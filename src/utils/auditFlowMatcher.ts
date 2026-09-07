import type {
  AuditFlowApproverStep,
  AuditFlowCondition,
  AuditFlowConfig,
  AuditFlowMatchType,
  AuditFlowOrgScope,
  AuditFlowProcessType,
  LegacyAuditFlowCondition,
  OrgAdminResolveLevel,
} from '../types/auditFlowConfig';
import {
  GLOBAL_FALLBACK_APPROVERS,
  isApplicantOrgAdmin,
  MEETING_ROOM_ADMIN_SCOPE_LABEL,
  ORG_SCOPE_OPTIONS,
  resolveOrgAdminLevelFromOrgScopes,
  resolveOrgAdmins,
  resolveOrgValueLabel,
  resolveRoomLabel,
} from '../data/auditFlowOptions';

export interface AuditFlowApplicantContext {
  userId: string;
  name: string;
  company: string;
  park?: string;
  department?: string;
  isCompanyAdmin?: boolean;
  isParkAdmin?: boolean;
  isDepartmentAdmin?: boolean;
}

export interface AuditFlowMatchContext extends AuditFlowApplicantContext {
  processType: AuditFlowProcessType;
  roomId: string;
  roomName: string;
}

export const CONDITION_KIND_LABELS = {
  org: '组织架构',
  room: '会议室',
} as const;

export function normalizeAuditFlowCondition(
  raw: LegacyAuditFlowCondition | AuditFlowCondition,
): AuditFlowCondition {
  if ('values' in raw && Array.isArray(raw.values)) {
    return {
      type: raw.type === 'room' ? 'room' : 'org',
      orgScope: raw.type === 'org' ? raw.orgScope ?? 'company' : undefined,
      values: raw.values.filter(Boolean),
    };
  }

  const legacy = raw as LegacyAuditFlowCondition;
  if (legacy.type === 'room' && legacy.value) {
    return { type: 'room', values: [legacy.value] };
  }
  if (legacy.type === 'company' && legacy.value) {
    return { type: 'org', orgScope: 'company', values: [legacy.value] };
  }
  return { type: 'org', orgScope: 'company', values: [] };
}

export function formatConditionValue(condition: AuditFlowCondition, value: string): string {
  if (condition.type === 'room') return resolveRoomLabel(value);
  if (condition.type === 'org' && condition.orgScope) {
    return resolveOrgValueLabel(condition.orgScope, value);
  }
  return value;
}

export function formatConditionSummary(condition: AuditFlowCondition): string {
  if (condition.values.length === 0) return '';
  const labels = condition.values.map((v) => formatConditionValue(condition, v)).join('、');
  if (condition.type === 'room') return `会议室 = ${labels}`;
  const scopeLabel =
    ORG_SCOPE_OPTIONS.find((item) => item.value === condition.orgScope)?.label ?? '组织';
  return `${scopeLabel} = ${labels}`;
}

export function formatConditionsSummary(conditions: AuditFlowCondition[]): string {
  if (conditions.length === 0) return '';
  return conditions.map(formatConditionSummary).join('；');
}

export function buildAuditFlowDefaultName(
  processType: AuditFlowProcessType,
  conditions: AuditFlowCondition[],
  isDefault: boolean,
): string {
  if (isDefault) return `${processType}默认流程`;
  const summary = formatConditionsSummary(conditions);
  return summary ? `${processType} · ${summary}` : processType;
}

export function getAuditFlowDisplayName(flow: AuditFlowConfig): string {
  return flow.name?.trim() || buildAuditFlowDefaultName(flow.processType, flow.conditions, flow.isDefault);
}

export function isRoomOnlyRule(flow: AuditFlowConfig): boolean {
  return flow.conditions.length === 1 && flow.conditions[0].type === 'room';
}

export function hasOrgAndRoomRule(flow: AuditFlowConfig): boolean {
  const hasOrg = flow.conditions.some((c) => c.type === 'org');
  const hasRoom = flow.conditions.some((c) => c.type === 'room');
  return hasOrg && hasRoom;
}

export function extractRoomIdsFromConditions(conditions: AuditFlowCondition[]): string[] {
  return conditions.filter((c) => c.type === 'room').flatMap((c) => c.values);
}

/** 规则形态：组织+会议室专属 / 仅会议室 / 其它 */
export function getAuditRuleShape(conditions: AuditFlowCondition[]): 'orgRoom' | 'roomOnly' | 'other' {
  if (conditions.length === 0) return 'other';
  const hasOrg = conditions.some((c) => c.type === 'org');
  const hasRoom = conditions.some((c) => c.type === 'room');
  if (hasOrg && hasRoom) return 'orgRoom';
  if (hasRoom && !hasOrg) return 'roomOnly';
  return 'other';
}

