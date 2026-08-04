import { useSyncExternalStore } from 'react';
import type { AccessControlGroup } from '../types/accessControl';
import { mockAccessControlGroups } from '../data/mockAccessControl';

let groups: AccessControlGroup[] = structuredClone(mockAccessControlGroups);

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getAccessControlGroups(): AccessControlGroup[] {
  return groups;
}

export function setAccessControlGroups(
  next: AccessControlGroup[] | ((prev: AccessControlGroup[]) => AccessControlGroup[]),
) {
  groups = typeof next === 'function' ? next(groups) : next;
  emit();
}

export function subscribeAccessControl(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAccessControlStore(): [
  AccessControlGroup[],
  { setAccessControlGroups: typeof setAccessControlGroups },
] {
  const data = useSyncExternalStore(subscribeAccessControl, getAccessControlGroups, getAccessControlGroups);
  return [data, { setAccessControlGroups }];
}
