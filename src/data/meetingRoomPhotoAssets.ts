import photo2106 from '../assets/meeting-rooms/r-2106.jpg';
import photo2108 from '../assets/meeting-rooms/r-2108.jpg';
import photo2204 from '../assets/meeting-rooms/r-2204.jpg';
import photo5201 from '../assets/meeting-rooms/r-5201.jpg';
import photo5211 from '../assets/meeting-rooms/r-5211.jpg';
import photo3102 from '../assets/meeting-rooms/r-3102.jpg';
import photo3105 from '../assets/meeting-rooms/r-3105.jpg';

/** 各会议室室内全景实景图（960×540，16:9） */
export const meetingRoomPhotoMap: Record<string, string> = {
  'r-2106': photo2106,
  'r-2108': photo2108,
  'r-2204': photo2204,
  'r-5201': photo5201,
  'r-5211': photo5211,
  'r-3102': photo3102,
  'r-3105': photo3105,
};

export function getMeetingRoomPhotoUrl(roomId: string): string {
  return meetingRoomPhotoMap[roomId] ?? photo2106;
}
