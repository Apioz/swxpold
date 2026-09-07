import { getAuditFlowConfigs } from '../store/auditFlowConfigStore';
import { getReservationLimitConfigs } from '../store/reservationLimitConfigStore';
import { resolveAuditApprovalPlan } from '../utils/auditFlowMatcher';
import {
  ReservationLimitError,
  getReservationLimitDisplayName,
  validateReservationLimits,
} from '../utils/reservationLimitMatcher';
import type { MeetingAuditItem, MeetingReservation } from './mockMeetingRooms';
import { myReservations } from './mockMeetingRooms';
import { buildMeetingApplicantContext, meetingCurrentUser } from './meetingCurrentUser';
import {
  expandRecurringToStandardReservations,
  findRecurringConflictDates,
} from './recurringMeetingSchedule';
import type { MeetingTimeSlot } from './meetingRoomSchedule';
import { formatMeetingTimeRange } from './meetingRoomSchedule';

export interface RecurringSubmitPayload {
  roomId: string;
  roomName: string;
  address: string;
  title: string;
  description: string;
  recurrenceStartDate: string;
  recurrenceEndDate: string;
  recurrenceWeekdays: number[];
  recurrenceWeekdaysLabel: string;
  selectedSlots: MeetingTimeSlot[];
}

export interface StandardSubmitPayload {
  roomId: string;
  roomName: string;
  address: string;
  title: string;
  description: string;
  selectedSlots: MeetingTimeSlot[];
  activeDate: string;
  duration?: string;
  participants?: string;
  participantCount?: number;
}

export interface RecurringSubmitResult {
  excludedDates: string[];
  reservationId: string;
  auditId: string;
}

export interface StandardSubmitResult {
  reservationId: string;
  auditId: string;
}

const dynamicReservations: MeetingReservation[] = [];
const dynamicAudits: MeetingAuditItem[] = [];
const expandedByAudit = new Map<string, MeetingReservation[]>();

let submitCounter = 0;

function nextId(prefix: string) {
  submitCounter += 1;
  return `${prefix}-${Date.now()}-${submitCounter}`;
}

function formatDisplayDate(date: string): string {
  return date.replace(/-/g, '.');
}

function buildApplicantFields() {
  return {
    applicantId: meetingCurrentUser.id,
    applicantName: meetingCurrentUser.name,
    applicantCompany: meetingCurrentUser.company,
  };
}

interface SubmissionLimitMeta {
  matchedLimitRuleId?: string;
  matchedLimitRuleName?: string;
  limitViolationApproverNames?: string[];
}

interface SubmissionAuditOutcome {
  reservationStatus: MeetingReservation['status'];
  reservationStatusLabel: string;
  auditStatus: MeetingAuditItem['status'];
  auditStatusLabel: string;
  matchedFlowMeta: {
    matchedAuditFlowId?: string;
    matchedAuditFlowName?: string;
  };
  limitMeta?: SubmissionLimitMeta;
  approverNames?: string[];
  approveMode?: 'auto' | 'manual';
  autoApproverScopeLabel?: string;
}

function getExistingReservationsForLimitCheck(): MeetingReservation[] {
  return [...myReservations, ...dynamicReservations];
}

function resolveLimitCheck(
  payload: Pick<
    RecurringSubmitPayload | StandardSubmitPayload,
    'roomId' | 'roomName' | 'selectedSlots'
  > & {
    activeDate?: string;
    recurrenceStartDate?: string;
    recurrenceEndDate?: string;
    recurrenceWeekdays?: number[];
  },
): SubmissionLimitMeta | undefined {
  const applicant = buildMeetingApplicantContext();
  const limitResult = validateReservationLimits(
    getReservationLimitConfigs(),
    {
      ...applicant,
      roomId: payload.roomId,
      roomName: payload.roomName,
      selectedSlots: payload.selectedSlots,
      activeDate: payload.activeDate,
      recurrenceStartDate: payload.recurrenceStartDate,
      recurrenceEndDate: payload.recurrenceEndDate,
      recurrenceWeekdays: payload.recurrenceWeekdays,
    },
    getExistingReservationsForLimitCheck(),
  );

  if (limitResult.action === 'reject') {
    const ruleName = limitResult.matchedRule
      ? getReservationLimitDisplayName(limitResult.matchedRule)
      : '占用限制';
    throw new ReservationLimitError(
      `${ruleName}：${limitResult.messages.join('；')}`,
    );
  }

  if (limitResult.action === 'requireApproval' && limitResult.matchedRule) {
    return {
      matchedLimitRuleId: limitResult.matchedRule.id,
      matchedLimitRuleName: getReservationLimitDisplayName(limitResult.matchedRule),
      limitViolationApproverNames: limitResult.limitApproverNames,
    };
  }

  if (limitResult.matchedRule) {
    return {
      matchedLimitRuleId: limitResult.matchedRule.id,
      matchedLimitRuleName: getReservationLimitDisplayName(limitResult.matchedRule),
    };
  }

  return undefined;
}

