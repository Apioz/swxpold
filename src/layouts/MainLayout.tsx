import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Tabs } from 'antd';
import type { MenuProps } from 'antd';
import {
  ExperimentOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  CustomerServiceOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  FileProtectOutlined,
  HomeOutlined,
  MobileOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import PlatformSwitcher from '../components/PlatformSwitcher';
import './MainLayout.css';
import { getEnergyOpenKeys, energyMenuChildren, energyRouteTitleMap } from '../config/energyMenu';

const { Sider, Header, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const routeTitleMap: Record<string, string> = {
  '/home': '首页',
  '/workbench': '工作台',
  '/assets': '资产台账',
  '/schedule': '工作排班',
  '/repair': '报修管理',
  '/maintenance': '维保管理',
  '/inspection': '巡检管理',
  '/spare-parts/ledger': '备件台账',
  '/spare-parts/inbound': '入库管理',
  '/spare-parts/outbound': '出库管理',
  '/security/events/realtime': '实时事件',
  '/security/events/push-config': '事件推送配置',
  '/security/events/notification': '通知方式配置',
  '/security/alarms/statistics': '报警统计',
  '/security/alarms/events': '报警事件',
  '/security/alarms/workbench': '事件工作台',
  '/security/parking': '停车管理',
  '/security/monitoring': '监控管理',
  '/security/access-control/devices': '门禁设备管理',
  '/security/access-control/records': '门禁识别记录',
  '/security/access-control/permissions': '门禁权限配置',
  '/security/passage': '通行管理',
  '/security/iot': '物联管理',
  ...energyRouteTitleMap,
  '/innovation-center/flow-meters': '创新中心设备管理',
  '/plc-hvac/systems': 'PLC风系统管理',
  '/process': '流程管理',
  '/mobile': '移动端管理',
  '/customer': '客户管理',
  '/project': '项目管理',
  '/system': '系统管理',
  '/task': '任务管理',
  '/mid-platform-entry': '生物芯片中台',
};

const menuItems: MenuItem[] = [
  { key: '/workbench', icon: <HomeOutlined />, label: '工作台' },
  { key: '/assets', icon: <DatabaseOutlined />, label: '资产台账' },
  { key: '/schedule', icon: <CalendarOutlined />, label: '工作排班' },
  { key: '/repair', icon: <ToolOutlined />, label: '报修管理' },
  { key: '/maintenance', icon: <FileProtectOutlined />, label: '维保管理' },
  { key: '/inspection', icon: <UnorderedListOutlined />, label: '巡检管理' },
  {
    key: 'spare-parts',
    icon: <AppstoreOutlined />,
    label: '备件管理',
    children: [
      { key: '/spare-parts/ledger', label: '备件台账' },
      { key: '/spare-parts/inbound', label: '入库管理' },
      { key: '/spare-parts/outbound', label: '出库管理' },
    ],
  },
  {
    key: 'security',
    icon: <SafetyCertificateOutlined />,
    label: '安全管理',
    children: [
      {
        key: 'security-events',
        label: '事件管理',
        children: [
          { key: '/security/events/realtime', label: '实时事件' },
          { key: '/security/events/push-config', label: '事件推送配置' },
          { key: '/security/events/notification', label: '通知方式配置' },
        ],
      },
      {
        key: 'security-alarms',
        label: '报警管理',
        children: [
          { key: '/security/alarms/statistics', label: '报警统计' },
          { key: '/security/alarms/events', label: '报警事件' },
          { key: '/security/alarms/workbench', label: '事件工作台' },
        ],
      },
      { key: '/security/parking', label: '停车管理' },
      { key: '/security/monitoring', label: '监控管理' },
      {
        key: 'security-access',
        label: '门禁管理',
        children: [
          { key: '/security/access-control/devices', label: '门禁设备管理' },
          { key: '/security/access-control/records', label: '门禁识别记录' },
          { key: '/security/access-control/permissions', label: '门禁权限配置' },
        ],
      },
      { key: '/security/passage', label: '通行管理' },
      { key: '/security/iot', label: '物联管理' },
    ],
  },
  {
    key: 'energy',
    icon: <ThunderboltOutlined />,
    label: '能源管理',
    children: energyMenuChildren,
  },
  {
    key: 'innovation-center',
    icon: <ExperimentOutlined />,
    label: '开放创新中心',
    children: [
      { key: '/innovation-center/flow-meters', label: '创新中心设备管理' },
    ],
  },
  { key: '/plc-hvac/systems', icon: <AppstoreOutlined />, label: 'PLC风系统管理' },
  { key: '/process', icon: <DesktopOutlined />, label: '流程管理' },
  { key: '/mobile', icon: <MobileOutlined />, label: '移动端管理' },
  { key: '/customer', icon: <CustomerServiceOutlined />, label: '客户管理' },
  { key: '/project', icon: <ProjectOutlined />, label: '项目管理' },
  { key: '/system', icon: <SettingOutlined />, label: '系统管理' },
  { key: '/task', icon: <UnorderedListOutlined />, label: '任务管理' },
  { key: '/mid-platform/operations/personnel', icon: <AppstoreOutlined />, label: '生物芯片中台' },
];

interface TabItem {
  key: string;
  label: string;
  closable?: boolean;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/home', label: '首页', closable: false },
  ]);

  const selectedKeys = useMemo(() => {
    return [location.pathname];
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    const title = routeTitleMap[path];
    if (!title) return;

    setTabs((prev) => {
      if (prev.some((t) => t.key === path)) return prev;
      return [...prev, { key: path, label: title, closable: path !== '/home' }];
    });

    if (path.startsWith('/spare-parts')) {
      setOpenKeys((prev) =>
        [...new Set([...prev, 'spare-parts'])],
      );
    }
    if (path.startsWith('/security/events')) {
      setOpenKeys((prev) =>
        [...new Set([...prev, 'security', 'security-events'])],
      );
    }
    if (path.startsWith('/security/alarms')) {
      setOpenKeys((prev) =>
        [...new Set([...prev, 'security', 'security-alarms'])],
      );
    }
    if (path.startsWith('/security/access-control')) {
      setOpenKeys((prev) =>
        [...new Set([...prev, 'security', 'security-access'])],
      );
    }
    if (path.startsWith('/security/parking') || path.startsWith('/security/monitoring') || path.startsWith('/security/passage') || path.startsWith('/security/iot')) {
      setOpenKeys((prev) =>
        [...new Set([...prev, 'security'])],
      );
    }
    if (path.startsWith('/energy')) {
      setOpenKeys((prev) =>
        [...new Set([...prev, ...getEnergyOpenKeys(path)])],
      );
    }
    if (path.startsWith('/innovation-center')) {
      setOpenKeys((prev) =>
        [...new Set([...prev, 'innovation-center'])],
      );
    }
  }, [location.pathname]);

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const onOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const onTabChange = (key: string) => {
    navigate(key);
  };

  const onTabEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove',
  ) => {
    if (action !== 'remove' || typeof targetKey !== 'string') return;

    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === targetKey);
      const next = prev.filter((t) => t.key !== targetKey);
      if (location.pathname === targetKey) {
        const fallback = next[Math.max(0, idx - 1)] ?? next[0];
        if (fallback) navigate(fallback.key);
      }
      return next;
    });
  };

  return (
    <Layout className="main-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        className="main-sider"
        theme="light"
      >
        <div className="logo">
          <span className="logo-mark">芯</span>
          {!collapsed && <span className="logo-text">生物芯片</span>}
        </div>
        <div className="main-sider-menu-wrap">
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            onClick={onMenuClick}
            items={menuItems}
          />
        </div>
      </Sider>
      <Layout className="main-layout-right">
        <Header className="main-header">
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={
              location.pathname === '/' ? '/home' : location.pathname
            }
            onChange={onTabChange}
            onEdit={onTabEdit}
            items={tabs.map((t) => ({
              key: t.key,
              label: t.label,
              closable: t.closable,
            }))}
            className="header-tabs"
            tabBarExtraContent={
              <div className="main-header-extra">
                <PlatformSwitcher />
                <span className="more-btn">更多</span>
              </div>
            }
          />
        </Header>
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
