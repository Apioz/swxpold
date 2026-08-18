import { useMemo, useState } from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  auditTabs,
  getAuditItemsByStatus,
  getReservationsByAuditId,
  type AuditTabStatus,
  type MeetingAuditItem,
} from '../../../data/mockMeetingRooms';
import MpNavBar from '../components/MpNavBar';
import '../components/MiniProgramCommon.css';
import './MeetingRoom.css';

const TAB_STATUS: AuditTabStatus[] = ['pending', 'approved', 'rejected', 'processing'];

function AuditTimeBlock({ item }: { item: MeetingAuditItem }) {
  if (item.meetingType === 'recurring') {
    return (
      <div className="mp-audit-time-block">
        <div>{item.recurrenceStartDate} - {item.recurrenceEndDate}</div>
        <div>{item.recurrenceWeekdays}</div>
        <div>{item.timeSlot}</div>
      </div>
    );
  }

  return <span>{item.time}</span>;
}

function AuditCard({ item }: { item: MeetingAuditItem }) {
  const navigate = useNavigate();
  const expandedReservations = getReservationsByAuditId(item.id);
  const isApprovedRecurring = item.status === 'approved' && item.meetingType === 'recurring';

  const openDetail = (reservationId: string) => {
    navigate(`/mini-program/meeting-room/reservation/${reservationId}`);
  };

  return (
    <div className="mp-audit-card">
      <div className="mp-audit-card-head">
        <div className="mp-audit-icon" />
        <div className="mp-audit-card-title">{item.title}</div>
        <span className={`mp-audit-status mp-audit-status--${item.status}`}>
          {item.statusLabel}
          <RightOutlined style={{ fontSize: 10 }} />
        </span>
      </div>

      {item.status === 'pending' ? (
        <>
          {item.applicantName && (
            <div className="mp-audit-row">
              <span className="label">申请人</span>
              {item.applicantName}
            </div>
          )}
          <div className="mp-audit-row">
            <span className="label">时间</span>
            <AuditTimeBlock item={item} />
          </div>
          <div className="mp-audit-row">
            <span className="label">会议室名称</span>
            {item.roomName}
          </div>
          <div className="mp-audit-actions">
            <button
              type="button"
              className="mp-btn-outline"
              onClick={() => item.reservationId && openDetail(item.reservationId)}
            >
              查看详情
            </button>
            <button type="button" className="mp-btn-primary">去审核</button>
          </div>
        </>
      ) : isApprovedRecurring ? (
        <>
          <div className="mp-audit-row mp-audit-row--hint">
            已拆分为 {expandedReservations.length} 场标准会议
          </div>
          {expandedReservations.map((res) => (
            <div key={res.id} className="mp-audit-expanded-item">
              <div className="mp-audit-row">
                <span className="label">时间</span>
                {res.time}
              </div>
              <div className="mp-audit-row">
                <span className="label">会议室名称</span>
                {res.roomName}
              </div>
              <div className="mp-audit-actions">
                <button
                  type="button"
                  className="mp-btn-outline"
                  onClick={() => openDetail(res.id)}
                >
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {item.applicantName && (
            <div className="mp-audit-row">
              <span className="label">申请人</span>
              {item.applicantName}
            </div>
          )}
          <div className="mp-audit-row">
            <span className="label">时间</span>
            <AuditTimeBlock item={item} />
          </div>
          <div className="mp-audit-row">
            <span className="label">会议室名称</span>
            {item.roomName}
          </div>
          <div className="mp-audit-actions">
            <button
              type="button"
              className="mp-btn-outline"
              onClick={() => {
                const targetId = item.reservationId ?? item.expandedReservationIds?.[0];
                if (targetId) openDetail(targetId);
              }}
            >
              查看详情
            </button>
            {item.status === 'processing' && (
              <button type="button" className="mp-btn-primary">去审核</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MeetingAudit() {
  const [activeTab, setActiveTab] = useState(0);

  const list = useMemo(
    () => getAuditItemsByStatus(TAB_STATUS[activeTab]),
    [activeTab],
  );

  return (
    <div className="mp-page mp-meeting-audit">
      <MpNavBar
        title="会议审核"
        showBack
        backTo="/mini-program/meeting-room"
        light
      />

      <div className="mp-tabs mp-tabs--transparent">
        {auditTabs.map((tab, i) => (
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
          list.map((item) => <AuditCard key={item.id} item={item} />)
        ) : (
          <div className="mp-empty-tip">暂无{auditTabs[activeTab]}记录</div>
        )}
      </div>
    </div>
  );
}
