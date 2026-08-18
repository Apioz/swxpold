import { useEffect, useMemo, useRef, useState } from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { message, Modal } from 'antd';
import { getMeetingRoomById, getMeetingRoomAddress } from '../../../data/mockMeetingRooms';
import {
  collectPersons,
  meetingParticipantTree,
} from '../../../data/mockMeetingParticipants';
import {
  formatRecurringConflictMessage,
  findRecurringConflictDates,
} from '../../../data/recurringMeetingSchedule';
import { submitRecurringMeeting, submitStandardMeeting } from '../../../data/meetingSubmissionStore';
import type { MeetingTimeSlot } from '../../../data/meetingRoomSchedule';
import {
  formatMeetingTimeRange,
  formatSelectedSlots,
  getMeetingTimeSlots,
  getRecurringTimeSlots,
} from '../../../data/meetingRoomSchedule';
import MpNavBar from '../components/MpNavBar';
import MeetingRoomPhoto from './components/MeetingRoomPhoto';
import MeetingTimeSlotGrid from './components/MeetingTimeSlotGrid';
import '../components/MiniProgramCommon.css';
import './MeetingRoom.css';

type MeetingType = 'standard' | 'recurring';

export const WEEKDAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
] as const;

export type WeekdayValue = (typeof WEEKDAY_OPTIONS)[number]['value'];

export interface MeetingBookDraft {
  meetingType: MeetingType;
  recurrenceStartDate: string;
  recurrenceEndDate: string;
  recurrenceWeekdays: WeekdayValue[];
  subject: string;
  description: string;
  selectedParticipantIds: string[];
  selectedSlotIds: string[];
  activeDate?: string;
}

interface BookLocationState {
  fromParticipantPicker?: boolean;
  selectedIds?: string[];
  bookDraft?: MeetingBookDraft;
}

const allPersons = collectPersons(meetingParticipantTree);

