import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  buildRecurringTimeRangeSelection,
  buildTimeRangeSelection,
  formatMeetingTimeRange,
  formatTimeLabel,
  getMeetingDateOptions,
  getMeetingTimeSlots,
  getRecurringSlotBaseStatus,
  getRecurringTimeSlots,
  getSlotBaseStatus,
  type MeetingTimeSlot,
} from '../../../../data/meetingRoomSchedule';
import './MeetingTimeSlotGrid.css';

const RANGE_CONFLICT_MSG =
  '您当前所选的时间段中已有其他会议存在，请重新选择会议时间';

interface MeetingTimeSlotGridProps {
  roomId: string;
  roomName: string;
  mode?: 'standard' | 'recurring';
  initialSelectedSlotIds?: string[];
  initialActiveDate?: string;
  onSelectionChange?: (slots: MeetingTimeSlot[]) => void;
}

export default function MeetingTimeSlotGrid({
  roomId,
  roomName,
  mode = 'standard',
  initialSelectedSlotIds = [],
  initialActiveDate,
  onSelectionChange,
}: MeetingTimeSlotGridProps) {
  const navigate = useNavigate();
  const isRecurring = mode === 'recurring';
  const dateOptions = useMemo(() => getMeetingDateOptions(), []);
  const [activeDate, setActiveDate] = useState(
    initialActiveDate ?? dateOptions[1]?.key ?? dateOptions[0].key,
  );
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialSelectedSlotIds),
  );
  /** 已点选的开始时段，等待选择结束时段 */
  const [rangeStartId, setRangeStartId] = useState<string | null>(null);

  const slots = useMemo(() => {
    if (isRecurring) {
      return getRecurringTimeSlots(roomId, selectedIds);
    }
    return getMeetingTimeSlots(roomId, activeDate, selectedIds);
  }, [roomId, activeDate, selectedIds, isRecurring]);

  const selectedSlots = slots.filter((s) => s.status === 'selected');
  const selectedIdsKey = initialSelectedSlotIds.join('|');

  useEffect(() => {
    if (initialActiveDate) {
      setActiveDate(initialActiveDate);
    }
  }, [initialActiveDate]);

  useEffect(() => {
    setSelectedIds(new Set(initialSelectedSlotIds));
    setRangeStartId(null);
  }, [selectedIdsKey, initialSelectedSlotIds]);

  const applySelection = (ids: string[], rangeSlots: MeetingTimeSlot[]) => {
    setSelectedIds(new Set(ids));
    setRangeStartId(null);
    onSelectionChange?.(rangeSlots);
  };

  const resetSelection = () => {
    setSelectedIds(new Set());
    setRangeStartId(null);
    onSelectionChange?.([]);
  };

  const handleSlotClick = (slot: MeetingTimeSlot) => {
    const baseStatus = isRecurring
      ? getRecurringSlotBaseStatus(roomId, slot.time)
      : getSlotBaseStatus(roomId, activeDate, slot.time);

    if (baseStatus !== 'available') return;

    if (selectedIds.size > 0) {
      setRangeStartId(slot.id);
      setSelectedIds(new Set());
      onSelectionChange?.([]);
      return;
    }

    if (!rangeStartId) {
      setRangeStartId(slot.id);
      return;
    }

    if (rangeStartId === slot.id) {
      applySelection([slot.id], [{ ...slot, status: 'selected' }]);
      return;
    }

    const result = isRecurring
      ? buildRecurringTimeRangeSelection(roomId, rangeStartId, slot.id)
      : buildTimeRangeSelection(roomId, activeDate, rangeStartId, slot.id);

    if (!result.ok) {
      if (result.reason === 'blocked') {
        message.error(RANGE_CONFLICT_MSG);
      }
      resetSelection();
      return;
    }

    applySelection(result.slotIds, result.slots);
  };

  const handleDateChange = (key: string) => {
    setActiveDate(key);
    resetSelection();
  };

  const rangeHint = (() => {
    if (selectedSlots.length > 0) {
      const timeRange = formatMeetingTimeRange(selectedSlots);
      return isRecurring
        ? `周期统一会议时段：${timeRange}`
        : `会议时间：${timeRange}`;
    }
    if (rangeStartId) {
      return '请选择结束时间';
    }
    return isRecurring
      ? '请选择周期内统一的开始与结束时间'
      : '请先选择开始时间，再选择结束时间';
  })();

  return (
    <div className={`mp-slot-grid-wrap${isRecurring ? ' mp-slot-grid-wrap--recurring' : ''}`}>
      <div className="mp-slot-range-hint">{rangeHint}</div>

      {isRecurring ? (
        <div className="mp-slot-recurring-tip">
          以下仅设置每日会议时段，将在上方所选日期区间与重复星期统一生效
        </div>
      ) : (
        <div className="mp-slot-date-tabs">
          {dateOptions.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`mp-slot-date-tab${d.key === activeDate ? ' active' : ''}`}
              onClick={() => handleDateChange(d.key)}
            >
              <span className="weekday">{d.weekday}</span>
              <span className="date">{d.dateLabel}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mp-slot-grid-scroll">
        <div className="mp-slot-grid">
          <div className="mp-slot-grid-corner">{isRecurring ? '时段' : ''}</div>
          <div className="mp-slot-grid-room-head">{roomName}</div>

          {slots.map((slot) => {
            const isPendingStart =
              rangeStartId === slot.id && selectedIds.size === 0;
            const cellStatus = isPendingStart ? 'pending-start' : slot.status;

            return (
              <div key={slot.id} className="mp-slot-grid-row">
                <div
                  className={`mp-slot-time-label${slot.isHourMark ? ' is-hour' : ' is-quarter'}`}
                >
                  {formatTimeLabel(slot.time, slot.isHourMark)}
                </div>
                <button
                  type="button"
                  className={`mp-slot-cell mp-slot-cell--${cellStatus}${slot.isHourMark ? ' is-hour-row' : ''}`}
                  disabled={slot.status === 'past' || slot.status === 'booked'}
                  onClick={() => handleSlotClick(slot)}
                  aria-label={`${slot.label} ${cellStatus === 'available' ? '可预约' : cellStatus === 'selected' ? '已选择' : cellStatus === 'pending-start' ? '开始时间' : '不可预约'}`}
                >
                  {cellStatus === 'available' && (
                    <span className="mp-slot-cell-text">可约</span>
                  )}
                  {cellStatus === 'pending-start' && (
                    <span className="mp-slot-cell-text">开始</span>
                  )}
                  {cellStatus === 'selected' && (
                    <span className="mp-slot-cell-text">{slot.time}</span>
                  )}
                  {(cellStatus === 'booked' || cellStatus === 'past') && (
                    <span className="mp-slot-cell-watermark" aria-hidden />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mp-slot-legend">
        <span><i className="mp-slot-legend-box available" />可预约</span>
        {!isRecurring && (
          <span><i className="mp-slot-legend-box booked" />已占用</span>
        )}
        {!isRecurring && (
          <span><i className="mp-slot-legend-box past" />已过/不可约</span>
        )}
        <span><i className="mp-slot-legend-box pending" />开始/结束</span>
        <span><i className="mp-slot-legend-box selected" />已选区间</span>
      </div>

      <div className="mp-slot-footer">
        <span className="mp-slot-selected-count">
          {selectedSlots.length > 0
            ? `已选：${formatMeetingTimeRange(selectedSlots)}`
            : '已选时段(0)'}
        </span>
        <button
          type="button"
          className="mp-slot-floor-btn"
          onClick={() => navigate('/mini-program/meeting-room/list?view=plan')}
        >
          场馆平面图
        </button>
      </div>
    </div>
  );
}
