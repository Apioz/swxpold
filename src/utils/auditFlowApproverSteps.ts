import type {
  AuditFlowApproverStep,
  AuditFlowApproveMode,
} from '../types/auditFlowConfig';

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

export function createAutoApproverStep(): AuditFlowApproverStep {
  return {
    orgLevel: '公司',
    orgName: '按匹配条件组织层级',
    signType: '或签',
    approverType: '动态人员',
    dynamicScope: 'orgAdmin',
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

/** 校验审核人步骤配置，返回错误文案；通过则返回 null */
export function validateApproverSteps(
  steps: AuditFlowApproverStep[] | undefined,
  approveMode: AuditFlowApproveMode,
): string | null {
  if (approveMode === 'auto') return null;

  if (!steps || steps.length === 0) {
    return '请至少配置一组审核人';
  }

  if (steps.length > MAX_APPROVER_STEPS) {
    return `同一规则最多配置 ${MAX_APPROVER_STEPS} 组审核人`;
  }

  const dynamicCount = steps.filter((s) => s.approverType === '动态人员').length;
  if (dynamicCount > 1) {
    return '同一规则只能配置一组「当前组织管理员」，请勿重复添加';
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

export function normalizeFormApproverSteps(
  raw: unknown,
  approveMode: AuditFlowApproveMode,
): AuditFlowApproverStep[] {
  if (approveMode === 'auto') {
    return [createAutoApproverStep()];
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    return [createDefaultApproverStep()];
  }

  return raw.map((item) => {
    const step = item as AuditFlowApproverStep;
    const approverType = step.approverType ?? '指定人员';
    return {
      orgLevel: step.orgLevel ?? '集团',
      orgName: step.orgName ?? '',
      signType: step.signType ?? '或签',
      approverType,
      approverNames: approverType === '指定人员' ? (step.approverNames ?? []).filter(Boolean) : [],
      dynamicScope: approverType === '动态人员' ? 'orgAdmin' : undefined,
    };
  });
}
