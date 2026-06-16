import React, { useMemo } from 'react';
import { Card, Row, Col, Button, Space, Tag, Typography, Timeline, Statistic } from 'antd';
import ReactECharts from 'echarts-for-react';
import { ArrowLeftOutlined, EnvironmentOutlined, ThunderboltOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { PLANTS, generate7DayTrend, generateEquipmentStatus, generateEnergyData } from '../mock/data';
import type { PlantInfo, EquipmentFault } from '../types';

const { Title, Text } = Typography;

const PlantDetail: React.FC = () => {
  const navigate = useNavigate();
  const { plantId } = useParams<{ plantId: string }>();

  const plant = useMemo<PlantInfo | undefined>(() => {
    return PLANTS.find((p) => p.id === plantId);
  }, [plantId]);

  const trendData = useMemo(() => {
    if (!plantId) return { cod: [], nh3n: [], tp: [] };
    return generate7DayTrend(plantId);
  }, [plantId]);

  const equipmentData = useMemo(() => {
    if (!plantId) return { totalEquipment: 0, faultEquipment: 0, faultRate: 0, faultDetails: [] };
    return generateEquipmentStatus(plantId);
  }, [plantId]);

  const energyData = useMemo(() => {
    if (!plantId) return [];
    return generateEnergyData(plantId, 30).reverse();
  }, [plantId]);

  const trendOption = useMemo(() => {
    const times = trendData.cod.map((d) => d.time);
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let html = `<div style="font-weight:500;margin-bottom:8px">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            const unit = p.seriesName === 'COD' ? 'mg/L' : p.seriesName === 'NH₃-N' ? 'mg/L' : 'mg/L';
            html += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
              <span>${p.seriesName}:</span>
              <span style="font-weight:600">${p.value} ${unit}</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['COD', 'NH₃-N', 'TP', 'COD限值', 'NH₃-N限值', 'TP限值'],
        top: 0,
        textStyle: { color: '#595959' },
      },
      grid: { left: 60, right: 30, top: 50, bottom: 60 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', interval: 23, rotate: 0 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'COD (mg/L)',
          position: 'left',
          axisLine: { lineStyle: { color: '#d9d9d9' } },
          axisLabel: { color: '#666' },
          splitLine: { lineStyle: { color: '#f0f2f5' } },
        },
        {
          type: 'value',
          name: 'NH₃-N / TP (mg/L)',
          position: 'right',
          axisLine: { lineStyle: { color: '#d9d9d9' } },
          axisLabel: { color: '#666' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'COD',
          type: 'line',
          yAxisIndex: 0,
          data: trendData.cod.map((d) => d.value),
          smooth: true,
          lineStyle: { width: 2, color: '#36cfc9' },
          itemStyle: { color: '#36cfc9' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(54,207,201,0.25)' },
                { offset: 1, color: 'rgba(54,207,201,0.02)' },
              ],
            },
          },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
        },
        {
          name: 'NH₃-N',
          type: 'line',
          yAxisIndex: 1,
          data: trendData.nh3n.map((d) => d.value),
          smooth: true,
          lineStyle: { width: 2, color: '#73d13d' },
          itemStyle: { color: '#73d13d' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(115,209,61,0.25)' },
                { offset: 1, color: 'rgba(115,209,61,0.02)' },
              ],
            },
          },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
        },
        {
          name: 'TP',
          type: 'line',
          yAxisIndex: 1,
          data: trendData.tp.map((d) => d.value),
          smooth: true,
          lineStyle: { width: 2, color: '#ffc53d' },
          itemStyle: { color: '#ffc53d' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,197,61,0.25)' },
                { offset: 1, color: 'rgba(255,197,61,0.02)' },
              ],
            },
          },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
        },
        {
          name: 'COD限值',
          type: 'line',
          yAxisIndex: 0,
          data: new Array(times.length).fill(50),
          lineStyle: { type: 'dashed', width: 1, color: '#ff6b6b' },
          itemStyle: { color: '#ff6b6b' },
          symbol: 'none',
        },
        {
          name: 'NH₃-N限值',
          type: 'line',
          yAxisIndex: 1,
          data: new Array(times.length).fill(5),
          lineStyle: { type: 'dashed', width: 1, color: '#ff9c6e' },
          itemStyle: { color: '#ff9c6e' },
          symbol: 'none',
        },
        {
          name: 'TP限值',
          type: 'line',
          yAxisIndex: 1,
          data: new Array(times.length).fill(0.5),
          lineStyle: { type: 'dashed', width: 1, color: '#ffd666' },
          itemStyle: { color: '#ffd666' },
          symbol: 'none',
        },
      ],
    };
  }, [trendData]);

  const pieOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}% ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#595959' },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}\n{c}%',
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: 65, name: '电费', itemStyle: { color: '#36cfc9' } },
            { value: 20, name: '药剂费', itemStyle: { color: '#73d13d' } },
            { value: 10, name: '人工费', itemStyle: { color: '#ffc53d' } },
            { value: 5, name: '维护费', itemStyle: { color: '#9254de' } },
          ],
        },
      ],
    };
  }, []);

  const barOption = useMemo(() => {
    const dates = energyData.map((d) => d.date.slice(5));
    const values = energyData.map((d) => d.unitEnergyKwhPerTon);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `${params[0].axisValue}<br/>单位能耗: ${params[0].value} kWh/吨`;
        },
        axisPointer: { type: 'shadow' },
      },
      grid: { left: 60, right: 20, top: 30, bottom: 60 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', interval: 4, rotate: 45 },
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
          data: values.map((v) => ({
            value: v,
            itemStyle: {
              color: v > avg + 0.05 ? '#ff6b6b' : v > avg - 0.05 ? '#ffc53d' : '#52c41a',
            },
          })),
          barWidth: '60%',
          markLine: {
            silent: true,
            lineStyle: { type: 'dashed', color: '#faad14' },
            data: [{ yAxis: avg.toFixed(3), name: '平均值' }],
            label: { formatter: `均值: {c}`, color: '#faad14' },
          },
        },
      ],
    };
  }, [energyData]);

  const timelineItems = useMemo(() => {
    const sortedFaults = [...equipmentData.faultDetails].sort(
      (a, b) => new Date(b.faultTime).getTime() - new Date(a.faultTime).getTime()
    );
    return sortedFaults.map((fault: EquipmentFault) => {
      const time = new Date(fault.faultTime);
      const timeStr = `${time.getMonth() + 1}月${time.getDate()}日 ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      const isActive = fault.status === 'active';
      return {
        color: isActive ? '#ff4d4f' : '#52c41a',
        children: (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{timeStr}</Text>
            <div style={{ marginTop: 4, fontWeight: 500 }}>
              {fault.equipmentName}
              <Tag color={isActive ? 'red' : 'green'} style={{ marginLeft: 8 }}>
                {isActive ? '处理中' : '已修复'}
              </Tag>
            </div>
            <div style={{ marginTop: 2, color: '#595959', fontSize: 13 }}>
              <ToolOutlined style={{ marginRight: 4 }} />
              {fault.faultType}
            </div>
          </div>
        ),
      };
    });
  }, [equipmentData.faultDetails]);

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #f0f2f5',
  };

  const headStyle: React.CSSProperties = {
    borderBottom: '1px solid #f0f2f5',
    color: '#262626',
  };

  if (!plant) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Text type="secondary">未找到该污水厂信息</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 0, background: '#f5f7fa', minHeight: '100%' }}>
      <Card style={{ ...cardStyle, marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
        <Space size="large" style={{ width: '100%' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/monitoring')}
          >
            返回
          </Button>
          <Title level={4} style={{ margin: 0, color: '#262626' }}>
            {plant.name}
          </Title>
          <Space size="middle">
            <Tag icon={<EnvironmentOutlined />} color="cyan">
              {plant.province} · {plant.city}
            </Tag>
            <Tag color="blue">{plant.processType}工艺</Tag>
            <Tag color="purple">设计规模 {plant.designScale}万吨/日</Tag>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>设备总数</span>}
              value={equipmentData.totalEquipment}
              suffix="台"
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#36cfc9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>故障设备</span>}
              value={equipmentData.faultEquipment}
              suffix="台"
              prefix={<ToolOutlined />}
              valueStyle={{ color: equipmentData.faultEquipment > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>设备故障率</span>}
              value={equipmentData.faultRate}
              suffix="%"
              prefix={<ToolOutlined />}
              valueStyle={{ color: equipmentData.faultRate > 5 ? '#ff4d4f' : equipmentData.faultRate > 3 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>当前处理负荷</span>}
              value={Math.round((plant.currentLoad / plant.designScale) * 100)}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#73d13d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={<span style={{ color: '#262626' }}>近7天出水趋势曲线</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={trendOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>能耗成本分布</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={pieOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>30天单位能耗趋势</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={barOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={<span style={{ color: '#262626' }}>设备维修时间线</span>} style={cardStyle} styles={{ header: headStyle }}>
            {timelineItems.length > 0 ? (
              <Timeline mode="left" items={timelineItems} style={{ padding: '16px 0' }} />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>
                暂无设备维修记录
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlantDetail;
