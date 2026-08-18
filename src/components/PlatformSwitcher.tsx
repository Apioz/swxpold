import { DesktopOutlined, MobileOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCurrentPlatformId,
  platformOptions,
  type PlatformId,
} from '../config/platformSwitch';
import './PlatformSwitcher.css';

const platformIcons: Record<PlatformId, React.ReactNode> = {
  pc: <DesktopOutlined />,
  'mid-platform': <AppstoreOutlined />,
  'mini-program': <MobileOutlined />,
};

interface PlatformSwitcherProps {
  className?: string;
}

export default function PlatformSwitcher({ className }: PlatformSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentId = getCurrentPlatformId(location.pathname);

  const items: MenuProps['items'] = platformOptions.map((option) => ({
    key: option.id,
    label: option.label,
    icon: platformIcons[option.id],
    disabled: option.id === currentId,
  }));

  const onClick: MenuProps['onClick'] = ({ key }) => {
    const target = platformOptions.find((p) => p.id === key);
    if (target) navigate(target.path);
  };

  return (
    <Dropdown
      menu={{ items, onClick }}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="platform-switcher-dropdown"
    >
      <button
        type="button"
        className={['platform-switcher-btn', className].filter(Boolean).join(' ')}
        aria-label="切换平台"
        title="切换平台"
      >
        <DesktopOutlined />
      </button>
    </Dropdown>
  );
}
