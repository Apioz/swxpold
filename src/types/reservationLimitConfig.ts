import type {
  AuditFlowApproverStep,
  AuditFlowCondition,
  AuditFlowMatchType,
} from './auditFlowConfig';

/** 预约占用管控参数（空/0 表示不限制） */
export interface ReservationLimitParams {
  /** 单次预约最长时长（分钟），防单条霸占全天 */
  maxDurationMinutes?: number;
  /** 同一用户单日预约总次数 */
  maxDailyBookingCount?: number;
  /** 同一用户单日对同一会议室预约次数 */
  maxDailySameRoomCount?: number;
  /** 同一用户近 7 天对同一会议室预约次数 */
  maxWeeklySameRoomCount?: number;
  /** 同一用户近 7 天对同一会议室占用总时长（分钟） */
  maxWeeklySameRoomDurationMinutes?: number;
  /** 同一用户近 7 天对所有会议室占用总时长（分钟） */
  maxWeeklyTotalDurationMinutes?: number;
  /** 同一用户连续 N 天预约同一会议室（防连续霸占） */
  maxConsecutiveDaysSameRoom?: number;
  /** @deprecated 已替换为 maxWeeklySameRoomDurationMinutes */
  maxWeeklyCompanySameRoomCount?: number;
  /** 同一时段可并发占用会议室数量（防一人多间） */
  maxConcurrentRooms?: number;
}

/** 超限处置：直接拒绝 / 触发多级审批 */
export type ReservationLimitViolationAction = 'reject' | 'requireApproval';

export interface ReservationLimitConfig {
  id: string;
  /** 规则名称，用于预约单追溯 */
  name: string;
  /** 组合条件（且关系）：会议室 + 适用企业等 */
  conditions: AuditFlowCondition[];
  matchType: AuditFlowMatchType;
  isDefault: boolean;
  enabled: boolean;
  limits: ReservationLimitParams;
  /** 超限时的处置方式 */
  violationAction: ReservationLimitViolationAction;
  /** 超限时需走的多级审批节点（violationAction=requireApproval 时生效） */
  approverSteps: AuditFlowApproverStep[];
}
