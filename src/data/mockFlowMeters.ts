import type { FacilityDeviceType, FlowMeterDevice } from '../types/innovationCenter';

type RawDevice = Omit<
  FlowMeterDevice,
  'id' | 'floorId' | 'mapX' | 'mapY' | 'status' | 'flowRate' | 'unit' | 'lastUpdate'
>;

function resolveFloorId(roomNo: string): string {
  if (roomNo.includes('楼顶') || roomNo.includes('AP')) return 'building8-roof';
  if (roomNo.includes('4F') || roomNo.startsWith('84')) return 'building8-4f';
  if (roomNo.includes('3F') || roomNo.startsWith('83')) return 'building8-3f';
  return 'building8-4f';
}

function resolveMapPosition(roomNo: string, indexNo: number): { mapX: number; mapY: number } {
  const num = parseInt(roomNo.replace(/\D/g, ''), 10);
  if (Number.isNaN(num)) {
    return { mapX: 12 + (indexNo % 6) * 14, mapY: 82 + (indexNo % 3) * 4 };
  }
  const floorPrefix = Math.floor(num / 100);
  const roomOffset = num % 100;
  const col = (roomOffset % 10) * 8 + 10;
  const row = Math.floor(roomOffset / 10) * 11 + (floorPrefix === 84 ? 16 : 48);
  return { mapX: Math.min(94, col + (indexNo % 3)), mapY: Math.min(90, row + (indexNo % 2) * 3) };
}

function resolveStatus(indexNo: number): FlowMeterDevice['status'] {
  if (indexNo % 13 === 0) return 'alarm';
  if (indexNo % 6 === 0) return 'offline';
  return 'online';
}

function resolveInstallLocation(raw: RawDevice): string {
  const name = raw.name.trim();
  if (raw.roomNo && name.startsWith(raw.roomNo)) {
    return name;
  }
  return raw.roomNo ? `${raw.roomNo} ${name}` : name;
}

function enrichLedgerFields(
  raw: RawDevice,
  status: FlowMeterDevice['status'],
): Partial<FlowMeterDevice> {
  const installLocation = resolveInstallLocation(raw);
  const bindingStatus = status === 'offline' ? '未绑定' : '已绑定';
  const integrationFromIp = raw.ip
    ? raw.deviceType === '门禁' || raw.deviceType === '门禁控制器'
      ? `http://${raw.ip}:8000`
      : `modbus://${raw.ip}:502`
    : undefined;

  if (raw.deviceType === '门禁') {
    return {
      installLocation,
      integrationAddress: integrationFromIp,
      serialNo: raw.code,
      channelNo: String((raw.indexNo % 2) + 1),
      bindingStatus,
      brand: '海康威视',
      model: 'DS-K1T320',
      account: 'admin',
      password: '******',
    };
  }

  if (raw.deviceType === '门禁控制器') {
    return {
      installLocation,
      integrationAddress: raw.ip ? `http://${raw.ip}:8000/api` : undefined,
      serialNo: raw.code,
      channelNo: raw.spec?.includes('四') ? '1-4' : '1-2',
      bindingStatus,
      brand: '海康威视',
      model: raw.spec ?? '双门控制器',
      account: 'admin',
      password: '******',
    };
  }

  if (raw.deviceType === '摄像头') {
    return {
      installLocation,
      integrationAddress: raw.ip ? `rtsp://${raw.ip}:554` : undefined,
      serialNo: raw.code,
      channelNo: String(raw.indexNo),
      bindingStatus,
      brand: '海康威视',
      model: 'DS-2CD3T86',
      account: raw.account ?? 'admin',
      password: raw.password ?? '******',
    };
  }

  if (raw.deviceType === '会议屏') {
    return {
      installLocation,
      integrationAddress: raw.ip ? `http://${raw.ip}` : undefined,
      serialNo: raw.mac ?? raw.code,
      channelNo: '-',
      bindingStatus,
      brand: 'MAXHUB',
      model: 'ME65',
      account: '-',
      password: '-',
    };
  }

  const typeMeta: Partial<
    Record<FacilityDeviceType, { brand: string; model: string; integration?: string }>
  > = {
    纯水流量计: { brand: 'E+H', model: 'Promag 50', integration: 'modbus' },
    压差计: { brand: 'Setra', model: '267', integration: 'modbus' },
    电表: { brand: '正泰', model: 'DTSU666', integration: 'modbus' },
    温湿度传感器: { brand: '霍尼韦尔', model: 'HHT1', integration: 'modbus' },
    氧浓度: { brand: 'Teledyne', model: 'M400', integration: 'modbus' },
  };

  const meta = typeMeta[raw.deviceType];
  return {
    installLocation,
    integrationAddress:
      integrationFromIp ??
      (raw.gateway ? `gateway://${raw.gateway}` : undefined) ??
      (meta?.integration && raw.ip ? `${meta.integration}://${raw.ip}:502` : undefined),
    serialNo: raw.code,
    channelNo: '-',
    bindingStatus,
    brand: meta?.brand ?? '-',
    model: meta?.model ?? '-',
    account: '-',
    password: '-',
  };
}

