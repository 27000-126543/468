import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Select, Table, Tag, Space, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { PLANTS } from '../mock/data';
import type { PlantInfo, WaterQuality, EquipmentStatus } from '../types';
import { useAppContext } from '../store/context';
import { filterPlantsByPermission } from '../utils/permission';

const { Title } = Typography;

interface Threshold {
  value: number;
  color: string;
}

interface PlantRealTimeData {
  plant: PlantInfo;
  waterQuality: WaterQuality;
  equipmentStatus: EquipmentStatus;
}

function getGaugeOption(value: number, title: string, min: number, max: number, thresholds: Threshold[]) {
  const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value);
  const axisLineColors = sortedThresholds.map((t, i) => {
    const prev = i === 0 ? min : sortedThresholds[i - 1].value;
    return [Math.min(1, (t.value - min) / (max - min)), t.color];
  });

  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min,
        max,
        radius: '90%',
        center: ['50%', '55%'],
        axisLine: {
          lineStyle: {
            width: 20,
            color: axisLineColors,
          },
        },
        pointer: {
          itemStyle: {
            color: '#1890ff',
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 10,
          },
          length: '65%',
          width: 5,
        },
        axisTick: {
          distance: -20,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2,
          },
        },
        splitLine: {
          distance: -25,
          length: 14,
          lineStyle: {
            color: '#fff',
            width: 3,
          },
        },
        axisLabel: {
          color: '#666',
          distance: 25,
          fontSize: 11,
          formatter(v: number) {
            if (max > 100) return v.toFixed(0);
            if (max > 10) return v.toFixed(0);
            if (max > 2) return v.toFixed(1);
            return v.toFixed(1);
          },
        },
        detail: {
          valueAnimation: true,
          formatter: (v: number) => v.toFixed(max > 10 ? 1 : 2),
          color: '#262626',
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, '25%'],
        },
        title: {
          offsetCenter: [0, '70%'],
          fontSize: 14,
          color: '#595959',
          fontWeight: 500,
        },
        data: [
          {
            value,
            name: title,
          },
        ],
      },
    ],
  };
}

