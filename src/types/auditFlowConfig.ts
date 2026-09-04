export type AuditFlowProcessType = '访问预约' | '会议室预约';

/** 条件大类：组织架构 / 会议室 */
export type AuditFlowConditionKind = 'org' | 'room';

/** 组织架构层级：公司 / 园区 / 部门 / 人员 */
export type AuditFlowOrgScope = 'company' | 'park' | 'department' | 'person';

export type AuditFlowMatchType = '精确匹配' | '模糊匹配';

export type AuditFlowApproveMode = 'manual' | 'auto';

export type AuditFlowOrgLevel = '集团' | '园区' | '公司' | '部门';

export type AuditFlowSignType = '会签' | '或签';

export type AuditFlowApproverType = '指定人员' | '动态人员';

/** 动态审核人：当前组织管理员（具体层级由匹配条件推断） */
export type AuditFlowDynamicScope = 'orgAdmin';

/** 内部解析层级，不暴露给配置 UI */
export type OrgAdminResolveLevel = 'companyAdmin' | 'parkAdmin' | 'departmentAdmin';

export interface AuditFlowCondition {
  type: AuditFlowConditionKind;
  /** 组织架构条件下必填 */
  orgScope?: AuditFlowOrgScope;
  /** 匹配值（多选） */
  values: string[];
}

export interface AuditFlowApproverStep {
  orgLevel: AuditFlowOrgLevel;
  orgName: string;
  signType: AuditFlowSignType;
  approverType: AuditFlowApproverType;
  approverNames: string[];
  /** 动态人员时：按组织层级解析管理员（公司 / 园区 / 部门） */
  dynamicScope?: AuditFlowDynamicScope;
}

export interface AuditFlowConfig {
  id: string;
  /** 规则名称，用于预约单追溯展示 */
  name: string;
  processType: AuditFlowProcessType;
  /** 组合条件（且关系），默认流程可为空 */
  conditions: AuditFlowCondition[];
  matchType: AuditFlowMatchType;
  isDefault: boolean;
  /** 人工审批 / 自动审批（当前组织管理员角色自动通过） */
  approveMode: AuditFlowApproveMode;
  /** 是否启用 */
  enabled: boolean;
  /**
   * 申请人为所属公司管理员时，跳过本规则审批（常用于公司+会议室组合规则）
   */
  selfApplyAutoPass?: boolean;
  /**
   * 可与其它命中规则叠加审批（如会议室固定审批人，不管申请人是谁都需审批）
   */
  stackable?: boolean;
  approverSteps: AuditFlowApproverStep[];
}

/** @deprecated 旧版单值条件，仅用于迁移 */
export interface LegacyAuditFlowCondition {
  type: 'company' | 'room' | 'org';
  orgScope?: AuditFlowOrgScope;
  value?: string;
  values?: string[];
}