function enrich(raw: RawDevice, globalIndex: number): FlowMeterDevice {
  const pos = resolveMapPosition(raw.roomNo, raw.indexNo);
  const status = resolveStatus(globalIndex);
  return {
    ...raw,
    ...enrichLedgerFields(raw, status),
    id: `${raw.deviceType}-${raw.indexNo}-${globalIndex}`,
    floorId: resolveFloorId(raw.roomNo),
    ...pos,
    status,
    flowRate:
      raw.deviceType === '纯水流量计' && status !== 'offline'
        ? 1.2 + (raw.indexNo % 8) * 0.35
        : undefined,
    unit: raw.deviceType === '纯水流量计' ? 'm³/h' : undefined,
    lastUpdate: '2026-08-03 09:15:00',
  };
}

/** 纯水流量计 23 条 */
const pureWaterFlowMeters: RawDevice[] = [
  { indexNo: 1, deviceType: '纯水流量计', roomNo: '8322', name: '8322-纯水室纯水表2', code: 'BIO8322-J01-51', ip: '172.16.20.78' },
  { indexNo: 2, deviceType: '纯水流量计', roomNo: '8322', name: '8322-纯水室纯水表1', code: 'BIO8322-J01-52', ip: '172.16.20.79' },
  { indexNo: 3, deviceType: '纯水流量计', roomNo: '8401', name: '8401-通用实验室1纯水表', code: 'BIO8401-J01-53', ip: '172.16.20.80' },
  { indexNo: 4, deviceType: '纯水流量计', roomNo: '8402', name: '8402-通用实验室2纯水表', code: 'BIO8402-J01-54', ip: '172.16.20.81' },
  { indexNo: 5, deviceType: '纯水流量计', roomNo: '8403', name: '8403-通用实验室3纯水表', code: 'BIO8403-J01-55', ip: '172.16.20.82' },
  { indexNo: 6, deviceType: '纯水流量计', roomNo: '8404', name: '8404-通用实验室4纯水表', code: 'BIO8404-J01-56', ip: '172.16.20.83' },
  { indexNo: 7, deviceType: '纯水流量计', roomNo: '8405', name: '8405-通用实验室6纯水表', code: 'BIO8405-J01-57', ip: '172.16.20.84' },
  { indexNo: 8, deviceType: '纯水流量计', roomNo: '8406', name: '8406-通用实验室7纯水表', code: 'BIO8406-J01-58', ip: '172.16.20.85' },
  { indexNo: 9, deviceType: '纯水流量计', roomNo: '8407', name: '8407-通用实验室9纯水表', code: 'BIO8407-J01-59', ip: '172.16.20.62' },
  { indexNo: 10, deviceType: '纯水流量计', roomNo: '8408', name: '8408-通用实验室5纯水表', code: 'BIO8408-J01-60', ip: '172.16.20.61' },
  { indexNo: 11, deviceType: '纯水流量计', roomNo: '8409', name: '8409-通用实验室8纯水表', code: 'BIO8409-J01-61', ip: '172.16.20.63' },
  { indexNo: 12, deviceType: '纯水流量计', roomNo: '8410', name: '8410-通用实验室10纯水表', code: 'BIO8410-J01-62', ip: '172.16.20.64' },
  { indexNo: 13, deviceType: '纯水流量计', roomNo: '8411', name: '8411-通用实验室11纯水表', code: 'BIO8411-J01-63', ip: '172.16.20.65' },
  { indexNo: 14, deviceType: '纯水流量计', roomNo: '8412', name: '8412-通用实验室12纯水表', code: 'BIO8412-J01-64', ip: '172.16.20.66' },
  { indexNo: 15, deviceType: '纯水流量计', roomNo: '8413', name: '8413-洗消间纯水表', code: 'BIO8413-J01-65', ip: '172.16.20.67' },
  { indexNo: 16, deviceType: '纯水流量计', roomNo: '8414', name: '8414-洗消间纯水表1', code: 'BIO8414-J01-66', ip: '172.16.20.68' },
  { indexNo: 17, deviceType: '纯水流量计', roomNo: '8415', name: '8415-净化室4纯水表', code: 'BIO8415-J01-67', ip: '172.16.20.69' },
  { indexNo: 18, deviceType: '纯水流量计', roomNo: '8418', name: '8418-净化室3纯水表', code: 'BIO8418-J01-68', ip: '172.16.20.70' },
  { indexNo: 19, deviceType: '纯水流量计', roomNo: '8419', name: '8419-净化室2纯水表', code: 'BIO8419-J01-69', ip: '172.16.20.71' },
  { indexNo: 20, deviceType: '纯水流量计', roomNo: '8423', name: '8423-净化室1纯水表', code: 'BIO8423-J01-70', ip: '172.16.20.72' },
  { indexNo: 21, deviceType: '纯水流量计', roomNo: '4F水井间', name: '4F水井间自来水表', code: 'BIO4FSJ-J01-71', ip: '172.16.20.59' },
  { indexNo: 22, deviceType: '纯水流量计', roomNo: '3F水井间', name: '3F水井间自来水表', code: 'BIO3FSJ-J01-72', ip: '172.16.20.74' },
  { indexNo: 23, deviceType: '纯水流量计', roomNo: '8322', name: '8322-自来水表', code: 'BIO3FSJ-J01-73', ip: '172.16.20.75' },
];

