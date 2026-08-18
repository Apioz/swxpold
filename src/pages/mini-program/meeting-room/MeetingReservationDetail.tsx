import { useState } from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { message } from 'antd';
import { getReservationById } from '../../../data/mockMeetingRooms';
import MpNavBar from '../components/MpNavBar';
import '../components/MiniProgramCommon.css';
import './MeetingRoom.css';

function RequiredMark() {
  return <span className="mp-reservation-detail-required">*</span>;
}

function toDatetimeLocal(value: string): string {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
}

function fromDatetimeLocal(value: string): string {
  if (!value) return '';
  return value.length === 16 ? `${value.replace('T', ' ')}:00` : value.replace('T', ' ');
}

interface DetailFormState {
  title: string;
  time: string;
  duration: string;
  roomName: string;
  participants: string;
  description: string;
  recurrenceStartDate: string;
  recurrenceEndDate: string;
  recurrenceWeekdays: string;
  timeSlot: string;
}

export default function MeetingReservationDetail() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const reservation = reservationId ? getReservationById(reservationId) : undefined;

  const isPendingRecurring =
    reservation?.meetingType === 'recurring' && Boolean(reservation.recurrenceStartDate);
  const isEditable = reservation?.status === 'processing';

  const [form, setForm] = useState<DetailFormState | null>(() => {
    if (!reservation) return null;
    return {
      title: reservation.title,
      time: reservation.time,
      duration: reservation.duration ?? '',
      roomName: reservation.roomName,
      participants: reservation.participants ?? '',
      description: reservation.description ?? '',
      recurrenceStartDate: reservation.recurrenceStartDate ?? '',
      recurrenceEndDate: reservation.recurrenceEndDate ?? '',
      recurrenceWeekdays: reservation.recurrenceWeekdays ?? '',
      timeSlot: reservation.timeSlot ?? '',
    };
  });

  if (!reservation || !form) {
    return (
      <div className="mp-page">
        <MpNavBar title="会议室详情" showBack backTo="/mini-program/meeting-room/my-reservations" />
        <div className="mp-empty-tip">未找到该预约记录</div>
      </div>
    );
  }

  const participantsSuffix = reservation.participantCount && !isEditable
    ? `等${reservation.participantCount}人`
    : '';

  const updateForm = (patch: Partial<DetailFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = () => {
    message.success('会议信息已保存');
  };

  const renderArrow = () => !isEditable && <RightOutlined />;

  return (
    <div className="mp-page mp-reservation-detail-page">
      <MpNavBar
        title="会议室详情"
        showBack
        backTo="/mini-program/meeting-room/my-reservations"
        light
      />

      <div className="mp-page-scroll">
        <div className="mp-reservation-detail-card">
          <div className="mp-reservation-detail-item mp-reservation-detail-item--inline">
            <span className="mp-reservation-detail-label">会议状态</span>
            <span className={`mp-reservation-detail-status mp-reservation-detail-status--${reservation.status}`}>
              {reservation.statusLabel}
              <RightOutlined />
            </span>
          </div>

          <div className="mp-reservation-detail-item">
            <div className="mp-reservation-detail-label">
              <RequiredMark />
              会议主题
            </div>
            {isEditable ? (
              <input
                type="text"
                className="mp-reservation-detail-input"
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
              />
            ) : (
              <div className="mp-reservation-detail-value">{form.title}</div>
            )}
          </div>

          {isPendingRecurring ? (
            <>
              <div className={`mp-reservation-detail-item${isEditable ? '' : ' mp-reservation-detail-item--arrow'}`}>
                <div className="mp-reservation-detail-label">
                  <RequiredMark />
                  会议日期区间
                </div>
                {isEditable ? (
                  <div className="mp-reservation-detail-date-row">
                    <input
                      type="text"
                      className="mp-reservation-detail-input"
                      value={form.recurrenceStartDate}
                      onChange={(e) => updateForm({ recurrenceStartDate: e.target.value })}
                      placeholder="开始日期"
                    />
                    <span className="mp-reservation-detail-date-sep">-</span>
                    <input
                      type="text"
                      className="mp-reservation-detail-input"
                      value={form.recurrenceEndDate}
                      onChange={(e) => updateForm({ recurrenceEndDate: e.target.value })}
                      placeholder="截止日期"
                    />
                  </div>
                ) : (
                  <div className="mp-reservation-detail-value-row">
                    <span>{form.recurrenceStartDate} - {form.recurrenceEndDate}</span>
                    {renderArrow()}
                  </div>
                )}
              </div>

              <div className={`mp-reservation-detail-item${isEditable ? '' : ' mp-reservation-detail-item--arrow'}`}>
                <div className="mp-reservation-detail-label">
                  <RequiredMark />
                  重复星期
                </div>
                {isEditable ? (
                  <input
                    type="text"
                    className="mp-reservation-detail-input"
                    value={form.recurrenceWeekdays}
                    onChange={(e) => updateForm({ recurrenceWeekdays: e.target.value })}
                  />
                ) : (
                  <div className="mp-reservation-detail-value-row">
                    <span>{form.recurrenceWeekdays}</span>
                    {renderArrow()}
                  </div>
                )}
              </div>

              <div className={`mp-reservation-detail-item${isEditable ? '' : ' mp-reservation-detail-item--arrow'}`}>
                <div className="mp-reservation-detail-label">
                  <RequiredMark />
                  会议时间段
                </div>
                {isEditable ? (
                  <input
                    type="text"
                    className="mp-reservation-detail-input"
                    value={form.timeSlot}
                    onChange={(e) => updateForm({ timeSlot: e.target.value })}
                  />
                ) : (
                  <div className="mp-reservation-detail-value-row">
                    <span>{form.timeSlot}</span>
                    {renderArrow()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={`mp-reservation-detail-item${isEditable ? '' : ' mp-reservation-detail-item--arrow'}`}>
                <div className="mp-reservation-detail-label">
                  <RequiredMark />
                  开始时间
                </div>
                {isEditable ? (
                  <input
                    type="datetime-local"
                    className="mp-reservation-detail-input"
                    value={toDatetimeLocal(form.time)}
                    onChange={(e) => updateForm({ time: fromDatetimeLocal(e.target.value) })}
                  />
                ) : (
                  <div className="mp-reservation-detail-value-row">
                    <span>{form.time}</span>
                    {renderArrow()}
                  </div>
                )}
              </div>

              <div className={`mp-reservation-detail-item${isEditable ? '' : ' mp-reservation-detail-item--arrow'}`}>
                <div className="mp-reservation-detail-label">会议时长</div>
                {isEditable ? (
                  <input
                    type="text"
                    className="mp-reservation-detail-input"
                    value={form.duration}
                    onChange={(e) => updateForm({ duration: e.target.value })}
                  />
                ) : (
                  <div className="mp-reservation-detail-value-row">
                    <span>{form.duration || '—'}</span>
                    {renderArrow()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mp-reservation-detail-card">
          <div className={`mp-reservation-detail-item${isEditable ? '' : ' mp-reservation-detail-item--arrow'}`}>
            <div className="mp-reservation-detail-label mp-reservation-detail-label--icon">
              <RequiredMark />
              <span className="mp-reservation-detail-icon mp-reservation-detail-icon--room" aria-hidden />
              选择会议室
            </div>
            {isEditable ? (
              <input
                type="text"
                className="mp-reservation-detail-input"
                value={form.roomName}
                onChange={(e) => updateForm({ roomName: e.target.value })}
              />
            ) : (
              <div className="mp-reservation-detail-value-row">
                <span>{form.roomName}</span>
                {renderArrow()}
              </div>
            )}
          </div>

          <div className={`mp-reservation-detail-item${isEditable ? '' : ' mp-reservation-detail-item--arrow'}`}>
            <div className="mp-reservation-detail-label mp-reservation-detail-label--icon">
              <RequiredMark />
              <span className="mp-reservation-detail-icon mp-reservation-detail-icon--people" aria-hidden />
              添加参会人
            </div>
            {isEditable ? (
              <textarea
                className="mp-reservation-detail-textarea mp-reservation-detail-textarea--editable"
                value={form.participants}
                onChange={(e) => updateForm({ participants: e.target.value })}
                rows={3}
              />
            ) : (
              <div className="mp-reservation-detail-participants">
                <p>
                  {form.participants || '—'}
                  {participantsSuffix ? `，${participantsSuffix}` : ''}
                </p>
                {!isEditable && (
                  <RightOutlined className="mp-reservation-detail-participants-arrow" />
                )}
              </div>
            )}
          </div>

          <div className="mp-reservation-detail-item">
            <div className="mp-reservation-detail-label mp-reservation-detail-label--icon">
              <RequiredMark />
              <span className="mp-reservation-detail-icon mp-reservation-detail-icon--desc" aria-hidden />
              会议描述
            </div>
            {isEditable ? (
              <textarea
                className="mp-reservation-detail-textarea mp-reservation-detail-textarea--editable"
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={4}
              />
            ) : (
              <div className="mp-reservation-detail-textarea">
                {form.description || '—'}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditable && (
        <div className="mp-reservation-detail-footer">
          <button type="button" className="mp-btn-primary mp-reservation-detail-checkin" onClick={handleSave}>
            保存
          </button>
        </div>
      )}

      {!isEditable && reservation.status === 'completed' && (
        <div className="mp-reservation-detail-footer">
          <button type="button" className="mp-btn-primary mp-reservation-detail-checkin">
            查看签到详情
          </button>
        </div>
      )}
    </div>
  );
}
