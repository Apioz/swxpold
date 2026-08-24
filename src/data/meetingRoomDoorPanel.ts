import dayjs from 'dayjs';
import { getMeetingTimeSlots } from './meetingRoomSchedule';

export interface DoorPanelTimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  status: 'available' | 'booked';
}

export interface DoorPanelMeeting {
  title: string;
  timeRange: string;
  booker: string;
  participantCount: number;
}

/** 门牌屏演示：指定会议室当天固定占用时段 */
const DOOR_PANEL_BOOKED_RANGES: Record<string, { start: string; end: string; title?: string }[]> = {
  'r-2106': [
    { start: '10:00', end: '11:30', title: '项目组晨会' },
    { start: '14:00', end: '15:00', title: '技术部周会' },
    { start: '16:00', end: '17:30', title: '产品评审' },
  ],
  default: [
    { start: '14:00', end: '15:00', title: '技术部周会' },
    { start: '09:30', end: '10:30' },
    { start: '16:00', end: '17:00' },
  ],
};

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 18;
const SLOT_MINUTES = 30;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isSlotBooked(
  slotStart: string,
  slotEnd: string,
  bookedRanges: { start: string; end: string }[],
  roomId: string,
  dateKey: string,
): boolean {
  const sStart = toMinutes(slotStart);
  const sEnd = toMinutes(slotEnd);

  for (const range of bookedRanges) {
    const rStart = toMinutes(range.start);
    const rEnd = toMinutes(range.end);
    if (rStart < sEnd && rEnd > sStart) return true;
  }

  const slots = getMeetingTimeSlots(roomId, dateKey);
  return slots.some((slot) => {
    if (slot.status !== 'booked') return false;
    const start = toMinutes(slot.time);
    const end = toMinutes(slot.endTime);
    return start < sEnd && end > sStart;
  });
}

export function getDoorPanelDayBlocks(roomId: string, dateKey?: string): DoorPanelTimeBlock[] {
  const day = dateKey ?? dayjs().format('YYYY-MM-DD');
  const bookedRanges = DOOR_PANEL_BOOKED_RANGES[roomId] ?? DOOR_PANEL_BOOKED_RANGES.default;
  const blocks: DoorPanelTimeBlock[] = [];

  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour += 1) {
    for (const minute of [0, 30]) {
      const start = dayjs().hour(hour).minute(minute).second(0);
      const end = start.add(SLOT_MINUTES, 'minute');
      const startTime = start.format('HH:mm');
      const endTime = end.format('HH:mm');
      const booked = isSlotBooked(startTime, endTime, bookedRanges, roomId, day);

      blocks.push({
        id: `${day}-${startTime}`,
        startTime,
        endTime,
        label: `${startTime}-${endTime}`,
        status: booked ? 'booked' : 'available',
      });
    }
  }

  return blocks;
}

export function getDoorPanelCurrentMeeting(roomId: string, now = dayjs()): DoorPanelMeeting | null {
  const dateKey = now.format('YYYY-MM-DD');
  const bookedRanges = DOOR_PANEL_BOOKED_RANGES[roomId] ?? DOOR_PANEL_BOOKED_RANGES.default;
  const nowMin = now.hour() * 60 + now.minute();

  for (const range of bookedRanges) {
    const start = toMinutes(range.start);
    const end = toMinutes(range.end);
    if (nowMin >= start && nowMin < end) {
      return {
        title: range.title ?? '会议进行中',
        timeRange: `${range.start}-${range.end}`,
        booker: '禹创会议助理',
        participantCount: 30,
      };
    }
  }

  const slots = getMeetingTimeSlots(roomId, dateKey);
  const active = slots.find((slot) => {
    if (slot.status !== 'booked') return false;
    const start = toMinutes(slot.time);
    const end = toMinutes(slot.endTime);
    return nowMin >= start && nowMin < end;
  });

  if (!active) return null;

  return {
    title: '预约会议',
    timeRange: `${active.time}-${active.endTime}`,
    booker: '禹创会议助理',
    participantCount: 12,
  };
}

export function getDoorPanelRoomStatus(roomId: string, now = dayjs()): 'idle' | 'busy' {
  return getDoorPanelCurrentMeeting(roomId, now) ? 'busy' : 'idle';
}

export function listDoorPanelMeetingsToday(roomId: string, _dateKey?: string): DoorPanelMeeting[] {
  const bookedRanges = DOOR_PANEL_BOOKED_RANGES[roomId] ?? DOOR_PANEL_BOOKED_RANGES.default;

  return bookedRanges.map((range, index) => ({
    title: range.title ?? `会议 ${index + 1}`,
    timeRange: `${range.start}-${range.end}`,
    booker: '禹创会议助理',
    participantCount: 20 + index * 5,
  }));
}
