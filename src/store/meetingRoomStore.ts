import { useSyncExternalStore } from 'react';
import type { MidPlatformMeetingRoom } from '../types/midPlatformMeetingRoom';
import { midPlatformMeetingRooms } from '../data/mockMidPlatformMeetingRooms';
import { clearPersisted, loadPersisted, savePersisted } from '../utils/persistStore';

const STORAGE_KEY = 'sw.meeting-rooms';

let rooms: MidPlatformMeetingRoom[] = loadPersisted(
  STORAGE_KEY,
  structuredClone(midPlatformMeetingRooms),
);
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
  const index = rooms.findIndex((item) => item.id === room.id);
  if (index >= 0) {
    rooms = rooms.map((item, i) => (i === index ? room : item));
  } else {
    rooms = [...rooms, room];
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
  rooms = structuredClone(midPlatformMeetingRooms);
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
