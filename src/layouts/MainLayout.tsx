import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Badge, theme, ConfigProvider, Select, Tag } from 'antd';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  AlertOutlined,
  LineChartOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppContext } from '../store/context';
import { MOCK_USER, PLANTS } from '../mock/data';
import type { UserRole } from '../types';
import { getPermissionScope } from '../utils/permission';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '核心看板',
  },
  {
    key: '/monitoring',
    icon: <LineChartOutlined />,
    label: '实时监控',
  },
  {
    key: '/alert',
    icon: <AlertOutlined />,
    label: '预警中心',
  },
  {
    key: '/emission',
    icon: <SafetyCertificateOutlined />,
    label: '减排管理',
  },
  {
    key: '/report',
    icon: <FileTextOutlined />,
    label: '运营诊断',
  },
  {
    key: '/equipment',
    icon: <ToolOutlined />,
    label: '设备管理',
  },
];

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: '个人信息',
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: '权限设置',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: '退出登录',
      icon: <LogoutOutlined />,
    },
  ];

  const roleDisplay = {
    national: '国家级',
    provincial: '省级',
    municipal: '市级',
  };

  const provinceList = [...new Set(PLANTS.map((p) => p.province))].sort();
  const cityList = user.province
    ? [...new Set(PLANTS.filter((p) => p.province === user.province).map((p) => p.city))].sort()
    : [];

  const handleRoleChange = (role: UserRole) => {
    const newUser = { ...user, role };
    if (role === 'national') {
      newUser.province = undefined;
      newUser.city = undefined;
      newUser.name = '国家管理员';
    } else if (role === 'provincial') {
      newUser.province = newUser.province || '广东';
      newUser.city = undefined;
      newUser.name = `${newUser.province}管理员`;
    } else if (role === 'municipal') {
      newUser.province = newUser.province || '广东';
      newUser.city = newUser.city || '深圳';
      newUser.name = `${newUser.city}管理员`;
    }
    setUser(newUser);
  };

  const handleProvinceChange = (province: string) => {
    setUser({ ...user, province, city: undefined, name: `${province}管理员` });
  };

  const handleCityChange = (city: string) => {
    setUser({ ...user, city, name: `${city}管理员` });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={240}
        style={{
          background: 'linear-gradient(180deg, #001529 0%, #000c17 100%)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 20,
            color: '#fff',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 600,
            letterSpacing: 0.5,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 8,
          }}
        >
          <EnvironmentOutlined style={{ fontSize: 20, marginRight: collapsed ? 0 : 10, color: '#1890ff' }} />
          {!collapsed && <span>水环境管理</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key as string)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
              全国城镇污水处理厂运行与减排分析平台
            </h2>
            <Tag color="blue" icon={<GlobalOutlined />} style={{ margin: 0 }}>
              管辖范围: {getPermissionScope(user.role, user.province, user.city)}
            </Tag>
            <Space size="small" wrap>
              <span style={{ fontSize: 13, color: '#8c8c8c' }}>角色:</span>
              <Select
                value={user.role}
                onChange={handleRoleChange}
                style={{ width: 100 }}
                size="small"
                options={[
                  { label: '国家级', value: 'national' },
                  { label: '省级', value: 'provincial' },
                  { label: '市级', value: 'municipal' },
                ]}
              />
              {user.role !== 'national' && (
                <>
                  <span style={{ fontSize: 13, color: '#8c8c8c' }}>省份:</span>
                  <Select
                    value={user.province}
                    onChange={handleProvinceChange}
                    style={{ width: 110 }}
                    size="small"
                    options={provinceList.map((p) => ({ label: p, value: p }))}
                  />
                </>
              )}
              {user.role === 'municipal' && (
                <>
                  <span style={{ fontSize: 13, color: '#8c8c8c' }}>城市:</span>
                  <Select
                    value={user.city}
                    onChange={handleCityChange}
                    style={{ width: 110 }}
                    size="small"
                    options={cityList.map((c) => ({ label: c, value: c }))}
                  />
                </>
              )}
            </Space>
            <Space size="small">
              <Badge status="processing" text="实时同步中" />
            </Space>
          </div>
          <Space size={24} style={{ marginRight: 8 }}>
            <Badge count={12} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#666' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} size={12}>
                <Avatar size={32} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)' }} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name || MOCK_USER.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{roleDisplay[user.role]}</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
