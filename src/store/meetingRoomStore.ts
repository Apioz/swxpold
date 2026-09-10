import { useSyncExternalStore } from 'react';
import type { MidPlatformMeetingRoom, MeetingRoomStatus } from '../types/midPlatformMeetingRoom';
import { midPlatformMeetingRooms } from '../data/mockMidPlatformMeetingRooms';
import { clearPersisted, loadPersisted, savePersisted } from '../utils/persistStore';

const STORAGE_KEY = 'sw.meeting-rooms';

type LegacyMeetingRoom = MidPlatformMeetingRoom & { enabled?: boolean };

/** 兼容旧数据：enabled 布尔值迁移为 status，并补齐缺失字段避免小程序渲染崩溃 */
function normalizeMeetingRoom(room: LegacyMeetingRoom): MidPlatformMeetingRoom {
  const status: MeetingRoomStatus =
    room.status ?? (room.enabled === false ? 'disabled' : 'enabled');

  return {
    ...room,
    roomNo: room.roomNo ?? '',
    name: room.name ?? '',
    address: room.address ?? '',
    spaceLocation: room.spaceLocation ?? '',
    area: typeof room.area === 'number' && !Number.isNaN(room.area) ? room.area : 0,
    capacity: typeof room.capacity === 'number' && !Number.isNaN(room.capacity) ? room.capacity : 0,
    equipment: Array.isArray(room.equipment) ? room.equipment : [],
    screenDevice: room.screenDevice ?? '',
    status,
    usagePermission: room.usagePermission === 'restricted' ? 'restricted' : 'unlimited',
    authorizedUserIds: Array.isArray(room.authorizedUserIds) ? room.authorizedUserIds : [],
    building: room.building ?? '',
    cover: room.cover ?? null,
    planPoint: room.planPoint ?? null,
  };
}

function loadMeetingRooms(): MidPlatformMeetingRoom[] {
  const loaded = loadPersisted<LegacyMeetingRoom[] | unknown>(
    STORAGE_KEY,
    structuredClone(midPlatformMeetingRooms),
  );
  const source = Array.isArray(loaded) ? loaded : structuredClone(midPlatformMeetingRooms);
  const normalized = source.map(normalizeMeetingRoom);

  if (typeof window !== 'undefined' && Array.isArray(loaded)) {
    savePersisted(STORAGE_KEY, normalized);
  }

  return normalized;
}

let rooms: MidPlatformMeetingRoom[] = loadMeetingRooms();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getMeetingRooms(): MidPlatformMeetingRoom[] {
  return rooms;
}

export function getMeetingRoomByMidPlatformId(id: string): MidPlatformMeetingRoom | undefined {
  return rooms.find((room) => room.id === id);
}

export function getMeetingRoomByRoomNo(roomNo: string): MidPlatformMeetingRoom | undefined {
  return rooms.find((room) => room.roomNo === roomNo);
}

function persistRooms() {
  savePersisted(STORAGE_KEY, rooms);
}

export function setMeetingRooms(next: MidPlatformMeetingRoom[]) {
  rooms = next;
  persistRooms();
  emit();
}

export function upsertMeetingRoom(room: MidPlatformMeetingRoom) {
  const normalized = normalizeMeetingRoom(room);
  const index = rooms.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    rooms = rooms.map((item, i) => (i === index ? normalized : item));
  } else {
    rooms = [...rooms, normalized];
  }
  persistRooms();
  emit();
}

export function removeMeetingRoom(id: string) {
  rooms = rooms.filter((room) => room.id !== id);
  persistRooms();
  emit();
}

export function resetMeetingRooms() {
  rooms = structuredClone(midPlatformMeetingRooms).map(normalizeMeetingRoom);
  clearPersisted(STORAGE_KEY);
  emit();
}

export function subscribeMeetingRooms(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMeetingRoomStore(): [
  MidPlatformMeetingRoom[],
  {
    setMeetingRooms: typeof setMeetingRooms;
    upsertMeetingRoom: typeof upsertMeetingRoom;
    removeMeetingRoom: typeof removeMeetingRoom;
    resetMeetingRooms: typeof resetMeetingRooms;
  },
] {
  const data = useSyncExternalStore(subscribeMeetingRooms, getMeetingRooms, getMeetingRooms);
  return [
    data,
    { setMeetingRooms, upsertMeetingRoom, removeMeetingRoom, resetMeetingRooms },
  ];
}
