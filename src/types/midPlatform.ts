/** 生物芯片中台-运营管理 · 人员管理 */

export interface MidPlatformPersonnelIdentity {
  id: string;
  participantCompany: string;
  contact: string;
  department: string;
  employeeNo: string;
  registerTime: string;
  licensePlate: string;
  contactPerson?: string;
}

export interface MidPlatformPersonnelDevice {
  id: string;
  indexNo: number;
  deviceType: string;
  deviceName: string;
  online: string;
  accessTimePermission: string;
}

export interface MidPlatformPersonnel {
  id: string;
  indexNo: number;
  name: string;
  contactMasked: string;
  contact: string;
  participantCompany: string;
  registerTime: string;
  distributionChannels: string;
  accessTimePermission: string;
  distributionStatusRuanjie: string;
  distributionStatusHikvision: string;
  retryEnabled: boolean;
  wechat?: string;
  idCard?: string;
  gender?: string;
  channelsRuanjie?: boolean;
  channelsHikvision?: boolean;
  identities?: MidPlatformPersonnelIdentity[];
  devices?: MidPlatformPersonnelDevice[];
}

export interface MidPlatformPersonnelFormValues {
  name: string;
  contact: string;
  wechat?: string;
  idCard: string;
  gender: string;
  channelsRuanjie: boolean;
  channelsHikvision: boolean;
  accessTimeRange?: [string, string];
  identities: MidPlatformPersonnelIdentity[];
}
