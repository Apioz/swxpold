import type { MeetingRoomDetail } from './mockMeetingRooms';

/** 根据楼栋、楼层、序号生成会议室编号，如 8号楼 + 4F + 1 → 8401 */
export function buildMeetingRoomCode(building: string, floor: string, sequence: number): string {
  const buildingNo = building.match(/(\d+)/)?.[1] ?? '';
  const floorNo = floor.match(/(\d+)/)?.[1] ?? '';
  return `${buildingNo}${floorNo}${String(sequence).padStart(2, '0')}`;
}

export function getMeetingRoomDisplayCode(
  room: Pick<MeetingRoomDetail, 'roomNo' | 'building' | 'floor'>,
): string {
  return room.roomNo;
}

export function getMeetingRoomDisplayName(
  room: Pick<MeetingRoomDetail, 'roomNo' | 'roomType' | 'name'>,
): string {
  if (room.name.startsWith(room.roomNo)) return room.name;
  return `${room.roomNo} ${room.roomType}`;
}