function getParticipantNames(ids: string[]): string {
  return ids
    .map((id) => allPersons.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join('、');
}

function getSlotActiveDate(slots: MeetingTimeSlot[], meetingType: MeetingType): string | undefined {
  if (meetingType === 'recurring' || slots.length === 0) return undefined;
  const match = slots[0].id.match(/^(\d{4}-\d{2}-\d{2})-/);
  return match?.[1];
}

function restoreSlotsFromDraft(
  roomId: string,
  draft: MeetingBookDraft,
): MeetingTimeSlot[] {
  if (!draft.selectedSlotIds.length) return [];

  const ids = new Set(draft.selectedSlotIds);
  const slots = draft.meetingType === 'recurring'
    ? getRecurringTimeSlots(roomId, ids)
    : draft.activeDate
      ? getMeetingTimeSlots(roomId, draft.activeDate, ids)
      : [];

  return slots.filter((slot) => ids.has(slot.id));
}

export default function MeetingRoomBook() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state ?? {}) as BookLocationState;
  const room = roomId ? getMeetingRoomById(roomId) : undefined;

  const [selectedSlots, setSelectedSlots] = useState<MeetingTimeSlot[]>([]);
  const [meetingType, setMeetingType] = useState<MeetingType>('standard');
  const [recurrenceStartDate, setRecurrenceStartDate] = useState('');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<WeekdayValue[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [scrollToParticipants, setScrollToParticipants] = useState(false);
  const participantFieldRef = useRef<HTMLDivElement>(null);

  const recurrenceRangeReady = Boolean(
    recurrenceStartDate && recurrenceEndDate && recurrenceEndDate >= recurrenceStartDate,
  );

  const selectedParticipantLabel = useMemo(
    () => getParticipantNames(selectedParticipantIds),
    [selectedParticipantIds],
  );

  useEffect(() => {
    if (!locationState.fromParticipantPicker) return;

    if (locationState.selectedIds) {
      setSelectedParticipantIds(locationState.selectedIds);
    }

    const draft = locationState.bookDraft;
    if (draft) {
      setMeetingType(draft.meetingType);
      setRecurrenceStartDate(draft.recurrenceStartDate);
      setRecurrenceEndDate(draft.recurrenceEndDate);
      setRecurrenceWeekdays(draft.recurrenceWeekdays);
      setSubject(draft.subject);
      setDescription(draft.description);
      if (draft.selectedParticipantIds.length > 0) {
        setSelectedParticipantIds(draft.selectedParticipantIds);
      }
      if (roomId && draft.selectedSlotIds.length > 0) {
        setSelectedSlots(restoreSlotsFromDraft(roomId, draft));
      }
    }

    setScrollToParticipants(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [locationState, location.pathname, navigate, roomId]);

  useEffect(() => {
    if (!scrollToParticipants || !participantFieldRef.current) return;

    const timer = window.setTimeout(() => {
      participantFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setScrollToParticipants(false);
    }, 50);

    return () => window.clearTimeout(timer);
  }, [scrollToParticipants, selectedParticipantIds]);

  if (!room) {
    return (
      <div className="mp-page">
        <MpNavBar title="会议室预约" showBack backTo="/mini-program/meeting-room/list" />
        <div className="mp-empty-tip">未找到该会议室</div>
      </div>
    );
  }

  const buildBookDraft = (): MeetingBookDraft => ({
    meetingType,
    recurrenceStartDate,
    recurrenceEndDate,
    recurrenceWeekdays,
    subject,
    description,
    selectedParticipantIds,
    selectedSlotIds: selectedSlots.map((slot) => slot.id),
    activeDate: getSlotActiveDate(selectedSlots, meetingType),
  });

  const slotActiveDate = getSlotActiveDate(selectedSlots, meetingType);

  const openParticipantPicker = () => {
    navigate(`/mini-program/meeting-room/book/${room.id}/participants`, {
      state: {
        selectedIds: selectedParticipantIds,
        bookDraft: buildBookDraft(),
      },
    });
  };

  const toggleWeekday = (value: WeekdayValue) => {
    setRecurrenceWeekdays((prev) => (
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort((a, b) => a - b)
    ));
  };

  const handleSubmit = () => {
    if (selectedSlots.length === 0) {
      message.warning('请先选择可预约时段');
      return;
    }

    if (meetingType === 'recurring') {
      if (!recurrenceStartDate || !recurrenceEndDate) {
        message.warning('请选择周期会议的开始日期和截止日期');
        return;
      }
      if (recurrenceEndDate < recurrenceStartDate) {
        message.warning('截止日期不能早于开始日期');
        return;
      }
      if (recurrenceWeekdays.length === 0) {
        message.warning('请选择周期重复的星期');
        return;
      }
    }

    if (!subject.trim()) {
      message.warning('请填写会议主题');
      return;
    }
    if (selectedParticipantIds.length === 0) {
      message.warning('请添加参会人');
      return;
    }
    if (!description.trim()) {
      message.warning('请填写会议描述');
      return;
    }

    if (meetingType === 'recurring') {
      const weekdayLabel = recurrenceWeekdays
        .map((d) => WEEKDAY_OPTIONS.find((w) => w.value === d)?.label)
        .filter(Boolean)
        .join('、');

      const conflictDates = findRecurringConflictDates(
        room.id,
        recurrenceStartDate,
        recurrenceEndDate,
        recurrenceWeekdays,
        selectedSlots,
      );

      const doSubmitRecurring = () => {
        submitRecurringMeeting({
          roomId: room.id,
          roomName: room.roomNo,
          address: getMeetingRoomAddress(room),
          title: subject.trim(),
          description: description.trim(),
          recurrenceStartDate,
          recurrenceEndDate,
          recurrenceWeekdays,
          recurrenceWeekdaysLabel: weekdayLabel,
          selectedSlots,
        });

        message.success(
          `周期会议已提交审批，审批通过后将自动生成多场标准会议：每${weekdayLabel} ${formatSelectedSlots(selectedSlots)}（${recurrenceStartDate} 至 ${recurrenceEndDate}）`,
        );
        navigate('/mini-program/meeting-room/my-reservations?tab=processing');
      };

      if (conflictDates.length > 0) {
        Modal.confirm({
          title: '周期会议部分日期冲突',
          content: formatRecurringConflictMessage(conflictDates, room.roomNo),
          okText: '确认提交',
          cancelText: '返回修改',
          centered: true,
          width: 320,
          onOk: doSubmitRecurring,
        });
        return;
      }

      doSubmitRecurring();
      return;
    }

    const participantNames = selectedParticipantIds
      .map((id) => collectPersons(meetingParticipantTree).find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    submitStandardMeeting({
      roomId: room.id,
      roomName: room.roomNo,
      address: getMeetingRoomAddress(room),
      title: subject.trim(),
      description: description.trim(),
      selectedSlots,
      activeDate: slotActiveDate ?? '',
      duration: formatSelectedSlots(selectedSlots),
      participants: participantNames,
      participantCount: selectedParticipantIds.length,
    });

    message.success(`已提交标准会议预约：${formatSelectedSlots(selectedSlots)}`);
    navigate('/mini-program/meeting-room/my-reservations?tab=processing');
  };

  return (
    <div className="mp-page mp-room-book-page">
      <MpNavBar title="会议预约" showBack backTo="/mini-program/meeting-room/list" />

      <div className="mp-page-scroll">
        <div className="mp-room-book-header">
          <h2 className="mp-room-book-title">{room.name}</h2>
          <MeetingRoomPhoto room={room} size="thumb" className="mp-room-book-header-photo" />
          <div className="mp-room-book-tags">
            <span>{room.building} {room.floor}</span>
            <span>{room.roomType}</span>
            <span>容纳 {room.capacity} 人</span>
          </div>
        </div>

        <div className="mp-room-book-section">
          <div className="mp-room-book-section-title">会议类型</div>
          <div className="mp-room-book-type-tabs" role="radiogroup" aria-label="会议类型">
            <button
              type="button"
              role="radio"
              aria-checked={meetingType === 'standard'}
              className={`mp-room-book-type-tab${meetingType === 'standard' ? ' mp-room-book-type-tab--active' : ''}`}
              onClick={() => setMeetingType('standard')}
            >
              标准会议
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={meetingType === 'recurring'}
              className={`mp-room-book-type-tab${meetingType === 'recurring' ? ' mp-room-book-type-tab--active' : ''}`}
              onClick={() => setMeetingType('recurring')}
            >
              周期会议
            </button>
          </div>

          {meetingType === 'recurring' && (
            <div className="mp-room-book-recurrence">
              <div className="mp-room-book-date-row">
                <label className="mp-room-book-field">
                  <span className="mp-room-book-field-label">
                    开始日期<span className="mp-room-book-required">*</span>
                  </span>
                  <input
                    type="date"
                    value={recurrenceStartDate}
                    onChange={(e) => setRecurrenceStartDate(e.target.value)}
                  />
                </label>
                <label className="mp-room-book-field">
                  <span className="mp-room-book-field-label">
                    截止日期<span className="mp-room-book-required">*</span>
                  </span>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    min={recurrenceStartDate || undefined}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  />
                </label>
              </div>

              {recurrenceRangeReady && (
                <div className="mp-room-book-weekdays">
                  <div className="mp-room-book-field-label">
                    重复星期<span className="mp-room-book-required">*</span>
                  </div>
                  <p className="mp-room-book-section-desc">
                    在 {recurrenceStartDate} 至 {recurrenceEndDate} 期间，按所选星期重复召开（可多选连续或不连续）
                  </p>
                  <div className="mp-room-book-weekday-tabs">
                    {WEEKDAY_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        className={`mp-room-book-weekday-tab${
                          recurrenceWeekdays.includes(value) ? ' mp-room-book-weekday-tab--active' : ''
                        }`}
                        onClick={() => toggleWeekday(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mp-room-book-section mp-room-book-section--flush">
          <div className="mp-room-book-section-title">
            {meetingType === 'recurring' ? '设置会议时段' : '选择预约时段'}
          </div>
          {meetingType === 'recurring' && (
            <p className="mp-room-book-section-desc mp-room-book-section-desc--slot">
              周期会议时间统一设置，选定后在日期区间内按重复星期每天相同时间召开
            </p>
          )}
          <MeetingTimeSlotGrid
            key={meetingType}
            roomId={room.id}
            roomName={room.roomNo}
            mode={meetingType === 'recurring' ? 'recurring' : 'standard'}
            initialSelectedSlotIds={selectedSlots.map((slot) => slot.id)}
            initialActiveDate={slotActiveDate}
            onSelectionChange={setSelectedSlots}
          />
        </div>

        <div className="mp-room-book-section">
          <div className="mp-room-book-section-title">会议信息</div>
          <p className="mp-room-book-section-desc mp-room-book-section-desc--required">
            以下字段均为必填
          </p>
          <div className="mp-room-book-form">
            <label className="mp-room-book-field">
              <span className="mp-room-book-field-label">
                创建会议主题<span className="mp-room-book-required">*</span>
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="请输入会议主题"
                maxLength={50}
              />
            </label>

            <div className="mp-room-book-field" ref={participantFieldRef}>
              <span className="mp-room-book-field-label">
                添加参会人<span className="mp-room-book-required">*</span>
              </span>
              <button type="button" className="mp-room-book-picker-field" onClick={openParticipantPicker}>
                <span className={selectedParticipantIds.length === 0 ? 'mp-room-book-picker-placeholder' : ''}>
                  {selectedParticipantIds.length === 0
                    ? '请选择参会人'
                    : `${selectedParticipantLabel}${selectedParticipantIds.length > 3 ? ` 等${selectedParticipantIds.length}人` : ''}`}
                </span>
                <RightOutlined />
              </button>
            </div>

            <label className="mp-room-book-field">
              <span className="mp-room-book-field-label">
                会议描述<span className="mp-room-book-required">*</span>
              </span>
              <textarea
                className="mp-room-book-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入会议描述、议程或备注"
                rows={4}
                maxLength={200}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mp-room-book-footer">
        <button type="button" className="mp-btn-primary mp-room-book-submit" onClick={handleSubmit}>
          提交预约
          {selectedSlots.length > 0 ? `（${formatMeetingTimeRange(selectedSlots)}）` : ''}
        </button>
      </div>
    </div>
  );
}
