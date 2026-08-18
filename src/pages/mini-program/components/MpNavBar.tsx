import { LeftOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './MiniProgramCommon.css';

interface MpNavBarProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  showCampus?: boolean;
  light?: boolean;
}

export default function MpNavBar({
  title,
  showBack = false,
  backTo,
  showCampus = false,
  light = false,
}: MpNavBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className={`mp-nav ${light ? 'mp-nav--light' : ''}`}>
      {showCampus && (
        <div className="mp-nav-campus">
          <span className="mp-nav-campus-pin" />
          <span>生物芯片智慧园区</span>
          <span className="mp-nav-campus-arrow">▼</span>
        </div>
      )}
      <div className="mp-nav-main">
        {showBack ? (
          <button type="button" className="mp-nav-back" onClick={handleBack}>
            <LeftOutlined />
            <span>返回</span>
          </button>
        ) : (
          <span className="mp-nav-spacer" />
        )}
        <span className="mp-nav-title">{title}</span>
        <span className="mp-nav-actions">
          <MoreOutlined />
          <span className="mp-nav-dot" />
        </span>
      </div>
    </div>
  );
}
