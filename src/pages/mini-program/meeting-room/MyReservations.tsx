import { useMemo, useState } from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getReservationsByStatus,
  reservationTabs,
  type MeetingReservation,
  type ReservationTabStatus,
} from '../../../data/mockMeetingRooms';
import { isOwnMeetingApplicant } from '../../../data/meetingCurrentUser';
import MpNavBar from '../components/MpNavBar';
import '../components/MiniProgramCommon.css';
import './MeetingRoom.css';

const TAB_STATUS: ReservationTabStatus[] = [
  'pending',
  'processing',
  'completed',
  'rejected',
  'cancelled',
];

const TAB_QUERY_MAP: Record<string, number> = {
  pending: 0,
  processing: 1,
  completed: 2,
  rejected: 3,
  cancelled: 4,
};

function ReservationTimeBlock({ item }: { item: MeetingReservation }) {
  if (item.meetingType === 'recurring' && item.recurrenceStartDate) {
    return (
      <div className="mp-audit-time-block">
        <div>{item.recurrenceStartDate} - {item.recurrenceEndDate}</div>
        <div>{item.recurrenceWeekdays}</div>
        <div>{item.timeSlot}</div>
      </div>
    );
  }

  return <>{item.time}</>;
}

function canCancelReservation(item: MeetingReservation) {
  return isOwnMeetingApplicant(item.applicantId)
    && (item.status === 'processing' || item.status === 'completed');
}

function isPendingApprovalView(item: MeetingReservation) {
  return item.status === 'pending' && !isOwnMeetingApplicant(item.applicantId);
}

function ReservationCard({ item }: { item: MeetingReservation }) {
  const navigate = useNavigate();
  const pendingApproval = isPendingApprovalView(item);

  return (
    <div className="mp-my-reservation-card">
      <div className="mp-my-reservation-card-head">
        <div className="mp-my-reservation-icon" aria-hidden />
        <div className="mp-my-reservation-card-title">{item.title}</div>
        <span className={`mp-my-reservation-status mp-my-reservation-status--${item.status}`}>
          {item.statusLabel}
          <RightOutlined style={{ fontSize: 10 }} />
        </span>
      </div>

      {pendingApproval && item.applicantName && (
        <div className="mp-my-reservation-row">
          <span className="label">申请人</span>
          {item.applicantName}
        </div>
      )}

      <div className="mp-my-reservation-row">
        <span className="label">时间</span>
        <ReservationTimeBlock item={item} />
      </div>
      <div className="mp-my-reservation-row">
        <span className="label">会议室名称</span>
        {item.roomName}
      </div>

      <div className="mp-my-reservation-actions">
        <button
          type="button"
          className="mp-btn-outline"
          onClick={() => navigate(`/mini-program/meeting-room/reservation/${item.id}`)}
        >
          查看详情
        </button>
        {pendingApproval ? (
          <button type="button" className="mp-btn-primary">去审核</button>
        ) : canCancelReservation(item) && (
          <button type="button" className="mp-btn-primary">
            取消预定
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyReservations() {
  const [searchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const initialTab = tabFromQuery && TAB_QUERY_MAP[tabFromQuery] !== undefined
    ? TAB_QUERY_MAP[tabFromQuery]
    : 0;
  const [activeTab, setActiveTab] = useState(initialTab);

  const list = useMemo(
    () => getReservationsByStatus(TAB_STATUS[activeTab]),
    [activeTab],
  );

  return (
    <div className="mp-page mp-my-reservations">
      <MpNavBar
        title="我的预定"
        showBack
        backTo="/mini-program/meeting-room"
        light
      />

      <div className="mp-tabs mp-tabs--transparent">
        {reservationTabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`mp-tab${activeTab === i ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mp-page-scroll">
        {list.length > 0 ? (
          list.map((item) => <ReservationCard key={item.id} item={item} />)
        ) : (
          <div className="mp-empty-tip">暂无{reservationTabs[activeTab]}记录</div>
        )}
      </div>
    </div>
  );
}
