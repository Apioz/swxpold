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
  getMidPlatformOpenKeys,
  midPlatformMenuItems,
  midPlatformRouteTitleMap,
} from '../config/midPlatformMenu';
import PlatformSwitcher from '../components/PlatformSwitcher';
import './MidPlatformLayout.css';

const { Sider, Header, Content } = Layout;

interface TabItem {
  key: string;
  label: string;
  closable?: boolean;
}

function MenuGridIcon() {
  return (
    <span className="mid-platform-menu-grid-icon" aria-hidden>
      <i /><i /><i /><i />
    </span>
  );
}

const menuItemsWithIcons: MenuProps['items'] = midPlatformMenuItems.map((item) => {
  if (!item || typeof item !== 'object' || !('label' in item)) return item;
  const withIcon = { ...item, icon: <MenuGridIcon /> };
  if ('children' in item && item.children) {
    return {
      ...withIcon,
      children: item.children.map((child) =>
        child && typeof child === 'object' && 'label' in child
          ? { ...child, icon: <MenuGridIcon /> }
          : child,
      ),
    };
  }
  return withIcon;
});

export default function MidPlatformLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(['mid-operations']);
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/mid-platform/operations/home', label: '运营管理首页', closable: true },
    { key: '/mid-platform/operations/personnel', label: '人员管理', closable: true },
  ]);

  const selectedKeys = useMemo(() => {
    if (location.pathname.startsWith('/mid-platform/operations/personnel')) {
      return ['/mid-platform/operations/personnel'];
    }
    return [location.pathname];
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    const title = midPlatformRouteTitleMap[path];
    if (!title) return;

    setTabs((prev) => {
      if (prev.some((t) => t.key === path)) return prev;
      return [...prev, { key: path, label: title, closable: true }];
    });

    setOpenKeys((prev) => [...new Set([...prev, ...getMidPlatformOpenKeys(path)])]);
  }, [location.pathname]);

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key);
    }
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
    <Layout className="mid-platform-layout">
      <Header className="mid-platform-topbar">
        <div className="mid-platform-topbar-left">
          <button
            type="button"
            className="mid-platform-icon-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="切换菜单"
          >
            <MenuFoldOutlined />
          </button>
          <span className="mid-platform-system-title">生物芯片中台-运营管理</span>
        </div>
        <div className="mid-platform-topbar-right">
          <Select
            className="mid-platform-park-select"
            defaultValue="biochip-mid"
            options={[{ label: '生物芯片中台', value: 'biochip-mid' }]}
            suffixIcon={<DownOutlined />}
          />
          <SkinOutlined className="mid-platform-header-icon" />
          <LockOutlined className="mid-platform-header-icon" />
          <ReloadOutlined className="mid-platform-header-icon" />
          <FullscreenOutlined className="mid-platform-header-icon" />
          <PlatformSwitcher className="mid-platform-platform-switch" />
          <BellOutlined className="mid-platform-header-icon" />
          <Dropdown menu={{ items: [{ key: '1', label: '退出登录' }] }}>
            <div className="mid-platform-user">
              <Avatar size={28} className="mid-platform-user-avatar">
                管
              </Avatar>
              <span>管理员</span>
              <DownOutlined className="mid-platform-user-arrow" />
            </div>
          </Dropdown>
        </div>
      </Header>

      <Layout className="mid-platform-body">
        <Sider
          collapsed={collapsed}
          width={210}
          collapsedWidth={0}
          trigger={null}
          className="mid-platform-sider"
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onClick={onMenuClick}
            items={menuItemsWithIcons}
            className="mid-platform-menu"
          />
        </Sider>

        <Layout className="mid-platform-main">
          <div className="mid-platform-tabbar">
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
              className="mid-platform-tabs"
            />
            <span className="mid-platform-more-btn">更多</span>
          </div>

          <Content className="mid-platform-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
