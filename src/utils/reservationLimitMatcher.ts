import dayjs from 'dayjs';
import type { AuditFlowCondition } from '../types/auditFlowConfig';
import type {
  ReservationLimitConfig,
  ReservationLimitParams,
  ReservationLimitViolationAction,
} from '../types/reservationLimitConfig';
import type { MeetingReservation } from '../data/mockMeetingRooms';
import { resolveOrgAdmins } from '../data/auditFlowOptions';
import {
  computeAuditFlowPriority,
  formatConditionsSummary,
  matchAuditFlowConditions,
  normalizeConditionsKey,
  type AuditFlowMatchContext,
} from './auditFlowMatcher';
import type { MeetingTimeSlot } from '../data/meetingRoomSchedule';
import { SLOT_MINUTES } from '../data/meetingRoomSchedule';

export interface ReservationOccurrence {
  date: string;
  startMin: number;
  endMin: number;
  roomId: string;
  userId: string;
  company?: string;
}

export interface ReservationLimitCheckContext {
  userId: string;
  name: string;
  company: string;
  park?: string;
  department?: string;
  roomId: string;
  roomName: string;
  selectedSlots: MeetingTimeSlot[];
  activeDate?: string;
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  recurrenceWeekdays?: number[];
}

export interface ReservationLimitViolation {
  code: keyof ReservationLimitParams;
  message: string;
}

export interface ReservationLimitCheckResult {
  matchedRule?: ReservationLimitConfig;
  violations: ReservationLimitViolation[];
  action: 'pass' | ReservationLimitViolationAction;
  messages: string[];
  limitApproverNames?: string[];
}

export class ReservationLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationLimitError';
  }
}

function compareLimitRuleWeight(a: ReservationLimitConfig, b: ReservationLimitConfig): number {
  return computeAuditFlowPriority(b.conditions, b.isDefault) - computeAuditFlowPriority(a.conditions, a.isDefault);
}

export function getReservationLimitDisplayName(rule: ReservationLimitConfig): string {
  if (rule.name?.trim()) return rule.name.trim();
  const summary = formatConditionsSummary(rule.conditions);
  return summary ? `占用限制 · ${summary}` : '占用限制';
}

export function formatLimitsSummary(limits: ReservationLimitParams): string {
  const parts: string[] = [];
  if (limits.maxDurationMinutes) parts.push(`单次≤${limits.maxDurationMinutes}分钟`);
  if (limits.maxDailyBookingCount) parts.push(`单日≤${limits.maxDailyBookingCount}次`);
  if (limits.maxDailySameRoomCount) parts.push(`同室单日≤${limits.maxDailySameRoomCount}次`);
  if (limits.maxWeeklySameRoomCount) parts.push(`7天同室≤${limits.maxWeeklySameRoomCount}次`);
  if (limits.maxWeeklySameRoomDurationMinutes) {
    parts.push(`7天同室≤${limits.maxWeeklySameRoomDurationMinutes}分钟`);
  }
  if (limits.maxWeeklyTotalDurationMinutes) {
    parts.push(`7天总时长≤${limits.maxWeeklyTotalDurationMinutes}分钟`);
  }
  if (limits.maxConsecutiveDaysSameRoom) parts.push(`连续同室≤${limits.maxConsecutiveDaysSameRoom}天`);
  if (limits.maxConcurrentRooms) parts.push(`同时段≤${limits.maxConcurrentRooms}间`);
  return parts.length > 0 ? parts.join('；') : '—';
}

export function findDuplicateReservationLimitRule(
  rules: ReservationLimitConfig[],
  candidate: {
    id?: string;
    conditions: AuditFlowCondition[];
    isDefault: boolean;
  },
): ReservationLimitConfig | undefined {
  if (candidate.isDefault || candidate.conditions.length === 0) return undefined;
  const key = normalizeConditionsKey(candidate.conditions);
  return rules.find(
    (rule) =>
      rule.id !== candidate.id &&
      !rule.isDefault &&
      normalizeConditionsKey(rule.conditions) === key,
  );
}

export function resolveReservationLimitRule(
  rules: ReservationLimitConfig[],
  context: Pick<AuditFlowMatchContext, 'company' | 'park' | 'department' | 'userId' | 'name' | 'roomId' | 'roomName'>,
): ReservationLimitConfig | undefined {
  const matchCtx: AuditFlowMatchContext = {
    processType: '会议室预约',
    ...context,
  };

  const matched = rules
    .filter(
      (rule) =>
        rule.enabled &&
        !rule.isDefault &&
        matchAuditFlowConditions(rule.conditions, matchCtx, rule.matchType),
    )
    .sort(compareLimitRuleWeight);

  if (matched.length > 0) return matched[0];
  return rules.find((rule) => rule.enabled && rule.isDefault);
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function parseDurationMinutes(duration?: string): number {
  if (!duration) return 60;
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*小时/);
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60);
  const minMatch = duration.match(/(\d+)\s*分钟/);
  if (minMatch) return Number(minMatch[1]);
  return 60;
}

