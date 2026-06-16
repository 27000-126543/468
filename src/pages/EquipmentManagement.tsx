import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, Input, Button, Space, Timeline, Typography, Progress, Popconfirm } from 'antd';
import ReactECharts from 'echarts-for-react';
import { ToolOutlined, CheckCircleOutlined, WarningOutlined, SearchOutlined, HistoryOutlined, AlertOutlined } from '@ant-design/icons';
import { PLANTS, generateEquipmentStatus } from '../mock/data';
import type { PlantInfo, EquipmentStatus } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface EquipmentRecord {
  id: string;
  name: string;
  plantId: string;
  plantName: string;
  type: string;
  status: 'normal' | 'fault' | 'maintenance';
  runningHours: number;
  lastMaintenance: string;
  nextMaintenance: string;
  faultRate: number;
}

interface MaintenanceEvent {
  date: string;
  equipmentName: string;
  plantName: string;
  type: 'preventive' | 'repair';
  status: 'scheduled' | 'in_progress' | 'completed';
}

const EQUIPMENT_TYPES = ['曝气机', '回流泵', '污泥泵', '提升泵', '搅拌机', '刮泥机', '鼓风机', '加药泵', '脱水机', '阀门', '传感器'];

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #f0f2f5',
};

const headStyle: React.CSSProperties = {
  borderBottom: '1px solid #f0f2f5',
  color: '#262626',
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getFaultRateColor(rate: number): string {
  if (rate < 3) return '#52c41a';
  if (rate < 5) return '#faad14';
  return '#ff4d4f';
}

function generateEquipmentRecords(plants: PlantInfo[]): EquipmentRecord[] {
  const records: EquipmentRecord[] = [];
  plants.forEach((plant) => {
    const status = generateEquipmentStatus(plant.id);
    const maintenanceCount = Math.max(1, Math.floor(status.totalEquipment * rand(0.02, 0.03)));
    for (let i = 0; i < status.totalEquipment; i++) {
      const isFault = i < status.faultEquipment;
      const isMaintenance = i >= status.faultEquipment && i < status.faultEquipment + maintenanceCount;
      let equipStatus: 'normal' | 'fault' | 'maintenance' = 'normal';
      if (isFault) equipStatus = 'fault';
      else if (isMaintenance) equipStatus = 'maintenance';
      
      const runningHours = randInt(5000, 25000);
      const lastMaintenanceDate = new Date(Date.now() - randInt(30, 180) * 86400000);
      const nextMaintenanceDate = new Date(Date.now() + randInt(7, 90) * 86400000);
      
      records.push({
        id: `EQ${plant.id}${String(i + 1).padStart(4, '0')}`,
        name: `${pickOne(EQUIPMENT_TYPES)}${i + 1}号`,
        plantId: plant.id,
        plantName: plant.name,
        type: pickOne(EQUIPMENT_TYPES),
        status: equipStatus,
        runningHours,
        lastMaintenance: formatDate(lastMaintenanceDate),
        nextMaintenance: formatDate(nextMaintenanceDate),
        faultRate: Math.round(rand(0.5, 8) * 100) / 100,
      });
    }
  });
  return records;
}

function generateMaintenanceEvents(records: EquipmentRecord[]): MaintenanceEvent[] {
  const events: MaintenanceEvent[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() + i * 86400000);
    const dateStr = formatDate(date);
    const eventCount = randInt(1, 4);
    for (let j = 0; j < eventCount; j++) {
      const record = pickOne(records);
      events.push({
        date: dateStr,
        equipmentName: record.name,
        plantName: record.plantName,
        type: Math.random() < 0.6 ? 'preventive' : 'repair',
        status: i < 2 ? (i === 0 ? 'in_progress' : 'scheduled') : 'scheduled',
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

const EquipmentManagement: React.FC = () => {
  const [selectedPlant, setSelectedPlant] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState<string>('');

  const equipmentStatuses = useMemo<EquipmentStatus[]>(() => {
    return PLANTS.map((plant) => generateEquipmentStatus(plant.id));
  }, []);

  const equipmentRecords = useMemo<EquipmentRecord[]>(() => {
    return generateEquipmentRecords(PLANTS);
  }, []);

  const maintenanceEvents = useMemo<MaintenanceEvent[]>(() => {
    return generateMaintenanceEvents(equipmentRecords);
  }, [equipmentRecords]);

  const stats = useMemo(() => {
    const totalEquipment = equipmentStatuses.reduce((s, e) => s + e.totalEquipment, 0);
    const faultEquipment = equipmentStatuses.reduce((s, e) => s + e.faultEquipment, 0);
    const runningEquipment = totalEquipment - faultEquipment;
    const faultRate = Math.round((faultEquipment / totalEquipment) * 10000) / 100;
    return { totalEquipment, runningEquipment, faultEquipment, faultRate };
  }, [equipmentStatuses]);

  const plantOptions = useMemo(() => {
    return PLANTS.map((p) => ({ label: p.name, value: p.id }));
  }, []);

  const statusDistribution = useMemo(() => {
    const total = stats.totalEquipment;
    const fault = stats.faultEquipment;
    const maintenance = Math.floor(total * rand(0.02, 0.03));
    const normal = total - fault - maintenance;
    return { normal, fault, maintenance };
  }, [stats]);

  const doughnutOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
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
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: '#666',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: [
            { value: statusDistribution.normal, name: '正常运行', itemStyle: { color: '#52c41a' } },
            { value: statusDistribution.fault, name: '故障中', itemStyle: { color: '#ff4d4f' } },
            { value: statusDistribution.maintenance, name: '维护中', itemStyle: { color: '#faad14' } },
          ],
        },
      ],
    };
  }, [statusDistribution]);

  const plantFaultRates = useMemo(() => {
    return equipmentStatuses
      .map((es) => {
        const plant = PLANTS.find((p) => p.id === es.plantId);
        return {
          name: plant?.name || '',
          faultRate: es.faultRate,
        };
      })
      .sort((a, b) => b.faultRate - a.faultRate)
      .slice(0, 10);
  }, [equipmentStatuses]);

  const barChartOption = useMemo(() => {
    const barColors = plantFaultRates.map((p) => getFaultRateColor(p.faultRate));
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>故障率: ${p.value}%`;
        },
      },
      grid: {
        left: 160,
        right: 40,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'value',
        max: 10,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f0f2f5' } },
      },
      yAxis: {
        type: 'category',
        data: plantFaultRates.map((p) => p.name),
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: plantFaultRates.map((p, i) => ({
            value: p.faultRate,
            itemStyle: {
              color: barColors[i],
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: '50%',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#ff4d4f',
              type: 'dashed',
              width: 2,
            },
            data: [
              {
                xAxis: 5,
                label: {
                  formatter: '5% 阈值',
                  position: 'end',
                  color: '#ff4d4f',
                },
              },
            ],
          },
        },
      ],
    };
  }, [plantFaultRates]);

  const filteredRecords = useMemo(() => {
    return equipmentRecords.filter((r) => {
      if (selectedPlant && r.plantId !== selectedPlant) return false;
      if (selectedStatus && r.status !== selectedStatus) return false;
      if (searchText && !r.name.includes(searchText)) return false;
      return true;
    });
  }, [equipmentRecords, selectedPlant, selectedStatus, searchText]);

  const tableColumns = [
    {
      title: '设备编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 140,
    },
    {
      title: '所属污水厂',
      dataIndex: 'plantName',
      key: 'plantName',
      width: 200,
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: '运行状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render(status: string) {
        const map: Record<string, { color: string; text: string }> = {
          normal: { color: 'success', text: '正常运行' },
          fault: { color: 'error', text: '故障中' },
          maintenance: { color: 'warning', text: '维护中' },
        };
        const s = map[status] || map.normal;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '运行时长',
      dataIndex: 'runningHours',
      key: 'runningHours',
      width: 110,
      render(hours: number) {
        return `${hours.toLocaleString()} h`;
      },
    },
    {
      title: '上次维护时间',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
      width: 130,
    },
    {
      title: '下次维护时间',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
      width: 130,
    },
    {
      title: '故障率',
      dataIndex: 'faultRate',
      key: 'faultRate',
      width: 180,
      render(rate: number) {
        return (
          <Progress
            percent={rate}
            strokeColor={getFaultRateColor(rate)}
            format={(v) => `${v}%`}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render(_: any, record: EquipmentRecord) {
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<SearchOutlined />}>
              查看详情
            </Button>
            <Button type="link" size="small" icon={<HistoryOutlined />}>
              维护记录
            </Button>
            <Popconfirm title="确定要报修此设备吗？" okText="确定" cancelText="取消">
              <Button type="link" size="small" danger icon={<AlertOutlined />}>
                报修
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const groupedMaintenanceEvents = useMemo(() => {
    const map = new Map<string, MaintenanceEvent[]>();
    maintenanceEvents.forEach((e) => {
      const existing = map.get(e.date);
      if (existing) {
        existing.push(e);
      } else {
        map.set(e.date, [e]);
      }
    });
    return Array.from(map.entries()).slice(0, 7);
  }, [maintenanceEvents]);

  return (
    <div style={{ padding: 0, background: '#f5f7fa', minHeight: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>设备总数</span>}
              value={stats.totalEquipment}
              suffix="台"
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#36cfc9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>运行中设备</span>}
              value={stats.runningEquipment}
              suffix="台"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#73d13d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>故障设备</span>}
              value={stats.faultEquipment}
              suffix="台"
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#595959' }}>综合故障率</span>}
              value={stats.faultRate}
              suffix="%"
              prefix={<AlertOutlined />}
              valueStyle={{ color: getFaultRateColor(stats.faultRate) }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>设备运行状态分布</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={doughnutOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#262626' }}>各厂设备故障率</span>} style={cardStyle} styles={{ header: headStyle }}>
            <ReactECharts option={barChartOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ color: '#262626' }}>设备列表</span>}
        style={{ ...cardStyle, marginTop: 16 }}
        styles={{ header: headStyle }}
        extra={
          <Space>
            <Select
              placeholder="选择污水厂"
              allowClear
              style={{ width: 220 }}
              value={selectedPlant}
              onChange={setSelectedPlant}
              options={plantOptions}
            />
            <Select
              placeholder="设备状态"
              allowClear
              style={{ width: 140 }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="normal">正常运行</Option>
              <Option value="fault">故障中</Option>
              <Option value="maintenance">维护中</Option>
            </Select>
            <Input
              placeholder="搜索设备名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Space>
        }
      >
        <Table
          columns={tableColumns}
          dataSource={filteredRecords}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Card
        title={<span style={{ color: '#262626' }}>维护计划（未来14天）</span>}
        style={{ ...cardStyle, marginTop: 16 }}
        styles={{ header: headStyle }}
        extra={<ToolOutlined style={{ color: '#1890ff' }} />}
      >
        <Timeline
          mode="left"
          items={groupedMaintenanceEvents.map(([date, events]) => ({
            label: <Text strong style={{ color: '#262626' }}>{date}</Text>,
            children: (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {events.map((event, idx) => (
                  <Card key={idx} size="small" style={{ border: '1px solid #f0f2f5' }}>
                    <Space>
                      <Text strong>{event.equipmentName}</Text>
                      <Text type="secondary">-</Text>
                      <Text type="secondary">{event.plantName}</Text>
                      <Tag color={event.type === 'preventive' ? 'blue' : 'orange'}>
                        {event.type === 'preventive' ? '预防性维护' : '故障维修'}
                      </Tag>
                      <Tag color={event.status === 'in_progress' ? 'processing' : event.status === 'completed' ? 'success' : 'default'}>
                        {event.status === 'in_progress' ? '进行中' : event.status === 'completed' ? '已完成' : '待执行'}
                      </Tag>
                    </Space>
                  </Card>
                ))}
              </Space>
            ),
            color: 'blue',
          }))}
        />
      </Card>
    </div>
  );
};

export default EquipmentManagement;
