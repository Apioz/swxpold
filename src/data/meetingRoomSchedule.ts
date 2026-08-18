import dayjs from 'dayjs';

export type SlotStatus = 'available' | 'booked' | 'past' | 'selected';

export interface MeetingTimeSlot {
  id: string;
  time: string;
  endTime: string;
  label: string;
  status: SlotStatus;
  /** 是否整点行（用于网格左侧时间展示） */
  isHourMark: boolean;
}

export interface MeetingDateOption {
  key: string;
  weekday: string;
  dateLabel: string;
  isToday: boolean;
  isTomorrow: boolean;
}

export const SLOT_MINUTES = 15;
const DAY_START = '09:00';
const DAY_END = '18:00';

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function buildTimeRows(): { time: string; endTime: string }[] {
  const rows: { time: string; endTime: string }[] = [];
  let current = dayjs(`2000-01-01 ${DAY_START}`);
  const end = dayjs(`2000-01-01 ${DAY_END}`);

  while (current.isBefore(end)) {
    const next = current.add(SLOT_MINUTES, 'minute');
    rows.push({
      time: current.format('HH:mm'),
      endTime: next.format('HH:mm'),
    });
    current = next;
  }

  return rows;
}

const TIME_ROWS = buildTimeRows();

export function getMeetingDateOptions(baseDate = dayjs()): MeetingDateOption[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = baseDate.add(i, 'day');
    const isToday = i === 0;
    const isTomorrow = i === 1;
    let weekday = WEEKDAY[d.day()];
    if (isToday) weekday = '今天';
    else if (isTomorrow) weekday = '明天';

    return {
      key: d.format('YYYY-MM-DD'),
      weekday,
      dateLabel: d.format('M-D'),
      isToday,
      isTomorrow,
    };
  });
}

function getSlotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const startHour = parseInt(DAY_START.split(':')[0], 10);
  return (h - startHour) * (60 / SLOT_MINUTES) + m / SLOT_MINUTES;
}

/** 根据会议室与日期生成时段占用（模拟数据，15 分钟粒度） */
function isSlotBooked(roomId: string, dateKey: string, time: string): boolean {
  const seed = `${roomId}-${dateKey}`.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const idx = getSlotIndex(time);
  return (seed + idx * 7) % 6 === 0 || (seed + idx * 3) % 13 === 0;
}

/** 演示：指定日期该会议室全天已有安排（如 8.12 周三已被占用） */
const EXPLICIT_BLOCKED_DATES: Record<string, string[]> = {
  'r-2204': ['2026-08-12'],
};

export function isDateExplicitlyBlocked(roomId: string, dateKey: string): boolean {
  return EXPLICIT_BLOCKED_DATES[roomId]?.includes(dateKey) ?? false;
}

function isSlotPast(dateKey: string, time: string): boolean {
  const now = dayjs();
  const slotStart = dayjs(`${dateKey} ${time}`);
  return slotStart.isBefore(now);
}

export function getMeetingTimeSlots(
  roomId: string,
  dateKey: string,
  selectedIds: Set<string> = new Set(),
): MeetingTimeSlot[] {
  return TIME_ROWS.map(({ time, endTime }) => {
    const id = `${dateKey}-${time}`;
    let status: SlotStatus = 'available';

    if (isSlotPast(dateKey, time)) {
      status = 'past';
    } else if (selectedIds.has(id)) {
      status = 'selected';
    } else if (isSlotBooked(roomId, dateKey, time)) {
      status = 'booked';
    }

    return {
      id,
      time,
      endTime,
      label: `${time}-${endTime}`,
      status,
      isHourMark: time.endsWith(':00'),
    };
  });
}

export function formatSelectedSlots(slots: MeetingTimeSlot[]): string {
  if (slots.length === 0) return '';
  return formatMeetingTimeRange(slots);
}

export function formatMeetingTimeRange(slots: MeetingTimeSlot[]): string {
  if (slots.length === 0) return '';
  const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
  return `${sorted[0].time}-${sorted[sorted.length - 1].endTime}`;
}

export function getBaseMeetingTimeSlots(
  roomId: string,
  dateKey: string,
): MeetingTimeSlot[] {
  return getMeetingTimeSlots(roomId, dateKey, new Set());
}

/** 获取时段基础可用性（不含选中态） */
export function getSlotBaseStatus(
  roomId: string,
  dateKey: string,
  time: string,
): Exclude<SlotStatus, 'selected'> {
  if (isSlotPast(dateKey, time)) return 'past';
  if (isSlotBooked(roomId, dateKey, time)) return 'booked';
  return 'available';
}

export type RangeSelectResult =
  | { ok: true; slotIds: string[]; slots: MeetingTimeSlot[] }
  | { ok: false; reason: 'blocked' | 'invalid' };

/** 校验开始—结束区间内是否全部空闲，并返回应选中的时段 */
export function buildTimeRangeSelection(
  roomId: string,
  dateKey: string,
  startId: string,
  endId: string,
): RangeSelectResult {
  const baseSlots = getBaseMeetingTimeSlots(roomId, dateKey);
  const startIdx = baseSlots.findIndex((s) => s.id === startId);
  const endIdx = baseSlots.findIndex((s) => s.id === endId);

  if (startIdx === -1 || endIdx === -1) {
    return { ok: false, reason: 'invalid' };
  }

  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  const rangeSlots = baseSlots.slice(from, to + 1);

  const hasBlocked = rangeSlots.some(
    (s) => getSlotBaseStatus(roomId, dateKey, s.time) !== 'available',
  );

  if (hasBlocked) {
    return { ok: false, reason: 'blocked' };
  }

  return {
    ok: true,
    slotIds: rangeSlots.map((s) => s.id),
    slots: rangeSlots.map((s) => ({ ...s, status: 'selected' as const })),
  };
}

export const RECURRING_SLOT_PREFIX = 'recurring';

export function getRecurringSlotBaseStatus(
  _roomId: string,
  _time: string,
): Exclude<SlotStatus, 'selected'> {
  /** 周期会议时段模板不与具体日期冲突绑定，具体日期冲突在提交时处理 */
  return 'available';
}

/** 周期会议：仅展示时段，不含日期/星期；模板时段均可选 */
export function getRecurringTimeSlots(
  _roomId: string,
  selectedIds: Set<string> = new Set(),
): MeetingTimeSlot[] {
  return TIME_ROWS.map(({ time, endTime }) => {
    const id = `${RECURRING_SLOT_PREFIX}-${time}`;
    const status: SlotStatus = selectedIds.has(id) ? 'selected' : 'available';

    return {
      id,
      time,
      endTime,
      label: `${time}-${endTime}`,
      status,
      isHourMark: time.endsWith(':00'),
    };
  });
}

export function buildRecurringTimeRangeSelection(
  roomId: string,
  startId: string,
  endId: string,
): RangeSelectResult {
  const baseSlots = getRecurringTimeSlots(roomId, new Set());
  const startIdx = baseSlots.findIndex((s) => s.id === startId);
  const endIdx = baseSlots.findIndex((s) => s.id === endId);

  if (startIdx === -1 || endIdx === -1) {
    return { ok: false, reason: 'invalid' };
  }

  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  const rangeSlots = baseSlots.slice(from, to + 1);

  return {
    ok: true,
    slotIds: rangeSlots.map((s) => s.id),
    slots: rangeSlots.map((s) => ({ ...s, status: 'selected' as const })),
  };
}

export function formatTimeLabel(time: string, isHourMark: boolean): string {
  if (isHourMark) return time;
  return time.slice(3);
}
