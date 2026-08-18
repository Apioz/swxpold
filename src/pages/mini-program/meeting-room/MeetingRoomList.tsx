import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MpNavBar from '../components/MpNavBar';
import {
  getMeetingRoomById,
  meetingRoomTree,
  type MeetingRoomNode,
} from '../../../data/mockMeetingRooms';
import MeetingRoomFloorPlan from './components/MeetingRoomFloorPlan';
import MeetingRoomPhoto from './components/MeetingRoomPhoto';
import '../components/MiniProgramCommon.css';
import './MeetingRoom.css';

function RoomCard({ room }: { room: MeetingRoomNode }) {
  const navigate = useNavigate();
  const detail = getMeetingRoomById(room.id);

  if (!detail) return null;

  return (
    <button
      type="button"
      className="mp-room-card"
      onClick={() => navigate(`/mini-program/meeting-room/book/${room.id}`)}
    >
      <div className="mp-room-card-name">{room.name}</div>
      <MeetingRoomPhoto room={detail} size="thumb" className="mp-room-card-photo" />
      <div className="mp-room-card-meta">
        {detail.building} {detail.floor} · 容纳 {detail.capacity} 人 · {detail.roomType}
      </div>
    </button>
  );
}

function TreeFloor({ floor }: { floor: MeetingRoomNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mp-tree-floor-block">
      <div
        className="mp-tree-floor-head"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={() => {}}
        role="button"
        tabIndex={0}
      >
        <span className={`arrow${open ? ' open' : ''}`}>▶</span>
        <span>{floor.name}</span>
      </div>
      {open && (
        <div className="mp-room-card-list">
          {floor.children?.map((room) => <RoomCard key={room.id} room={room} />)}
        </div>
      )}
    </div>
  );
}

function TreeBuilding({ building }: { building: MeetingRoomNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mp-tree-building-block">
      <div
        className="mp-tree-building-head"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={() => {}}
        role="button"
        tabIndex={0}
      >
        <span className={`arrow${open ? ' open' : ''}`}>▶</span>
        <span>{building.name}</span>
      </div>
      {open && building.children?.map((floor) => (
        <TreeFloor key={floor.id} floor={floor} />
      ))}
    </div>
  );
}

export default function MeetingRoomList() {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'plan' ? 'plan' : 'list';
  const [viewMode, setViewMode] = useState<'list' | 'plan'>(initialView);

  return (
    <div className="mp-page mp-tree-page">
      <MpNavBar
        title="会议室预约"
        showBack
        backTo="/mini-program/meeting-room"
      />

      <div className="mp-list-plan-tabs">
        <button
          type="button"
          className={`mp-list-plan-tab${viewMode === 'list' ? ' active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          列表
        </button>
        <button
          type="button"
          className={`mp-list-plan-tab${viewMode === 'plan' ? ' active' : ''}`}
          onClick={() => setViewMode('plan')}
        >
          平面图
        </button>
      </div>

      <div className="mp-page-scroll">
        {viewMode === 'list' ? (
          <div className="mp-room-list-wrap">
            {meetingRoomTree.map((building) => (
              <TreeBuilding key={building.id} building={building} />
            ))}
          </div>
        ) : (
          <MeetingRoomFloorPlan />
        )}
      </div>
    </div>
  );
}
