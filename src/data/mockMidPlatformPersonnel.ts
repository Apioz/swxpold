import type { MidPlatformPersonnel } from '../types/midPlatform';

const channelText = '软杰(同步人员及设备)\n海康(仅同步人员)';

/** 示意图第 1 页可见的 7 条人员数据 */
export const mockMidPlatformPersonnelPage1: MidPlatformPersonnel[] = [
  {
    id: 'mp-p-001',
    indexNo: 1,
    name: '张张',
    contactMasked: '173****8716',
    contact: '17321088716',
    participantCompany: '',
    registerTime: '2026-07-29',
    distributionChannels: '',
    accessTimePermission: '-',
    distributionStatusRuanjie: '-',
    distributionStatusHikvision: '-',
    retryEnabled: false,
    wechat: '',
    idCard: '32424',
    gender: '女',
    channelsRuanjie: false,
    channelsHikvision: false,
    identities: [
      {
        id: 'id-1',
        participantCompany: '0',
        contact: '',
        department: '研发平台部',
        employeeNo: '32432424',
        registerTime: '2026-07-29',
        licensePlate: '',
        contactPerson: '',
      },
    ],
    devices: [],
  },
  {
    id: 'mp-p-002',
    indexNo: 2,
    name: '严仕怡',
    contactMasked: '186****8525',
    contact: '18612348525',
    participantCompany: '',
    registerTime: '2026-07-13',
    distributionChannels: channelText,
    accessTimePermission: '2026-07-13至2036-07-12',
    distributionStatusRuanjie: '下发成功',
    distributionStatusHikvision: '下发成功',
    retryEnabled: true,
  },
  {
    id: 'mp-p-003',
    indexNo: 3,
    name: '陈如弯',
    contactMasked: '182****6090',
    contact: '18212346090',
    participantCompany: '',
    registerTime: '2026-07-13',
    distributionChannels: channelText,
    accessTimePermission: '2026-07-13至2027-07-31',
    distributionStatusRuanjie: '下发成功',
    distributionStatusHikvision: '下发成功',
    retryEnabled: true,
  },
  {
    id: 'mp-p-004',
    indexNo: 4,
    name: '宋佳筠',
    contactMasked: '157****1834',
    contact: '15712341834',
    participantCompany: '',
    registerTime: '2026-07-10',
    distributionChannels: channelText,
    accessTimePermission: '2026-07-10至2036-07-09',
    distributionStatusRuanjie: '下发成功',
    distributionStatusHikvision: '下发成功',
    retryEnabled: true,
  },
  {
    id: 'mp-p-005',
    indexNo: 5,
    name: '顾志明',
    contactMasked: '139****9676',
    contact: '13912349676',
    participantCompany: '',
    registerTime: '2026-07-09',
    distributionChannels: channelText,
    accessTimePermission: '2026-07-09至2036-07-08',
    distributionStatusRuanjie: '下发成功',
    distributionStatusHikvision: '下发成功',
    retryEnabled: true,
  },
  {
    id: 'mp-p-006',
    indexNo: 6,
    name: '黄仁怡',
    contactMasked: '158****5621',
    contact: '15812345621',
    participantCompany: '',
    registerTime: '2026-07-08',
    distributionChannels: channelText,
    accessTimePermission: '2026-07-08至2036-07-07',
    distributionStatusRuanjie: '下发成功',
    distributionStatusHikvision: '下发成功',
    retryEnabled: true,
  },
  {
    id: 'mp-p-007',
    indexNo: 7,
    name: '陈梦洁',
    contactMasked: '137****3318',
    contact: '13712343318',
    participantCompany: '',
    registerTime: '2026-07-08',
    distributionChannels: channelText,
    accessTimePermission: '2026-07-08至2036-07-07',
    distributionStatusRuanjie: '下发成功',
    distributionStatusHikvision: '下发成功',
    retryEnabled: true,
  },
];

/** 示意图分页：共 798 条 */
export const MID_PLATFORM_PERSONNEL_TOTAL = 798;

export function getMidPlatformPersonnelPage(page: number, pageSize: number): MidPlatformPersonnel[] {
  if (page === 1 && pageSize >= 10) {
    return mockMidPlatformPersonnelPage1;
  }
  return [];
}

export function maskContact(contact: string): string {
  if (contact.length < 7) return contact;
  return `${contact.slice(0, 3)}****${contact.slice(-4)}`;
}

export function formatDistributionChannels(ruanjie: boolean, hikvision: boolean): string {
  const parts: string[] = [];
  if (ruanjie) parts.push('软杰(同步人员及设备)');
  if (hikvision) parts.push('海康(仅同步人员)');
  return parts.join('\n');
}

export function formatChannelDisplay(ruanjie: boolean, hikvision: boolean): string {
  if (!ruanjie && !hikvision) return '未配置';
  return formatDistributionChannels(ruanjie, hikvision).replace('\n', ' ');
}

export function formatAccessPermission(range?: [string, string]): string {
  if (!range?.[0] || !range?.[1]) return '未配置';
  return `${range[0]}至${range[1]}`;
}
