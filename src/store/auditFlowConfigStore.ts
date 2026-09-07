import { useSyncExternalStore } from 'react';
import type { AuditFlowCondition, AuditFlowConfig } from '../types/auditFlowConfig';
import { auditFlowConfigs } from '../data/mockAuditFlowConfig';
import { normalizeStoredApproverSteps } from '../utils/auditFlowApproverSteps';
import {
  buildAuditFlowDefaultName,
  normalizeAuditFlowCondition,
} from '../utils/auditFlowMatcher';
import { loadPersisted, savePersisted } from '../utils/persistStore';

const STORAGE_KEY = 'sw.audit-flow-configs-v2';

type LegacyAuditFlowConfig = Omit<AuditFlowConfig, 'conditions'> & {
  priority?: number;
  conditionType?: string;
  matchValue?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  conditions?: Array<AuditFlowCondition & { value?: string; type?: string }>;
};

function normalizeConditions(raw: LegacyAuditFlowConfig['conditions']): AuditFlowCondition[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeAuditFlowCondition(item)).filter((c) => c.values.length > 0);
}

function normalizeAuditFlowConfig(raw: LegacyAuditFlowConfig): AuditFlowConfig {
  let conditions = normalizeConditions(raw.conditions);

  if (conditions.length === 0 && raw.conditionType === '公司' && raw.matchValue) {
    conditions = [{ type: 'org', orgScope: 'company', values: [raw.matchValue] }];
  }

  const isDefault = raw.isDefault ?? false;
  const processType = raw.processType ?? '会议室预约';

  return {
    id: raw.id,
    name:
      raw.name?.trim() ||
      buildAuditFlowDefaultName(processType, conditions, isDefault),
    processType,
    conditions,
    matchType: raw.matchType ?? '精确匹配',
    isDefault,
    approveMode: 'manual',
    enabled: raw.enabled !== false,
    selfApplyAutoPass: raw.selfApplyAutoPass ?? false,
    approverSteps: normalizeStoredApproverSteps(raw.approverSteps),
  };
}

let configs: AuditFlowConfig[] = loadPersisted(STORAGE_KEY, structuredClone(auditFlowConfigs)).map(
  normalizeAuditFlowConfig,
);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persistConfigs() {
  savePersisted(STORAGE_KEY, configs);
}

export function getAuditFlowConfigs(): AuditFlowConfig[] {
  return configs;
}

export function setAuditFlowConfigs(next: AuditFlowConfig[]) {
  configs = next.map(normalizeAuditFlowConfig);
  persistConfigs();
  emit();
}

export function subscribeAuditFlowConfigs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuditFlowConfigs(): AuditFlowConfig[] {
  return useSyncExternalStore(subscribeAuditFlowConfigs, getAuditFlowConfigs, getAuditFlowConfigs);
}
