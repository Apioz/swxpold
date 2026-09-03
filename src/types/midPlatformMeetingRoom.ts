export type MeetingRoomEquipment = '投影仪' | '白板' | '麦克风';

export type MeetingRoomUsagePermission = 'unlimited' | 'restricted';

/** 会议室室内全景封面（与楼层平面图分离） */
export interface MeetingRoomCoverSelection {
  imageId: string;
  imageName: string;
  imageUrl: string;
  documentPath: string;
  campus: string;
  building: string;
  floor: string;
}

/** 楼层级平面图（全局共享，同楼层所有会议室共用） */
export interface MeetingRoomFloorPlanRecord {
  floorKey: string;
  floorPlanId: string;
  building: string;
  floor: string;
  campus: string;
  imageId: string;
  imageName: string;
  imageUrl: string;
  documentPath: string;
}

export interface MeetingRoomPlanPoint {
  x: number;
  y: number;
}

export interface MidPlatformMeetingRoom {
  id: string;
  roomNo: string;
  name: string;
  address: string;
  spaceLocation: string;
  area: number;
  capacity: number;
  equipment: MeetingRoomEquipment[];
  screenDevice: string;
  enabled: boolean;
  usagePermission: MeetingRoomUsagePermission;
  description?: string;
  building: string;
  cover?: MeetingRoomCoverSelection | null;
  planPoint?: MeetingRoomPlanPoint | null;
}

export interface MeetingRoomAccessRecord {
  id: string;
  name: string;
  meeting: string;
  recordTime: string;
}

export interface MeetingRoomPermissionNode {
  id: string;
  name: string;
  type: 'company' | 'department' | 'person';
  children?: MeetingRoomPermissionNode[];
}
