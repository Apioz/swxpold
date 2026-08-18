export interface MeetingRoomNode {
  id: string;
  name: string;
  type: 'building' | 'floor' | 'room';
  capacity?: number;
  roomType?: string;
  children?: MeetingRoomNode[];
}

export interface MeetingRoomDetail {
  id: string;
  roomNo: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  roomType: string;
  area: string;
  facilities: string[];
  /** 室内全景照，统一 16:9 */
  photoUrl: string;
  floorPlanId: string;
  /** 平面图标注位置（百分比） */
  planX: number;
  planY: number;
}

export interface MeetingReservation {
  id: string;
  title: string;
  time: string;
  address: string;
  roomId: string;
  roomName: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  statusLabel: string;
  /** 待审核周期批量申请为 recurring，审批通过后拆分为 standard */
  meetingType?: 'standard' | 'recurring';
  duration?: string;
  participants?: string;
  participantCount?: number;
  description?: string;
  /** 周期会议待审核：日期区间 */
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  recurrenceWeekdays?: string;
  timeSlot?: string;
  /** 周期内与已有会议冲突、自动跳过的日期 YYYY-MM-DD */
  excludedDates?: string[];
  /** 来源周期审批单 id（由周期会议拆分生成时标记） */
  sourceAuditId?: string;
  /** 申请人 id */
  applicantId: string;
  applicantName?: string;
}

export interface MeetingAuditItem {
  id: string;
  title: string;
  roomName: string;
  roomId: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  statusLabel: string;
  meetingType: 'standard' | 'recurring';
  /** 标准会议：单场开始时间 */
  time?: string;
  /** 周期会议批量申请 */
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  recurrenceWeekdays?: string;
  timeSlot?: string;
  /** 周期内冲突跳过的日期 */
  excludedDates?: string[];
  /** 审批通过后拆分的标准会议记录 id */
  expandedReservationIds?: string[];
  /** 关联的用户预约记录 id（查看详情跳转） */
  reservationId?: string;
  /** 申请人 id */
  applicantId: string;
  applicantName?: string;
}

export interface MeetingFloorPlan {
  id: string;
  building: string;
  floor: string;
  label: string;
  width: number;
  height: number;
}

import { getMeetingRoomPhotoUrl } from './meetingRoomPhotoAssets';
import {
  findDynamicReservation,
  getDynamicAudits,
  getDynamicReservations,
  getExpandedReservationsForAudit,
} from './meetingSubmissionStore';
import { isOwnMeetingApplicant, meetingCurrentUser, meetingOtherApplicants } from './meetingCurrentUser';

export const meetingFloorPlans: MeetingFloorPlan[] = [
  { id: 'b8-4f', building: '8号楼', floor: '4F', label: '8号楼 4F', width: 960, height: 420 },
  { id: 'b8-5f', building: '8号楼', floor: '5F', label: '8号楼 5F', width: 1024, height: 461 },
  { id: 'b7-3f', building: '7号楼', floor: '3F', label: '7号楼 3F', width: 960, height: 420 },
];

