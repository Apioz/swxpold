import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export const foundationRouteTitleMap: Record<string, string> = {
  '/foundation/project-center': '项目中心',
  '/foundation/model-center': '模型中心',
  '/foundation/device-center': '设备中心',
  '/foundation/space-center': '空间中心',
  '/foundation/floor-manage': '全层管理',
  '/foundation/document-center': '文档中心',
  '/foundation/source-center': '源码中心',
  '/foundation/collaboration-center': '协同中心',
};

export const foundationMenuItems: MenuItem[] = [
  { key: '/foundation/project-center', label: '项目中心' },
  { key: '/foundation/model-center', label: '模型中心' },
  { key: '/foundation/device-center', label: '设备中心' },
  { key: '/foundation/space-center', label: '空间中心' },
  { key: '/foundation/floor-manage', label: '全层管理' },
  { key: '/foundation/document-center', label: '文档中心' },
  { key: '/foundation/source-center', label: '源码中心' },
  { key: '/foundation/collaboration-center', label: '协同中心' },
  {
    key: 'foundation-iot',
    label: '物联网集成',
    children: [{ key: '/foundation/iot/devices', label: '设备接入' }],
  },
  {
    key: 'foundation-system',
    label: '系统管理',
    children: [{ key: '/foundation/system/users', label: '用户管理' }],
  },
  {
    key: 'foundation-service',
    label: '系统服务',
    children: [{ key: '/foundation/service/logs', label: '服务日志' }],
  },
];

export function getFoundationOpenKeys(path: string): string[] {
  if (path.startsWith('/foundation/iot')) return ['foundation-iot'];
  if (path.startsWith('/foundation/system')) return ['foundation-system'];
  if (path.startsWith('/foundation/service')) return ['foundation-service'];
  return [];
}