/** 匹配排序权重（内部使用，组织+会议室 > 仅会议室 > 仅组织 > 默认） */
export function computeAuditFlowPriority(
  conditions: AuditFlowCondition[],
  isDefault: boolean,
): number {
  if (isDefault && conditions.length === 0) return 0;

  const hasOrg = conditions.some((c) => c.type === 'org');
  const hasRoom = conditions.some((c) => c.type === 'room');

  if (hasOrg && hasRoom) return 30;
  if (hasRoom) return 20;
  if (hasOrg) return 10;
  return 0;
}

export function getAuditFlowMatchWeight(flow: AuditFlowConfig): number {
  return computeAuditFlowPriority(flow.conditions, flow.isDefault);
}

function compareAuditFlowByMatchWeight(a: AuditFlowConfig, b: AuditFlowConfig): number {
  return getAuditFlowMatchWeight(b) - getAuditFlowMatchWeight(a);
}

export function normalizeConditionsKey(conditions: AuditFlowCondition[]): string {
  const normalized = conditions.map((c) => ({
    type: c.type,
    orgScope: c.orgScope ?? '',
    values: [...c.values].sort(),
  }));
  normalized.sort((a, b) => {
    const ak = `${a.type}:${a.orgScope}`;
    const bk = `${b.type}:${b.orgScope}`;
    return ak.localeCompare(bk);
  });
  return normalized.map((c) => `${c.type}:${c.orgScope}:${c.values.join(',')}`).join('|');
}

export function findDuplicateAuditFlow(
  flows: AuditFlowConfig[],
  candidate: {
    id?: string;
    processType: AuditFlowProcessType;
    conditions: AuditFlowCondition[];
    isDefault: boolean;
  },
): AuditFlowConfig | undefined {
  if (candidate.isDefault || candidate.conditions.length === 0) return undefined;

  const key = normalizeConditionsKey(candidate.conditions);
  return flows.find(
    (flow) =>
      flow.id !== candidate.id &&
      flow.processType === candidate.processType &&
      !flow.isDefault &&
      normalizeConditionsKey(flow.conditions) === key,
  );
}

function matchValueInList(
  target: string,
  values: string[],
  matchType: AuditFlowMatchType,
): boolean {
  if (values.length === 0) return false;
  return values.some((value) => {
    if (matchType === '模糊匹配') return target.includes(value);
    return target === value;
  });
}

function matchSingleCondition(
  condition: AuditFlowCondition,
  context: AuditFlowMatchContext,
  matchType: AuditFlowMatchType,
): boolean {
  if (condition.type === 'room') {
    return (
      matchValueInList(context.roomId, condition.values, matchType) ||
      matchValueInList(context.roomName, condition.values, matchType)
    );
  }

  if (condition.type === 'org') {
    switch (condition.orgScope) {
      case 'company':
        return matchValueInList(context.company, condition.values, matchType);
      case 'park':
        return matchValueInList(context.park ?? '', condition.values, matchType);
      case 'department':
        return matchValueInList(context.department ?? '', condition.values, matchType);
      case 'person':
        return (
          matchValueInList(context.userId, condition.values, matchType) ||
          matchValueInList(context.name, condition.values, matchType)
        );
      default:
        return false;
    }
  }

  return false;
}

export function matchAuditFlowConditions(
  conditions: AuditFlowCondition[],
  context: AuditFlowMatchContext,
  matchType: AuditFlowMatchType,
): boolean {
  if (conditions.length === 0) return false;
  return conditions.every((c) => matchSingleCondition(c, context, matchType));
}

export function resolveAllMatchingAuditFlows(
  flows: AuditFlowConfig[],
  context: AuditFlowMatchContext,
): AuditFlowConfig[] {
  return flows
    .filter(
      (flow) =>
        flow.processType === context.processType &&
        flow.enabled &&
        !flow.isDefault &&
        matchAuditFlowConditions(flow.conditions, context, flow.matchType),
    )
    .sort(compareAuditFlowByMatchWeight);
}

export function resolveAuditFlow(
  flows: AuditFlowConfig[],
  context: AuditFlowMatchContext,
): AuditFlowConfig | undefined {
  const matched = resolveAllMatchingAuditFlows(flows, context);
  if (matched.length > 0) return matched[0];

  return flows.find(
    (flow) => flow.processType === context.processType && flow.enabled && flow.isDefault,
  );
}

