import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Tabs,
  Button,
  Drawer,
  Steps,
  Form,
  Input,
  Modal,
  Space,
  Typography,
  Badge,
  Popconfirm,
  message,
  Descriptions,
  Timeline,
} from 'antd';
import {
  AlertOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UndoOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PLANTS, generateAlerts, generateWaterQuality, generateEquipmentStatus } from '../mock/data';
import { useAppContext } from '../store/context';
import { filterPlantsByPermission } from '../utils/permission';
import type { AlertRecord, ApprovalStep, PlantInfo } from '../types';

const { Title, Text } = Typography;

interface ExecutionRecord {
  content: string;
  executor: string;
  executeTime: string;
  result: string;
  followUp: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  water_quality: { label: '水质超标', color: '#ff4d4f', icon: <AlertOutlined /> },
  equipment: { label: '设备故障', color: '#fa8c16', icon: <ThunderboltOutlined /> },
  emission: { label: '减排异常', color: '#722ed1', icon: <SafetyOutlined /> },
};

const levelConfig: Record<number, { label: string; color: string }> = {
  1: { label: '一级预警', color: '#ff4d4f' },
  2: { label: '二级预警', color: '#faad14' },
  3: { label: '三级预警', color: '#faad14' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#ff4d4f' },
  processing: { label: '处理中', color: '#faad14' },
  resolved: { label: '已解决', color: '#52c41a' },
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #f0f2f5',
};

const headStyle: React.CSSProperties = {
  borderBottom: '1px solid #f0f2f5',
  color: '#262626',
};

const PUSH_PREFIX = '【已推送：厂长-张明、属地生态环境局水环境科-李强】';

function deterministicRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

function pickDeterministic<T>(seed: string, arr: T[]): T {
  const idx = Math.floor(deterministicRandom(seed) * arr.length);
  return arr[idx];
}

function generateExecutionRecord(alert: AlertRecord): ExecutionRecord {
  const seed = `${alert.plantId}-${alert.type}`;
  const rand = deterministicRandom(seed);

  let content: string;
  if (alert.type === 'water_quality') {
    const doFrom = (1.8 + rand * 0.6).toFixed(1);
    const doTo = (parseFloat(doFrom) + 0.3 + rand * 0.4).toFixed(1);
    const refluxFrom = Math.floor(70 + rand * 20);
    const refluxTo = refluxFrom + Math.floor(5 + rand * 15);
    content = `曝气池DO浓度从${doFrom}mg/L提升至${doTo}mg/L；污泥回流比从${refluxFrom}%调整至${refluxTo}%`;
  } else if (alert.type === 'equipment') {
    const equipOptions = [
      '更换1号鼓风机轴承，重新校准压力传感器',
      '维修3号回流泵机械密封，更换滤芯',
      '清理2号曝气盘堵塞组，更换老化膜片',
      '校准pH/DO在线传感器，更换电极电解液',
    ];
    content = pickDeterministic(seed, equipOptions);
  } else {
    content = `优化工艺调度方案，提升处理负荷至设计值${Math.floor(85 + rand * 10)}%`;
  }

  const flow = alert.approvalFlow;
  const executeTime = flow && flow[2]?.timestamp
    ? flow[2].timestamp
    : new Date().toISOString();

  return {
    content,
    executor: '厂长-张明',
    executeTime,
    result: '成功',
    followUp: alert.type === 'equipment'
      ? '设备运行平稳，72小时无再次报警记录'
      : '持续监测出水COD/氨氮指标，预计24小时内见效',
  };
}

function generateSyncWaterQualityMessage(plant: PlantInfo, seed: string): string {
  const indicators = [
    { name: 'COD', valueFn: () => (51 + deterministicRandom(seed + 'v') * 29).toFixed(0), limit: '50', unit: 'mg/L' },
    { name: '氨氮', valueFn: () => (5.2 + deterministicRandom(seed + 'v') * 6.8).toFixed(1), limit: '5', unit: 'mg/L' },
    { name: '总磷', valueFn: () => (0.55 + deterministicRandom(seed + 'v') * 0.95).toFixed(1), limit: '0.5', unit: 'mg/L' },
  ];
  const indicator = pickDeterministic(seed, indicators);
  const duration = Math.floor(1 + deterministicRandom(seed + 'd') * 5);
  return `${indicator.name}${indicator.valueFn()}${indicator.unit}超标（限值${indicator.limit}${indicator.unit}），已持续${duration}小时`;
}

function generateSyncEquipmentMessage(plant: PlantInfo, seed: string): string {
  const total = Math.floor(100 + deterministicRandom(seed + 't') * 100);
  const faultCount = Math.floor(8 + deterministicRandom(seed + 'f') * 17);
  const faultRate = ((faultCount / total) * 100).toFixed(1);
  return `设备综合故障率${faultRate}%（阈值5%），故障设备${faultCount}台/总数${total}台`;
}

const AlertCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const permissionFilteredPlants = useMemo(() => filterPlantsByPermission(PLANTS, user.role, user.province, user.city), [user]);
  const [alerts, setAlerts] = useState<AlertRecord[]>(() => {
    const baseAlerts = generateAlerts(permissionFilteredPlants);
    if (user.role === 'municipal' && user.city) {
      const municipalPlantIds = permissionFilteredPlants.filter((p) => p.city === user.city).map((p) => p.id);
      return baseAlerts.filter((a) => municipalPlantIds.includes(a.plantId));
    }
    return baseAlerts;
  });
  const [activeTab, setActiveTab] = useState<string>('all');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [currentApprovalStep, setCurrentApprovalStep] = useState<number>(0);
  const [form] = Form.useForm();
  const [monitoredAbnormalPlants, setMonitoredAbnormalPlants] = useState<string[]>([]);
  const [logModalVisible, setLogModalVisible] = useState(false);

  useEffect(() => {
    const baseAlerts = generateAlerts(permissionFilteredPlants);
    if (user.role === 'municipal' && user.city) {
      const municipalPlantIds = permissionFilteredPlants.filter((p) => p.city === user.city).map((p) => p.id);
      setAlerts(baseAlerts.filter((a) => municipalPlantIds.includes(a.plantId)));
    } else {
      setAlerts(baseAlerts);
    }
  }, [user, permissionFilteredPlants]);

  const stats = useMemo(() => {
    const total = alerts.length;
    const pending = alerts.filter((a) => a.status === 'pending').length;
    const processing = alerts.filter((a) => a.status === 'processing').length;
    const resolved = alerts.filter((a) => a.status === 'resolved').length;
    return { total, pending, processing, resolved };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (activeTab === 'all') return alerts;
    return alerts.filter((a) => a.type === activeTab);
  }, [alerts, activeTab]);

  const getApprovalFlow = (alert: AlertRecord): ApprovalStep[] => {
    return alert.approvalFlow || [
      { role: '厂长确认', name: '张明', status: 'pending' },
      { role: '区环保局复核', name: '李强', status: 'pending' },
      { role: '省厅批准', name: '王伟', status: 'pending' },
    ];
  };

  const getCurrentStepIndex = (flow: ApprovalStep[]): number => {
    for (let i = 0; i < flow.length; i++) {
      if (flow[i].status === 'pending') return i;
    }
    return flow.length;
  };

  const getStepStatus = (status: string) => {
    if (status === 'approved') return 'finish';
    if (status === 'rejected') return 'error';
    return 'process';
  };

  const handleViewDetail = (alert: AlertRecord) => {
    setSelectedAlert(alert);
    setDetailDrawerVisible(true);
  };

  const handleProcess = (alert: AlertRecord, stepIndex: number) => {
    setSelectedAlert(alert);
    setCurrentApprovalStep(stepIndex);
    setProcessModalVisible(true);
    form.resetFields();
  };

  const handleProcessSubmit = () => {
    form.validateFields().then((values) => {
      if (!selectedAlert) return;

      const approval = values.approval as 'approve' | 'reject';
      const comment = values.comment as string;

      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id !== selectedAlert.id) return a;

          const flow = getApprovalFlow(a);
          const newStepStatus: 'approved' | 'rejected' = approval === 'approve' ? 'approved' : 'rejected';
          const updatedFlow: ApprovalStep[] = flow.map((step, idx) => {
            if (idx === currentApprovalStep) {
              return {
                ...step,
                status: newStepStatus,
                timestamp: new Date().toISOString(),
                comment,
              };
            }
            return step;
          });

          const newStatus: 'pending' | 'processing' | 'resolved' =
            approval === 'reject'
              ? 'pending'
              : currentApprovalStep === flow.length - 1
              ? 'resolved'
              : 'processing';

          return {
            ...a,
            status: newStatus,
            approvalFlow: updatedFlow,
          };
        })
      );

      setSelectedAlert(null);
      setProcessModalVisible(false);
    });
  };

  const handleSyncAbnormal = () => {
    const timestamp = Date.now();
    const newAbnormalPlantIds: string[] = [];
    const newAlerts: AlertRecord[] = [];
    const now = new Date().toISOString();
    const normalPlantTypeKeys: string[] = [];

    permissionFilteredPlants.forEach((plant) => {
      const waterQuality = generateWaterQuality(plant);
      const equipment = generateEquipmentStatus(plant.id);

      const codExceed = waterQuality.codOut > waterQuality.codLimit;
      const nh3nExceed = waterQuality.nh3nOut > waterQuality.nh3nLimit;
      const tpExceed = waterQuality.tpOut > waterQuality.tpLimit;
      const waterQualityAbnormal = codExceed || nh3nExceed || tpExceed;

      const equipmentAbnormal = equipment.faultRate > 5;

      if (waterQualityAbnormal) {
        const alertId = `SYNC-${plant.id}-water_quality-${timestamp}`;
        const dedupeKey = `${plant.id}-water_quality`;
        const exists = alerts.some((a) => `${a.plantId}-${a.type}` === dedupeKey);
        if (!exists) {
          const exceedMsgs: string[] = [];
          if (codExceed) exceedMsgs.push(`COD${waterQuality.codOut}mg/L超标（限值${waterQuality.codLimit}mg/L）`);
          if (nh3nExceed) exceedMsgs.push(`氨氮${waterQuality.nh3nOut}mg/L超标（限值${waterQuality.nh3nLimit}mg/L）`);
          if (tpExceed) exceedMsgs.push(`总磷${waterQuality.tpOut}mg/L超标（限值${waterQuality.tpLimit}mg/L）`);
          const detailMsg = exceedMsgs.length > 0 ? exceedMsgs.join('，') : '水质指标超标';
          newAlerts.push({
            id: alertId,
            plantId: plant.id,
            plantName: plant.name,
            type: 'water_quality',
            level: 1,
            message: `${PUSH_PREFIX}${detailMsg}`,
            timestamp: now,
            status: 'pending',
            approvalFlow: [
              { role: '厂长', name: '张明', status: 'pending' },
              { role: '区环保局复核', name: '李强', status: 'pending' },
              { role: '省厅批准', name: '王伟', status: 'pending' },
            ],
          });
          if (!newAbnormalPlantIds.includes(plant.id)) {
            newAbnormalPlantIds.push(plant.id);
          }
        }
      } else {
        normalPlantTypeKeys.push(`${plant.id}-water_quality`);
      }

      if (equipmentAbnormal) {
        const alertId = `SYNC-${plant.id}-equipment-${timestamp}`;
        const dedupeKey = `${plant.id}-equipment`;
        const exists = alerts.some((a) => `${a.plantId}-${a.type}` === dedupeKey);
        if (!exists) {
          const detailMsg = `设备综合故障率${equipment.faultRate}%（阈值5%），故障设备${equipment.faultEquipment}台/总数${equipment.totalEquipment}台`;
          newAlerts.push({
            id: alertId,
            plantId: plant.id,
            plantName: plant.name,
            type: 'equipment',
            level: 1,
            message: `${PUSH_PREFIX}${detailMsg}`,
            timestamp: now,
            status: 'pending',
            approvalFlow: [
              { role: '厂长', name: '张明', status: 'pending' },
              { role: '区环保局复核', name: '李强', status: 'pending' },
              { role: '省厅批准', name: '王伟', status: 'pending' },
            ],
          });
          if (!newAbnormalPlantIds.includes(plant.id)) {
            newAbnormalPlantIds.push(plant.id);
          }
        }
      } else {
        normalPlantTypeKeys.push(`${plant.id}-equipment`);
      }
    });

    setAlerts((prev) => {
      let result = [...prev];
      if (normalPlantTypeKeys.length > 0) {
        result = result.map((a) => {
          const key = `${a.plantId}-${a.type}`;
          if (normalPlantTypeKeys.includes(key) && (a.status === 'pending' || a.status === 'processing')) {
            const flow = getApprovalFlow(a);
            const updatedFlow: ApprovalStep[] = flow.map((step, idx) => {
              if (step.status === 'pending') {
                return {
                  ...step,
                  status: 'approved',
                  timestamp: new Date().toISOString(),
                  comment: idx === flow.length - 1 ? '异常指标已恢复正常，预警解除' : '已确认',
                };
              }
              return step;
            });
            return {
              ...a,
              status: 'resolved',
              timestamp: new Date().toISOString(),
              approvalFlow: updatedFlow,
            };
          }
          return a;
        });
      }
      if (newAlerts.length > 0) {
        result = [...newAlerts, ...result];
      }
      return result;
    });

    if (newAbnormalPlantIds.length > 0) {
      setMonitoredAbnormalPlants((prev) => Array.from(new Set([...prev, ...newAbnormalPlantIds])));
    }

    const resolvedCount = normalPlantTypeKeys.filter((k) => {
      return alerts.some((a) => `${a.plantId}-${a.type}` === k && (a.status === 'pending' || a.status === 'processing'));
    }).length;

    if (newAlerts.length > 0 || resolvedCount > 0) {
      message.success(`同步完成，新增 ${newAlerts.length} 条预警，解除 ${resolvedCount} 条已恢复预警`);
    } else {
      message.success('同步完成，当前监控数据正常，无新增预警');
    }
  };

  const handleResolveAlert = (alert: AlertRecord) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alert.id) return a;
        const flow = getApprovalFlow(a);
        const updatedFlow: ApprovalStep[] = flow.map((step, idx) => {
          if (step.status === 'pending') {
            return {
              ...step,
              status: 'approved',
              timestamp: new Date().toISOString(),
              comment: idx === flow.length - 1 ? '异常指标已恢复正常，预警解除' : '已确认',
            };
          }
          return step;
        });
        return {
          ...a,
          status: 'resolved',
          timestamp: new Date().toISOString(),
          approvalFlow: updatedFlow,
        };
      })
    );
    message.success('预警已解除');
  };

  const columns = [
    {
      title: '预警级别',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (v: number) => <Tag color={levelConfig[v].color}>{levelConfig[v].label}</Tag>,
    },
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (v: string) => (
        <Space>
          <span style={{ color: typeConfig[v].color }}>{typeConfig[v].icon}</span>
          <span>{typeConfig[v].label}</span>
        </Space>
      ),
    },
    {
      title: '污水厂',
      dataIndex: 'plantName',
      key: 'plantName',
      width: 200,
      render: (v: string, record: AlertRecord) => {
        const canAccess = permissionFilteredPlants.some((p) => p.id === record.plantId);
        return (
          <Button
            type="link"
            onClick={() => {
              if (!canAccess) {
                message.warning('您没有权限访问该污水厂');
                navigate('/alert');
                return;
              }
              navigate(`/plant-detail/${record.plantId}`);
            }}
          >
            {v}
          </Button>
        );
      },
    },
    {
      title: '预警内容',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '预警时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusConfig[v].color}>{statusConfig[v].label}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 360,
      render: (_: any, record: AlertRecord) => {
        const flow = getApprovalFlow(record);
        const currentStepIdx = getCurrentStepIndex(flow);

        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              查看详情
            </Button>
            {record.status !== 'resolved' && (
              <Button type="link" size="small" onClick={() => handleProcess(record, currentStepIdx)}>
                处理
              </Button>
            )}
            <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
              三级审批
            </Button>
            {record.status !== 'resolved' && (
              <Popconfirm
                title="确认异常已解除？"
                onConfirm={() => handleResolveAlert(record)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<UndoOutlined />} danger>
                  解除预警
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'water_quality', label: '水质超标' },
    { key: 'equipment', label: '设备故障' },
    { key: 'emission', label: '减排异常' },
  ];

  const selectedExecutionRecord = selectedAlert ? generateExecutionRecord(selectedAlert) : null;

  return (
    <div style={{ padding: 0, background: '#f5f7fa', minHeight: '100%' }}>
      <Title level={4} style={{ margin: '0 0 16px 0', color: '#262626' }}>
        预警中心
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Badge.Ribbon text="预警总数" color="#1890ff">
            <Card style={cardStyle}>
              <Statistic
                title={<span style={{ color: '#595959' }}>预警总数</span>}
                value={stats.total}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Badge.Ribbon>
        </Col>
        <Col span={6}>
          <Badge.Ribbon text="待处理" color="#ff4d4f">
            <Card style={cardStyle}>
              <Statistic
                title={<span style={{ color: '#595959' }}>待处理</span>}
                value={stats.pending}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Badge.Ribbon>
        </Col>
        <Col span={6}>
          <Badge.Ribbon text="处理中" color="#faad14">
            <Card style={cardStyle}>
              <Statistic
                title={<span style={{ color: '#595959' }}>处理中</span>}
                value={stats.processing}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Badge.Ribbon>
        </Col>
        <Col span={6}>
          <Badge.Ribbon text="已解决" color="#52c41a">
            <Card style={cardStyle}>
              <Statistic
                title={<span style={{ color: '#595959' }}>已解决</span>}
                value={stats.resolved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Badge.Ribbon>
        </Col>
      </Row>

      <Card
        style={{ ...cardStyle, marginTop: 16 }}
        styles={{ header: headStyle }}
        title="预警列表"
        extra={
          <Button type="primary" icon={<SyncOutlined />} onClick={handleSyncAbnormal}>
            同步实时监控异常
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          columns={columns}
          dataSource={filteredAlerts}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Drawer
        title="预警详情"
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedAlert && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" title="基本信息">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">预警级别：</Text>
                  <Tag color={levelConfig[selectedAlert.level].color}>
                    {levelConfig[selectedAlert.level].label}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text type="secondary">预警类型：</Text>
                  <span style={{ color: typeConfig[selectedAlert.type].color }}>
                    {typeConfig[selectedAlert.type].icon} {typeConfig[selectedAlert.type].label}
                  </span>
                </Col>
                <Col span={12}>
                  <Text type="secondary">污水厂：</Text>
                  <Button
                    type="link"
                    onClick={() => {
                      const canAccess = permissionFilteredPlants.some((p) => p.id === selectedAlert.plantId);
                      if (!canAccess) {
                        message.warning('您没有权限访问该污水厂');
                        setDetailDrawerVisible(false);
                        navigate('/alert');
                        return;
                      }
                      setDetailDrawerVisible(false);
                      navigate(`/plant-detail/${selectedAlert.plantId}`);
                    }}
                  >
                    {selectedAlert.plantName}
                  </Button>
                </Col>
                <Col span={12}>
                  <Text type="secondary">状态：</Text>
                  <Tag color={statusConfig[selectedAlert.status].color}>
                    {statusConfig[selectedAlert.status].label}
                  </Tag>
                </Col>
                <Col span={24}>
                  <Text type="secondary">预警时间：</Text>
                  {dayjs(selectedAlert.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Col>
                <Col span={24}>
                  <Text type="secondary">预警内容：</Text>
                  <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{selectedAlert.message}</div>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="三级审批流程">
              <Steps
                direction="vertical"
                current={getCurrentStepIndex(getApprovalFlow(selectedAlert))}
                items={getApprovalFlow(selectedAlert).map((step, idx) => ({
                  title: step.role,
                  status: getStepStatus(step.status),
                  description: (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary">审批人：</Text>
                        {step.name}
                      </div>
                      {step.timestamp && (
                        <div>
                          <Text type="secondary">时间：</Text>
                          {dayjs(step.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                      )}
                      {step.comment && (
                        <div>
                          <Text type="secondary">意见：</Text>
                          <Tag color={step.status === 'approved' ? 'green' : 'red'}>
                            {step.status === 'approved' ? '通过' : '驳回'}
                          </Tag>
                          <span style={{ marginLeft: 8 }}>{step.comment}</span>
                        </div>
                      )}
                      {step.status === 'pending' && selectedAlert.status !== 'resolved' && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            setDetailDrawerVisible(false);
                            handleProcess(selectedAlert, idx);
                          }}
                        >
                          处理
                        </Button>
                      )}
                    </Space>
                  ),
                }))}
              />
            </Card>

            {selectedAlert.status === 'resolved' && selectedExecutionRecord && (
              <Card
                size="small"
                title={
                  <Space>
                    <span>工艺参数调整/应急处理执行记录</span>
                    <Tag color="#52c41a">执行完毕</Tag>
                  </Space>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    icon={<FileTextOutlined />}
                    onClick={() => setLogModalVisible(true)}
                  >
                    查看完整操作日志
                  </Button>
                }
              >
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="调整内容">
                    {selectedExecutionRecord.content}
                  </Descriptions.Item>
                  <Descriptions.Item label="执行人">
                    {selectedExecutionRecord.executor}
                  </Descriptions.Item>
                  <Descriptions.Item label="执行时间">
                    {dayjs(selectedExecutionRecord.executeTime).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="执行结果">
                    <Tag color="#52c41a">{selectedExecutionRecord.result}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="后续跟踪">
                    {selectedExecutionRecord.followUp}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </Space>
        )}
      </Drawer>

      <Modal
        title="审批处理"
        open={processModalVisible}
        onOk={handleProcessSubmit}
        onCancel={() => setProcessModalVisible(false)}
        okText="提交"
        cancelText="取消"
      >
        {selectedAlert && (
          <Form form={form} layout="vertical">
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 8 }}>
              <div>
                <Text type="secondary">审批步骤：</Text>
                <strong>
                  {getApprovalFlow(selectedAlert)[currentApprovalStep]?.role || '审批'}
                </strong>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">预警内容：</Text>
                {selectedAlert.message}
              </div>
            </div>
            <Form.Item
              name="approval"
              label="审批意见"
              rules={[{ required: true, message: '请选择审批意见' }]}
            >
              <div style={{ display: 'flex', gap: 16 }}>
                <Button
                  icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  onClick={() => form.setFieldValue('approval', 'approve')}
                  type={form.getFieldValue('approval') === 'approve' ? 'primary' : 'default'}
                >
                  通过
                </Button>
                <Button
                  icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  onClick={() => form.setFieldValue('approval', 'reject')}
                  type={form.getFieldValue('approval') === 'reject' ? 'primary' : 'default'}
                  danger
                >
                  驳回
                </Button>
              </div>
            </Form.Item>
            <Form.Item
              name="comment"
              label="审批备注"
              rules={[{ required: true, message: '请输入审批备注' }]}
            >
              <Input.TextArea rows={4} placeholder="请输入审批备注..." />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="完整操作日志"
        open={logModalVisible}
        onCancel={() => setLogModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLogModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedAlert && selectedExecutionRecord && (
          <Timeline
            mode="left"
            items={[
              {
                color: '#ff4d4f',
                label: dayjs(selectedAlert.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                children: (
                  <div>
                    <div><strong>预警触发</strong></div>
                    <div style={{ color: '#8c8c8c', marginTop: 4 }}>{selectedAlert.message}</div>
                  </div>
                ),
              },
              ...getApprovalFlow(selectedAlert)
                .filter((s) => s.status !== 'pending')
                .map((step, idx) => ({
                  color: '#52c41a',
                  label: step.timestamp ? dayjs(step.timestamp).format('YYYY-MM-DD HH:mm:ss') : '',
                  children: (
                    <div>
                      <div><strong>{step.role} - {step.name}</strong></div>
                      <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                        审批通过：{step.comment || '无'}
                      </div>
                    </div>
                  ),
                })),
              {
                color: '#1890ff',
                label: dayjs(selectedExecutionRecord.executeTime).format('YYYY-MM-DD HH:mm:ss'),
                children: (
                  <div>
                    <div><strong>执行操作 - {selectedExecutionRecord.executor}</strong></div>
                    <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                      {selectedExecutionRecord.content}
                    </div>
                  </div>
                ),
              },
              {
                color: '#52c41a',
                label: dayjs(selectedExecutionRecord.executeTime).add(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
                children: (
                  <div>
                    <div><strong>执行结果确认</strong></div>
                    <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                      执行{selectedExecutionRecord.result}。{selectedExecutionRecord.followUp}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default AlertCenter;
