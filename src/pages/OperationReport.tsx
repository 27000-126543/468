import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Select, Button, List, Tag, Space, Typography, Divider, Descriptions } from 'antd';
import ReactECharts from 'echarts-for-react';
import {
  DownloadOutlined,
  PrinterOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  BulbOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { generateOperationReport } from '../mock/data';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #f0f2f5',
};

const headStyle: React.CSSProperties = {
  borderBottom: '1px solid #f0f2f5',
  color: '#262626',
};

const OperationReport: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<string>('2026年第24周');
  const reportData = useMemo(() => generateOperationReport(), []);

  const weeks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => `2026年第${24 - i}周`);
  }, []);

  const complianceTrendOption = useMemo(() => {
    const weekLabels = Array.from({ length: 8 }, (_, i) => `第${24 - 7 + i}周`);
    const currentData = weekLabels.map((_, i) => +(94 + Math.random() * 5).toFixed(1));
    const lastWeekData = weekLabels.map((_, i) => +(93 + Math.random() * 5).toFixed(1));
    const lastYearData = weekLabels.map((_, i) => +(91 + Math.random() * 5).toFixed(1));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['本周达标率', '上周达标率', '去年同期达标率'],
        textStyle: { color: '#666' },
        bottom: 0,
      },
      grid: { left: 50, right: 20, top: 30, bottom: 60 },
      xAxis: {
        type: 'category',
        data: weekLabels,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' },
      },
      yAxis: {
        type: 'value',
        min: 85,
        max: 100,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      series: [
        {
          name: '本周达标率',
          type: 'bar',
          data: currentData,
          barWidth: '25%',
          itemStyle: { color: '#36cfc9', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '上周达标率',
          type: 'bar',
          data: lastWeekData,
          barWidth: '25%',
          itemStyle: { color: '#73d13d', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '去年同期达标率',
          type: 'bar',
          data: lastYearData,
          barWidth: '25%',
          itemStyle: { color: '#ffc53d', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, []);

  const energyRankingOption = useMemo(() => {
    const sorted = [...reportData.energyRanking].sort((a, b) => a.unitEnergy - b.unitEnergy);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const d = params[0];
          return `<b>${d.name}</b><br/>单位能耗: ${d.value} kWh/吨`;
        },
      },
      grid: { left: 140, right: 40, top: 20, bottom: 30 },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((r) => r.name),
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((r) => r.unitEnergy),
          barWidth: '50%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#95de64' },
                { offset: 1, color: '#52c41a' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c} kWh/吨',
            color: '#666',
            fontSize: 12,
          },
        },
      ],
    };
  }, [reportData.energyRanking]);

  const faultDistributionOption = useMemo(() => {
    const total = reportData.faultDistribution.reduce((s, f) => s + f.count, 0);
    const colors = ['#36cfc9', '#73d13d', '#ffc53d', '#ff7a45', '#597ef7', '#eb2f96', '#9254de', '#13c2c2'];
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percent = ((params.value / total) * 100).toFixed(1);
          return `<b>${params.name}</b><br/>数量: ${params.value}<br/>占比: ${percent}%`;
        },
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#666' },
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
            show: true,
            formatter: (params: any) => {
              const percent = ((params.value / total) * 100).toFixed(1);
              return `${percent}%`;
            },
            color: '#666',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: reportData.faultDistribution.map((f, i) => ({
            value: f.count,
            name: f.type,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    };
  }, [reportData.faultDistribution]);

  const recommendationItems = useMemo(() => {
    const benefitTags = ['节能12%', '改善脱氮效果', '降低故障率', '提高响应效率'];
    return reportData.recommendations.map((rec, i) => ({
      title: rec,
      icon: i % 2 === 0 ? <ThunderboltOutlined style={{ color: '#ffc53d', fontSize: 20 }} /> : <ToolOutlined style={{ color: '#36cfc9', fontSize: 20 }} />,
      benefit: benefitTags[i % benefitTags.length],
    }));
  }, [reportData.recommendations]);

  return (
    <div style={{ padding: 0, background: '#f5f7fa', minHeight: '100%' }}>
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <Select
                value={selectedWeek}
                onChange={setSelectedWeek}
                style={{ width: 180 }}
                prefix={<CalendarOutlined />}
              >
                {weeks.map((week) => (
                  <Option key={week} value={week}>
                    {week}
                  </Option>
                ))}
              </Select>
              <Title level={3} style={{ margin: 0, color: '#262626' }}>
                每周运营诊断报告
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<DownloadOutlined />}>
                下载报告
              </Button>
              <Button icon={<PrinterOutlined />}>打印</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>本周达标率</span>}
              value={96.8}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>同比变化</span>}
              value={2.3}
              suffix="%"
              prefix={reportData.complianceRateYoy >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: reportData.complianceRateYoy >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>环比变化</span>}
              value={1.1}
              suffix="%"
              prefix={reportData.complianceRateMom >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: reportData.complianceRateMom >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>平均单位能耗</span>}
              value={0.32}
              suffix="kWh/吨"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#36cfc9' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>达标率同比环比趋势</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={complianceTrendOption} style={{ height: 380 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>能耗效率排名</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={energyRankingOption} style={{ height: 380 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>设备故障类型分布</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={faultDistributionOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>优化建议</span>} style={cardStyle} styles={{ header: headStyle }}>
            <List
              dataSource={recommendationItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">
                      查看详情
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={
                      <Space>
                        <Text>{item.title}</Text>
                        <Tag color={item.benefit.includes('节能') ? 'green' : 'blue'}>{item.benefit}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title={<span style={{ color: '#262626' }}>报告详情</span>} style={cardStyle} styles={{ header: headStyle }}>
        <div style={{ padding: '0 16px' }}>
          <Title level={4} style={{ color: '#262626', marginTop: 24, marginBottom: 16 }}>
            <BulbOutlined style={{ color: '#36cfc9', marginRight: 8 }} />
            本周运营概览
          </Title>
          <Paragraph style={{ color: '#595959', lineHeight: 1.8 }}>
            {reportData.week}，全国污水处理厂整体运行情况良好。本周平均出水达标率为96.8%，同比提升{reportData.complianceRateYoy}个百分点，环比提升{reportData.complianceRateMom}个百分点。
            平均单位能耗0.32kWh/吨，较上周下降0.01kWh/吨。全国共监测污水处理厂{286}座，其中{277}座运行稳定，{9}座存在不同程度的达标风险。
          </Paragraph>

          <Divider style={{ margin: '24px 0' }} />

          <Title level={4} style={{ color: '#262626', marginTop: 24, marginBottom: 16 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            达标率分析
          </Title>
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="本周达标率">96.8%</Descriptions.Item>
            <Descriptions.Item label="上周达标率">95.7%</Descriptions.Item>
            <Descriptions.Item label="去年同期达标率">94.5%</Descriptions.Item>
            <Descriptions.Item label="达标水厂数">277座</Descriptions.Item>
            <Descriptions.Item label="待改善水厂">9座</Descriptions.Item>
            <Descriptions.Item label="主要超标指标">COD、NH₃-N</Descriptions.Item>
          </Descriptions>
          <Paragraph style={{ color: '#595959', lineHeight: 1.8 }}>
            本周达标率持续向好，华东地区达标率最高（98.2%），西南地区相对偏低（93.5%）。
            超标原因主要集中在进水浓度波动和设备运行不稳定两个方面。建议重点关注西南区域3座水厂的运行状况。
          </Paragraph>

          <Divider style={{ margin: '24px 0' }} />

          <Title level={4} style={{ color: '#262626', marginTop: 24, marginBottom: 16 }}>
            <ThunderboltOutlined style={{ color: '#ffc53d', marginRight: 8 }} />
            能耗分析
          </Title>
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="平均单位能耗">0.32 kWh/吨</Descriptions.Item>
            <Descriptions.Item label="上周平均">0.33 kWh/吨</Descriptions.Item>
            <Descriptions.Item label="最低单位能耗">0.22 kWh/吨</Descriptions.Item>
            <Descriptions.Item label="最高单位能耗">0.58 kWh/吨</Descriptions.Item>
            <Descriptions.Item label="总耗电量">1,286万kWh</Descriptions.Item>
            <Descriptions.Item label="电费支出">964.5万元</Descriptions.Item>
          </Descriptions>
          <Paragraph style={{ color: '#595959', lineHeight: 1.8 }}>
            本周能耗效率有所提升，单位能耗较上周下降3.0%。能耗排名前5位的水厂均采用了优化曝气控制策略，
            建议其他水厂参考学习。能耗较高的水厂主要集中在西北和东北地区，建议开展节能专项审计。
          </Paragraph>

          <Divider style={{ margin: '24px 0' }} />

          <Title level={4} style={{ color: '#262626', marginTop: 24, marginBottom: 16 }}>
            <ToolOutlined style={{ color: '#597ef7', marginRight: 8 }} />
            设备故障分析
          </Title>
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="设备总数">12,458台</Descriptions.Item>
            <Descriptions.Item label="故障设备数">328台</Descriptions.Item>
            <Descriptions.Item label="故障率">2.63%</Descriptions.Item>
            <Descriptions.Item label="已修复">285台</Descriptions.Item>
            <Descriptions.Item label="待修复">43台</Descriptions.Item>
            <Descriptions.Item label="平均修复时间">8.5小时</Descriptions.Item>
          </Descriptions>
          <Paragraph style={{ color: '#595959', lineHeight: 1.8 }}>
            本周设备故障率2.63%，处于正常水平。主要故障类型为电机故障（占比22%）和阀门卡死（占比18%）。
            建议对使用年限超过10年的设备进行预防性维护，降低故障发生率。
          </Paragraph>

          <Divider style={{ margin: '24px 0' }} />

          <Title level={4} style={{ color: '#262626', marginTop: 24, marginBottom: 16 }}>
            <CalendarOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
            下周计划
          </Title>
          <List
            dataSource={[
              '完成西南区域3座待改善水厂的现场调研和技术指导',
              '组织开展曝气系统优化运行专项培训',
              '安排15座水厂的设备预防性维护',
              '启动第二批水厂节能改造项目的方案评审',
              '完成本月水质全分析检测工作',
            ]}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>{item}</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      </Card>
    </div>
  );
};

export default OperationReport;
