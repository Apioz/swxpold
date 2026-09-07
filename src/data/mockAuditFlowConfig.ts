import type { AuditFlowConfig } from '../types/auditFlowConfig';

export {
  COMPANY_OPTIONS,
  DEPARTMENT_OPTIONS,
  getOrgValueOptions,
  getRoomOptions,
  ORG_SCOPE_OPTIONS,
  PARK_OPTIONS,
  PERSON_OPTIONS,
} from './auditFlowOptions';

export const PROCESS_TYPE_OPTIONS = [
  { label: '访问预约', value: '访问预约' },
  { label: '会议室预约', value: '会议室预约' },
];

export const CONDITION_TYPE_OPTIONS = [
  { label: '组织架构', value: 'org' },
  { label: '会议室', value: 'room' },
];

export const MATCH_TYPE_OPTIONS = [
  { label: '精确匹配', value: '精确匹配' },
  { label: '模糊匹配', value: '模糊匹配' },
];

export const APPROVE_MODE_OPTIONS = [
  { label: '指定人员审批', value: 'manual' },
];

export { DYNAMIC_SCOPE_OPTIONS } from './auditFlowOptions';

export const ORG_LEVEL_OPTIONS = [
  { label: '集团', value: '集团' },
  { label: '园区', value: '园区' },
  { label: '公司', value: '公司' },
  { label: '部门', value: '部门' },
];

export const ORG_ENTITY_OPTIONS = [
  { label: '生物芯片上海国家工程研究中心', value: '生物芯片上海国家工程研究中心' },
  { label: '生物芯片园区', value: '生物芯片园区' },
  { label: 'visitor', value: 'visitor' },
  { label: 'meeting', value: 'meeting' },
];

export const APPROVER_NAME_OPTIONS = [
  { label: '黄莹', value: '黄莹' },
  { label: '王磊', value: '王磊' },
  { label: '陈昊', value: '陈昊' },
  { label: '管理员', value: '管理员' },
  { label: '白钺', value: '白钺' },
];

export const auditFlowConfigs: AuditFlowConfig[] = [
  {
    id: 'afc-1',
    name: '访问预约默认流程',
    processType: '访问预约',
    conditions: [],
    matchType: '精确匹配',
    isDefault: true,
    approveMode: 'manual',
    enabled: true,
    approverSteps: [
      {
        orgLevel: '集团',
        orgName: '生物芯片上海国家工程研究中心',
        signType: '或签',
        approverType: '指定人员',
        approverNames: ['黄莹', '王磊', '管理员', '白钺'],
      },
    ],
  },
  {
    id: 'afc-2',
    name: '会议室预约默认流程',
    processType: '会议室预约',
    conditions: [],
    matchType: '精确匹配',
    isDefault: true,
    approveMode: 'manual',
    enabled: true,
    approverSteps: [
      {
        orgLevel: '集团',
        orgName: '生物芯片上海国家工程研究中心',
        signType: '或签',
        approverType: '指定人员',
        approverNames: ['黄莹', '王磊', '陈昊', '管理员'],
      },
    ],
  },
  {
    id: 'afc-a-room1',
    name: 'A公司专属 · 2204会议室',
    processType: '会议室预约',
    conditions: [
      { type: 'org', orgScope: 'company', values: ['A公司'] },
      { type: 'room', values: ['mr-2204'] },
    ],
    matchType: '精确匹配',
    isDefault: false,
    approveMode: 'manual',
    enabled: true,
    selfApplyAutoPass: true,
    approverSteps: [
      {
        orgLevel: '公司',
        orgName: 'A公司',
        signType: '或签',
        approverType: '指定人员',
        approverNames: ['王磊', '陈昊'],
      },
    ],
  },
  {
    id: 'afc-room2-fixed',
    name: '1104会议室固定审批人（任何人）',
    processType: '会议室预约',
    conditions: [{ type: 'room', values: ['mr-1104'] }],
    matchType: '精确匹配',
    isDefault: false,
    approveMode: 'manual',
    enabled: true,
    approverSteps: [
      {
        orgLevel: '集团',
        orgName: '生物芯片上海国家工程研究中心',
        signType: '或签',
        approverType: '指定人员',
        approverNames: ['黄莹'],
      },
    ],
  },
  {
    id: 'afc-1103-manual',
    name: '1103会议室 · 会议室管理员审批',
    processType: '会议室预约',
    conditions: [{ type: 'room', values: ['mr-1103'] }],
    matchType: '精确匹配',
    isDefault: false,
    approveMode: 'manual',
    enabled: true,
    approverSteps: [
      {
        orgLevel: '集团',
        orgName: '生物芯片上海国家工程研究中心',
        signType: '或签',
        approverType: '动态人员',
        dynamicScope: 'orgAdmin',
        approverNames: [],
      },
    ],
  },
];