/** 压差计 6 条 */
const pressureGauges: RawDevice[] = [
  { indexNo: 1, deviceType: '压差计', roomNo: '8415', name: '8415-净化室4压差计', code: 'BI08415-Y01', ip: '' },
  { indexNo: 2, deviceType: '压差计', roomNo: '8418', name: '8418-净化室3压差计', code: 'BI08418-Y02', ip: '' },
  { indexNo: 3, deviceType: '压差计', roomNo: '8419', name: '8419-净化室2压差计', code: 'BI08419-Y03', ip: '' },
  { indexNo: 4, deviceType: '压差计', roomNo: '8423', name: '8423-净化室1压差计', code: 'BI08423-Y04', ip: '' },
  { indexNo: 5, deviceType: '压差计', roomNo: '8323', name: '8323-净化室2压差计', code: 'BI08323-Y05', ip: '' },
  { indexNo: 6, deviceType: '压差计', roomNo: '8327', name: '8327-净化室1压差计', code: 'BI08327-Y06', ip: '' },
];

/** 电表 39 条 */
const electricMeters: RawDevice[] = (() => {
  const list: RawDevice[] = [];
  for (let i = 1; i <= 12; i++) {
    list.push({
      indexNo: i,
      deviceType: '电表',
      roomNo: `840${i}`,
      name: `840${i}-通用实验室${i}电表`,
      code: `BIO840${i}-4AP${18 + i}`,
      ip: `172.16.20.${117 + i}`,
    });
  }
  const extras: Array<[number, string, string, string, string]> = [
    [13, '8413', '8413-洗消间电表', 'BIO8413-4AP31', '172.16.20.130'],
    [14, '8414', '8414-洗消间电表', 'BIO8414-4AP32', '172.16.20.131'],
    [15, '8415', '8415-净化室4电表', 'BIO8415-4AP33', '172.16.20.132'],
    [16, '8418', '8418-净化室3电表', 'BIO8418-4AP34', '172.16.20.133'],
    [17, '8419', '8419-净化室2电表', 'BIO8419-4AP35', '172.16.20.134'],
    [18, '8423', '8423-净化室1电表', 'BIO8423-4AP36', '172.16.20.135'],
    [19, '空调外机房', '4F空调外机房电表', 'BIO4WJ', '172.16.20.136'],
    [20, '4F强电间', '4F强电间电表', 'BIO4QD', '172.16.20.137'],
    [21, '8301', '8301-三层会议室1电表', 'BIO8301-3AP22', '172.16.20.138'],
    [22, '8304', '8304-三层会议室2电表', 'BIO8304-3AP23', '172.16.20.139'],
    [23, '8322', '8322-纯水室电表', 'BIO8322-3AP24', '172.16.20.140'],
    [24, '8319', '8319-气瓶间电表', 'BIO8319-3AP25', '172.16.20.141'],
    [25, '8320', '8320-净化室2电表', 'BIO8320-3AP26', '172.16.20.142'],
    [26, '8323', '8323-净化室2电表', 'BIO8323-3AP27', '172.16.20.143'],
    [27, '8324', '8324-仪器室1电表', 'BIO8324-3AP28', '172.16.20.144'],
    [28, '8325', '8325-仪器室2电表', 'BIO8325-3AP29', '172.16.20.145'],
    [29, '8327', '8327-净化室1电表', 'BIO8327-3AP30', '172.16.20.146'],
    [30, '8302', '8302-办公室1电表', 'BIO8302-3AP31', '172.16.20.147'],
    [31, '8319外机柜', '8319外机柜电表', 'BIO8319-WJ', '172.16.20.148'],
    [32, '8409', '8409-四层会议室电表', 'BIO8409-4AP37', '172.16.20.149'],
    [33, '8410', '8410-通用实验室10电表2', 'BIO8410-4AP38', '172.16.20.150'],
    [34, '8411', '8411-通用实验室11电表2', 'BIO8411-4AP39', '172.16.20.151'],
    [35, '8412', '8412-通用实验室12电表2', 'BIO8412-4AP40', '172.16.20.152'],
    [36, '8420', '8420-净化室2电表', 'BIO8420-4AP41', '172.16.20.153'],
    [37, '8421', '8421-仪器室电表', 'BIO8421-4AP42', '172.16.20.154'],
    [38, '8422', '8422-仪器室2电表', 'BIO8422-4AP43', '172.16.20.155'],
    [39, '3F强电间', '3F强电间电表', 'BIO3QD', '172.16.20.156'],
  ];
  extras.forEach(([indexNo, roomNo, name, code, ip]) => {
    list.push({ indexNo, deviceType: '电表', roomNo, name, code, ip });
  });
  return list;
})();

