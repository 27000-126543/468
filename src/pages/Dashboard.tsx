import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Select, Table, Tag, Space, ConfigProvider, theme } from 'antd';
import ReactECharts from 'echarts-for-react';
import {
  EnvironmentOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { PLANTS } from '../mock/data';
import type { PlantInfo } from '../types';
import { useAppContext } from '../store/context';
import { filterPlantsByPermission } from '../utils/permission';

const PROVINCE_COORDS: Record<string, [number, number]> = {
  北京: [116.4, 39.9],
  上海: [121.5, 31.2],
  广东: [113.3, 23.1],
  江苏: [118.8, 32.1],
  浙江: [120.2, 30.3],
  山东: [117.0, 36.7],
  四川: [104.1, 30.6],
  湖北: [114.3, 30.6],
  河南: [113.7, 34.7],
  湖南: [113.0, 28.2],
  河北: [114.5, 38.0],
  福建: [119.3, 26.1],
  安徽: [117.3, 31.8],
  辽宁: [123.4, 41.8],
  陕西: [108.9, 34.3],
  江西: [115.9, 28.7],
  重庆: [106.5, 29.6],
  广西: [108.3, 22.8],
  云南: [102.7, 25.0],
  天津: [117.2, 39.1],
  黑龙江: [126.5, 45.8],
  吉林: [125.3, 43.9],
  贵州: [106.7, 26.6],
  甘肃: [103.8, 36.1],
  内蒙古: [111.7, 40.8],
  新疆: [87.6, 43.8],
  海南: [110.3, 20.0],
  宁夏: [106.3, 38.5],
  青海: [101.8, 36.6],
  西藏: [91.1, 29.6],
  山西: [112.5, 37.9],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getProvinceCompliance(province: string): number {
  return +(85 + (hashStr(province) % 1500) / 100).toFixed(2);
}

function getProvinceEnergy(province: string): number {
  return +(0.2 + (hashStr(province + 'e') % 400) / 1000).toFixed(3);
}

function getMonthCompliance(province: string, month: number): number {
  const base = getProvinceCompliance(province);
  const offset = (hashStr(province + String(month)) % 300) / 100 - 1.5;
  return +(Math.min(99.5, Math.max(84, base + offset))).toFixed(2);
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #f0f2f5',
};

const headStyle: React.CSSProperties = {
  borderBottom: '1px solid #f0f2f5',
  color: '#262626',
};

const Dashboard: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [selectedProcess, setSelectedProcess] = useState<string | undefined>(undefined);
  const { user } = useAppContext();

  const permissionFilteredPlants = useMemo(() => {
    return filterPlantsByPermission(PLANTS, user.role, user.province, user.city);
  }, [user]);

  const provinceList = useMemo(() => [...new Set(permissionFilteredPlants.map((p) => p.province))].sort(), [permissionFilteredPlants]);
  const processList = useMemo(() => [...new Set(permissionFilteredPlants.map((p) => p.processType))].sort(), [permissionFilteredPlants]);

  const filteredPlants = useMemo<PlantInfo[]>(() => {
    return permissionFilteredPlants.filter((p) => {
      if (selectedProvince && p.province !== selectedProvince) return false;
      if (selectedProcess && p.processType !== selectedProcess) return false;
      return true;
    });
  }, [permissionFilteredPlants, selectedProvince, selectedProcess]);

  const provinceStats = useMemo(() => {
    const map = new Map<
      string,
      { count: number; loadSum: number; designSum: number; compliance: number; energy: number }
    >();
    filteredPlants.forEach((p) => {
      const existing = map.get(p.province);
      if (existing) {
        existing.count++;
        existing.loadSum += p.currentLoad;
        existing.designSum += p.designScale;
      } else {
        map.set(p.province, {
          count: 1,
          loadSum: p.currentLoad,
          designSum: p.designScale,
          compliance: getProvinceCompliance(p.province),
          energy: getProvinceEnergy(p.province),
        });
      }
    });
    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      loadRate: +((stats.loadSum / stats.designSum) * 100).toFixed(2),
      compliance: stats.compliance,
      energy: stats.energy,
    }));
  }, [filteredPlants]);

  const overallStats = useMemo(() => {
    const total = filteredPlants.length;
    if (total === 0) return { totalPlants: 0, avgCompliance: 0, avgLoadRate: 0, avgEnergy: 0 };
    const totalLoad = filteredPlants.reduce((s, p) => s + p.currentLoad, 0);
    const totalDesign = filteredPlants.reduce((s, p) => s + p.designScale, 0);
    const avgCompliance =
      provinceStats.length > 0
        ? +(provinceStats.reduce((s, p) => s + p.compliance, 0) / provinceStats.length).toFixed(2)
        : 0;
    const avgLoadRate = +((totalLoad / totalDesign) * 100).toFixed(2);
    const avgEnergy =
      provinceStats.length > 0
        ? +(provinceStats.reduce((s, p) => s + p.energy, 0) / provinceStats.length).toFixed(3)
        : 0;
    return { totalPlants: total, avgCompliance, avgLoadRate, avgEnergy };
  }, [filteredPlants, provinceStats]);

  const heatmapOption = useMemo(() => {
    const data = provinceStats.map((p) => {
      const coords = PROVINCE_COORDS[p.name] || [110, 35];
      return { value: [...coords, p.compliance, p.count], name: p.name };
    });
    return {
      tooltip: {
        formatter(params: any) {
          const d = params.data;
          return `<b>${d.name}</b><br/>达标率: ${d.value[2]}%<br/>厂数: ${d.value[3]}`;
        },
      },
      visualMap: {
        min: 85,
        max: 99,
        text: ['高', '低'],
        inRange: { color: ['#ff6b6b', '#fadb14', '#95de64', '#52c41a'] },
        left: 10,
        bottom: 20,
        calculable: true,
        textStyle: { color: '#666' },
      },
      xAxis: { type: 'value', min: 75, max: 135, show: false },
      yAxis: { type: 'value', min: 15, max: 55, show: false },
      grid: { left: 10, right: 50, top: 10, bottom: 60 },
      series: [
        {
          type: 'effectScatter',
          data,
          symbolSize(val: number[]) {
            return Math.max(8, val[3] * 1.5);
          },
          rippleEffect: { brushType: 'stroke', scale: 2.5, period: 4 },
          label: {
            show: true,
            formatter(params: any) {
              return params.data.name;
            },
            position: 'right',
            fontSize: 10,
            color: '#666',
          },
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(25, 190, 107, 0.5)' },
        },
      ],
    };
  }, [provinceStats]);

  const rankingData = useMemo(() => {
    return [...provinceStats]
      .sort((a, b) => b.compliance - a.compliance)
      .slice(0, 10)
      .map((p, i) => ({ ...p, rank: i + 1, key: p.name }));
  }, [provinceStats]);

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render(v: number) {
        if (v === 1) return <Tag color="gold">{v}</Tag>;
        if (v === 2) return <Tag color="#c0c0c0">{v}</Tag>;
        if (v === 3) return <Tag color="#cd7f32">{v}</Tag>;
        return v;
      },
    },
    { title: '省份', dataIndex: 'name', key: 'name' },
    {
      title: '达标率',
      dataIndex: 'compliance',
      key: 'compliance',
      render(v: number) {
        return (
          <span style={{ color: v >= 95 ? '#52c41a' : v >= 90 ? '#faad14' : '#ff4d4f' }}>
            {v}%
          </span>
        );
      },
    },
    { title: '厂数', dataIndex: 'count', key: 'count' },
    {
      title: '状态',
      key: 'status',
      render(_: any, record: any) {
        return (
          <Tag color={record.compliance >= 95 ? 'green' : record.compliance >= 90 ? 'orange' : 'red'}>
            {record.compliance >= 95 ? '优秀' : record.compliance >= 90 ? '良好' : '待改善'}
          </Tag>
        );
      },
    },
  ];

  const trendOption = useMemo(() => {
    const provinces = selectedProvince ? [selectedProvince] : provinceStats.map((p) => p.name);
    const overallData = MONTHS.map((_, i) => {
      const sum = provinces.reduce((s, prov) => s + getMonthCompliance(prov, i), 0);
      return +(sum / provinces.length).toFixed(2);
    });
    const codData = MONTHS.map((_, i) => {
      const sum = provinces.reduce((s, prov) => s + getMonthCompliance(prov + 'cod', i), 0);
      return +(sum / provinces.length).toFixed(2);
    });
    const nh3nData = MONTHS.map((_, i) => {
      const sum = provinces.reduce((s, prov) => s + getMonthCompliance(prov + 'nh3n', i), 0);
      return +(sum / provinces.length).toFixed(2);
    });
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['综合达标率', 'COD达标率', 'NH₃-N达标率'], textStyle: { color: '#666' } },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: MONTHS,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' },
      },
      yAxis: {
        type: 'value',
        min: 82,
        max: 100,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      series: [
        {
          name: '综合达标率',
          type: 'line',
          data: overallData,
          smooth: true,
          lineStyle: { width: 2 },
          itemStyle: { color: '#36cfc9' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(54,207,201,0.3)' },
                { offset: 1, color: 'rgba(54,207,201,0.02)' },
              ],
            },
          },
        },
        {
          name: 'COD达标率',
          type: 'line',
          data: codData,
          smooth: true,
          lineStyle: { width: 2 },
          itemStyle: { color: '#73d13d' },
        },
        {
          name: 'NH₃-N达标率',
          type: 'line',
          data: nh3nData,
          smooth: true,
          lineStyle: { width: 2 },
          itemStyle: { color: '#ffc53d' },
        },
      ],
    };
  }, [selectedProvince, provinceStats]);

  const energyOption = useMemo(() => {
    const processMap = new Map<string, { count: number; totalEnergy: number }>();
    filteredPlants.forEach((p) => {
      const energy = getProvinceEnergy(p.province);
      const existing = processMap.get(p.processType);
      if (existing) {
        existing.count++;
        existing.totalEnergy += energy;
      } else {
        processMap.set(p.processType, { count: 1, totalEnergy: energy });
      }
    });
    const processData = Array.from(processMap.entries())
      .map(([name, stats]) => ({ name, value: +(stats.totalEnergy / stats.count).toFixed(3) }))
      .sort((a, b) => b.value - a.value);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 60, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: processData.map((p) => p.name),
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'kWh/吨',
        nameTextStyle: { color: '#666' },
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      series: [
        {
          type: 'bar',
          data: processData.map((p) => p.value),
          barWidth: '40%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#36cfc9' },
                { offset: 1, color: '#003a8c' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [filteredPlants]);

  return (
    <div style={{ padding: 0, background: '#f5f7fa', minHeight: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>污水厂总数</span>}
              value={overallStats.totalPlants}
              suffix="座"
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#36cfc9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>平均出水达标率</span>}
              value={overallStats.avgCompliance}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#73d13d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>平均处理负荷率</span>}
              value={overallStats.avgLoadRate}
              suffix="%"
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#ffc53d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>平均单位能耗</span>}
              value={overallStats.avgEnergy}
              suffix="kWh/吨"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#597ef7' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title={<span style={{ color: '#262626' }}>全国污水厂运行热力图</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={heatmapOption} style={{ height: 420 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title={<span style={{ color: '#262626' }}>达标率排名</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ConfigProvider>
              <Table
                columns={columns}
                dataSource={rankingData}
                rowKey="name"
                pagination={false}
                size="small"
              />
            </ConfigProvider>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <Space>
          <Select
            placeholder="选择省份"
            allowClear
            style={{ width: 180 }}
            value={selectedProvince}
            onChange={setSelectedProvince}
            options={provinceList.map((p) => ({ label: p, value: p }))}
          />
          <Select
            placeholder="选择工艺类型"
            allowClear
            style={{ width: 180 }}
            value={selectedProcess}
            onChange={setSelectedProcess}
            options={processList.map((p) => ({ label: p, value: p }))}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>实时达标率趋势</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>单位能耗对比</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={energyOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
