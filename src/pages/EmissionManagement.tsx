import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Upload, Alert, Select, Typography, Space, Progress, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import { UploadOutlined, FileExcelOutlined, WarningOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { generateEmissionPlan, generate90DayPrediction, PLANTS } from '../mock/data';
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

const EmissionManagement: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [uploadedInfo, setUploadedInfo] = useState<{ targetVolume: number; codLimit: number; nh3nLimit: number; tpLimit: number } | null>(null);

  const provinceList = useMemo(() => [...new Set(PLANTS.map((p) => p.province))].sort(), []);

  const emissionPlans = useMemo<EmissionPlan[]>(() => {
    return provinceList.map((province) => generateEmissionPlan(province));
  }, [provinceList]);

  const filteredPlans = useMemo(() => {
    if (!selectedProvince) return emissionPlans;
    return emissionPlans.filter((p) => p.province === selectedProvince);
  }, [emissionPlans, selectedProvince]);

  const overallStats = useMemo(() => {
    const totalTarget = emissionPlans.reduce((s, p) => s + p.targetVolume, 0);
    const totalActual = emissionPlans.reduce((s, p) => s + p.actualVolume, 0);
    const completionRate = +((totalActual / totalTarget) * 100).toFixed(2);
    const gap = totalActual - totalTarget;
    return { totalTarget, totalActual, completionRate, gap };
  }, [emissionPlans]);

  const showAlert = overallStats.completionRate < 80;

  const predictionData = useMemo(() => {
    const data = generate90DayPrediction('全国');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next90Days = data.filter((d) => {
      const date = new Date(d.date);
      return date >= today && date < new Date(today.getTime() + 90 * 86400000);
    });
    return next90Days;
  }, []);

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

  const provincialChartData = useMemo(() => {
    return emissionPlans
      .map((p) => ({
        province: p.province,
        completionRate: +((p.actualVolume / p.targetVolume) * 100).toFixed(2),
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
          const row = jsonData[0];
          const targetVolume = row['目标处理量'] || row['targetVolume'] || 0;
          const codLimit = row['COD限值'] || row['codLimit'] || 0;
          const nh3nLimit = row['氨氮限值'] || row['nh3nLimit'] || 0;
          const tpLimit = row['总磷限值'] || row['tpLimit'] || 0;

          setUploadedInfo({
            targetVolume: Number(targetVolume),
            codLimit: Number(codLimit),
            nh3nLimit: Number(nh3nLimit),
            tpLimit: Number(tpLimit),
          });
          message.success('文件上传成功，已提取年度减排计划数据');
        }
      } catch (error) {
        message.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
    return false;
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
          <Alert
            message="上传成功"
            description={
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <span>年度目标处理量: <b>{uploadedInfo.targetVolume.toLocaleString()}</b> 吨</span>
                <span>COD排放限值: <b>{uploadedInfo.codLimit.toLocaleString()}</b> 吨</span>
                <span>氨氮排放限值: <b>{uploadedInfo.nh3nLimit.toLocaleString()}</b> 吨</span>
                <span>总磷排放限值: <b>{uploadedInfo.tpLimit.toLocaleString()}</b> 吨</span>
              </Space>
            }
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

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
          <Select
            placeholder="选择省份"
            allowClear
            style={{ width: 180 }}
            value={selectedProvince}
            onChange={setSelectedProvince}
          >
            {provinceList.map((p) => (
              <Option key={p} value={p}>
                {p}
              </Option>
            ))}
          </Select>
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
    </div>
  );
};

export default EmissionManagement;