/** 温湿度传感器 22 条 */
const tempHumidity: RawDevice[] = (() => {
  const labs = [
    [8401, '通用实验室1'], [8402, '通用实验室2'], [8403, '通用实验室3'], [8404, '通用实验室4'],
    [8405, '通用实验室6'], [8406, '通用实验室7'], [8407, '通用实验室9'], [8408, '通用实验室5'],
    [8409, '通用实验室8'], [8410, '通用实验室10'], [8411, '通用实验室11'], [8412, '通用实验室12'],
    [8413, '洗消间'], [8414, '洗消间'], [8415, '净化室4'], [8418, '净化室3'],
    [8419, '净化室2'], [8423, '净化室1'], [8319, '气瓶间'], [8324, '仪器室1'],
    [8325, '仪器室2'], [8327, '净化室1'],
  ];
  return labs.map(([room, label], i) => ({
    indexNo: i + 1,
    deviceType: '温湿度传感器' as FacilityDeviceType,
    roomNo: String(room),
    name: `${room}-${label}温湿度`,
    code: `BI0${room}-W${String(i + 1).padStart(2, '0')}`,
    ip: '',
  }));
})();

/** 氧浓度 10 条 */
const oxygenDevices: RawDevice[] = [
  { indexNo: 1, deviceType: '氧浓度', roomNo: '8320', name: '8320-净化室2氧浓度', code: 'BI08320-001', ip: '172.16.20.150' },
  { indexNo: 2, deviceType: '氧浓度', roomNo: '8325', name: '8325-仪器室2氧浓度', code: 'BI08325-002', ip: '172.16.20.151' },
  { indexNo: 3, deviceType: '氧浓度', roomNo: '8413', name: '8413-洗消间氧浓度', code: 'BI08413-003', ip: '172.16.20.152' },
  { indexNo: 4, deviceType: '氧浓度', roomNo: '8319', name: '8319-气瓶间氧浓度', code: 'BI08319-004', ip: '172.16.20.153' },
  { indexNo: 5, deviceType: '氧浓度', roomNo: '8324', name: '8324-仪器室1氧浓度', code: 'BI08324-005', ip: '172.16.20.154' },
  { indexNo: 6, deviceType: '氧浓度', roomNo: '3F货梯厅', name: '3F货梯厅进口北侧过道氧浓度', code: 'BIO过道-006', ip: '3F氧浓度主机' },
  { indexNo: 7, deviceType: '氧浓度', roomNo: '8420', name: '8420-净化室2氧浓度', code: 'BI08420-007', ip: '172.16.20.155' },
  { indexNo: 8, deviceType: '氧浓度', roomNo: '8415', name: '8415-净化室4氧浓度', code: 'BI08415-008', ip: '172.16.20.156' },
  { indexNo: 9, deviceType: '氧浓度', roomNo: '8327', name: '8327-净化室1氧浓度', code: 'BI08327-009', ip: '172.16.20.157' },
  { indexNo: 10, deviceType: '氧浓度', roomNo: '3F', name: '3F氧浓度主机', code: 'BIO3F-O2-HOST', ip: '172.16.20.158', gateway: '3F氧浓度主机' },
];

