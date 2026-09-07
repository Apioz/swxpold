import { useSyncExternalStore } from 'react';
import type { AuditFlowCondition, LegacyAuditFlowCondition } from '../types/auditFlowConfig';
import type { ReservationLimitConfig, ReservationLimitParams } from '../types/reservationLimitConfig';
import { reservationLimitConfigs } from '../data/mockReservationLimitConfig';
import { normalizeAuditFlowCondition } from '../utils/auditFlowMatcher';
import { normalizeStoredApproverSteps } from '../utils/auditFlowApproverSteps';
import { loadPersisted, savePersisted } from '../utils/persistStore';

const STORAGE_KEY = 'sw.reservation-limit-configs-v1';

type LegacyCondition = AuditFlowCondition | LegacyAuditFlowCondition;

function normalizeConditions(raw: LegacyCondition[] | undefined): AuditFlowCondition[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeAuditFlowCondition(item)).filter((c) => c.values.length > 0);
}

function normalizeLimits(raw: ReservationLimitParams | undefined): ReservationLimitParams {
  if (!raw) return {};
  const {
    maxWeeklyCompanySameRoomCount: _deprecatedWeekly,
    maxConsecutiveDaysCompanySameRoom: _deprecatedConsecutive,
    ...limits
  } = raw as ReservationLimitParams & {
    maxWeeklyCompanySameRoomCount?: number;
    maxConsecutiveDaysCompanySameRoom?: number;
  };
  return limits;
}

function normalizeReservationLimitConfig(raw: ReservationLimitConfig): ReservationLimitConfig {
  return {
    ...raw,
    name: raw.name?.trim() || '未命名占用限制',
    conditions: normalizeConditions(raw.conditions as LegacyCondition[]),
    limits: normalizeLimits(raw.limits),
    violationAction: raw.violationAction ?? 'reject',
    approverSteps:
      raw.violationAction === 'requireApproval'
        ? normalizeStoredApproverSteps(raw.approverSteps)
        : [],
  };
}

let configs: ReservationLimitConfig[] = loadPersisted(
  STORAGE_KEY,
  structuredClone(reservationLimitConfigs),
).map(normalizeReservationLimitConfig);

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getReservationLimitConfigs(): ReservationLimitConfig[] {
  return configs;
}

export function setReservationLimitConfigs(next: ReservationLimitConfig[]) {
  configs = next.map(normalizeReservationLimitConfig);
  savePersisted(STORAGE_KEY, configs);
  emitChange();
}

export function subscribeReservationLimitConfigs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReservationLimitConfigs(): ReservationLimitConfig[] {
  return useSyncExternalStore(
    subscribeReservationLimitConfigs,
    getReservationLimitConfigs,
    getReservationLimitConfigs,
  );
}