function mergeApproverNames(
  auditNames: string[] | undefined,
  limitNames: string[] | undefined,
): string[] | undefined {
  const merged = [...new Set([...(auditNames ?? []), ...(limitNames ?? [])].filter(Boolean))];
  return merged.length > 0 ? merged : undefined;
}

function buildLimitRecordFields(limitMeta?: SubmissionLimitMeta) {
  if (!limitMeta) return {};
  return {
    matchedLimitRuleId: limitMeta.matchedLimitRuleId,
    matchedLimitRuleName: limitMeta.matchedLimitRuleName,
    limitViolationApproverNames: limitMeta.limitViolationApproverNames,
  };
}

function buildAuditRecordFields(outcome: SubmissionAuditOutcome) {
  const fields = {
    ...outcome.matchedFlowMeta,
    ...buildLimitRecordFields(outcome.limitMeta),
  } as Record<string, unknown>;
  if (outcome.approverNames?.length) {
    if (outcome.approveMode === 'auto') {
      fields.approvedByNames = outcome.approverNames;
      if (outcome.autoApproverScopeLabel) {
        fields.autoApproverScopeLabel = outcome.autoApproverScopeLabel;
      }
    } else {
      fields.pendingApproverNames = outcome.approverNames;
    }
  }
  return fields;
}

function resolveSubmissionAuditOutcome(
  roomId: string,
  roomName: string,
  limitMeta?: SubmissionLimitMeta,
): SubmissionAuditOutcome {
  const plan = resolveAuditApprovalPlan(getAuditFlowConfigs(), {
    processType: '会议室预约',
    roomId,
    roomName,
    ...buildMeetingApplicantContext(),
  });

  const primaryFlow = plan.matchedFlows[0];
  const matchedFlowMeta = primaryFlow
    ? {
        matchedAuditFlowId: primaryFlow.id,
        matchedAuditFlowName: plan.displayName,
      }
    : {};

  const approverNames = mergeApproverNames(
    plan.approverNames,
    limitMeta?.limitViolationApproverNames,
  );

  if (plan.approveMode === 'auto' && !limitMeta?.limitViolationApproverNames?.length) {
    const scopeLabel = plan.approverScopeLabel ?? '组织管理员';
    return {
      reservationStatus: 'completed',
      reservationStatusLabel: `${scopeLabel}已自动通过`,
      auditStatus: 'approved',
      auditStatusLabel: `${scopeLabel}已自动通过`,
      matchedFlowMeta,
      limitMeta,
      approverNames,
      approveMode: 'auto',
      autoApproverScopeLabel: scopeLabel,
    };
  }

  const statusLabel = limitMeta?.limitViolationApproverNames?.length
    ? '占用超限审批中'
    : '审批中';

  return {
    reservationStatus: 'processing',
    reservationStatusLabel: statusLabel,
    auditStatus: 'pending',
    auditStatusLabel: statusLabel,
    matchedFlowMeta,
    limitMeta,
    approverNames,
    approveMode: 'manual',
  };
}

export function submitRecurringMeeting(payload: RecurringSubmitPayload): RecurringSubmitResult {
  const limitMeta = resolveLimitCheck({
    roomId: payload.roomId,
    roomName: payload.roomName,
    selectedSlots: payload.selectedSlots,
    recurrenceStartDate: payload.recurrenceStartDate,
    recurrenceEndDate: payload.recurrenceEndDate,
    recurrenceWeekdays: payload.recurrenceWeekdays,
  });

  const excludedDates = findRecurringConflictDates(
    payload.roomId,
    payload.recurrenceStartDate,
    payload.recurrenceEndDate,
    payload.recurrenceWeekdays,
    payload.selectedSlots,
  );

  const reservationId = nextId('res-recurring-processing');
  const auditId = nextId('audit-recurring-pending');
  const timeSlot = formatMeetingTimeRange(payload.selectedSlots).replace('-', ' - ');
  const applicant = buildApplicantFields();
  const auditOutcome = resolveSubmissionAuditOutcome(payload.roomId, payload.roomName, limitMeta);

  const reservation: MeetingReservation = {
    id: reservationId,
    title: payload.title,
    time: '',
    address: payload.address,
    roomId: payload.roomId,
    roomName: payload.roomName,
    status: auditOutcome.reservationStatus,
    statusLabel: auditOutcome.reservationStatusLabel,
    meetingType: 'recurring',
    recurrenceStartDate: formatDisplayDate(payload.recurrenceStartDate),
    recurrenceEndDate: formatDisplayDate(payload.recurrenceEndDate),
    recurrenceWeekdays: payload.recurrenceWeekdaysLabel,
    timeSlot,
    description: payload.description,
    excludedDates,
    ...applicant,
    ...buildAuditRecordFields(auditOutcome),
  };

  const audit: MeetingAuditItem = {
    id: auditId,
    title: payload.title,
    roomName: payload.roomName,
    roomId: payload.roomId,
    status: auditOutcome.auditStatus,
    statusLabel: auditOutcome.auditStatusLabel,
    meetingType: 'recurring',
    recurrenceStartDate: formatDisplayDate(payload.recurrenceStartDate),
    recurrenceEndDate: formatDisplayDate(payload.recurrenceEndDate),
    recurrenceWeekdays: payload.recurrenceWeekdaysLabel,
    timeSlot,
    reservationId,
    excludedDates,
    ...applicant,
    ...buildAuditRecordFields(auditOutcome),
  };

  dynamicReservations.push(reservation);
  dynamicAudits.push(audit);

  return { excludedDates, reservationId, auditId };
}

