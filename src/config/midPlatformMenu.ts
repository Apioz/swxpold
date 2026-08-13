import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export const midPlatformRouteTitleMap: Record<string, string> = {
  '/mid-platform/operations/home': '运营管理首页',
  '/mid-platform/operations/personnel': '人员管理',
};

export const midPlatformMenuItems: MenuItem[] = [
  {
    key: 'mid-appointment',
    label: '预约管理',
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
];

export function getMidPlatformOpenKeys(path: string): string[] {
  if (path.startsWith('/mid-platform/operations')) {
    return ['mid-operations'];
  }
  return [];
}
