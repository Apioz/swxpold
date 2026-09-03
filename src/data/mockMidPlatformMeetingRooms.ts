import photo2204 from '../assets/meeting-rooms/r-2204.jpg';
import type {
  MeetingRoomAccessRecord,
  MeetingRoomPermissionNode,
  MidPlatformMeetingRoom,
} from '../types/midPlatformMeetingRoom';

export const midPlatformMeetingRooms: MidPlatformMeetingRoom[] = [
  {
    id: 'mr-2204',
    roomNo: '2204',
    name: '2204',
    address: '综合办公楼2# | 2F | 2204室',
    spaceLocation: '综合办公楼2#',
    area: 22,
    capacity: 10,
    equipment: ['投影仪', '白板'],
    screenDevice: '会议预约屏-2204',
    enabled: true,
    usagePermission: 'unlimited',
    building: '综合办公楼2#',
    cover: {
      imageId: 'img-2204',
      imageName: '2204室-室内全景.jpg',
      imageUrl: photo2204,
      documentPath: '生物芯片智慧园区 / 生物芯片-参考图纸 / 综合办公楼2# / 2F / 01-建筑装修 / 2204室-室内全景.jpg',
      campus: '生物芯片智慧园区',
      building: '综合办公楼2#',
      floor: '2F',
    },
    planPoint: { x: 31.25, y: 71.43 },
  },
  {
    id: 'mr-2202',
    roomNo: '2202',
    name: '2202',
    address: '综合办公楼2# | 2F | 2202室',
    spaceLocation: '综合办公楼2#',
    area: 22,
    capacity: 10,
    equipment: ['投影仪', '白板'],
    screenDevice: '会议预约屏-2202',
    enabled: true,
    usagePermission: 'unlimited',
    building: '综合办公楼2#',
  },
  {
    id: 'mr-1103',
    roomNo: '1103',
    name: '1103',
    address: '综合办公楼1# | 1F | 1103室',
    spaceLocation: '综合办公楼1# | 1F | 1103室',
    area: 92,
    capacity: 40,
    equipment: ['投影仪', '麦克风'],
    screenDevice: '会议预约屏-1103',
    enabled: true,
    usagePermission: 'unlimited',
    building: '综合办公楼1#',
  },
  {
    id: 'mr-1104',
    roomNo: '1104',
    name: '1104',
    address: '综合办公楼1# | 1F | 1104室',
    spaceLocation: '综合办公楼1# | 1F | 1104室',
    area: 29,
    capacity: 15,
    equipment: ['投影仪', '白板'],
    screenDevice: '会议预约屏-1104',
    enabled: true,
    usagePermission: 'unlimited',
    building: '综合办公楼1#',
  },
  {
    id: 'mr-1304',
    roomNo: '1304',
    name: '1304',
    address: '综合办公楼1# | 3F | 1304室',
    spaceLocation: '综合办公楼1# | 3F | 1304室',
    area: 49,
    capacity: 20,
    equipment: ['投影仪', '白板'],
    screenDevice: '会议预约屏-1304',
    enabled: true,
    usagePermission: 'unlimited',
    building: '综合办公楼1#',
  },
  {
    id: 'mr-lecture-hall',
    roomNo: 'lecture hall',
    name: '报告厅',
    address: '综合办公楼2#',
    spaceLocation: '综合办公楼2# | 2F | 2210室',
    area: 334,
    capacity: 314,
    equipment: ['投影仪', '麦克风'],
    screenDevice: '会议预约屏-2210、会议预约屏-2211',
    enabled: true,
    usagePermission: 'unlimited',
    building: '综合办公楼2#',
  },
  {
    id: 'mr-8331',
    roomNo: '8331',
    name: '8331',
    address: '分子医学楼8# | 3F | 8331室',
    spaceLocation: '分子医学楼8# | 3F | 8331室',
    area: 26,
    capacity: 50,
    equipment: [],
    screenDevice: '会议预约屏-8331',
    enabled: true,
    usagePermission: 'unlimited',
    building: '分子医学楼8#',
  },
  {
    id: 'mr-8301',
    roomNo: '8301',
    name: '8301',
    address: '分子医学楼8# | 3F | 8301室',
    spaceLocation: '分子医学楼8# | 3F | 8301室',
    area: 22,
    capacity: 50,
    equipment: [],
    screenDevice: '会议预约屏-8301',
    enabled: true,
    usagePermission: 'unlimited',
    building: '分子医学楼8#',
  },
  {
    id: 'mr-8304',
    roomNo: '8304',
    name: '8304',
    address: '分子医学楼8# | 3F | 8304室',
    spaceLocation: '分子医学楼8# | 3F | 8304室',
    area: 11,
    capacity: 50,
    equipment: [],
    screenDevice: '会议预约屏-8304',
    enabled: true,
    usagePermission: 'unlimited',
    building: '分子医学楼8#',
  },
];