function parseTimeSlotRange(timeSlot?: string): { startMin: number; endMin: number } | undefined {
  if (!timeSlot) return undefined;
  const parts = timeSlot.split(/[-–—]/).map((s) => s.trim());
  if (parts.length < 2) return undefined;
  return {
    startMin: parseTimeToMinutes(parts[0]),
    endMin: parseTimeToMinutes(parts[1]),
  };
}

function normalizeDateKey(raw: string): string {
  return raw.replace(/\./g, '-').slice(0, 10);
}

function isActiveReservation(status: MeetingReservation['status']): boolean {
  return status !== 'cancelled' && status !== 'rejected';
}

function expandRecurringReservation(res: MeetingReservation): ReservationOccurrence[] {
  const start = res.recurrenceStartDate ? normalizeDateKey(res.recurrenceStartDate) : '';
  const end = res.recurrenceEndDate ? normalizeDateKey(res.recurrenceEndDate) : '';
  if (!start || !end) return [];

  const weekdayMap: Record<string, number> = {
    周一: 1, 周二: 2, 周三: 3, 周四: 4, 周五: 5, 周六: 6, 周日: 7,
  };
  const weekdayValues = (res.recurrenceWeekdays ?? '')
    .split(/[、,，]/)
    .map((label) => weekdayMap[label.trim()])
    .filter(Boolean);

  const slotRange = parseTimeSlotRange(res.timeSlot);
  const startMin = slotRange?.startMin ?? 9 * 60;
  const endMin = slotRange?.endMin ?? startMin + 60;
  const excluded = new Set((res.excludedDates ?? []).map(normalizeDateKey));
  const occurrences: ReservationOccurrence[] = [];

  let cursor = dayjs(start);
  const endDay = dayjs(end);
  while (cursor.isBefore(endDay) || cursor.isSame(endDay, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD');
    const weekday = cursor.day() === 0 ? 7 : cursor.day();
    if (weekdayValues.includes(weekday) && !excluded.has(dateKey)) {
      occurrences.push({
        date: dateKey,
        startMin,
        endMin,
        roomId: res.roomId,
        userId: res.applicantId,
        company: res.applicantCompany,
      });
    }
    cursor = cursor.add(1, 'day');
  }

  return occurrences;
}

function expandStandardReservation(res: MeetingReservation): ReservationOccurrence[] {
  const dateMatch = res.time.match(/^(\d{4}[-/.]\d{2}[-/.]\d{2})/);
  if (!dateMatch) return [];

  const date = normalizeDateKey(dateMatch[1]);
  const timePart = res.time.match(/\d{2}:\d{2}/)?.[0] ?? '09:00';
  const startMin = parseTimeToMinutes(timePart);
  const slotRange = parseTimeSlotRange(res.duration);
  const endMin = slotRange ? slotRange.endMin : startMin + parseDurationMinutes(res.duration);

  return [{
    date,
    startMin,
    endMin,
    roomId: res.roomId,
    userId: res.applicantId,
    company: res.applicantCompany,
  }];
}

export function expandReservationOccurrences(res: MeetingReservation): ReservationOccurrence[] {
  if (!isActiveReservation(res.status)) return [];
  if (res.meetingType === 'recurring') return expandRecurringReservation(res);
  return expandStandardReservation(res);
}

export function getAllReservationOccurrences(
  reservations: MeetingReservation[],
): ReservationOccurrence[] {
  return reservations.flatMap(expandReservationOccurrences);
}

function buildProposedOccurrences(context: ReservationLimitCheckContext): ReservationOccurrence[] {
  if (context.selectedSlots.length === 0) return [];

  const sorted = [...context.selectedSlots].sort((a, b) => a.time.localeCompare(b.time));
  const startMin = parseTimeToMinutes(sorted[0].time);
  const endMin = parseTimeToMinutes(sorted[sorted.length - 1].endTime);

  const base: Omit<ReservationOccurrence, 'date'> = {
    startMin,
    endMin,
    roomId: context.roomId,
    userId: context.userId,
    company: context.company,
  };

  if (context.recurrenceStartDate && context.recurrenceEndDate && context.recurrenceWeekdays?.length) {
    const occurrences: ReservationOccurrence[] = [];
    let cursor = dayjs(context.recurrenceStartDate);
    const endDay = dayjs(context.recurrenceEndDate);

    while (cursor.isBefore(endDay) || cursor.isSame(endDay, 'day')) {
      const dateKey = cursor.format('YYYY-MM-DD');
      const weekday = cursor.day() === 0 ? 7 : cursor.day();
      if (context.recurrenceWeekdays.includes(weekday)) {
        occurrences.push({ ...base, date: dateKey });
      }
      cursor = cursor.add(1, 'day');
    }
    return occurrences;
  }

  if (!context.activeDate) return [];
  return [{ ...base, date: normalizeDateKey(context.activeDate) }];
}

function timesOverlap(a: ReservationOccurrence, b: ReservationOccurrence): boolean {
  if (a.date !== b.date) return false;
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

function maxConsecutiveDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let max = 1;
  let streak = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = dayjs(sorted[i - 1]);
    const curr = dayjs(sorted[i]);
    if (curr.diff(prev, 'day') === 1) {
      streak += 1;
      max = Math.max(max, streak);
    } else {
      streak = 1;
    }
  }
  return max;
}

