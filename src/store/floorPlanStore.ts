import { useSyncExternalStore } from 'react';
import type { FloorPlanImageConfig, FloorPlanPoint } from '../types/floorPlan';

interface FloorPlanState {
  images: Record<string, FloorPlanImageConfig>;
  points: FloorPlanPoint[];
}

let state: FloorPlanState = {
  images: {},
  points: [],
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function getState(): FloorPlanState {
  return state;
}

export function getFloorPlanImage(floorId: string): FloorPlanImageConfig | undefined {
  return state.images[floorId];
}

export function setFloorPlanImage(config: FloorPlanImageConfig) {
  state = {
    ...state,
    images: { ...state.images, [config.floorId]: config },
  };
  emit();
}

export function batchSetFloorPlanImages(configs: FloorPlanImageConfig[]) {
  if (configs.length === 0) return;
  const next = { ...state.images };
  configs.forEach((c) => {
    next[c.floorId] = c;
  });
  state = { ...state, images: next };
  emit();
}

export function getFloorPlanPoints(floorId: string): FloorPlanPoint[] {
  return state.points.filter((p) => p.floorId === floorId);
}

export function addFloorPlanPoint(point: FloorPlanPoint) {
  state = {
    ...state,
    points: [...state.points.filter((p) => p.deviceId !== point.deviceId || p.floorId !== point.floorId), point],
  };
  emit();
}

export function removeFloorPlanPoint(pointId: string) {
  state = {
    ...state,
    points: state.points.filter((p) => p.id !== pointId),
  };
  emit();
}

export function subscribeFloorPlan(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useFloorPlanStore(): [
  FloorPlanState,
  {
    setFloorPlanImage: typeof setFloorPlanImage;
    batchSetFloorPlanImages: typeof batchSetFloorPlanImages;
    addFloorPlanPoint: typeof addFloorPlanPoint;
    removeFloorPlanPoint: typeof removeFloorPlanPoint;
  },
] {
  const data = useSyncExternalStore(subscribeFloorPlan, getState, getState);
  return [
    data,
    { setFloorPlanImage, batchSetFloorPlanImages, addFloorPlanPoint, removeFloorPlanPoint },
  ];
}
