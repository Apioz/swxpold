import { useNavigate } from 'react-router-dom';
import homeRef from '../../assets/mini-program-home-ref.png';
import './MiniProgramHome.css';

export default function MiniProgramHome() {
  const navigate = useNavigate();

  return (
    <div className="mp-home">
      <img
        src={homeRef}
        alt="生物芯片智慧园区"
        className="mp-home-screen-ref"
        draggable={false}
      />
      {/* 首页「会议室预约」快捷入口热区 */}
      <button
        type="button"
        className="mp-home-hotspot mp-home-hotspot-meeting"
        aria-label="会议室预约"
        onClick={() => navigate('/mini-program/meeting-room')}
      />
    </div>
  );
}
