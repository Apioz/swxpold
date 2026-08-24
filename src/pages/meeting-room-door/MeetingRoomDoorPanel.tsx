import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import doorPanelImg from '../../assets/meeting-room-door-panel.png';
import { getMeetingRoomById } from '../../data/mockMeetingRooms';
import './MeetingRoomDoorPanel.css';

const WEEKDAY = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function formatDateLine(d: dayjs.Dayjs) {
  return `${d.format('YYYY年M月D日')}${WEEKDAY[d.day()]}`;
}

export default function MeetingRoomDoorPanel() {
  const { roomId = 'r-2106' } = useParams<{ roomId: string }>();
  const room = getMeetingRoomById(roomId);
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!room) {
    return <div className="door-panel door-panel--empty">未找到会议室</div>;
  }

  return (
    <div className="door-panel door-panel--export">
      <div className="door-panel__frame">
        <img
          src={doorPanelImg}
          alt={`${room.roomType}门牌屏`}
          className="door-panel__export-img"
        />
        <div className="door-panel__live-clock">{now.format('HH:mm')}</div>
        <div className="door-panel__live-date">{formatDateLine(now)}</div>
      </div>
    </div>
  );
}