export const meetingRoomDetails: MeetingRoomDetail[] = [
  {
    id: 'r-2106',
    roomNo: '8401',
    name: '8401 普通会议室',
    building: '8号楼',
    floor: '4F',
    capacity: 12,
    roomType: '普通会议室',
    area: '36㎡',
    facilities: ['投影', '白板', '视频会议'],
    photoUrl: getMeetingRoomPhotoUrl('r-2106'),
    floorPlanId: 'b8-4f',
    planX: 18,
    planY: 72,
  },
  {
    id: 'r-2108',
    roomNo: '8402',
    name: '8402 视频会议室',
    building: '8号楼',
    floor: '4F',
    capacity: 20,
    roomType: '视频会议室',
    area: '48㎡',
    facilities: ['4K投影', '音响', '视频会议'],
    photoUrl: getMeetingRoomPhotoUrl('r-2108'),
    floorPlanId: 'b8-4f',
    planX: 42,
    planY: 72,
  },
  {
    id: 'r-2204',
    roomNo: '8403',
    name: '8403 普通会议室',
    building: '8号楼',
    floor: '4F',
    capacity: 10,
    roomType: '普通会议室',
    area: '32㎡',
    facilities: ['投影', '白板'],
    photoUrl: getMeetingRoomPhotoUrl('r-2204'),
    floorPlanId: 'b8-4f',
    planX: 68,
    planY: 72,
  },
  {
    id: 'r-5201',
    roomNo: '8501',
    name: '8501 普通会议室',
    building: '8号楼',
    floor: '5F',
    capacity: 8,
    roomType: '普通会议室',
    area: '28㎡',
    facilities: ['投影', '白板'],
    photoUrl: getMeetingRoomPhotoUrl('r-5201'),
    floorPlanId: 'b8-5f',
    planX: 17,
    planY: 78,
  },
  {
    id: 'r-5211',
    roomNo: '8502',
    name: '8502 大型会议室',
    building: '8号楼',
    floor: '5F',
    capacity: 30,
    roomType: '大型会议室',
    area: '86㎡',
    facilities: ['LED屏', '音响', '同声传译'],
    photoUrl: getMeetingRoomPhotoUrl('r-5211'),
    floorPlanId: 'b8-5f',
    planX: 74,
    planY: 24,
  },
  {
    id: 'r-3102',
    roomNo: '7301',
    name: '7301 普通会议室',
    building: '7号楼',
    floor: '3F',
    capacity: 10,
    roomType: '普通会议室',
    area: '30㎡',
    facilities: ['投影', '白板'],
    photoUrl: getMeetingRoomPhotoUrl('r-3102'),
    floorPlanId: 'b7-3f',
    planX: 28,
    planY: 55,
  },
  {
    id: 'r-3105',
    roomNo: '7302',
    name: '7302 洽谈室',
    building: '7号楼',
    floor: '3F',
    capacity: 6,
    roomType: '洽谈室',
    area: '18㎡',
    facilities: ['茶几', '白板'],
    photoUrl: getMeetingRoomPhotoUrl('r-3105'),
    floorPlanId: 'b7-3f',
    planX: 62,
    planY: 55,
  },
];

export const meetingRoomTree: MeetingRoomNode[] = [
  {
    id: 'b8',
    name: '8号楼',
    type: 'building',
    children: [
      {
        id: 'b8-4f',
        name: '4F',
        type: 'floor',
        children: [
          { id: 'r-2106', name: '8401 普通会议室', type: 'room', capacity: 12, roomType: '普通会议室' },
          { id: 'r-2108', name: '8402 视频会议室', type: 'room', capacity: 20, roomType: '视频会议室' },
          { id: 'r-2204', name: '8403 普通会议室', type: 'room', capacity: 10, roomType: '普通会议室' },
        ],
      },
      {
        id: 'b8-5f',
        name: '5F',
        type: 'floor',
        children: [
          { id: 'r-5201', name: '8501 普通会议室', type: 'room', capacity: 8, roomType: '普通会议室' },
          { id: 'r-5211', name: '8502 大型会议室', type: 'room', capacity: 30, roomType: '大型会议室' },
        ],
      },
    ],
  },
  {
    id: 'b7',
    name: '7号楼',
    type: 'building',
    children: [
      {
        id: 'b7-3f',
        name: '3F',
        type: 'floor',
        children: [
          { id: 'r-3102', name: '7301 普通会议室', type: 'room', capacity: 10, roomType: '普通会议室' },
          { id: 'r-3105', name: '7302 洽谈室', type: 'room', capacity: 6, roomType: '洽谈室' },
        ],
      },
    ],
  },
];

