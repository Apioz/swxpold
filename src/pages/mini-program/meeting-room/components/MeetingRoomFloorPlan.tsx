import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllMeetingFloorPlans,
  getMeetingFloorPlan,
  getMeetingRoomsByFloorPlan,
} from '../../../../data/mockMeetingRooms';
import { getFloorPlanImageSrc } from '../../../../data/meetingFloorPlanAssets';
import { useMeetingRoomStore } from '../../../../store/meetingRoomStore';
import { useMeetingRoomFloorPlanStore } from '../../../../store/meetingRoomFloorPlanStore';
import './MeetingRoomFloorPlan.css';

export default function MeetingRoomFloorPlan() {
  const [rooms] = useMeetingRoomStore();
  const [floorPlanRecords] = useMeetingRoomFloorPlanStore();
  const navigate = useNavigate();
  const floorPlans = useMemo(
    () => getAllMeetingFloorPlans(),
    [rooms, floorPlanRecords],
  );
  const [activePlanId, setActivePlanId] = useState(
    () => floorPlans.find((plan) => plan.id === 'office2-2f')?.id ?? floorPlans[0]?.id ?? '',
  );

  const plan = getMeetingFloorPlan(activePlanId);
  const roomList = useMemo(
    () => getMeetingRoomsByFloorPlan(activePlanId),
    [activePlanId, rooms, floorPlanRecords],
  );
  const imageSrc = plan ? getFloorPlanImageSrc(plan.id) : '';

  if (!plan) return null;

  return (
    <div className="mp-floor-plan">
      <div className="mp-floor-plan-tabs">
        {floorPlans.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mp-floor-plan-tab${item.id === activePlanId ? ' active' : ''}`}
            onClick={() => setActivePlanId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mp-floor-plan-stage">
        <img
          src={imageSrc}
          alt={plan.label}
          className="mp-floor-plan-image"
          draggable={false}
        />
        <svg
          className="mp-floor-plan-markers"
          viewBox={`0 0 ${plan.width} ${plan.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {roomList.map((room) => {
            const cx = (room.planX / 100) * plan.width;
            const cy = (room.planY / 100) * plan.height;
            return (
              <g key={room.id} className="mp-floor-plan-marker-group">
                <circle cx={cx} cy={cy} r={14} className="mp-floor-plan-marker-ring" />
                <circle cx={cx} cy={cy} r={6} className="mp-floor-plan-marker-dot" />
              </g>
            );
          })}
        </svg>

        {roomList.map((room) => (
          <button
            key={room.id}
            type="button"
            className="mp-floor-plan-hotspot"
            style={{ left: `${room.planX}%`, top: `${room.planY}%` }}
            aria-label={`${room.name} 预约`}
            onClick={() => navigate(`/mini-program/meeting-room/book/${room.id}`)}
          >
            <span className="mp-floor-plan-hotspot-label">{room.roomNo}</span>
          </button>
        ))}
      </div>

      <div className="mp-floor-plan-legend">
        <span className="mp-floor-plan-legend-dot" />
        点击标注进入对应会议室预约
      </div>

      <div className="mp-floor-plan-room-list">
        {roomList.map((room) => (
          <button
            key={room.id}
            type="button"
            className="mp-floor-plan-room-chip"
            onClick={() => navigate(`/mini-program/meeting-room/book/${room.id}`)}
          >
            {room.roomNo} · {room.roomType}
          </button>
        ))}
      </div>
    </div>
  );
}
