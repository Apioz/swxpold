import dayjs from 'dayjs';
import { getBaseMeetingTimeSlots } from './meetingRoomSchedule';

export interface ReservationDayBlock {
  start: string;
  end: string;
  title: string;
}

const EXPLICIT_DAY_BOOKINGS: Record<string, ReservationDayBlock[]> = {
  'mr-2204': [
    { start: '09:00', end: '11:30', title: '研发' },
    { start: '13:30', end: '15:30', title: '服务器' },
  ],
  'mr-2202': [{ start: '14:00', end: '16:00', title: '行政部例会' }],
  'mr-1103': [{ start: '10:00', end: '12:00', title: '产品评审' }],
  'mr-1104': [{ start: '08:45', end: '10:15', title: '晨会' }],
  'mr-1304': [{ start: '15:00', end: '17:00', title: '培训' }],
  'mr-2210': [{ start: '09:30', end: '11:00', title: '项目例会' }],
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function mergeSlotsToBlocks(
  slots: Array<{ time: string; endTime: string }>,
  title: string,
): ReservationDayBlock[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
  const blocks: ReservationDayBlock[] = [];
  let currentStart = sorted[0].time;
  let currentEnd = sorted[0].endTime;

  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].time === currentEnd) {
      currentEnd = sorted[i].endTime;
    } else {
      blocks.push({ start: currentStart, end: currentEnd, title });
      currentStart = sorted[i].time;
      currentEnd = sorted[i].endTime;
    }
  }
  blocks.push({ start: currentStart, end: currentEnd, title });
  return blocks;
}

export function getReservationDayBlocks(
  roomId: string,
  dateKey: string,
): ReservationDayBlock[] {
  const explicit = EXPLICIT_DAY_BOOKINGS[roomId];
  if (explicit) return explicit;

  const bookedSlots = getBaseMeetingTimeSlots(roomId, dateKey).filter(
    (slot) => slot.status === 'booked',
  );
  if (bookedSlots.length === 0) return [];

  return mergeSlotsToBlocks(bookedSlots, '已预约');
}

export function getReservationTimelineDate(): string {
  return '2026-09-03';
}

export function timeRangeToPercent(start: string, end: string): { left: number; width: number } {
  const dayMinutes = 24 * 60;
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  return {
    left: (startMin / dayMinutes) * 100,
    width: ((endMin - startMin) / dayMinutes) * 100,
  };
}

export function isTimeRangeConflict(
  blocks: ReservationDayBlock[],
  start: string,
  end: string,
): ReservationDayBlock | undefined {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  return blocks.find((block) => {
    const blockStart = timeToMinutes(block.start);
    const blockEnd = timeToMinutes(block.end);
    return startMin < blockEnd && endMin > blockStart;
  });
}

export function formatReservationTimeRange(start: string, end: string): string {
  return `${start}-${end}`;
}

export function buildSlotsFromTimeRange(
  dateKey: string,
  start: string,
  end: string,
): Array<{ id: string; time: string; endTime: string; label: string; status: 'selected'; isHourMark: boolean }> {
  const slots: Array<{ id: string; time: string; endTime: string; label: string; status: 'selected'; isHourMark: boolean }> = [];
  let cursor = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  while (cursor < endMin) {
    const next = Math.min(cursor + 15, endMin);
    const time = minutesToTime(cursor);
    const endTime = minutesToTime(next);
    slots.push({
      id: `${dateKey}-${time}`,
      time,
      endTime,
      label: `${time}-${endTime}`,
      status: 'selected',
      isHourMark: time.endsWith(':00'),
    });
    cursor = next;
  }

  return slots;
}

export interface RecurringCalendarEvent {
  date: string;
  start: string;
  end: string;
  title: string;
}

export function getRecurringCalendarEvents(
  roomId: string,
  month: dayjs.Dayjs,
): RecurringCalendarEvent[] {
  const events: RecurringCalendarEvent[] = [];
  const daysInMonth = month.daysInMonth();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = month.date(day).format('YYYY-MM-DD');
    getReservationDayBlocks(roomId, date).forEach((block) => {
      events.push({
        date,
        start: block.start,
        end: block.end,
        title: block.title,
      });
    });
  }

  return events;
}
