import { useSyncExternalStore } from 'react';
import type { EventPushConfig, NotificationConfig } from '../types/security';
import {
  mockEventPushConfigs,
  mockNotificationConfigs,
} from '../data/mockSecurity';

interface SecurityState {
  eventPushConfigs: EventPushConfig[];
  notificationConfigs: NotificationConfig[];
}

let state: SecurityState = {
  eventPushConfigs: structuredClone(mockEventPushConfigs),
  notificationConfigs: structuredClone(mockNotificationConfigs),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function getState(): SecurityState {
  return state;
}

export function getEventPushConfigs(): EventPushConfig[] {
  return state.eventPushConfigs;
}

export function setEventPushConfigs(
  next: EventPushConfig[] | ((prev: EventPushConfig[]) => EventPushConfig[]),
) {
  state = {
    ...state,
    eventPushConfigs:
      typeof next === 'function' ? next(state.eventPushConfigs) : next,
  };
  emit();
}

export function getNotificationConfigs(): NotificationConfig[] {
  return state.notificationConfigs;
}

export function setNotificationConfigs(
  next:
    | NotificationConfig[]
    | ((prev: NotificationConfig[]) => NotificationConfig[]),
) {
  state = {
    ...state,
    notificationConfigs:
      typeof next === 'function' ? next(state.notificationConfigs) : next,
  };
  emit();
}

export function subscribeSecurity(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSecurityStore(): [
  SecurityState,
  {
    setEventPushConfigs: typeof setEventPushConfigs;
    setNotificationConfigs: typeof setNotificationConfigs;
  },
] {
  const data = useSyncExternalStore(subscribeSecurity, getState, getState);
  return [data, { setEventPushConfigs, setNotificationConfigs }];
}