/** 门禁 */
const accessControls: RawDevice[] = [
  '8302-办公室1', '8304-三层会议室2', '8318-资料室', '8319-气瓶间', '8320-净化室2',
  '8322-纯水室', '8323-净化室2', '8324-仪器室1', '8325-仪器室2', '8327-净化室1',
  '8401-通用实验室1', '8402-通用实验室2', '8403-通用实验室3', '8404-通用实验室4',
  '8405-通用实验室6', '8406-通用实验室7', '8407-通用实验室9', '8408-通用实验室5',
  '8409-通用实验室8', '8410-通用实验室10', '8411-通用实验室11', '8412-通用实验室12',
  '8413-洗消间', '8414-洗消间', '8415-净化室4', '8418-净化室3', '8419-净化室2', '8423-净化室1',
].map((label, i) => {
  const room = label.slice(0, 4);
  return {
    indexNo: i + 1,
    deviceType: '门禁' as FacilityDeviceType,
    roomNo: room,
    name: `${label}门禁`,
    code: `BIO${room}-A01-${105 + i}`,
    ip: `172.16.21.${40 + (i % 20)}`,
  };
});

/** 摄像头 21 条 */
const cameras: RawDevice[] = [
  { indexNo: 1, deviceType: '摄像头', roomNo: '4F货梯厅', name: '4F货梯厅摄像头', code: 'haikang_01', ip: '172.16.21.162', account: 'admin', password: '1234qwer' },
  { indexNo: 2, deviceType: '摄像头', roomNo: '4F', name: '4F-8415净化室4进口摄像头', code: 'haikang_02', ip: '172.16.21.163', account: 'admin', password: '1234qwer' },
  { indexNo: 3, deviceType: '摄像头', roomNo: '8418', name: '8418-净化室3进口摄像头', code: 'haikang_03', ip: '172.16.21.164', account: 'admin', password: '1234qwer' },
  { indexNo: 4, deviceType: '摄像头', roomNo: '8419', name: '8419-净化室2进口摄像头', code: 'haikang_04', ip: '172.16.21.165', account: 'admin', password: '1234qwer' },
  { indexNo: 5, deviceType: '摄像头', roomNo: '8423', name: '8423-净化室1进口摄像头', code: 'haikang_05', ip: '172.16.21.166', account: 'admin', password: '1234qwer' },
  { indexNo: 6, deviceType: '摄像头', roomNo: '8401', name: '8401-通用实验室1摄像头', code: 'haikang_06', ip: '172.16.21.167', account: 'admin', password: '1234qwer' },
  { indexNo: 7, deviceType: '摄像头', roomNo: '8407', name: '8407-通用实验室9摄像头', code: 'haikang_07', ip: '172.16.21.168', account: 'admin', password: '1234qwer' },
  { indexNo: 8, deviceType: '摄像头', roomNo: '8413', name: '8413-洗消间摄像头', code: 'haikang_08', ip: '172.16.21.169', account: 'admin', password: '1234qwer' },
  { indexNo: 9, deviceType: '摄像头', roomNo: '3F', name: '3F-8322纯水室进口摄像头', code: 'haikang_09', ip: '172.16.21.170', account: 'admin', password: '1234qwer' },
  { indexNo: 10, deviceType: '摄像头', roomNo: '8319', name: '8319-气瓶间摄像头', code: 'haikang_10', ip: '172.16.21.171', account: 'admin', password: '1234qwer' },
  { indexNo: 11, deviceType: '摄像头', roomNo: '8320', name: '8320-净化室2摄像头', code: 'haikang_11', ip: '172.16.21.172', account: 'admin', password: '1234qwer' },
  { indexNo: 12, deviceType: '摄像头', roomNo: '8324', name: '8324-仪器室1摄像头', code: 'haikang_12', ip: '172.16.21.173', account: 'admin', password: '1234qwer' },
  { indexNo: 13, deviceType: '摄像头', roomNo: '8301', name: '8301-三层会议室1摄像头', code: 'haikang_13', ip: '172.16.21.174', account: 'admin', password: '1234qwer' },
  { indexNo: 14, deviceType: '摄像头', roomNo: '8304', name: '8304-三层会议室2摄像头', code: 'haikang_14', ip: '172.16.21.175', account: 'admin', password: '1234qwer' },
  { indexNo: 15, deviceType: '摄像头', roomNo: '8409', name: '8409-四层会议室摄像头', code: 'haikang_15', ip: '172.16.21.176', account: 'admin', password: '1234qwer' },
  { indexNo: 16, deviceType: '摄像头', roomNo: '8402', name: '8402-通用实验室2摄像头', code: 'haikang_16', ip: '172.16.21.177', account: 'admin', password: '1234qwer' },
  { indexNo: 17, deviceType: '摄像头', roomNo: '8404', name: '8404-通用实验室4摄像头', code: 'haikang_17', ip: '172.16.21.178', account: 'admin', password: '1234qwer' },
  { indexNo: 18, deviceType: '摄像头', roomNo: '8410', name: '8410-通用实验室10摄像头', code: 'haikang_18', ip: '172.16.21.179', account: 'admin', password: '1234qwer' },
  { indexNo: 19, deviceType: '摄像头', roomNo: '8411', name: '8411-通用实验室11摄像头', code: 'haikang_19', ip: '172.16.21.180', account: 'admin', password: '1234qwer' },
  { indexNo: 20, deviceType: '摄像头', roomNo: '8412', name: '8412-通用实验室12摄像头', code: 'haikang_20', ip: '172.16.21.181', account: 'admin', password: '1234qwer' },
  { indexNo: 21, deviceType: '摄像头', roomNo: '机房', name: 'NVR视频存储', code: 'NVR-001', ip: '172.16.21.8', account: 'admin', password: '1234qwer' },
];