export interface AuditApprovalStep {
  flow: AuditFlowConfig;
  approverNames: string[];
  skipped: boolean;
  /** 当前组织管理员角色已自动审批 */
  autoApproved?: boolean;
}

export interface AuditResolutionPlan {
  matchedFlows: AuditFlowConfig[];
  steps: AuditApprovalStep[];
  displayName: string;
  approveMode: 'auto' | 'manual';
  /** 最终待审批人（去重，保证人工审批时不为空） */
  approverNames: string[];
  /** 自动审批时的组织管理员层级说明 */
  approverScopeLabel?: string;
}

function getFlowOrgScopes(flow: AuditFlowConfig): Array<AuditFlowOrgScope | undefined> {
  return flow.conditions.filter((c) => c.type === 'org').map((c) => c.orgScope);
}

/** 根据规则条件推断组织管理员解析层级（部门 > 公司 > 园区，默认公司） */
export function resolveOrgAdminLevelFromConditions(
  conditions: AuditFlowCondition[],
): OrgAdminResolveLevel {
  const orgScopes = conditions
    .filter((c) => c.type === 'org')
    .map((c) => c.orgScope);
  return resolveOrgAdminLevelFromOrgScopes(orgScopes);
}

/** @deprecated 保留别名，供旧引用迁移 */
export const inferDynamicScopeFromConditions = resolveOrgAdminLevelFromConditions;

function resolveSingleStepApprovers(
  step: AuditFlowApproverStep,
  flow: AuditFlowConfig,
  context: AuditFlowMatchContext,
): string[] {
  if (step.approverType === '指定人员') {
    return (step.approverNames ?? []).filter(Boolean);
  }
  return resolveOrgAdmins(
    step.dynamicScope ?? 'orgAdmin',
    context,
    getFlowOrgScopes(flow),
  );
}

function resolveStepApproversRaw(
  flow: AuditFlowConfig,
  context: AuditFlowMatchContext,
): string[] {
  if (!flow.approverSteps.length) return [];

  return uniqueApprovers(
    flow.approverSteps.flatMap((step) => resolveSingleStepApprovers(step, flow, context)),
  );
}

function uniqueApprovers(names: string[]): string[] {
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))];
}

function ensureApprovers(
  names: string[],
  context: AuditFlowMatchContext,
  defaultFlow?: AuditFlowConfig,
): string[] {
  const unique = uniqueApprovers(names);
  if (unique.length > 0) return unique;

  if (defaultFlow) {
    const fromDefault = resolveStepApproversRaw(defaultFlow, context);
    if (fromDefault.length > 0) return fromDefault;
  }

  return [...GLOBAL_FALLBACK_APPROVERS];
}

function collectActiveApprovers(steps: AuditApprovalStep[]): string[] {
  return uniqueApprovers(
    steps.filter((s) => !s.skipped).flatMap((s) => s.approverNames),
  );
}

function buildManualPlanWithApprovers(
  steps: AuditApprovalStep[],
  displayName: string,
  approverNames: string[],
): AuditResolutionPlan {
  return {
    matchedFlows: steps.map((s) => s.flow),
    steps,
    displayName,
    approveMode: 'manual',
    approverNames,
  };
}

function buildFallbackManualPlan(
  defaultFlow: AuditFlowConfig | undefined,
  context: AuditFlowMatchContext,
  labelSuffix = '（兜底）',
): AuditResolutionPlan {
  const fallbackFlow =
    defaultFlow ??
    ({
      id: 'afc-fallback',
      name: '系统兜底审批',
      processType: context.processType,
      conditions: [],
      matchType: '精确匹配',
      isDefault: true,
      approveMode: 'manual',
      enabled: true,
      approverSteps: [
        {
          orgLevel: '集团',
          orgName: '系统',
          signType: '或签',
          approverType: '指定人员',
          approverNames: [...GLOBAL_FALLBACK_APPROVERS],
        },
      ],
    } satisfies AuditFlowConfig);

  const approverNames = ensureApprovers(
    resolveStepApproversRaw(fallbackFlow, context),
    context,
    fallbackFlow,
  );

  return buildManualPlanWithApprovers(
    [{ flow: fallbackFlow, approverNames, skipped: false }],
    getAuditFlowDisplayName(fallbackFlow) + labelSuffix,
    approverNames,
  );
}


/** 会议室管理员申请自动通过时的审批人记录 */
export function resolveSelfPassApproverNames(
  context: AuditFlowMatchContext,
  flow: AuditFlowConfig,
  selfPass = false,
): string[] {
  const level = resolveOrgAdminLevelFromConditions(flow.conditions);
  const admins = resolveOrgAdmins('orgAdmin', context, getFlowOrgScopes(flow));
  if (selfPass && isApplicantOrgAdmin(level, context)) {
    return uniqueApprovers([context.name, ...admins]);
  }
  return admins.length > 0 ? admins : [...GLOBAL_FALLBACK_APPROVERS];
}

