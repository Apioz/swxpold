export type PlatformId = 'pc' | 'mid-platform' | 'mini-program';

export interface PlatformOption {
  id: PlatformId;
  label: string;
  path: string;
}

/** 平台切换列表：仅展示端类型，不包含各端内部菜单 */
export const platformOptions: PlatformOption[] = [
  { id: 'pc', label: 'PC管理端', path: '/spare-parts/ledger' },
  { id: 'mid-platform', label: '生物芯片中台', path: '/mid-platform/operations/personnel' },
  { id: 'mini-program', label: '小程序', path: '/mini-program/home' },
];

export function getCurrentPlatformId(pathname: string): PlatformId {
  if (pathname.startsWith('/mini-program')) return 'mini-program';
  if (pathname.startsWith('/mid-platform')) return 'mid-platform';
  return 'pc';
}
