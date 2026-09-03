import { useSyncExternalStore } from 'react';
import type { MeetingRoomFloorPlanRecord } from '../types/midPlatformMeetingRoom';
import type { SelectedFloorPlan } from '../types/foundationDocument';
import { getFoundationFloorPlanUrl } from '../data/foundationDocumentFloorPlans';
import {
  getMeetingRoomFloorKey,
  isSameMeetingRoomFloor,
} from '../utils/meetingRoomFloorContext';
import { clearPersisted, loadPersisted, savePersisted } from '../utils/persistStore';
import { getMeetingRooms, setMeetingRooms } from './meetingRoomStore';

const STORAGE_KEY = 'sw.meeting-room-floor-plans';

const initialFloorPlans: MeetingRoomFloorPlanRecord[] = [
  {
    floorKey: getMeetingRoomFloorKey('综合办公楼2#', '2F'),
    floorPlanId: 'office2-2f',
    building: '综合办公楼2#',
    floor: '2F',
    campus: '生物芯片智慧园区',
    imageId: 'office2-2f-plan',
    imageName: '2F-平面图.png',
    imageUrl: getFoundationFloorPlanUrl('office2-2f'),
    documentPath:
      '生物芯片智慧园区 / 生物芯片-参考图纸 / 综合办公楼2# / 2F / 01-建筑装修 / 2F-平面图.png',
  },
];

let floorPlans: MeetingRoomFloorPlanRecord[] = loadPersisted(
  STORAGE_KEY,
  structuredClone(initialFloorPlans),
);
const listeners = new Set<() => void>();

function persistFloorPlans() {
  savePersisted(STORAGE_KEY, floorPlans);
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getFloorPlans(): MeetingRoomFloorPlanRecord[] {
  return floorPlans;
}

export function getFloorPlan(building: string, floor: string): MeetingRoomFloorPlanRecord | undefined {
  const floorKey = getMeetingRoomFloorKey(building, floor);
  return floorPlans.find((item) => item.floorKey === floorKey);
}

export function getFloorPlanByFloorPlanId(
  floorPlanId: string,
): MeetingRoomFloorPlanRecord | undefined {
  return floorPlans.find((item) => item.floorPlanId === floorPlanId);
}

export function hasFloorPlan(building: string, floor: string): boolean {
  return Boolean(getFloorPlan(building, floor));
}

export function upsertFloorPlanFromSelection(
  selection: SelectedFloorPlan,
): MeetingRoomFloorPlanRecord {
  const record: MeetingRoomFloorPlanRecord = {
    floorKey: getMeetingRoomFloorKey(selection.building, selection.floor),
    floorPlanId: selection.floorPlanId,
    building: selection.building,
    floor: selection.floor,
    campus: selection.campus,
    imageId: selection.imageId,
    imageName: selection.imageName,
    imageUrl: selection.imageUrl,
    documentPath: selection.documentPath,
  };

  const index = floorPlans.findIndex((item) => item.floorKey === record.floorKey);
  if (index >= 0) {
    floorPlans = floorPlans.map((item, i) => (i === index ? record : item));
  } else {
    floorPlans = [...floorPlans, record];
  }
  persistFloorPlans();
  emit();
  return record;
}

function clearPlanPointsForFloor(building: string, floor: string) {
  const nextRooms = getMeetingRooms().map((room) =>
    isSameMeetingRoomFloor(room, building, floor) ? { ...room, planPoint: null } : room,
  );
  setMeetingRooms(nextRooms);
}

export function removeFloorPlan(building: string, floor: string) {
  const floorKey = getMeetingRoomFloorKey(building, floor);
  floorPlans = floorPlans.filter((item) => item.floorKey !== floorKey);
  clearPlanPointsForFloor(building, floor);
  persistFloorPlans();
  emit();
}

export function resetFloorPlans() {
  floorPlans = structuredClone(initialFloorPlans);
  clearPersisted(STORAGE_KEY);
  emit();
}

export function subscribeFloorPlans(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMeetingRoomFloorPlanStore(): [
  MeetingRoomFloorPlanRecord[],
  {
    upsertFloorPlanFromSelection: typeof upsertFloorPlanFromSelection;
    removeFloorPlan: typeof removeFloorPlan;
    resetFloorPlans: typeof resetFloorPlans;
  },
] {
  const data = useSyncExternalStore(subscribeFloorPlans, getFloorPlans, getFloorPlans);
  return [data, { upsertFloorPlanFromSelection, removeFloorPlan, resetFloorPlans }];
}