export function submitStandardMeeting(payload: StandardSubmitPayload): StandardSubmitResult {
  const limitMeta = resolveLimitCheck({
    roomId: payload.roomId,
    roomName: payload.roomName,
    selectedSlots: payload.selectedSlots,
    activeDate: payload.activeDate,
  });

  const reservationId = nextId('res-standard-processing');
  const auditId = nextId('audit-standard-pending');
  const timeRange = formatMeetingTimeRange(payload.selectedSlots);
  const time = payload.activeDate
    ? `${payload.activeDate} ${timeRange.split('-')[0]?.trim() ?? '09:00'}:00`
    : '';
  const applicant = buildApplicantFields();
  const auditOutcome = resolveSubmissionAuditOutcome(payload.roomId, payload.roomName, limitMeta);

  const reservation: MeetingReservation = {
    id: reservationId,
    title: payload.title,
    time,
    address: payload.address,
    roomId: payload.roomId,
    roomName: payload.roomName,
    status: auditOutcome.reservationStatus,
    statusLabel: auditOutcome.reservationStatusLabel,
    meetingType: 'standard',
    duration: payload.duration ?? '1小时',
    participants: payload.participants,
    participantCount: payload.participantCount,
    description: payload.description,
    ...applicant,
    ...buildAuditRecordFields(auditOutcome),
  };

  const audit: MeetingAuditItem = {
    id: auditId,
    title: payload.title,
    roomName: payload.roomName,
    roomId: payload.roomId,
    status: auditOutcome.auditStatus,
    statusLabel: auditOutcome.auditStatusLabel,
    meetingType: 'standard',
    time,
    reservationId,
    ...applicant,
    ...buildAuditRecordFields(auditOutcome),
  };

  dynamicReservations.push(reservation);
  dynamicAudits.push(audit);

  return { reservationId, auditId };
}

export function getDynamicReservations(): MeetingReservation[] {
  return dynamicReservations;
}

export function getDynamicAudits(): MeetingAuditItem[] {
  return dynamicAudits;
}

export function findDynamicReservation(id: string): MeetingReservation | undefined {
  return dynamicReservations.find((r) => r.id === id);
}

function buildMockSlotsFromAudit(audit: MeetingAuditItem): MeetingTimeSlot[] {
  const parts = audit.timeSlot?.split('-').map((s) => s.trim()) ?? ['10:30', '11:30'];
  return [{
    id: 'mock',
    time: parts[0],
    endTime: parts[1] ?? parts[0],
    label: audit.timeSlot ?? '',
    status: 'selected',
    isHourMark: false,
  }];
}

export function getExpandedReservationsForAudit(audit: MeetingAuditItem): MeetingReservation[] {
  if (audit.meetingType !== 'recurring') return [];

  const cached = expandedByAudit.get(audit.id);
  if (cached) return cached;

  const weekdayMap: Record<string, number> = {
    周一: 1, 周二: 2, 周三: 3, 周四: 4, 周五: 5, 周六: 6, 周日: 7,
  };
  const weekdayValues = (audit.recurrenceWeekdays ?? '')
    .split(/[、,，]/)
    .map((label) => weekdayMap[label.trim()])
    .filter(Boolean);

  const startDate = audit.recurrenceStartDate?.replace(/\./g, '-') ?? '';
  const endDate = audit.recurrenceEndDate?.replace(/\./g, '-') ?? '';
  const mockSlots = buildMockSlotsFromAudit(audit);

  const occurrences = expandRecurringToStandardReservations({
    auditId: audit.id,
    title: audit.title,
    roomId: audit.roomId,
    roomName: audit.roomName,
    startDate,
    endDate,
    weekdayValues,
    slots: mockSlots,
    excludedDates: audit.excludedDates ?? [],
  });

  const expanded: MeetingReservation[] = occurrences.map((occ) => ({
    id: occ.id,
    title: audit.title,
    time: occ.time,
    address: `${audit.roomName} 会议室`,
    roomId: audit.roomId,
    roomName: audit.roomName,
    status: 'completed',
    statusLabel: '已完成',
    meetingType: 'standard',
    description: '',
    sourceAuditId: audit.id,
    applicantId: audit.applicantId,
    applicantName: audit.applicantName,
  }));

  expandedByAudit.set(audit.id, expanded);
  return expanded;
}

export { ReservationLimitError } from '../utils/reservationLimitMatcher';
