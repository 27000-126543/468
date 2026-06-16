import React, { useState, useMemo } from 'react';
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
} from 'antd';
import {
  AlertOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PLANTS, generateAlerts } from '../mock/data';
import type { AlertRecord, ApprovalStep } from '../types';

const { Title, Text } = Typography;

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

const AlertCenter: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRecord[]>(() => generateAlerts(PLANTS));
  const [activeTab, setActiveTab] = useState<string>('all');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [currentApprovalStep, setCurrentApprovalStep] = useState<number>(0);
  const [form] = Form.useForm();

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
      render: (v: string, record: AlertRecord) => (
        <Button type="link" onClick={() => navigate(`/plant-detail/${record.plantId}`)}>
          {v}
        </Button>
      ),
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
      width: 280,
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

      <Card style={{ ...cardStyle, marginTop: 16 }} styles={{ header: headStyle }}>
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
                    onClick={() => navigate(`/plant-detail/${selectedAlert.plantId}`)}
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
                  <div style={{ marginTop: 8 }}>{selectedAlert.message}</div>
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
    </div>
  );
};

export default AlertCenter;