export const myReservations: MeetingReservation[] = [
  {
    id: 'res-recurring-pending-1',
    title: '数字化改造研讨会',
    time: '',
    address: '8号楼4F 8403 普通会议室',
    roomId: 'r-2204',
    roomName: '8403',
    status: 'pending',
    statusLabel: '待审核',
    meetingType: 'recurring',
    recurrenceStartDate: '2026.06.10',
    recurrenceEndDate: '2026.08.31',
    recurrenceWeekdays: '周五、周六',
    timeSlot: '10:30 - 11:30',
    description: '数字化改造研讨',
    excludedDates: ['2026-06-14'],
    applicantId: meetingOtherApplicants.zhang.id,
    applicantName: meetingOtherApplicants.zhang.name,
  },
  {
    id: 'res-pending-1',
    title: '数字孪生孵化器项目例会',
    time: '2026-08-18 13:00:00',
    address: '8号楼4F 8403 普通会议室',
    roomId: 'r-2204',
    roomName: '8403',
    status: 'pending',
    statusLabel: '待审核',
    meetingType: 'standard',
    duration: '1小时',
    description: '项目进度同步',
    applicantId: meetingOtherApplicants.li.id,
    applicantName: meetingOtherApplicants.li.name,
  },
  {
    id: 'res-pending-2',
    title: '智慧园区需求评审',
    time: '2026-09-20 10:00:00',
    address: '8号楼5F 8501 普通会议室',
    roomId: 'r-5201',
    roomName: '8501',
    status: 'pending',
    statusLabel: '待审核',
    meetingType: 'standard',
    duration: '2小时',
    description: '需求评审',
    applicantId: meetingOtherApplicants.wang.id,
    applicantName: meetingOtherApplicants.wang.name,
  },
  {
    id: 'res-processing-1',
    title: '中台系统联调会议',
    time: '2026-09-16 15:30:00',
    address: '8号楼5F 8502 大型会议室',
    roomId: 'r-5211',
    roomName: '8502',
    status: 'processing',
    statusLabel: '审批中',
    meetingType: 'standard',
    duration: '2小时',
    participants: '张明, 李华, 王芳, 刘强, 陈静',
    participantCount: 5,
    description: '中台联调进度同步',
    applicantId: meetingCurrentUser.id,
    applicantName: meetingCurrentUser.name,
  },
  {
    id: 'res-other-processing-1',
    title: '产品迭代评审会',
    time: '2026-09-18 14:00:00',
    address: '8号楼4F 8401 普通会议室',
    roomId: 'r-2106',
    roomName: '8401',
    status: 'processing',
    statusLabel: '审批中',
    meetingType: 'standard',
    duration: '1.5小时',
    description: '迭代计划评审',
    applicantId: meetingOtherApplicants.wang.id,
    applicantName: meetingOtherApplicants.wang.name,
  },
  {
    id: 'res-completed-1',
    title: '康抗生物周会',
    time: '2026-09-14 09:00:00',
    address: '7号楼3F 7301 普通会议室',
    roomId: 'r-3102',
    roomName: '7301',
    status: 'completed',
    statusLabel: '已完成',
    meetingType: 'standard',
    duration: '3小时',
    participants:
      '邀请全帅, 刘艺, 刘语菲, 洪杰, 杨海, 沈小诗, 张俊, 杨海, 刘艺, 刘语菲, 洪杰, 杨海, 沈小诗, 张俊, 杨海, 刘艺, 刘语菲, 洪杰, 杨海, 沈小诗, 张俊, 杨海, 刘艺, 刘语菲, 洪杰, 杨海, 沈小诗, 张俊, 杨海, 刘艺, 刘语菲, 洪杰, 杨海, 沈小诗, 张俊, 杨海, 刘艺, 刘语菲, 洪杰, 杨海, 沈小诗, 张俊, 杨海, 刘艺, 刘语菲, 洪杰, 杨海, 沈小诗, 张俊',
    participantCount: 45,
    description: '周会',
    applicantId: meetingCurrentUser.id,
    applicantName: meetingCurrentUser.name,
  },
  {
    id: 'res-completed-2',
    title: '周会',
    time: '2026-09-14 09:00:00',
    address: '7号楼3F 7301 普通会议室',
    roomId: 'r-3102',
    roomName: '7301',
    status: 'completed',
    statusLabel: '已完成',
    meetingType: 'standard',
    duration: '1小时',
    description: '周会',
    applicantId: meetingCurrentUser.id,
    applicantName: meetingCurrentUser.name,
  },
  {
    id: 'res-completed-3',
    title: '数字化改造研讨会',
    time: '2026-06-13 10:30:00',
    address: '8号楼4F 8403 普通会议室',
    roomId: 'r-2204',
    roomName: '8403',
    status: 'completed',
    statusLabel: '已完成',
    meetingType: 'standard',
    duration: '1小时',
    description: '数字化改造研讨',
    sourceAuditId: 'audit-recurring-approved',
    applicantId: meetingOtherApplicants.zhang.id,
    applicantName: meetingOtherApplicants.zhang.name,
  },
  {
    id: 'res-completed-4',
    title: '数字化改造研讨会',
    time: '2026-06-14 10:30:00',
    address: '8号楼4F 8403 普通会议室',
    roomId: 'r-2204',
    roomName: '8403',
    status: 'completed',
    statusLabel: '已完成',
    meetingType: 'standard',
    duration: '1小时',
    description: '数字化改造研讨',
    sourceAuditId: 'audit-recurring-approved',
    applicantId: meetingOtherApplicants.zhang.id,
    applicantName: meetingOtherApplicants.zhang.name,
  },
  {
    id: 'res-completed-5',
    title: '数字化改造研讨会',
    time: '2026-06-20 10:30:00',
    address: '8号楼4F 8403 普通会议室',
    roomId: 'r-2204',
    roomName: '8403',
    status: 'completed',
    statusLabel: '已完成',
    meetingType: 'standard',
    duration: '1小时',
    description: '数字化改造研讨',
    sourceAuditId: 'audit-recurring-approved',
    applicantId: meetingOtherApplicants.zhang.id,
    applicantName: meetingOtherApplicants.zhang.name,
  },
  {
    id: 'res-rejected-1',
    title: '跨部门协调会',
    time: '2026-09-12 16:00:00',
    address: '8号楼4F 8402 视频会议室',
    roomId: 'r-2108',
    roomName: '8402',
    status: 'rejected',
    statusLabel: '已拒绝',
    meetingType: 'standard',
    applicantId: meetingCurrentUser.id,
    applicantName: meetingCurrentUser.name,
  },
  {
    id: 'res-cancelled-1',
    title: '产品发布预演',
    time: '2026-09-10 11:00:00',
    address: '8号楼5F 8501 普通会议室',
    roomId: 'r-5201',
    roomName: '8501',
    status: 'cancelled',
    statusLabel: '已取消',
    meetingType: 'standard',
    applicantId: meetingCurrentUser.id,
    applicantName: meetingCurrentUser.name,
  },
];

