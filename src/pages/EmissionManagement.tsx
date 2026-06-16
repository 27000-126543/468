import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Upload, Alert, Select, Typography, Space, Progress, message, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import { UploadOutlined, FileExcelOutlined, WarningOutlined, SafetyOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { generateEmissionPlan, generate90DayPrediction, PLANTS } from '../mock/data';
import { useAppContext } from '../store/context';
import { filterPlantsByPermission, filterProvinceList } from '../utils/permission';
import type { EmissionPlan } from '../types';

const { Title } = Typography;
const { Option } = Select;

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #f0f2f5',
};

const headStyle: React.CSSProperties = {
  borderBottom: '1px solid #f0f2f5',
  color: '#262626',
};

interface UploadedEmissionRecord {
  province: string;
  city?: string;
  targetVolume: number;
  codLimit: number;
  nh3nLimit: number;
  tpLimit: number;
}

interface UploadedEmissionData {
  records: UploadedEmissionRecord[];
  uploadTime: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function hashRandom(str: string, min: number, max: number): number {
  const rand = seededRandom(hashString(str));
  return min + rand() * (max - min);
}

const EmissionManagement: React.FC = () => {
  const { user } = useAppContext();
  const permissionFilteredPlants = useMemo(() => filterPlantsByPermission(PLANTS, user.role, user.province, user.city), [user]);

  const getDefaultProvince = () => {
    if (user.role === 'provincial' || user.role === 'municipal') return user.province;
    return undefined;
  };

  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(getDefaultProvince());
  const [uploadedInfo, setUploadedInfo] = useState<UploadedEmissionData | null>(null);

  useEffect(() => {
    setSelectedProvince(getDefaultProvince());
  }, [user.role, user.province]);

  const provinceList = useMemo(() => [...new Set(permissionFilteredPlants.map((p) => p.province))].sort(), [permissionFilteredPlants]);

  const scopeFilteredRecords = useMemo(() => {
    if (!uploadedInfo || uploadedInfo.records.length === 0) return [];
    return uploadedInfo.records.filter((r) => {
      if (user.role === 'provincial') {
        return r.province === user.province;
      }
      if (user.role === 'municipal') {
        if (r.city) {
          return r.city === user.city;
        }
        return r.province === user.province;
      }
      return true;
    });
  }, [uploadedInfo, user]);

  const emissionPlans = useMemo<EmissionPlan[]>(() => {
    if (uploadedInfo && scopeFilteredRecords.length > 0) {
      return scopeFilteredRecords.map((record) => {
        const seedBase = `${record.province}-${record.city || ''}-${uploadedInfo.uploadTime}`;
        const actualVolumeRatio = hashRandom(`${seedBase}-volume`, 0.6, 1.05);
        const actualCodRatio = hashRandom(`${seedBase}-cod`, 0.6, 1.05);
        const actualNh3nRatio = hashRandom(`${seedBase}-nh3n`, 0.65, 1.08);
        const actualTpRatio = hashRandom(`${seedBase}-tp`, 0.6, 1.1);
        return {
          year: 2026,
          province: record.province,
          targetVolume: Math.round(record.targetVolume),
          targetCod: Math.round(record.codLimit),
          targetNh3n: Math.round(record.nh3nLimit),
          targetTp: Math.round(record.tpLimit),
          actualVolume: Math.round(record.targetVolume * actualVolumeRatio),
          actualCod: Math.round(record.codLimit * actualCodRatio),
          actualNh3n: Math.round(record.nh3nLimit * actualNh3nRatio),
          actualTp: Math.round(record.tpLimit * actualTpRatio),
        };
      });
    }
    if (uploadedInfo && scopeFilteredRecords.length === 0) {
      return [];
    }
    return provinceList.map((province) => generateEmissionPlan(province));
  }, [provinceList, uploadedInfo, scopeFilteredRecords]);

  const filteredPlans = useMemo(() => {
    let plans = emissionPlans;
    if (user.role === 'municipal' && user.city) {
      const municipalProvincePlants = permissionFilteredPlants.filter((p) => p.city === user.city);
      const municipalProvinces = [...new Set(municipalProvincePlants.map((p) => p.province))];
      plans = plans.filter((p) => municipalProvinces.includes(p.province));
    }
    if (!selectedProvince) return plans;
    return plans.filter((p) => p.province === selectedProvince);
  }, [emissionPlans, selectedProvince, user, permissionFilteredPlants]);

  const overallStats = useMemo(() => {
    if (emissionPlans.length === 0) {
      return { totalTarget: 0, totalActual: 0, completionRate: 0, gap: 0 };
    }
    const totalTarget = emissionPlans.reduce((s, p) => s + p.targetVolume, 0);
    const totalActual = emissionPlans.reduce((s, p) => s + p.actualVolume, 0);
    const completionRate = totalTarget > 0 ? +((totalActual / totalTarget) * 100).toFixed(2) : 0;
    const gap = totalActual - totalTarget;
    return { totalTarget, totalActual, completionRate, gap };
  }, [emissionPlans]);

  const showAlert = overallStats.totalTarget > 0 && overallStats.completionRate < 80;

  const originalTargetSum = useMemo(() => {
    return provinceList.reduce((sum, province) => {
      const plan = generateEmissionPlan(province);
      return sum + plan.targetVolume;
    }, 0);
  }, [provinceList]);

  const predictionData = useMemo(() => {
    const data = generate90DayPrediction(user.role === 'national' ? '全国' : user.province || '全国');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next90Days = data.filter((d) => {
      const date = new Date(d.date);
      return date >= today && date < new Date(today.getTime() + 90 * 86400000);
    });

    if (uploadedInfo && scopeFilteredRecords.length > 0) {
      const uploadedTargetSum = scopeFilteredRecords.reduce((s, r) => s + r.targetVolume, 0);
      const ratio = originalTargetSum > 0 ? uploadedTargetSum / originalTargetSum : 1;
      return next90Days.map((d) => ({
        date: d.date,
        planned: Math.round(d.planned * ratio),
        actual: d.actual > 0 ? Math.round(d.actual * ratio) : 0,
        predicted: d.predicted > 0 ? Math.round(d.predicted * ratio) : 0,
      }));
    }
    if (uploadedInfo && scopeFilteredRecords.length === 0) {
      return next90Days.map((d) => ({
        date: d.date,
        planned: 0,
        actual: 0,
        predicted: 0,
      }));
    }
    return next90Days;
  }, [uploadedInfo, originalTargetSum, user, scopeFilteredRecords]);

  const predictionChartOption = useMemo(() => {
    const dates = predictionData.map((d) => d.date);
    const planned = predictionData.map((d) => d.planned);
    const actual = predictionData.map((d) => (d.actual > 0 ? d.actual : null));
    const predicted = predictionData.map((d) => (d.predicted > 0 ? d.predicted : null));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `<b>${params[0].axisValue}</b><br/>`;
          params.forEach((p: any) => {
            if (p.value !== null && p.value !== undefined) {
              result += `${p.marker} ${p.seriesName}: ${p.value.toLocaleString()} 吨<br/>`;
            }
          });
          return result;
        },
      },
      legend: {
        data: ['计划量', '实际量', '预测值'],
        textStyle: { color: '#666' },
        top: 0,
      },
      grid: { left: 60, right: 30, top: 40, bottom: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', rotate: 45, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '排放量(吨)',
        nameTextStyle: { color: '#666' },
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', formatter: (v: number) => v.toLocaleString() },
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      series: [
        {
          name: '计划量',
          type: 'line',
          data: planned,
          lineStyle: { type: 'dashed', color: '#597ef7', width: 2 },
          itemStyle: { color: '#597ef7' },
          symbol: 'none',
        },
        {
          name: '实际量',
          type: 'line',
          data: actual,
          lineStyle: { color: '#52c41a', width: 2 },
          itemStyle: { color: '#52c41a' },
          symbol: 'circle',
          symbolSize: 6,
        },
        {
          name: '预测值',
          type: 'line',
          data: predicted,
          lineStyle: { color: '#fa8c16', width: 2 },
          itemStyle: { color: '#fa8c16' },
          symbol: 'diamond',
          symbolSize: 6,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(250,140,22,0.25)' },
                { offset: 1, color: 'rgba(250,140,22,0.02)' },
              ],
            },
          },
        },
      ],
    };
  }, [predictionData]);

  const hasScopeData = useMemo(() => {
    if (!uploadedInfo) return true;
    return scopeFilteredRecords.length > 0;
  }, [uploadedInfo, scopeFilteredRecords]);

  const provincialChartData = useMemo(() => {
    return emissionPlans
      .map((p) => ({
        province: p.province,
        completionRate: p.targetVolume > 0 ? +((p.actualVolume / p.targetVolume) * 100).toFixed(2) : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [emissionPlans]);

  const provincialChartOption = useMemo(() => {
    const getColor = (rate: number) => {
      if (rate >= 100) return '#52c41a';
      if (rate >= 80) return '#faad14';
      return '#ff4d4f';
    };

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `<b>${p.name}</b><br/>完成率: ${p.value.toFixed(2)}%`;
        },
      },
      grid: { left: 80, right: 50, top: 20, bottom: 30 },
      xAxis: {
        type: 'value',
        max: 120,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      yAxis: {
        type: 'category',
        data: provincialChartData.map((p) => p.province),
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: provincialChartData.map((p) => ({
            value: p.completionRate,
            itemStyle: {
              color: getColor(p.completionRate),
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: '60%',
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#666',
            fontSize: 11,
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#ff4d4f', type: 'dashed' },
            data: [{ xAxis: 80, label: { formatter: '80%', color: '#ff4d4f' } }],
          },
        },
      ],
    };
  }, [provincialChartData]);

  const tableColumns = [
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
      width: 100,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '目标处理量',
      dataIndex: 'targetVolume',
      key: 'targetVolume',
      width: 120,
      render: (v: number) => `${v.toLocaleString()} 吨`,
    },
    {
      title: '实际处理量',
      dataIndex: 'actualVolume',
      key: 'actualVolume',
      width: 120,
      render: (v: number) => `${v.toLocaleString()} 吨`,
    },
    {
      title: '完成率',
      key: 'completionRate',
      width: 180,
      render: (_: any, record: EmissionPlan) => {
        const rate = +((record.actualVolume / record.targetVolume) * 100).toFixed(2);
        const color = rate >= 100 ? '#52c41a' : rate >= 80 ? '#faad14' : '#ff4d4f';
        return (
          <Space>
            <Progress percent={rate} size="small" showInfo={false} strokeColor={color} />
            <span style={{ color, fontWeight: 500, minWidth: 55 }}>{rate}%</span>
          </Space>
        );
      },
    },
    {
      title: 'COD排放量',
      dataIndex: 'actualCod',
      key: 'actualCod',
      width: 120,
      render: (v: number, record: EmissionPlan) => (
        <span style={{ color: v > record.targetCod ? '#ff4d4f' : '#52c41a' }}>
          {v.toLocaleString()} 吨
        </span>
      ),
    },
    {
      title: '氨氮排放量',
      dataIndex: 'actualNh3n',
      key: 'actualNh3n',
      width: 120,
      render: (v: number, record: EmissionPlan) => (
        <span style={{ color: v > record.targetNh3n ? '#ff4d4f' : '#52c41a' }}>
          {v.toLocaleString()} 吨
        </span>
      ),
    },
    {
      title: '总磷排放量',
      dataIndex: 'actualTp',
      key: 'actualTp',
      width: 120,
      render: (v: number, record: EmissionPlan) => (
        <span style={{ color: v > record.targetTp ? '#ff4d4f' : '#52c41a' }}>
          {v.toLocaleString()} 吨
        </span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: EmissionPlan) => {
        const rate = (record.actualVolume / record.targetVolume) * 100;
        let status: string;
        let color: string;
        let icon: React.ReactNode;
        if (rate >= 80) {
          status = '正常';
          color = 'green';
          icon = <CheckCircleOutlined />;
        } else if (rate >= 60) {
          status = '预警';
          color = 'orange';
          icon = <WarningOutlined />;
        } else {
          status = '异常';
          color = 'red';
          icon = <WarningOutlined />;
        }
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
  ];

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (jsonData.length > 0) {
          const records: UploadedEmissionRecord[] = [];
          const firstRow = jsonData[0];
          const keys = Object.keys(firstRow);

          const hasProvinceKey = keys.some((k) =>
            k === '省份' || k.toLowerCase() === 'province'
          );

          if (hasProvinceKey) {
            jsonData.forEach((row) => {
              const province = row['省份'] || row['province'] || row['Province'] || '';
              const city = row['城市'] || row['city'] || row['City'];
              const targetVolume = Number(
                row['目标处理量'] || row['targetVolume'] || row['TargetVolume'] || 0
              );
              const codLimit = Number(
                row['COD限值'] || row['codLimit'] || row['CodLimit'] || row['CODLimit'] || 0
              );
              const nh3nLimit = Number(
                row['氨氮限值'] || row['nh3nLimit'] || row['Nh3nLimit'] || row['NH3NLimit'] || 0
              );
              const tpLimit = Number(
                row['总磷限值'] || row['tpLimit'] || row['TpLimit'] || row['TPLimit'] || 0
              );

              if (province && targetVolume > 0) {
                records.push({
                  province: String(province),
                  city: city ? String(city) : undefined,
                  targetVolume,
                  codLimit,
                  nh3nLimit,
                  tpLimit,
                });
              }
            });
          }

          if (records.length === 0 && jsonData.length > 0) {
            const totalTarget = jsonData.reduce((s: number, row: any) => {
              const v = Number(
                row['目标处理量'] || row['targetVolume'] || row['TargetVolume'] || 0
              );
              return s + (v > 0 ? v : 0);
            }, 0);

            const fallbackTargets: {
              targetVolume: number;
              codLimit: number;
              nh3nLimit: number;
              tpLimit: number;
            }[] = [];

            jsonData.forEach((row) => {
              const targetVolume = Number(
                row['目标处理量'] || row['targetVolume'] || row['TargetVolume'] || 0
              );
              const codLimit = Number(
                row['COD限值'] || row['codLimit'] || row['CodLimit'] || row['CODLimit'] || 0
              );
              const nh3nLimit = Number(
                row['氨氮限值'] || row['nh3nLimit'] || row['Nh3nLimit'] || row['NH3NLimit'] || 0
              );
              const tpLimit = Number(
                row['总磷限值'] || row['tpLimit'] || row['TpLimit'] || row['TPLimit'] || 0
              );
              if (targetVolume > 0 || codLimit > 0 || nh3nLimit > 0 || tpLimit > 0) {
                fallbackTargets.push({ targetVolume, codLimit, nh3nLimit, tpLimit });
              }
            });

            const effectiveTargets = fallbackTargets.length > 0 ? fallbackTargets : [
              {
                targetVolume: totalTarget > 0 ? totalTarget : 0,
                codLimit: 0,
                nh3nLimit: 0,
                tpLimit: 0,
              },
            ];

            const targetTotal = effectiveTargets.reduce((s, t) => s + t.targetVolume, 0);
            const codTotal = effectiveTargets.reduce((s, t) => s + t.codLimit, 0);
            const nh3nTotal = effectiveTargets.reduce((s, t) => s + t.nh3nLimit, 0);
            const tpTotal = effectiveTargets.reduce((s, t) => s + t.tpLimit, 0);

            const n = provinceList.length;
            if (n > 0) {
              provinceList.forEach((province, idx) => {
                const ratio = (idx + 1) / (n * (n + 1) / 2);
                records.push({
                  province,
                  targetVolume: Math.round(targetTotal * ratio),
                  codLimit: Math.round(codTotal * ratio),
                  nh3nLimit: Math.round(nh3nTotal * ratio),
                  tpLimit: Math.round(tpTotal * ratio),
                });
              });
            }
          }

          if (records.length > 0) {
            setUploadedInfo({
              records,
              uploadTime: new Date().toISOString(),
            });
            message.success(`文件上传成功，已提取 ${records.length} 条减排计划数据`);
          } else {
            message.error('未提取到有效数据，请检查文件格式');
          }
        }
      } catch (error) {
        message.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const handleClearUpload = () => {
    setUploadedInfo(null);
    message.info('已清除上传数据');
  };

  const uploadProps = {
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: handleUpload,
  };

  return (
    <div style={{ padding: 0, background: '#f5f7fa', minHeight: '100%' }}>
      <Title level={4} style={{ margin: '0 0 16px 0', color: '#262626' }}>
        减排管理
      </Title>

      {showAlert && (
        <Alert
          message="减排预警"
          description="实际减排量低于计划20%，已推送异常提醒至运维负责人"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary">
              查看详情
            </Button>
          }
        />
      )}

      <Card style={cardStyle} styles={{ header: headStyle }}>
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          </p>
          <p className="ant-upload-text" style={{ color: '#262626', fontSize: 16, fontWeight: 500 }}>
            上传年度减排计划Excel，自动提取目标处理量与排放限值
          </p>
          <p className="ant-upload-hint" style={{ color: '#8c8c8c' }}>
            支持 .xlsx / .xls 格式，点击或拖拽文件到此处上传
          </p>
          <div style={{ marginTop: 12 }}>
            <Button type="primary" icon={<UploadOutlined />}>
              选择文件
            </Button>
          </div>
        </Upload.Dragger>

        {uploadedInfo && (
          <Card
            type="inner"
            style={{ marginTop: 16, borderColor: '#b7eb8f', background: '#f6ffed' }}
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span style={{ color: '#389e0d' }}>上传成功</span>
              </Space>
            }
            extra={
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearUpload}
              >
                清除数据重新上传
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#595959' }}>文件记录数</span>}
                  value={uploadedInfo.records.length}
                  suffix="条"
                  valueStyle={{ color: '#1890ff', fontSize: 20 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#595959' }}>当前权限匹配记录</span>}
                  value={scopeFilteredRecords.length}
                  suffix="条"
                  valueStyle={{ color: scopeFilteredRecords.length > 0 ? '#36cfc9' : '#ff4d4f', fontSize: 20 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#595959' }}>当前权限总目标量</span>}
                  value={scopeFilteredRecords.reduce((s, r) => s + r.targetVolume, 0)}
                  suffix="吨"
                  valueStyle={{ color: '#722ed1', fontSize: 20 }}
                  formatter={(v) => (v !== undefined && v !== null ? Number(v).toLocaleString() : v)}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 12, color: '#8c8c8c', fontSize: 12 }}>
              已上传时间: {new Date(uploadedInfo.uploadTime).toLocaleString('zh-CN')}
              {user.role !== 'national' && (
                <span style={{ marginLeft: 12 }}>
                  当前按 {user.role === 'provincial' ? user.province : `${user.province}${user.city || ''}`} 管辖范围统计
                </span>
              )}
            </div>
          </Card>
        )}
      </Card>

      {hasScopeData ? (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Card style={cardStyle}>
                <Statistic
                  title={<span style={{ color: '#595959' }}>年度目标处理量</span>}
                  value={overallStats.totalTarget}
                  suffix="吨"
                  prefix={<SafetyOutlined />}
                  valueStyle={{ color: '#36cfc9' }}
                  formatter={(v) => (v !== undefined && v !== null ? Number(v).toLocaleString() : v)}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={cardStyle}>
                <Statistic
                  title={<span style={{ color: '#595959' }}>实际处理量</span>}
                  value={overallStats.totalActual}
                  suffix="吨"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#73d13d' }}
                  formatter={(v) => (v !== undefined && v !== null ? Number(v).toLocaleString() : v)}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={cardStyle}>
                <Statistic
                  title={<span style={{ color: '#595959' }}>完成率</span>}
                  value={overallStats.completionRate}
                  suffix="%"
                  prefix={<SafetyOutlined />}
                  valueStyle={{ color: overallStats.completionRate >= 80 ? '#73d13d' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={cardStyle}>
                <Statistic
                  title={<span style={{ color: '#595959' }}>减排缺口</span>}
                  value={Math.abs(overallStats.gap)}
                  suffix="吨"
                  prefix={overallStats.gap < 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
                  valueStyle={{ color: overallStats.gap < 0 ? '#ff4d4f' : '#73d13d' }}
                  formatter={(v) => `${overallStats.gap < 0 ? '-' : '+'}${v !== undefined && v !== null ? Number(v).toLocaleString() : v}`}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card title={<span style={{ color: '#262626' }}>90天减排缺口预测</span>} style={cardStyle} styles={{ header: headStyle }}>
                <ReactECharts option={predictionChartOption} style={{ height: 400 }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<span style={{ color: '#262626' }}>各省份减排完成情况</span>} style={cardStyle} styles={{ header: headStyle }}>
                <ReactECharts option={provincialChartOption} style={{ height: 400 }} />
              </Card>
            </Col>
          </Row>

          <Card
            title={<span style={{ color: '#262626' }}>减排完成详情</span>}
            style={{ ...cardStyle, marginTop: 16 }}
            styles={{ header: headStyle }}
            extra={
              user.role === 'provincial' ? null : (
                <Select
                  placeholder="选择省份"
                  allowClear={user.role !== 'municipal'}
                  style={{ width: 180 }}
                  value={selectedProvince}
                  onChange={setSelectedProvince}
                  disabled={user.role === 'municipal'}
                >
                  {provinceList.map((p) => (
                    <Option key={p} value={p}>
                      {p}
                    </Option>
                  ))}
                </Select>
              )
            }
          >
            <Table
              columns={tableColumns}
              dataSource={filteredPlans}
              rowKey="province"
              scroll={{ x: 1000 }}
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            />
          </Card>
        </>
      ) : (
        <Card style={{ ...cardStyle, marginTop: 16, textAlign: 'center' }} bodyStyle={{ padding: '60px 24px' }}>
          <Empty description="当前权限范围内无匹配减排数据，请上传包含本辖区的文件" />
        </Card>
      )}
    </div>
  );
};

export default EmissionManagement;