function buildOrgAdminAutoPlan(
  matchedFlows: AuditFlowConfig[],
  context: AuditFlowMatchContext,
  displayName: string,
  sourceFlow: AuditFlowConfig,
  selfPass = false,
): AuditResolutionPlan {
  const approverNames = resolveSelfPassApproverNames(context, sourceFlow, selfPass);
  const stepFlow = matchedFlows[0];
  return {
    matchedFlows,
    steps: stepFlow
      ? [{ flow: stepFlow, approverNames, skipped: false, autoApproved: true }]
      : [],
    displayName,
    approveMode: 'auto',
    approverNames,
    approverScopeLabel: MEETING_ROOM_ADMIN_SCOPE_LABEL,
  };
}

export function resolveAuditApprovalPlan(
  flows: AuditFlowConfig[],
  context: AuditFlowMatchContext,
): AuditResolutionPlan {
  const matched = resolveAllMatchingAuditFlows(flows, context);
  const defaultFlow = flows.find(
    (f) => f.processType === context.processType && f.enabled && f.isDefault,
  );

  if (matched.length === 0) {
    const fallback = defaultFlow;
    if (!fallback) {
      return buildFallbackManualPlan(undefined, context, '');
    }
    const approverNames = ensureApprovers(
      resolveStepApproversRaw(fallback, context),
      context,
      fallback,
    );
    return buildManualPlanWithApprovers(
      [{ flow: fallback, approverNames, skipped: false }],
      getAuditFlowDisplayName(fallback),
      approverNames,
    );
  }

  const roomOnlyRules = matched.filter((f) => isRoomOnlyRule(f));
  const primaryRules = matched.filter((f) => !isRoomOnlyRule(f));
  const primary = primaryRules[0] ?? matched[0];

  const steps: AuditApprovalStep[] = [];
  const usedFlowIds = new Set<string>();

  const addStep = (flow: AuditFlowConfig, skipped: boolean) => {
    if (usedFlowIds.has(flow.id)) return;
    usedFlowIds.add(flow.id);
    if (skipped) {
      steps.push({ flow, approverNames: [], skipped: true });
      return;
    }
    const approverNames = ensureApprovers(
      resolveStepApproversRaw(flow, context),
      context,
      defaultFlow,
    );
    steps.push({
      flow,
      approverNames,
      skipped: false,
    });
  };

  let primarySkippedForAdmin = false;

  if (primary) {
    const primaryAdminLevel = resolveOrgAdminLevelFromConditions(primary.conditions);
    primarySkippedForAdmin = Boolean(
      primary.selfApplyAutoPass &&
        isApplicantOrgAdmin(primaryAdminLevel, context) &&
        hasOrgAndRoomRule(primary),
    );

    addStep(primary, primarySkippedForAdmin);
  }

  roomOnlyRules.forEach((rule) => {
    if (rule.id === primary?.id) return;

    // 组织+会议室专属规则且管理员申请已自动通过时，不再叠加同会议室的固定审批人规则
    if (primarySkippedForAdmin && primary && isRoomOnlyRule(rule)) {
      const primaryRooms = extractRoomIdsFromConditions(primary.conditions);
      const stackRooms = extractRoomIdsFromConditions(rule.conditions);
      const sameExclusiveRoom =
        primaryRooms.includes(context.roomId) && stackRooms.includes(context.roomId);
      if (sameExclusiveRoom) return;
    }

    addStep(rule, false);
  });

  const manualSteps = steps.filter((s) => !s.autoApproved && !s.skipped);
  const autoSteps = steps.filter((s) => s.autoApproved);
  const involvedFlows = steps.map((s) => s.flow);
  const displayName =
    involvedFlows.map(getAuditFlowDisplayName).join(' + ') || '未命名规则';

  if (manualSteps.length === 0 && (autoSteps.length > 0 || primarySkippedForAdmin)) {
    const sourceFlow = primary ?? autoSteps[0]?.flow ?? involvedFlows[0];
    return buildOrgAdminAutoPlan(
      involvedFlows,
      context,
      displayName,
      sourceFlow,
      primarySkippedForAdmin,
    );
  }

  const activeApprovers = collectActiveApprovers(manualSteps);

  if (activeApprovers.length > 0) {
    return buildManualPlanWithApprovers(steps, displayName, activeApprovers);
  }

  return buildFallbackManualPlan(defaultFlow, context);
}
