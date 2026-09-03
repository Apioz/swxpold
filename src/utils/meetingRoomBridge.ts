import type { MeetingRoomDetail, MeetingFloorPlan, MeetingRoomNode } from '../data/mockMeetingRooms';
import type { MidPlatformMeetingRoom } from '../types/midPlatformMeetingRoom';
import { getMeetingRoomPhotoUrl } from '../data/meetingRoomPhotoAssets';
import { getMeetingRooms } from '../store/meetingRoomStore';
import {
  getFloorPlan,
  getFloorPlanByFloorPlanId,
  getFloorPlans,
} from '../store/meetingRoomFloorPlanStore';
import {
  resolveMeetingRoomBuilding,
  resolveMeetingRoomFloor,
  resolveMeetingRoomFloorContext,
} from './meetingRoomFloorContext';

const BUILDING_ORDER = ['综合办公楼1#', '综合办公楼2#', '分子医学楼8#'];

const equipmentLabelMap: Record<string, string> = {
  投影仪: '投影',
  白板: '白板',
  麦克风: '麦克风',
};

export function inferFloorPlanId(room: MidPlatformMeetingRoom): string {
  const ctx = resolveMeetingRoomFloorContext({
    building: room.building,
    spaceLocation: room.spaceLocation,
    address: room.address,
    cover: room.cover,
  });
  if (!ctx) return '';
  return getFloorPlan(ctx.building, ctx.floor)?.floorPlanId ?? '';
}

function resolveBuilding(room: MidPlatformMeetingRoom): string {
  return resolveMeetingRoomBuilding({
    building: room.building,
    spaceLocation: room.spaceLocation,
    address: room.address,
    cover: room.cover,
  });
}

function resolveFloor(room: MidPlatformMeetingRoom): string {
  return resolveMeetingRoomFloor({
    address: room.address,
    cover: room.cover,
  });
}

function resolvePhotoUrl(room: MidPlatformMeetingRoom): string {
  if (room.cover?.imageUrl) return room.cover.imageUrl;
  return getMeetingRoomPhotoUrl(`mr-${room.roomNo}`);
}

/** 中台会议室 → 小程序展示数据（封面=全景图，点位=平面图标注） */
export function midPlatformRoomToMiniProgramDetail(
  room: MidPlatformMeetingRoom,
): MeetingRoomDetail | null {
  if (room.status === 'disabled') return null;

  const floorPlanId = inferFloorPlanId(room);
  const planPoint = room.planPoint;

  return {
    id: room.id,
    roomNo: room.roomNo,
    name: room.name,
    building: resolveBuilding(room),
    floor: resolveFloor(room),
    capacity: room.capacity,
    roomType: '会议室',
    area: `${room.area}㎡`,
    facilities: room.equipment.map((item) => equipmentLabelMap[item] ?? item),
    photoUrl: resolvePhotoUrl(room),
    floorPlanId,
    planX: planPoint?.x ?? 0,
    planY: planPoint?.y ?? 0,
  };
}

export function getManagedMeetingRoomDetails(): MeetingRoomDetail[] {
  return getMeetingRooms()
    .map(midPlatformRoomToMiniProgramDetail)
    .filter((room): room is MeetingRoomDetail => room !== null);
}

export function getManagedMeetingRoomDetailById(id: string): MeetingRoomDetail | undefined {
  const room = getMeetingRooms().find((item) => item.id === id);
  return room ? midPlatformRoomToMiniProgramDetail(room) ?? undefined : undefined;
}

export function buildManagedMeetingRoomTree(): MeetingRoomNode[] {
  const activeRooms = getMeetingRooms().filter((room) => room.status !== 'disabled');
  const buildingMap = new Map<string, Map<string, MidPlatformMeetingRoom[]>>();

  activeRooms.forEach((room) => {
    const building = resolveBuilding(room);
    const floor = resolveFloor(room) || '未分层';
    if (!buildingMap.has(building)) buildingMap.set(building, new Map());
    const floorMap = buildingMap.get(building)!;
    if (!floorMap.has(floor)) floorMap.set(floor, []);
    floorMap.get(floor)!.push(room);
  });

  const buildings = [...buildingMap.keys()].sort((a, b) => {
    const ai = BUILDING_ORDER.indexOf(a);
    const bi = BUILDING_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return buildings.map((building) => {
    const floorMap = buildingMap.get(building)!;
    const floors = [...floorMap.keys()].sort((a, b) => a.localeCompare(b, 'zh-CN'));

    return {
      id: `mp-building-${building}`,
      name: building,
      type: 'building' as const,
      children: floors.map((floor) => ({
        id: `mp-floor-${building}-${floor}`,
        name: floor,
        type: 'floor' as const,
        children: floorMap.get(floor)!.map((room) => ({
          id: room.id,
          name: `${room.roomNo} ${room.name}`.trim(),
          type: 'room' as const,
          capacity: room.capacity,
          roomType: '会议室',
        })),
      })),
    };
  });
}

export function getManagedFloorPlans(): MeetingFloorPlan[] {
  return getFloorPlans().map((record) => ({
    id: record.floorPlanId,
    building: record.building,
    floor: record.floor,
    label: `${record.building} ${record.floor}`,
    width: 960,
    height: 420,
  }));
}

export function getManagedRoomsByFloorPlan(floorPlanId: string): MeetingRoomDetail[] {
  const record = getFloorPlanByFloorPlanId(floorPlanId);
  if (!record) return [];

  return getMeetingRooms()
    .filter(
      (room) =>
        room.status !== 'disabled' &&
        inferFloorPlanId(room) === floorPlanId &&
        room.planPoint,
    )
    .map(midPlatformRoomToMiniProgramDetail)
    .filter((room): room is MeetingRoomDetail => room !== null);
}

export function getFloorPlanImageUrl(floorPlanId: string): string | undefined {
  return getFloorPlanByFloorPlanId(floorPlanId)?.imageUrl;
}