const Monitoring: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [selectedProcess, setSelectedProcess] = useState<string | undefined>(undefined);
  const { user, monitorSnapshot, refreshMonitorSnapshot } = useAppContext();

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMonitorSnapshot();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshMonitorSnapshot]);

  const permissionFilteredPlants = useMemo(() => {
    return filterPlantsByPermission(PLANTS, user.role, user.province, user.city);
  }, [user]);

  const provinceList = useMemo(() => [...new Set(permissionFilteredPlants.map((p) => p.province))].sort(), [permissionFilteredPlants]);
  const processList = useMemo(() => [...new Set(permissionFilteredPlants.map((p) => p.processType))].sort(), [permissionFilteredPlants]);

  const [loadRate, complianceRate, energyEfficiency, sludgeIntensity] = useMemo(() => {
    const totalLoad = permissionFilteredPlants.reduce((s, p) => s + p.currentLoad, 0);
    const totalDesign = permissionFilteredPlants.reduce((s, p) => s + p.designScale, 0);
    const lr = Math.min(120, +((totalLoad / totalDesign) * 100 * (0.95 + Math.random() * 0.1)).toFixed(1));

    const wqSamples = permissionFilteredPlants
      .slice(0, 50)
      .map((p) => monitorSnapshot.waterQualityMap[p.id])
      .filter(Boolean);
    const compliant = wqSamples.filter((w) => w.codOut <= w.codLimit && w.nh3nOut <= w.nh3nLimit && w.tpOut <= w.tpLimit).length;
    const cr = wqSamples.length > 0
      ? +((compliant / wqSamples.length) * 100 * (0.98 + Math.random() * 0.04)).toFixed(1)
      : 100;

    const ee = +((0.25 + Math.random() * 0.25)).toFixed(3);
    const si = +((0.4 + Math.random() * 0.4)).toFixed(2);

    return [lr, cr, ee, si];
  }, [permissionFilteredPlants, monitorSnapshot]);

  const plantData = useMemo<PlantRealTimeData[]>(() => {
    return permissionFilteredPlants.map((plant) => {
      const wq = monitorSnapshot.waterQualityMap[plant.id];
      const eq = monitorSnapshot.equipmentMap[plant.id];
      return { plant, waterQuality: wq, equipmentStatus: eq };
    });
  }, [permissionFilteredPlants, monitorSnapshot]);

  const filteredData = useMemo(() => {
    return plantData.filter((d) => {
      if (selectedProvince && d.plant.province !== selectedProvince) return false;
      if (selectedProcess && d.plant.processType !== selectedProcess) return false;
      return true;
    });
  }, [plantData, selectedProvince, selectedProcess]);

  const loadRateOption = useMemo(
    () =>
      getGaugeOption(loadRate, '处理负荷率 (%)', 0, 120, [
        { value: 85, color: '#52c41a' },
        { value: 100, color: '#faad14' },
        { value: 120, color: '#ff4d4f' },
      ]),
    [loadRate]
  );

  const complianceRateOption = useMemo(
    () =>
      getGaugeOption(complianceRate, '出水达标率 (%)', 0, 100, [
        { value: 90, color: '#ff4d4f' },
        { value: 95, color: '#faad14' },
        { value: 100, color: '#52c41a' },
      ]),
    [complianceRate]
  );

  const energyEfficiencyOption = useMemo(
    () =>
      getGaugeOption(energyEfficiency, '单位能耗 (kWh/吨)', 0, 1, [
        { value: 0.3, color: '#52c41a' },
        { value: 0.5, color: '#faad14' },
        { value: 1, color: '#ff4d4f' },
      ]),
    [energyEfficiency]
  );

  const sludgeIntensityOption = useMemo(
    () =>
      getGaugeOption(sludgeIntensity, '污泥产生强度 (kg/m³)', 0, 2, [
        { value: 0.5, color: '#52c41a' },
        { value: 1, color: '#faad14' },
        { value: 2, color: '#ff4d4f' },
      ]),
    [sludgeIntensity]
  );

  const isNonCompliant = (wq: WaterQuality) => {
    return wq.codOut > wq.codLimit || wq.nh3nOut > wq.nh3nLimit || wq.tpOut > wq.tpLimit;
  };

  const getComplianceStatus = (wq: WaterQuality) => {
    return !isNonCompliant(wq);
  };

  const getLoadStatus = (load: number, design: number) => {
    const rate = (load / design) * 100;
    if (rate > 100) return 'overload';
    if (rate > 85) return 'high';
    return 'normal';
  };

  const columns = [
    {
      title: '污水厂名称',
      dataIndex: ['plant', 'name'],
      key: 'name',
      fixed: 'left' as const,
      width: 180,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '省份',
      dataIndex: ['plant', 'province'],
      key: 'province',
      width: 80,
    },
    {
      title: '处理工艺',
      dataIndex: ['plant', 'processType'],
      key: 'processType',
      width: 100,
    },
    {
      title: '设计规模',
      dataIndex: ['plant', 'designScale'],
      key: 'designScale',
      width: 100,
      render: (v: number) => `${v} 万吨/日`,
    },
    {
      title: '当前处理量',
      dataIndex: ['waterQuality', 'flowIn'],
      key: 'flowIn',
      width: 110,
      render: (v: number) => `${v.toFixed(2)} 万吨/日`,
    },
    {
      title: '负荷率',
      key: 'loadRate',
      width: 100,
      render: (_: any, record: PlantRealTimeData) => {
        const rate = (record.plant.currentLoad / record.plant.designScale) * 100;
        const status = getLoadStatus(record.plant.currentLoad, record.plant.designScale);
        const color = status === 'normal' ? '#52c41a' : status === 'high' ? '#faad14' : '#ff4d4f';
        return (
          <Space>
            <span style={{ color, fontWeight: 500 }}>{rate.toFixed(1)}%</span>
            <Tag color={status === 'normal' ? 'green' : status === 'high' ? 'orange' : 'red'}>
              {status === 'normal' ? '正常' : status === 'high' ? '高负荷' : '过载'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '进水COD',
      dataIndex: ['waterQuality', 'codIn'],
      key: 'codIn',
      width: 100,
      render: (v: number) => `${v} mg/L`,
    },
    {
      title: '出水COD',
      dataIndex: ['waterQuality', 'codOut'],
      key: 'codOut',
      width: 100,
      render: (v: number, record: PlantRealTimeData) => (
        <span style={{ color: v > record.waterQuality.codLimit ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>
          {v} mg/L
        </span>
      ),
    },
    {
      title: 'COD限值',
      dataIndex: ['waterQuality', 'codLimit'],
      key: 'codLimit',
      width: 90,
      render: (v: number) => `${v} mg/L`,
    },
    {
      title: '达标状态',
      key: 'compliance',
      width: 100,
      render: (_: any, record: PlantRealTimeData) => {
        const compliant = getComplianceStatus(record.waterQuality);
        return (
          <Tag color={compliant ? 'green' : 'red'}>
            {compliant ? '达标' : '超标'}
          </Tag>
        );
      },
    },
    {
      title: '进水氨氮',
      dataIndex: ['waterQuality', 'nh3nIn'],
      key: 'nh3nIn',
      width: 100,
      render: (v: number) => `${v.toFixed(1)} mg/L`,
    },
    {
      title: '出水氨氮',
      dataIndex: ['waterQuality', 'nh3nOut'],
      key: 'nh3nOut',
      width: 100,
      render: (v: number, record: PlantRealTimeData) => (
        <span style={{ color: v > record.waterQuality.nh3nLimit ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>
          {v.toFixed(1)} mg/L
        </span>
      ),
    },
    {
      title: '氨氮限值',
      dataIndex: ['waterQuality', 'nh3nLimit'],
      key: 'nh3nLimit',
      width: 90,
      render: (v: number) => `${v} mg/L`,
    },
    {
      title: '总磷',
      dataIndex: ['waterQuality', 'tpOut'],
      key: 'tpOut',
      width: 100,
      render: (v: number, record: PlantRealTimeData) => (
        <span style={{ color: v > record.waterQuality.tpLimit ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>
          {v.toFixed(2)} mg/L
        </span>
      ),
    },
    {
      title: '总磷限值',
      dataIndex: ['waterQuality', 'tpLimit'],
      key: 'tpLimit',
      width: 90,
      render: (v: number) => `${v} mg/L`,
    },
    {
      title: '设备故障率',
      dataIndex: ['equipmentStatus', 'faultRate'],
      key: 'faultRate',
      width: 110,
      render: (v: number) => (
        <span style={{ color: v > 5 ? '#ff4d4f' : v > 3 ? '#faad14' : '#52c41a', fontWeight: 500 }}>
          {v.toFixed(2)}%
        </span>
      ),
    },
  ];

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #f0f2f5',
  };

  const headStyle: React.CSSProperties = {
    borderBottom: '1px solid #f0f2f5',
    color: '#262626',
  };

  return (
    <div style={{ padding: 0, background: '#f5f7fa', minHeight: '100%' }}>
      <Title level={4} style={{ margin: '0 0 16px 0', color: '#262626' }}>
        实时监控中心
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card style={cardStyle} bodyStyle={{ padding: '12px 16px' }}>
            <ReactECharts option={loadRateOption} style={{ height: 220 }} notMerge />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bodyStyle={{ padding: '12px 16px' }}>
            <ReactECharts option={complianceRateOption} style={{ height: 220 }} notMerge />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bodyStyle={{ padding: '12px 16px' }}>
            <ReactECharts option={energyEfficiencyOption} style={{ height: 220 }} notMerge />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={cardStyle} bodyStyle={{ padding: '12px 16px' }}>
            <ReactECharts option={sludgeIntensityOption} style={{ height: 220 }} notMerge />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ color: '#262626' }}>污水厂实时运行数据</span>}
        style={{ ...cardStyle, marginTop: 16 }}
        styles={{ header: headStyle }}
        extra={
          <Space>
            <Select
              placeholder="选择省份"
              allowClear
              style={{ width: 160 }}
              value={selectedProvince}
              onChange={setSelectedProvince}
              options={provinceList.map((p) => ({ label: p, value: p }))}
            />
            <Select
              placeholder="选择工艺类型"
              allowClear
              style={{ width: 160 }}
              value={selectedProcess}
              onChange={setSelectedProcess}
              options={processList.map((p) => ({ label: p, value: p }))}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.plant.id}
          scroll={{ x: 1700, y: 500 }}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          onRow={(record) => ({
            onClick: () => navigate('/plant-detail/' + record.plant.id),
            style: { cursor: 'pointer' },
          })}
          rowClassName={(record) =>
            isNonCompliant(record.waterQuality) ? 'table-row-warning' : ''
          }
        />
      </Card>

      <style>{`
        .table-row-warning {
          background-color: #fff2f0 !important;
        }
        .table-row-warning:hover > td {
          background-color: #fff2f0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
};

export default Monitoring;
