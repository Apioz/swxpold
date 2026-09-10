import { useNavigate } from 'react-router-dom';
import homeRef from '../../assets/mini-program-home-ref.png';
import './MiniProgramHome.css';

export default function MiniProgramHome() {
  const navigate = useNavigate();

  return (
    <div className="mp-home">
      <div className="mp-home-screen-wrap">
        <img
          src={homeRef}
          alt="生物芯片智慧园区"
          className="mp-home-screen-ref"
          draggable={false}
        />
        {/* 热区相对示意图定位，随页面滚动，避免视口高度变化后点不中 */}
        <button
          type="button"
          className="mp-home-hotspot mp-home-hotspot-meeting"
          aria-label="会议室预约"
          onClick={() => navigate('/mini-program/meeting-room/list')}
        />
      </div>
    </div>
  );
}
