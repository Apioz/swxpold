import { getMeetingRooms } from '../store/meetingRoomStore';
import type {
  AuditFlowDynamicScope,
  AuditFlowOrgScope,
  OrgAdminResolveLevel,
} from '../types/auditFlowConfig';
import { mockPersonnel } from './mockPersonnel';

type OptionItem = { label: string; value: string };

export const ORG_SCOPE_OPTIONS: { label: string; value: AuditFlowOrgScope }[] = [
  { label: '公司', value: 'company' },
  { label: '园区', value: 'park' },
  { label: '部门', value: 'department' },
  { label: '人员', value: 'person' },
];

export const PARK_OPTIONS: OptionItem[] = [
  { label: '生物芯片园区', value: '生物芯片园区' },
  { label: '海林能源园区', value: '海林能源园区' },
];

export const COMPANY_OPTIONS: OptionItem[] = [
  { label: 'A公司', value: 'A公司' },
  { label: 'B公司', value: 'B公司' },
  { label: '上海生物芯片有限公司', value: '上海生物芯片有限公司' },
];

export const DEPARTMENT_OPTIONS: OptionItem[] = Array.from(
  new Set(mockPersonnel.map((p) => p.department)),
).map((dept) => ({ label: dept, value: dept }));

export const PERSON_OPTIONS: OptionItem[] = mockPersonnel
  .filter((p) => p.status === '在职')
  .map((p) => ({
    label: `${p.name}（${p.company} · ${p.department}）`,
    value: p.id,
  }));

export const DYNAMIC_SCOPE_OPTIONS: { label: string; value: AuditFlowDynamicScope }[] = [
  { label: '当前组织管理员', value: 'orgAdmin' },
];

export const ORG_ADMIN_SCOPE_LABEL = '当前组织管理员';

/** 各公司管理员（演示用） */
export const COMPANY_ADMIN_MAP: Record<string, string[]> = {
  A公司: ['管理员', '王磊'],
  B公司: ['陈昊'],
  上海生物芯片有限公司: ['黄莹', '管理员'],
};

/** 各园区管理员（演示用） */
export const PARK_ADMIN_MAP: Record<string, string[]> = {
  生物芯片园区: ['白钺', '管理员'],
  海林能源园区: ['林明'],
};

/** 各部门管理员（演示用） */
export const DEPARTMENT_ADMIN_MAP: Record<string, string[]> = {
  研发部: ['王磊'],
  行政部: ['钱七'],
  实验中心: ['赵六'],
  运维部: ['林明'],
};

/** 无法解析审核人时的全局兜底 */
export const GLOBAL_FALLBACK_APPROVERS = ['管理员'];

export interface OrgAdminResolveContext {
  name: string;
  company: string;
  park?: string;
  department?: string;
  isCompanyAdmin?: boolean;
  isParkAdmin?: boolean;
  isDepartmentAdmin?: boolean;
}

export function getCompanyAdmins(company: string): string[] {
  return COMPANY_ADMIN_MAP[company] ?? [...GLOBAL_FALLBACK_APPROVERS];
}

export function getParkAdmins(park: string): string[] {
  return PARK_ADMIN_MAP[park] ?? [...GLOBAL_FALLBACK_APPROVERS];
}

export function getDepartmentAdmins(department: string): string[] {
  return DEPARTMENT_ADMIN_MAP[department] ?? [...GLOBAL_FALLBACK_APPROVERS];
}

export function getDynamicScopeLabel(_scope?: AuditFlowDynamicScope): string {
  return ORG_ADMIN_SCOPE_LABEL;
}

export function normalizeDynamicScope(
  scope?: AuditFlowDynamicScope | OrgAdminResolveLevel | string,
): AuditFlowDynamicScope | undefined {
  if (!scope) return undefined;
  return 'orgAdmin';
}

export function resolveOrgAdminLevelFromOrgScopes(
  orgScopes: Array<AuditFlowOrgScope | undefined>,
): OrgAdminResolveLevel {
  if (orgScopes.includes('department')) return 'departmentAdmin';
  if (orgScopes.includes('company')) return 'companyAdmin';
  if (orgScopes.includes('park')) return 'parkAdmin';
  return 'companyAdmin';
}

export function resolveOrgAdminsByLevel(
  level: OrgAdminResolveLevel,
  context: OrgAdminResolveContext,
): string[] {
  if (level === 'parkAdmin') return getParkAdmins(context.park ?? '');
  if (level === 'departmentAdmin') return getDepartmentAdmins(context.department ?? '');
  return getCompanyAdmins(context.company);
}

export function resolveOrgAdmins(
  scope: AuditFlowDynamicScope | OrgAdminResolveLevel,
  context: OrgAdminResolveContext,
  orgScopes?: Array<AuditFlowOrgScope | undefined>,
): string[] {
  if (scope === 'orgAdmin') {
    return resolveOrgAdminsByLevel(resolveOrgAdminLevelFromOrgScopes(orgScopes ?? []), context);
  }
  return resolveOrgAdminsByLevel(scope, context);
}

export function isApplicantOrgAdmin(
  level: OrgAdminResolveLevel,
  context: OrgAdminResolveContext,
): boolean {
  if (level === 'companyAdmin') {
    if (context.isCompanyAdmin) return true;
    return getCompanyAdmins(context.company).includes(context.name);
  }
  if (level === 'parkAdmin') {
    if (context.isParkAdmin) return true;
    return getParkAdmins(context.park ?? '').includes(context.name);
  }
  if (level === 'departmentAdmin') {
    if (context.isDepartmentAdmin) return true;
    return getDepartmentAdmins(context.department ?? '').includes(context.name);
  }
  return false;
}

export function getRoomOptions(): OptionItem[] {
  return getMeetingRooms().map((room) => ({
    label: `${room.name}（${room.roomNo}）`,
    value: room.id,
  }));
}

export function getOrgValueOptions(orgScope?: AuditFlowOrgScope): OptionItem[] {
  if (orgScope === 'company') return COMPANY_OPTIONS;
  if (orgScope === 'park') return PARK_OPTIONS;
  if (orgScope === 'department') return DEPARTMENT_OPTIONS;
  if (orgScope === 'person') return PERSON_OPTIONS;
  return [];
}

export function resolveRoomLabel(roomId: string): string {
  const room = getMeetingRooms().find((item) => item.id === roomId);
  if (!room) return roomId;
  return `${room.name}（${room.roomNo}）`;
}

export function resolvePersonLabel(personId: string): string {
  return PERSON_OPTIONS.find((item) => item.value === personId)?.label ?? personId;
}

export function resolveOrgValueLabel(orgScope: AuditFlowOrgScope, value: string): string {
  if (orgScope === 'person') return resolvePersonLabel(value);
  return getOrgValueOptions(orgScope).find((item) => item.value === value)?.label ?? value;
}