/** 会议屏 3 条 */
const meetingScreens: RawDevice[] = [
  { indexNo: 1, deviceType: '会议屏', roomNo: '8409', name: '8409-四层会议室会议屏', code: 'A4:58:0F:4B:37:C5', ip: '172.16.21.30', mac: 'A4:58:0F:4B:37:C5' },
  { indexNo: 2, deviceType: '会议屏', roomNo: '8301', name: '8301-三层会议室1会议屏', code: 'A4:58:0F:4B:37:C6', ip: '172.16.21.31', mac: 'A4:58:0F:4B:37:C6' },
  { indexNo: 3, deviceType: '会议屏', roomNo: '8304', name: '8304-三层会议室2会议屏', code: 'A4:58:0F:4B:37:C7', ip: '172.16.21.32', mac: 'A4:58:0F:4B:37:C7' },
];

/** 门禁控制器 3 条 */
const accessControllers: RawDevice[] = [
  { indexNo: 1, deviceType: '门禁控制器', roomNo: '8409', name: '8409-四层会议室门禁控制器', code: 'CA-3220T20120330', ip: '172.16.21.40', spec: '双门控制器' },
  { indexNo: 2, deviceType: '门禁控制器', roomNo: '8304', name: '3F南侧8304小会议室门禁控制器', code: 'CA-3220T20110019', ip: '172.16.21.41', spec: '双门控制器' },
  { indexNo: 3, deviceType: '门禁控制器', roomNo: '8322', name: '3F北侧9U机柜门禁控制器', code: 'CA-3240T41110030', ip: '172.16.21.42', spec: '四门控制器' },
];

const allRaw: RawDevice[] = [
  ...pureWaterFlowMeters,
  ...pressureGauges,
  ...electricMeters,
  ...tempHumidity,
  ...oxygenDevices,
  ...accessControls,
  ...cameras,
  ...meetingScreens,
  ...accessControllers,
];

export const mockFlowMeters: FlowMeterDevice[] = allRaw.map((item, i) =>
  enrich(item, i + 1),
);

export function getFlowMetersByFloor(floorId: string): FlowMeterDevice[] {
  return mockFlowMeters.filter((d) => d.floorId === floorId);
}

export function getDevicesByType(type: FacilityDeviceType): FlowMeterDevice[] {
  return mockFlowMeters.filter((d) => d.deviceType === type);
}

export function countDevicesByType(type: FacilityDeviceType): number {
  return getDevicesByType(type).length;
}
