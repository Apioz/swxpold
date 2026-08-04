/** 能源管理 — 菜单与路由配置（细节页面待后续补充） */
export const ENERGY_ROUTE_PREFIX = '/energy';

/** 能源管理叶子路由（path → 页面标题） */
export const energyRouteTitleMap: Record<string, string> = {
  '/energy/reports': '能源报表',
  '/energy/statistics': '能源统计',
  '/energy/power-analysis': '电能分析',
  '/energy/power-devices': '电能设备管理',
  '/energy/types': '能源类型管理',
  '/energy/levels': '能源层级管理',
  '/energy/alarm-center': '报警中心',
  '/energy/hailin-meter/devices': '能量计设备管理',
  '/energy/hailin-meter/network': '管网点位结构',
  '/energy/hailin-meter/analysis': '流量数据分析',
};

/** 能源管理 openKeys 映射 */
export function getEnergyOpenKeys(path: string): string[] {
  const keys = ['energy'];
  if (path.startsWith('/energy/statistics')) {
    keys.push('energy-stats');
  } else if (path.startsWith('/energy/power-analysis')) {
    keys.push('energy-power-analysis');
  } else if (path.startsWith('/energy/power-devices')) {
    keys.push('energy-power-devices');
  } else if (path.startsWith('/energy/types')) {
    keys.push('energy-types');
  } else if (path.startsWith('/energy/levels')) {
    keys.push('energy-levels');
  } else if (path.startsWith('/energy/hailin-meter')) {
    keys.push('energy-hailin');
  }
  return keys;
}

/** 能源管理侧边栏菜单项 */
export const energyMenuChildren = [
  { key: '/energy/reports', label: '能源报表' },
  {
    key: 'energy-stats',
    label: '能源统计',
    children: [{ key: '/energy/statistics', label: '能源统计' }],
  },
  {
    key: 'energy-power-analysis',
    label: '电能分析',
    children: [{ key: '/energy/power-analysis', label: '电能分析' }],
  },
  {
    key: 'energy-power-devices',
    label: '电能设备管理',
    children: [{ key: '/energy/power-devices', label: '电能设备管理' }],
  },
  {
    key: 'energy-types',
    label: '能源类型管理',
    children: [{ key: '/energy/types', label: '能源类型管理' }],
  },
  {
    key: 'energy-levels',
    label: '能源层级管理',
    children: [{ key: '/energy/levels', label: '能源层级管理' }],
  },
  { key: '/energy/alarm-center', label: '报警中心' },
  {
    key: 'energy-hailin',
    label: '海林能量计',
    children: [
      { key: '/energy/hailin-meter/devices', label: '能量计设备管理' },
      { key: '/energy/hailin-meter/network', label: '管网点位结构' },
      { key: '/energy/hailin-meter/analysis', label: '流量数据分析' },
    ],
  },
];
