import type { MeetingAuditItem, MeetingReservation } from './mockMeetingRooms';
import { meetingCurrentUser } from './meetingCurrentUser';
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
  };
}

export function submitRecurringMeeting(payload: RecurringSubmitPayload): RecurringSubmitResult {
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

  const reservation: MeetingReservation = {
    id: reservationId,
    title: payload.title,
    time: '',
    address: payload.address,
    roomId: payload.roomId,
    roomName: payload.roomName,
    status: 'processing',
    statusLabel: '审批中',
    meetingType: 'recurring',
    recurrenceStartDate: formatDisplayDate(payload.recurrenceStartDate),
    recurrenceEndDate: formatDisplayDate(payload.recurrenceEndDate),
    recurrenceWeekdays: payload.recurrenceWeekdaysLabel,
    timeSlot,
    description: payload.description,
    excludedDates,
    ...applicant,
  };

  const audit: MeetingAuditItem = {
    id: auditId,
    title: payload.title,
    roomName: payload.roomName,
    roomId: payload.roomId,
    status: 'pending',
    statusLabel: '待审批',
    meetingType: 'recurring',
    recurrenceStartDate: formatDisplayDate(payload.recurrenceStartDate),
    recurrenceEndDate: formatDisplayDate(payload.recurrenceEndDate),
    recurrenceWeekdays: payload.recurrenceWeekdaysLabel,
    timeSlot,
    reservationId,
    excludedDates,
    ...applicant,
  };

  dynamicReservations.push(reservation);
  dynamicAudits.push(audit);

  return { excludedDates, reservationId, auditId };
}

export function submitStandardMeeting(payload: StandardSubmitPayload): StandardSubmitResult {
  const reservationId = nextId('res-standard-processing');
  const auditId = nextId('audit-standard-pending');
  const timeRange = formatMeetingTimeRange(payload.selectedSlots);
  const time = payload.activeDate
    ? `${payload.activeDate} ${timeRange.split('-')[0]?.trim() ?? '09:00'}:00`
    : '';
  const applicant = buildApplicantFields();

  const reservation: MeetingReservation = {
    id: reservationId,
    title: payload.title,
    time,
    address: payload.address,
    roomId: payload.roomId,
    roomName: payload.roomName,
    status: 'processing',
    statusLabel: '审批中',
    meetingType: 'standard',
    duration: payload.duration ?? '1小时',
    participants: payload.participants,
    participantCount: payload.participantCount,
    description: payload.description,
    ...applicant,
  };

  const audit: MeetingAuditItem = {
    id: auditId,
    title: payload.title,
    roomName: payload.roomName,
    roomId: payload.roomId,
    status: 'pending',
    statusLabel: '待审批',
    meetingType: 'standard',
    time,
    reservationId,
    ...applicant,
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
