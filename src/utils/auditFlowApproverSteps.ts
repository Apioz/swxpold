import type { AuditFlowApproverStep } from '../types/auditFlowConfig';
import { normalizeDynamicScope } from '../data/auditFlowOptions';

export const MAX_APPROVER_STEPS = 5;

export const DEFAULT_APPROVER_STEP: AuditFlowApproverStep = {
  orgLevel: '集团',
  orgName: '生物芯片上海国家工程研究中心',
  signType: '或签',
  approverType: '指定人员',
  approverNames: [],
};

export function createDefaultApproverStep(): AuditFlowApproverStep {
  return { ...DEFAULT_APPROVER_STEP, approverNames: [] };
}

export function createDynamicApproverStep(
  dynamicScope: AuditFlowApproverStep['dynamicScope'] = 'orgAdmin',
): AuditFlowApproverStep {
  return {
    orgLevel: '公司',
    orgName: '按匹配条件组织层级',
    signType: '或签',
    approverType: '动态人员',
    dynamicScope: normalizeDynamicScope(dynamicScope),
    approverNames: [],
  };
}

function stepSignature(step: AuditFlowApproverStep): string {
  return JSON.stringify({
    orgLevel: step.orgLevel,
    orgName: step.orgName,
    signType: step.signType,
    approverType: step.approverType,
    dynamicScope: step.dynamicScope,
    approverNames: [...(step.approverNames ?? [])].sort(),
  });
}

function normalizeStep(step: AuditFlowApproverStep): AuditFlowApproverStep {
  const approverType = step.approverType ?? '指定人员';
  return {
    orgLevel: step.orgLevel ?? '集团',
    orgName: step.orgName ?? '',
    signType: step.signType ?? '或签',
    approverType,
    approverNames: approverType === '指定人员' ? (step.approverNames ?? []).filter(Boolean) : [],
    dynamicScope: approverType === '动态人员' ? normalizeDynamicScope(step.dynamicScope) : undefined,
  };
}

/** 校验审核人步骤配置，返回错误文案；通过则返回 null */
export function validateApproverSteps(steps: AuditFlowApproverStep[] | undefined): string | null {
  if (!steps || steps.length === 0) {
    return '请至少配置一组审核人';
  }

  if (steps.length > MAX_APPROVER_STEPS) {
    return `同一规则最多配置 ${MAX_APPROVER_STEPS} 组审核人`;
  }

  const dynamicScopes = steps
    .filter((s) => s.approverType === '动态人员')
    .map((s) => normalizeDynamicScope(s.dynamicScope));
  if (dynamicScopes.length !== new Set(dynamicScopes).size) {
    return '同一规则中存在重复的动态审批角色，请合并或删除重复组';
  }

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    if (step.approverType === '指定人员') {
      const names = (step.approverNames ?? []).filter(Boolean);
      if (names.length === 0) {
        return `第 ${i + 1} 组审核人须指定至少一名人员`;
      }
    }
  }

  const signatures = steps.map(stepSignature);
  if (new Set(signatures).size !== signatures.length) {
    return '存在完全相同的审核人配置，请合并或删除重复组';
  }

  return null;
}

export function normalizeFormApproverSteps(raw: unknown): AuditFlowApproverStep[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [createDefaultApproverStep()];
  }

  return raw.map((item) => normalizeStep(item as AuditFlowApproverStep));
}

export function normalizeStoredApproverSteps(steps: AuditFlowApproverStep[] | undefined): AuditFlowApproverStep[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return [createDefaultApproverStep()];
  }
  return steps.map(normalizeStep);
}
