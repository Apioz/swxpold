import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export const midPlatformRouteTitleMap: Record<string, string> = {
  '/mid-platform/operations/home': '运营管理首页',
  '/mid-platform/operations/personnel': '人员管理',
  '/mid-platform/appointment/visitors': '访客管理',
  '/mid-platform/appointment/meeting-rooms/report': '会议室报表',
  '/mid-platform/appointment/meeting-rooms/list': '会议室列表',
  '/mid-platform/appointment/meeting-rooms/reservations': '会议预约',
  '/mid-platform/appointment/meeting-rooms/audit': '会议审核',
  '/mid-platform/appointment/meeting-rooms/records': '会议记录',
  '/mid-platform/system/audit-flow': '审核流程配置',
  '/mid-platform/system/reservation-limits': '预约占用限制配置',
};

export const midPlatformMenuItems: MenuItem[] = [
  {
    key: 'mid-appointment',
    label: '预约管理',
    children: [
      { key: '/mid-platform/appointment/visitors', label: '访客管理' },
      {
        key: 'mid-appointment-meeting',
        label: '会议室管理',
        children: [
          { key: '/mid-platform/appointment/meeting-rooms/report', label: '会议室报表' },
          { key: '/mid-platform/appointment/meeting-rooms/list', label: '会议室列表' },
          { key: '/mid-platform/appointment/meeting-rooms/reservations', label: '会议预约' },
          { key: '/mid-platform/appointment/meeting-rooms/audit', label: '会议审核' },
          { key: '/mid-platform/appointment/meeting-rooms/records', label: '会议记录' },
        ],
      },
    ],
  },
  {
    key: 'mid-operations',
    label: '运营管理',
    children: [
      { key: '/mid-platform/operations/participants', label: '参与方管理' },
      { key: '/mid-platform/operations/personnel', label: '人员管理' },
      { key: '/mid-platform/operations/personnel-deleted', label: '人员删除记录' },
      { key: '/mid-platform/operations/attendance', label: '考勤管理' },
      { key: '/mid-platform/operations/contracts', label: '合同管理' },
      { key: '/mid-platform/operations/billing-periods', label: '账期管理' },
      { key: '/mid-platform/operations/contract-archive', label: '合同归档管理' },
    ],
  },
  { key: '/mid-platform/info-publish', label: '信息发布管理' },
  {
    key: 'mid-message',
    label: '消息管理',
  },
  { key: '/mid-platform/crm', label: 'CRM平台' },
  { key: '/mid-platform/incubation', label: '孵化平台' },
  {
    key: 'mid-system',
    label: '系统配置',
    children: [
      { key: '/mid-platform/system/audit-flow', label: '审核流程配置' },
      { key: '/mid-platform/system/reservation-limits', label: '预约占用限制配置' },
    ],
  },
];

export function getMidPlatformOpenKeys(path: string): string[] {
  if (path.startsWith('/mid-platform/appointment/meeting-rooms')) {
    return ['mid-appointment', 'mid-appointment-meeting'];
  }
  if (path.startsWith('/mid-platform/appointment')) {
    return ['mid-appointment'];
  }
  if (path.startsWith('/mid-platform/operations')) {
    return ['mid-operations'];
  }
  if (path.startsWith('/mid-platform/system')) {
    return ['mid-system'];
  }
  return [];
}

export function getMidPlatformSelectedKey(path: string): string {
  if (path.startsWith('/mid-platform/operations/personnel-deleted')) {
    return '/mid-platform/operations/personnel-deleted';
  }
  if (path.startsWith('/mid-platform/operations/personnel')) {
    return '/mid-platform/operations/personnel';
  }
  if (path.startsWith('/mid-platform/appointment/meeting-rooms/list')) {
    return '/mid-platform/appointment/meeting-rooms/list';
  }
  if (path.startsWith('/mid-platform/appointment/meeting-rooms/report')) {
    return '/mid-platform/appointment/meeting-rooms/report';
  }
  if (path.startsWith('/mid-platform/appointment/meeting-rooms/reservations')) {
    return '/mid-platform/appointment/meeting-rooms/reservations';
  }
  if (path.startsWith('/mid-platform/appointment/meeting-rooms/audit')) {
    return '/mid-platform/appointment/meeting-rooms/audit';
  }
  if (path.startsWith('/mid-platform/appointment/meeting-rooms/records')) {
    return '/mid-platform/appointment/meeting-rooms/records';
  }
  if (path.startsWith('/mid-platform/appointment/visitors')) {
    return '/mid-platform/appointment/visitors';
  }
  if (path.startsWith('/mid-platform/system/reservation-limits')) {
    return '/mid-platform/system/reservation-limits';
  }
  if (path.startsWith('/mid-platform/system/audit-flow')) {
    return '/mid-platform/system/audit-flow';
  }
  return path;
}
