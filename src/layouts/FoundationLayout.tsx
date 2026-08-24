import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BellOutlined,
  DownOutlined,
  FullscreenOutlined,
  LockOutlined,
  MenuFoldOutlined,
  ReloadOutlined,
  SkinOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Select, Tabs } from 'antd';
import type { MenuProps } from 'antd';
import {
  foundationMenuItems,
  foundationRouteTitleMap,
  getFoundationOpenKeys,
} from '../config/foundationMenu';
import PlatformSwitcher from '../components/PlatformSwitcher';
import './FoundationLayout.css';

const { Sider, Header, Content } = Layout;

interface TabItem {
  key: string;
  label: string;
  closable?: boolean;
}

function MenuDotIcon() {
  return (
    <span className="foundation-menu-dot-icon" aria-hidden>
      <i /><i /><i /><i />
    </span>
  );
}

const menuItemsWithIcons: MenuProps['items'] = foundationMenuItems.map((item) => {
  if (!item || typeof item !== 'object' || !('label' in item)) return item;
  const withIcon = { ...item, icon: <MenuDotIcon /> };
  if ('children' in item && item.children) {
    return {
      ...withIcon,
      children: item.children.map((child) =>
        child && typeof child === 'object' && 'label' in child
          ? { ...child, icon: <MenuDotIcon /> }
          : child,
      ),
    };
  }
  return withIcon;
});

export default function FoundationLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/foundation/project-center', label: '项目中心', closable: true },
    { key: '/foundation/space-center', label: '空间中心', closable: true },
  ]);

  const selectedKeys = useMemo(() => [location.pathname], [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    const title = foundationRouteTitleMap[path];
    if (!title) return;

    setTabs((prev) => {
      if (prev.some((t) => t.key === path)) return prev;
      return [...prev, { key: path, label: title, closable: true }];
    });

    setOpenKeys((prev) => [...new Set([...prev, ...getFoundationOpenKeys(path)])]);
  }, [location.pathname]);

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) navigate(key);
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
    <Layout className="foundation-layout">
      <Header className="foundation-topbar">
        <div className="foundation-topbar-left">
          <button
            type="button"
            className="foundation-icon-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="切换菜单"
          >
            <MenuFoldOutlined />
          </button>
          <span className="foundation-system-title">生物芯片智慧园区</span>
        </div>
        <div className="foundation-topbar-right">
          <Select
            className="foundation-park-select"
            defaultValue="biochip-park"
            options={[{ label: '生物芯片智慧园区', value: 'biochip-park' }]}
            suffixIcon={<DownOutlined />}
          />
          <SkinOutlined className="foundation-header-icon" />
          <LockOutlined className="foundation-header-icon" />
          <ReloadOutlined className="foundation-header-icon" />
          <FullscreenOutlined className="foundation-header-icon" />
          <PlatformSwitcher className="foundation-platform-switch" />
          <BellOutlined className="foundation-header-icon" />
          <Dropdown menu={{ items: [{ key: '1', label: '退出登录' }] }}>
            <div className="foundation-user">
              <Avatar size={28} className="foundation-user-avatar">
                管
              </Avatar>
              <span>管理员</span>
              <DownOutlined className="foundation-user-arrow" />
            </div>
          </Dropdown>
          <button type="button" className="foundation-business-btn">
            业务
          </button>
        </div>
      </Header>

      <Layout className="foundation-body">
        <Sider
          collapsed={collapsed}
          width={210}
          collapsedWidth={0}
          trigger={null}
          className="foundation-sider"
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onClick={onMenuClick}
            items={menuItemsWithIcons}
            className="foundation-menu"
          />
        </Sider>

        <Layout className="foundation-main">
          <div className="foundation-tabbar">
            <Tabs
              type="editable-card"
              hideAdd
              activeKey={location.pathname}
              onChange={onTabChange}
              onEdit={onTabEdit}
              items={tabs.map((t) => ({
                key: t.key,
                label: t.label,
                closable: t.closable,
              }))}
              className="foundation-tabs"
            />
            <span className="foundation-more-btn">更多</span>
          </div>

          <Content className="foundation-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
