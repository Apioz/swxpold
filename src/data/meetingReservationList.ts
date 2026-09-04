import type { MidPlatformMeetingRoom } from '../types/midPlatformMeetingRoom';
import { midPlatformMeetingRooms } from './mockMidPlatformMeetingRooms';

/** 会议预约列表展示顺序，与示意图一致 */
export const MEETING_RESERVATION_ROOM_ORDER = [
  'mr-2204',
  'mr-2202',
  'mr-1103',
  'mr-1104',
  'mr-1304',
  'mr-2210',
  'mr-8331',
  'mr-lecture-hall',
  'mr-8304',
] as const;

/** 会议预约列表以 mock 数据为准，保证与示意图字段一致 */
export function getReservationMeetingRooms(): MidPlatformMeetingRoom[] {
  const roomMap = new Map(midPlatformMeetingRooms.map((room) => [room.id, room]));
  return MEETING_RESERVATION_ROOM_ORDER.map((id) => roomMap.get(id)).filter(
    (room): room is MidPlatformMeetingRoom => Boolean(room),
  );
}
