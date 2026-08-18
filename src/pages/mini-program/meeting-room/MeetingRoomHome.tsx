import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MpNavBar from '../components/MpNavBar';
import './MeetingRoom.css';

const menuItems = [
  {
    key: 'book',
    label: '会议室预约',
    iconClass: 'mp-mr-icon-book',
    path: '/mini-program/meeting-room/list',
  },
  {
    key: 'my',
    label: '我的预约',
    iconClass: 'mp-mr-icon-my',
    path: '/mini-program/meeting-room/my-reservations',
  },
  {
    key: 'audit',
    label: '会议审核',
    iconClass: 'mp-mr-icon-audit',
    path: '/mini-program/meeting-room/audit',
  },
];

export default function MeetingRoomHome() {
  const navigate = useNavigate();

  return (
    <div className="mp-page mp-meeting-room-home">
      <MpNavBar title="生物芯片会议室" showCampus />

      <div className="mp-page-scroll">
        <div className="mp-mr-banner">
          <div className="mp-mr-banner-text">
            <div className="mp-mr-banner-title">会议室预约</div>
            <div className="mp-mr-banner-sub">生物芯片会议室</div>
          </div>
          <div className="mp-mr-banner-deco" aria-hidden />
        </div>

        <div className="mp-mr-notice">
          <span className="mp-mr-notice-icon">🔔</span>
          <span className="mp-mr-notice-text">公告：生物芯片智能会议预约系统发布上线...</span>
        </div>

        <div className="mp-mr-menu-grid">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="mp-mr-menu-item"
              onClick={() => navigate(item.path)}
            >
              <div className={`mp-mr-menu-icon ${item.iconClass}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mp-mr-scan-card">
          <div className="mp-mr-scan-left">
            <div className="mp-mr-scan-title">扫码签到</div>
            <span className="mp-mr-scan-arrow">
              <RightOutlined />
            </span>
          </div>
          <div className="mp-mr-scan-icon" aria-hidden />
        </div>
      </div>
    </div>
  );
}
