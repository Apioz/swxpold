import dayjs from 'dayjs';
import type { MeetingTimeSlot } from './meetingRoomSchedule';
import { getBaseMeetingTimeSlots, getSlotBaseStatus, isDateExplicitlyBlocked } from './meetingRoomSchedule';

/** 1=周一 … 7=周日，与预约页 WEEKDAY_OPTIONS 一致 */
export function weekdayValueToDayjsDay(value: number): number {
  return value === 7 ? 0 : value;
}

export function parseWeekdayLabels(text: string): number[] {
  const map: Record<string, number> = {
    周一: 1, 周二: 2, 周三: 3, 周四: 4, 周五: 5, 周六: 6, 周日: 7,
  };
  return text.split(/[、,，]/).map((s) => map[s.trim()]).filter(Boolean);
}

/** 周期内所有符合重复星期的日期 */
export function getRecurringOccurrenceDates(
  startDate: string,
  endDate: string,
  weekdayValues: number[],
): string[] {
  if (!startDate || !endDate || weekdayValues.length === 0) return [];

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const targetDays = new Set(weekdayValues.map(weekdayValueToDayjsDay));
  const dates: string[] = [];

  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    if (targetDays.has(cursor.day())) {
      dates.push(cursor.format('YYYY-MM-DD'));
    }
    cursor = cursor.add(1, 'day');
  }

  return dates;
}

export function getTimeRangeFromSlots(slots: MeetingTimeSlot[]): { start: string; end: string } {
  const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
  return {
    start: sorted[0].time,
    end: sorted[sorted.length - 1].endTime,
  };
}

/** 某日在所选时段内是否与已有会议冲突 */
export function isTimeRangeConflictOnDate(
  roomId: string,
  dateKey: string,
  startTime: string,
  endTime: string,
): boolean {
  if (isDateExplicitlyBlocked(roomId, dateKey)) return true;

  const baseSlots = getBaseMeetingTimeSlots(roomId, dateKey);
  const rangeSlots = baseSlots.filter(
    (slot) => slot.time >= startTime && slot.time < endTime,
  );

  if (rangeSlots.length === 0) return false;

  return rangeSlots.some(
    (slot) => getSlotBaseStatus(roomId, dateKey, slot.time) !== 'available',
  );
}

export function findRecurringConflictDates(
  roomId: string,
  startDate: string,
  endDate: string,
  weekdayValues: number[],
  slots: MeetingTimeSlot[],
): string[] {
  const { start, end } = getTimeRangeFromSlots(slots);
  const occurrenceDates = getRecurringOccurrenceDates(startDate, endDate, weekdayValues);

  return occurrenceDates.filter((dateKey) =>
    isTimeRangeConflictOnDate(roomId, dateKey, start, end),
  );
}

export function formatConflictDateLabel(dateKey: string): string {
  return dayjs(dateKey).format('M月D日');
}

export function formatRecurringConflictMessage(
  conflictDates: string[],
  roomName: string,
): string {
  const dateText = conflictDates.map(formatConflictDateLabel).join('、');
  return `${dateText} 该会议室（${roomName}）已有其他会议安排，上述日期不会纳入本次周期预约。如需在这些日期开会，请另行单独预约；其余日期仍按所选时段正常提交。`;
}

export interface ExpandRecurringParams {
  auditId: string;
  title: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  weekdayValues: number[];
  slots: MeetingTimeSlot[];
  excludedDates: string[];
}

/** 审批通过后生成标准会议日期（排除冲突日期） */
export function expandRecurringToStandardReservations(
  params: ExpandRecurringParams,
): Array<{ dateKey: string; time: string; id: string }> {
  const { start } = getTimeRangeFromSlots(params.slots);
  const excluded = new Set(params.excludedDates);
  const dates = getRecurringOccurrenceDates(
    params.startDate,
    params.endDate,
    params.weekdayValues,
  ).filter((d) => !excluded.has(d));

  return dates.map((dateKey) => ({
    dateKey,
    time: `${dateKey} ${start}:00`,
    id: `${params.auditId}-${dateKey}`,
  }));
}