export const MEETING_ROOM_BUILDING_OPTIONS = [
  { label: '综合办公楼1#', value: '综合办公楼1#' },
  { label: '综合办公楼2#', value: '综合办公楼2#' },
  { label: '分子医学楼8#', value: '分子医学楼8#' },
];

export const MEETING_ROOM_SPACE_OPTIONS = [
  { label: '综合办公楼1#', value: '综合办公楼1#' },
  { label: '综合办公楼2#', value: '综合办公楼2#' },
  { label: '分子医学楼8#', value: '分子医学楼8#' },
];

export const MEETING_ROOM_SCREEN_OPTIONS = Array.from(
  new Set(
    midPlatformMeetingRooms.flatMap((room) =>
      room.screenDevice
        .split('、')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ),
).map((device) => ({
  label: device,
  value: device,
}));

export const MEETING_ROOM_EQUIPMENT_OPTIONS = [
  { label: '投影仪', value: '投影仪' as const },
  { label: '白板', value: '白板' as const },
  { label: '麦克风', value: '麦克风' as const },
];

export const meetingRoomAccessRecords: MeetingRoomAccessRecord[] = [
  { id: 'ar-1', name: '史海灏', meeting: '信息', recordTime: '2026-08-28 11:09:38' },
  { id: 'ar-2', name: '李梦', meeting: '信息', recordTime: '2026-08-28 09:42:32' },
  { id: 'ar-3', name: '黄俊荣', meeting: '', recordTime: '2026-08-27 13:26:15' },
  { id: 'ar-4', name: '白铖', meeting: '物业例会', recordTime: '2026-08-24 14:08:59' },
  { id: 'ar-5', name: '蒋敏', meeting: '服务平台例会', recordTime: '2026-08-21 09:27:49' },
  {
    id: 'ar-6',
    name: '张宇晖',
    meeting: '数字孪生孵化器项目例会',
    recordTime: '2026-08-18 14:16:16',
  },
  {
    id: 'ar-7',
    name: '余翔',
    meeting: '数字化改造研讨会',
    recordTime: '2026-08-12 14:01:14',
  },
  { id: 'ar-8', name: '程薇', meeting: '', recordTime: '2026-08-12 12:44:47' },
  {
    id: 'ar-9',
    name: '袁菁',
    meeting: '微生物实验室换证',
    recordTime: '2026-08-07 14:00:46',
  },
  { id: 'ar-10', name: '程薇', meeting: '', recordTime: '2026-07-29 13:00:11' },
];

export const MEETING_ROOM_ACCESS_TOTAL = 12;

export const meetingRoomPermissionTree: MeetingRoomPermissionNode[] = [
  { id: 'c-1', name: '上海小龄生物医药技术有限公司', type: 'company' },
  { id: 'c-2', name: '上海康抗生物技术有限公司', type: 'company' },
  { id: 'c-3', name: '上海智芯合生物科技有限公司', type: 'company' },
  { id: 'c-4', name: '上海沪滑物业管理有限公司', type: 'company' },
  { id: 'c-5', name: '上海爱萨尔生物科技有限公司', type: 'company' },
  {
    id: 'c-6',
    name: '上海生物芯片有限公司',
    type: 'company',
    children: [
      { id: 'd-1', name: '中心（公司）主任办公室', type: 'department' },
      { id: 'd-2', name: '主任室', type: 'department' },
      { id: 'd-3', name: '信息安全与IT中心', type: 'department' },
      { id: 'd-4', name: '党总支办公室', type: 'department' },
      {
        id: 'd-5',
        name: '创新策源部',
        type: 'department',
        children: [
          { id: 'p-1', name: '施玮', type: 'person' },
          { id: 'p-2', name: '赵芹', type: 'person' },
        ],
      },
      { id: 'd-6', name: '孵化平台部', type: 'department' },
      { id: 'd-7', name: '市场营销中心', type: 'department' },
      { id: 'd-8', name: '总裁室', type: 'department' },
    ],
  },
];

export function filterMeetingRoomPermissionTree(
  nodes: MeetingRoomPermissionNode[],
  keyword: string,
): MeetingRoomPermissionNode[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return nodes;

  const filterNode = (node: MeetingRoomPermissionNode): MeetingRoomPermissionNode | null => {
    if (node.type === 'person') {
      return node.name.toLowerCase().includes(q) ? node : null;
    }
    const children = (node.children ?? [])
      .map(filterNode)
      .filter((child): child is MeetingRoomPermissionNode => child !== null);
    if (children.length === 0) return null;
    return { ...node, children };
  };

  return nodes
    .map(filterNode)
    .filter((node): node is MeetingRoomPermissionNode => node !== null);
}