export const reservationTabs = ['待审核', '审批中', '已完成', '已拒绝', '已取消'] as const;

export type ReservationTabStatus = MeetingReservation['status'];

export function getReservationsByStatus(status: ReservationTabStatus): MeetingReservation[] {
  const all = [...myReservations, ...getDynamicReservations()];

  if (status === 'pending') {
    if (!meetingCurrentUser.canApproveMeetings) return [];
    return all.filter(
      (item) => item.status === 'pending' && !isOwnMeetingApplicant(item.applicantId),
    );
  }

  return all.filter(
    (item) => item.status === status && isOwnMeetingApplicant(item.applicantId),
  );
}

export const meetingAuditList: MeetingAuditItem[] = [
  {
    id: 'audit-recurring-pending',
    title: '数字化改造研讨会',
    roomName: '8403',
    roomId: 'r-2204',
    status: 'pending',
    statusLabel: '待审批',
    meetingType: 'recurring',
    recurrenceStartDate: '2026.06.10',
    recurrenceEndDate: '2026.08.31',
    recurrenceWeekdays: '周五、周六',
    timeSlot: '10:30 - 11:30',
    excludedDates: ['2026-06-14'],
    reservationId: 'res-recurring-pending-1',
    applicantId: meetingOtherApplicants.zhang.id,
    applicantName: meetingOtherApplicants.zhang.name,
  },
  {
    id: 'audit-standard-pending',
    title: '数字孪生孵化器项目例会',
    roomName: '8403',
    roomId: 'r-2204',
    status: 'pending',
    statusLabel: '待审批',
    meetingType: 'standard',
    time: '2026-08-18 13:00:00',
    reservationId: 'res-pending-1',
    applicantId: meetingOtherApplicants.li.id,
    applicantName: meetingOtherApplicants.li.name,
  },
  {
    id: 'audit-recurring-approved',
    title: '数字化改造研讨会',
    roomName: '8403',
    roomId: 'r-2204',
    status: 'approved',
    statusLabel: '审批通过',
    meetingType: 'recurring',
    recurrenceStartDate: '2026.06.10',
    recurrenceEndDate: '2026.08.31',
    recurrenceWeekdays: '周五、周六',
    timeSlot: '10:30 - 11:30',
    excludedDates: ['2026-06-14'],
    applicantId: meetingOtherApplicants.zhang.id,
    applicantName: meetingOtherApplicants.zhang.name,
  },
  {
    id: 'audit-standard-approved',
    title: '康抗生物周会',
    roomName: '7301',
    roomId: 'r-3102',
    status: 'approved',
    statusLabel: '审批通过',
    meetingType: 'standard',
    time: '2026-09-14 09:00:00',
    expandedReservationIds: ['res-completed-1'],
    applicantId: meetingOtherApplicants.wang.id,
    applicantName: meetingOtherApplicants.wang.name,
  },
  {
    id: 'audit-rejected-1',
    title: '跨部门协调会',
    roomName: '8402',
    roomId: 'r-2108',
    status: 'rejected',
    statusLabel: '审批拒绝',
    meetingType: 'standard',
    time: '2026-09-12 16:00:00',
    applicantId: meetingOtherApplicants.li.id,
    applicantName: meetingOtherApplicants.li.name,
  },
  {
    id: 'audit-processing-1',
    title: '产品迭代评审会',
    roomName: '8401',
    roomId: 'r-2106',
    status: 'processing',
    statusLabel: '审批中',
    meetingType: 'standard',
    time: '2026-09-18 14:00:00',
    reservationId: 'res-other-processing-1',
    applicantId: meetingOtherApplicants.wang.id,
    applicantName: meetingOtherApplicants.wang.name,
  },
];

