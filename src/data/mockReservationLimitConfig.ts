import type { ReservationLimitConfig } from '../types/reservationLimitConfig';

export {
  COMPANY_OPTIONS,
  getOrgValueOptions,
  getRoomOptions,
  ORG_SCOPE_OPTIONS,
} from './auditFlowOptions';

export const VIOLATION_ACTION_OPTIONS = [
  { label: '直接拒绝', value: 'reject' },
  { label: '触发多级审批', value: 'requireApproval' },
] as const;

export const LIMIT_FIELD_META = [
  {
    key: 'maxDurationMinutes' as const,
    label: '单次最长时长',
    unit: '分钟',
    placeholder: '如 240（4小时）',
    hint: '限制单次预约时长，防止单条预约霸占会议室全天',
  },
  {
    key: 'maxDailyBookingCount' as const,
    label: '单日预约总数',
    unit: '次',
    placeholder: '如 3',
    hint: '同一用户单日可提交的预约总次数',
  },
  {
    key: 'maxDailySameRoomCount' as const,
    label: '单日同室预约',
    unit: '次',
    placeholder: '如 1',
    hint: '同一用户单日对同一会议室的预约次数',
  },
  {
    key: 'maxWeeklySameRoomCount' as const,
    label: '近7天同室频次',
    unit: '次',
    placeholder: '如 5',
    hint: '防止同一用户多天重复霸占同一会议室',
  },
  {
    key: 'maxWeeklySameRoomDurationMinutes' as const,
    label: '7天同室总时长',
    unit: '分钟',
    placeholder: '如 480（8小时）',
    hint: '同一用户对同一会议室近 7 天内占用总时长',
  },
  {
    key: 'maxWeeklyTotalDurationMinutes' as const,
    label: '7天全部会议室总时长',
    unit: '分钟',
    placeholder: '如 960（16小时）',
    hint: '同一用户近 7 天内对所有会议室占用总时长',
  },
  {
    key: 'maxConsecutiveDaysSameRoom' as const,
    label: '连续同室天数',
    unit: '天',
    placeholder: '如 5',
    hint: '同一用户连续预约同一会议室的天数上限',
  },
  {
    key: 'maxConcurrentRooms' as const,
    label: '同时段并发间数',
    unit: '间',
    placeholder: '如 2',
    hint: '同一用户在同一时段可占用的会议室数量',
  },
];

export const reservationLimitConfigs: ReservationLimitConfig[] = [
  {
    id: 'rlc-default',
    name: '默认占用限制',
    conditions: [],
    matchType: '精确匹配',
    isDefault: true,
    enabled: true,
    limits: {
      maxDurationMinutes: 480,
      maxConcurrentRooms: 3,
    },
    violationAction: 'reject',
    approverSteps: [],
  },
  {
    id: 'rlc-a-company-8403',
    name: 'A公司 · 8403 占用限制',
    conditions: [
      { type: 'org', orgScope: 'company', values: ['A公司'] },
      { type: 'room', values: ['r-2204'] },
    ],
    matchType: '精确匹配',
    isDefault: false,
    enabled: true,
    limits: {
      maxDurationMinutes: 180,
      maxDailySameRoomCount: 1,
      maxWeeklySameRoomDurationMinutes: 360,
      maxWeeklyTotalDurationMinutes: 960,
      maxConsecutiveDaysSameRoom: 3,
      maxConcurrentRooms: 1,
    },
    violationAction: 'requireApproval',
    approverSteps: [
      {
        orgLevel: '公司',
        orgName: 'A公司',
        signType: '或签',
        approverType: '指定人员',
        approverNames: ['王磊', '陈昊'],
      },
      {
        orgLevel: '集团',
        orgName: '生物芯片上海国家工程研究中心',
        signType: '会签',
        approverType: '指定人员',
        approverNames: ['黄莹'],
      },
    ],
  },
  {
    id: 'rlc-b-company-video',
    name: 'B公司 · 视频会议室限制',
    conditions: [
      { type: 'org', orgScope: 'company', values: ['B公司'] },
      { type: 'room', values: ['r-2108'] },
    ],
    matchType: '精确匹配',
    isDefault: false,
    enabled: true,
    limits: {
      maxDurationMinutes: 120,
      maxDailyBookingCount: 2,
      maxConcurrentRooms: 1,
    },
    violationAction: 'reject',
    approverSteps: [],
  },
];
