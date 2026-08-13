import { useSyncExternalStore } from 'react';
import type { AccessControlGroup, AccessControlPoint } from '../types/accessControl';
import { mockAccessControlGroups, mockAccessControlPoints } from '../data/mockAccessControl';

let groups: AccessControlGroup[] = structuredClone(mockAccessControlGroups);
let points: AccessControlPoint[] = structuredClone(mockAccessControlPoints);

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getAccessControlGroups(): AccessControlGroup[] {
  return groups;
}

export function getAccessControlPoints(): AccessControlPoint[] {
  return points;
}

export function setAccessControlGroups(
  next: AccessControlGroup[] | ((prev: AccessControlGroup[]) => AccessControlGroup[]),
) {
  groups = typeof next === 'function' ? next(groups) : next;
  emit();
}

export function setAccessControlPoints(
  next: AccessControlPoint[] | ((prev: AccessControlPoint[]) => AccessControlPoint[]),
) {
  points = typeof next === 'function' ? next(points) : next;
  emit();
}

export function subscribeAccessControl(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAccessControlStore(): [
  AccessControlGroup[],
  AccessControlPoint[],
  {
    setAccessControlGroups: typeof setAccessControlGroups;
    setAccessControlPoints: typeof setAccessControlPoints;
  },
] {
  const groupsData = useSyncExternalStore(
    subscribeAccessControl,
    getAccessControlGroups,
    getAccessControlGroups,
  );
  const pointsData = useSyncExternalStore(
    subscribeAccessControl,
    getAccessControlPoints,
    getAccessControlPoints,
  );
  return [groupsData, pointsData, { setAccessControlGroups, setAccessControlPoints }];
}