function countInDateWindow(
  occurrences: ReservationOccurrence[],
  endDate: string,
  days: number,
  predicate: (occ: ReservationOccurrence) => boolean,
): number {
  const start = dayjs(endDate).subtract(days - 1, 'day');
  return occurrences.filter((occ) => {
    if (!predicate(occ)) return false;
    const d = dayjs(occ.date);
    return (d.isAfter(start) || d.isSame(start, 'day')) && (d.isBefore(endDate) || d.isSame(endDate, 'day'));
  }).length;
}

function occurrenceDurationMinutes(occ: ReservationOccurrence): number {
  return Math.max(0, occ.endMin - occ.startMin);
}

function sumDurationInDateWindow(
  occurrences: ReservationOccurrence[],
  endDate: string,
  days: number,
  predicate: (occ: ReservationOccurrence) => boolean,
): number {
  const start = dayjs(endDate).subtract(days - 1, 'day');
  return occurrences
    .filter((occ) => {
      if (!predicate(occ)) return false;
      const d = dayjs(occ.date);
      return (d.isAfter(start) || d.isSame(start, 'day')) && (d.isBefore(endDate) || d.isSame(endDate, 'day'));
    })
    .reduce((sum, occ) => sum + occurrenceDurationMinutes(occ), 0);
}

function getLatestDate(dates: string[]): string {
  return [...dates].sort().pop() ?? '';
}