export const auditTabs = ['待审批', '审批通过', '审批拒绝', '审批中'] as const;

export type AuditTabStatus = MeetingAuditItem['status'];

export function getAuditItemsByStatus(status: AuditTabStatus): MeetingAuditItem[] {
  if (!meetingCurrentUser.canApproveMeetings) return [];
  return [...meetingAuditList, ...getDynamicAudits()].filter(
    (item) => item.status === status && !isOwnMeetingApplicant(item.applicantId),
  );
}

export function getReservationsByAuditId(auditId: string): MeetingReservation[] {
  const audit = [...meetingAuditList, ...getDynamicAudits()].find((item) => item.id === auditId);
  if (!audit) return [];

  if (audit.meetingType === 'recurring' && audit.status === 'approved') {
    return getExpandedReservationsForAudit(audit);
  }

  if (!audit.expandedReservationIds?.length) return [];

  return audit.expandedReservationIds
    .map((id) => getReservationById(id))
    .filter((r): r is MeetingReservation => Boolean(r));
}

export function getMeetingRoomById(id: string): MeetingRoomDetail | undefined {
  return meetingRoomDetails.find((r) => r.id === id);
}

/** 会议室完整地址，如 8号楼4F 8401 普通会议室 */
export function getMeetingRoomAddress(room: Pick<MeetingRoomDetail, 'building' | 'floor' | 'roomNo' | 'roomType'>): string {
  return `${room.building}${room.floor} ${room.roomNo} ${room.roomType}`;
}

export function getMeetingRoomsByFloorPlan(floorPlanId: string): MeetingRoomDetail[] {
  return meetingRoomDetails.filter((r) => r.floorPlanId === floorPlanId);
}

export function getMeetingFloorPlan(id: string): MeetingFloorPlan | undefined {
  return meetingFloorPlans.find((p) => p.id === id);
}

export function getReservationById(id: string): MeetingReservation | undefined {
  return myReservations.find((r) => r.id === id)
    ?? findDynamicReservation(id);
}