function formatDurationMinutes(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60} 小时（${minutes} 分钟）`;
  }
  return `${minutes} 分钟`;
}

function resolveLimitApprovers(
  rule: ReservationLimitConfig,
  context: AuditFlowMatchContext,
): string[] {
  const orgScopes = rule.conditions.filter((c) => c.type === 'org').map((c) => c.orgScope);
  const names: string[] = [];
  for (const step of rule.approverSteps) {
    if (step.approverType === '指定人员') {
      names.push(...(step.approverNames ?? []).filter(Boolean));
    } else {
      names.push(...resolveOrgAdmins('orgAdmin', context, orgScopes));
    }
  }
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))];
}

function checkLimits(
  rule: ReservationLimitConfig,
  context: ReservationLimitCheckContext,
  proposed: ReservationOccurrence[],
  existing: ReservationOccurrence[],
): ReservationLimitViolation[] {
  const { limits } = rule;
  const violations: ReservationLimitViolation[] = [];
  const allOccurrences = [...existing, ...proposed];
  const durationMinutes = context.selectedSlots.length * SLOT_MINUTES;

  if (limits.maxDurationMinutes && durationMinutes > limits.maxDurationMinutes) {
    violations.push({
      code: 'maxDurationMinutes',
      message: `单次预约时长 ${durationMinutes} 分钟，超过限制 ${limits.maxDurationMinutes} 分钟`,
    });
  }

  for (const occ of proposed) {
    const sameDayUser = allOccurrences.filter(
      (item) => item.userId === context.userId && item.date === occ.date,
    );
    if (limits.maxDailyBookingCount && sameDayUser.length > limits.maxDailyBookingCount) {
      violations.push({
        code: 'maxDailyBookingCount',
        message: `${occ.date} 单日预约已达 ${sameDayUser.length} 次，上限 ${limits.maxDailyBookingCount} 次`,
      });
    }

    const sameDaySameRoom = sameDayUser.filter((item) => item.roomId === context.roomId);
    if (limits.maxDailySameRoomCount && sameDaySameRoom.length > limits.maxDailySameRoomCount) {
      violations.push({
        code: 'maxDailySameRoomCount',
        message: `${occ.date} 对同一会议室预约 ${sameDaySameRoom.length} 次，上限 ${limits.maxDailySameRoomCount} 次`,
      });
    }

    if (limits.maxWeeklySameRoomCount) {
      const weeklyCount = countInDateWindow(
        allOccurrences,
        occ.date,
        7,
        (item) => item.userId === context.userId && item.roomId === context.roomId,
      );
      if (weeklyCount > limits.maxWeeklySameRoomCount) {
        violations.push({
          code: 'maxWeeklySameRoomCount',
          message: `近 7 天对同一会议室预约 ${weeklyCount} 次，上限 ${limits.maxWeeklySameRoomCount} 次`,
        });
      }
    }

    if (limits.maxConcurrentRooms) {
      const concurrentRooms = new Set(
        allOccurrences
          .filter(
            (item) =>
              item.userId === context.userId &&
              item.date === occ.date &&
              timesOverlap(item, occ),
          )
          .map((item) => item.roomId),
      );
      if (concurrentRooms.size > limits.maxConcurrentRooms) {
        violations.push({
          code: 'maxConcurrentRooms',
          message: `同一时段占用 ${concurrentRooms.size} 间会议室，上限 ${limits.maxConcurrentRooms} 间`,
        });
      }
    }
  }

  if (proposed.length > 0) {
    const refDate = getLatestDate(proposed.map((item) => item.date));

    if (limits.maxWeeklySameRoomDurationMinutes) {
      const sameRoomMinutes = sumDurationInDateWindow(
        allOccurrences,
        refDate,
        7,
        (item) => item.userId === context.userId && item.roomId === context.roomId,
      );
      if (sameRoomMinutes > limits.maxWeeklySameRoomDurationMinutes) {
        violations.push({
          code: 'maxWeeklySameRoomDurationMinutes',
          message: `近 7 天对同一会议室占用 ${formatDurationMinutes(sameRoomMinutes)}，上限 ${formatDurationMinutes(limits.maxWeeklySameRoomDurationMinutes)}`,
        });
      }
    }

    if (limits.maxWeeklyTotalDurationMinutes) {
      const totalMinutes = sumDurationInDateWindow(
        allOccurrences,
        refDate,
        7,
        (item) => item.userId === context.userId,
      );
      if (totalMinutes > limits.maxWeeklyTotalDurationMinutes) {
        violations.push({
          code: 'maxWeeklyTotalDurationMinutes',
          message: `近 7 天对所有会议室占用 ${formatDurationMinutes(totalMinutes)}，上限 ${formatDurationMinutes(limits.maxWeeklyTotalDurationMinutes)}`,
        });
      }
    }
  }

  if (limits.maxConsecutiveDaysSameRoom) {
    const userRoomDates = allOccurrences
      .filter((item) => item.userId === context.userId && item.roomId === context.roomId)
      .map((item) => item.date);
    const streak = maxConsecutiveDays(userRoomDates);
    if (streak > limits.maxConsecutiveDaysSameRoom) {
      violations.push({
        code: 'maxConsecutiveDaysSameRoom',
        message: `连续 ${streak} 天预约同一会议室，上限 ${limits.maxConsecutiveDaysSameRoom} 天`,
      });
    }
  }

  const uniqueByCode = new Map<string, ReservationLimitViolation>();
  for (const v of violations) {
    if (!uniqueByCode.has(v.code)) uniqueByCode.set(v.code, v);
  }
  return [...uniqueByCode.values()];
}

export function validateReservationLimits(
  rules: ReservationLimitConfig[],
  context: ReservationLimitCheckContext,
  existingReservations: MeetingReservation[] = [],
): ReservationLimitCheckResult {
  const matchContext: AuditFlowMatchContext = {
    processType: '会议室预约',
    userId: context.userId,
    name: context.name,
    company: context.company,
    park: context.park,
    department: context.department,
    roomId: context.roomId,
    roomName: context.roomName,
  };

  const matchedRule = resolveReservationLimitRule(rules, matchContext);
  if (!matchedRule) {
    return { violations: [], action: 'pass', messages: [] };
  }

  const proposed = buildProposedOccurrences(context);
  const existing = getAllReservationOccurrences(existingReservations);
  const violations = checkLimits(matchedRule, context, proposed, existing);

  if (violations.length === 0) {
    return { matchedRule, violations: [], action: 'pass', messages: [] };
  }

  const messages = violations.map((v) => v.message);
  const action = matchedRule.violationAction;

  if (action === 'requireApproval') {
    const limitApproverNames = resolveLimitApprovers(matchedRule, matchContext);
    return {
      matchedRule,
      violations,
      action,
      messages,
      limitApproverNames,
    };
  }

  return {
    matchedRule,
    violations,
    action: 'reject',
    messages,
  };
}

export function buildReservationLimitDefaultName(
  conditions: AuditFlowCondition[],
  isDefault: boolean,
): string {
  if (isDefault) return '默认占用限制';
  const summary = formatConditionsSummary(conditions);
  return summary ? `占用限制 · ${summary}` : '占用限制';
}
