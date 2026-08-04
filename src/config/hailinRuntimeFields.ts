import type { ColumnsType } from 'antd/es/table';
import type { HailinMeterRuntime, HailinSensorStatus } from '../types/hailinMeter';

function sensorText(value: HailinSensorStatus | string) {
  return value || '-';
}

function numText(value: number | string | null | undefined, offline?: boolean) {
  if (offline) return '--';
  if (value == null || value === '') return '-';
  return String(value);
}

/** 能量计实时监测字段列（与业务字段表一致） */
export function buildHailinRuntimeColumns(): ColumnsType<HailinMeterRuntime> {
  return [
    { title: '设备名称', dataIndex: 'deviceName', width: 90, fixed: 'left' },
    { title: '所属房间', dataIndex: 'room', width: 100, fixed: 'left' },
    {
      title: '状态',
      dataIndex: 'statusText',
      width: 72,
      fixed: 'left',
    },
    { title: '更新时间', dataIndex: 'updateTime', width: 110 },
    {
      title: '标准累计流量(m³)',
      dataIndex: 'stdCumulativeFlow',
      width: 130,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    {
      title: '标准瞬时流量(m³/h)',
      dataIndex: 'stdInstantFlow',
      width: 140,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    {
      title: '标准热功率(Wh)',
      dataIndex: 'stdThermalPower',
      width: 120,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    {
      title: '标准当前热',
      dataIndex: 'stdCurrentHeat',
      width: 110,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    {
      title: '标准当前冷',
      dataIndex: 'stdCurrentCold',
      width: 110,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    { title: '积分仪故障', dataIndex: 'integratorFault', width: 96, render: sensorText },
    { title: '进水温度传感器', dataIndex: 'inletTempSensor', width: 120, render: sensorText },
    { title: '回水温度传感器', dataIndex: 'returnTempSensor', width: 120, render: sensorText },
    { title: '流量传感器', dataIndex: 'flowSensor', width: 96, render: sensorText },
    {
      title: '电池电压',
      dataIndex: 'batteryVoltage',
      width: 90,
      render: (v) => v || '-',
    },
    {
      title: '累计工作时间',
      dataIndex: 'cumulativeWorkHours',
      width: 110,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    {
      title: '回水温度(℃)',
      dataIndex: 'returnWaterTemp',
      width: 100,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    {
      title: '供水温度(℃)',
      dataIndex: 'supplyWaterTemp',
      width: 100,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    { title: '累计流量单位', dataIndex: 'cumulativeFlowUnit', width: 100 },
    {
      title: '累计流量',
      dataIndex: 'cumulativeFlow',
      width: 110,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    { title: '瞬时流量单位', dataIndex: 'instantFlowUnit', width: 100 },
    {
      title: '瞬时流量',
      dataIndex: 'instantFlow',
      width: 90,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    { title: '功率单位', dataIndex: 'powerUnit', width: 80 },
    {
      title: '热功率',
      dataIndex: 'thermalPower',
      width: 80,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    { title: '热量单位', dataIndex: 'heatUnit', width: 80 },
    {
      title: '当前热量',
      dataIndex: 'currentHeat',
      width: 90,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
    { title: '冷量单位', dataIndex: 'coldUnit', width: 80 },
    {
      title: '当前冷量',
      dataIndex: 'currentCold',
      width: 90,
      align: 'right',
      render: (v, r) => numText(v, r.status === 'offline'),
    },
  ];
}

/** 详情面板字段行 */
export function getHailinRuntimeDetailRows(
  runtime: HailinMeterRuntime,
): Array<{ label: string; value: string }> {
  const offline = runtime.status === 'offline';
  const n = (v: number | string | null | undefined) => numText(v, offline);

  return [
    { label: '设备名称', value: runtime.deviceName },
    { label: '所属房间', value: runtime.room },
    { label: '状态', value: runtime.statusText },
    { label: '更新时间', value: runtime.updateTime },
    { label: '标准累计流量(m³)', value: n(runtime.stdCumulativeFlow) },
    { label: '标准瞬时流量(m³/h)', value: n(runtime.stdInstantFlow) },
    { label: '标准热功率(Wh)', value: n(runtime.stdThermalPower) },
    { label: '标准当前热', value: n(runtime.stdCurrentHeat) },
    { label: '标准当前冷', value: n(runtime.stdCurrentCold) },
    { label: '积分仪故障', value: sensorText(runtime.integratorFault) },
    { label: '进水温度传感器', value: sensorText(runtime.inletTempSensor) },
    { label: '回水温度传感器', value: sensorText(runtime.returnTempSensor) },
    { label: '流量传感器', value: sensorText(runtime.flowSensor) },
    { label: '电池电压', value: runtime.batteryVoltage || '-' },
    { label: '累计工作时间', value: n(runtime.cumulativeWorkHours) },
    { label: '回水温度(℃)', value: n(runtime.returnWaterTemp) },
    { label: '供水温度(℃)', value: n(runtime.supplyWaterTemp) },
    { label: '累计流量单位', value: runtime.cumulativeFlowUnit },
    { label: '累计流量', value: n(runtime.cumulativeFlow) },
    { label: '瞬时流量单位', value: runtime.instantFlowUnit },
    { label: '瞬时流量', value: n(runtime.instantFlow) },
    { label: '功率单位', value: runtime.powerUnit },
    { label: '热功率', value: n(runtime.thermalPower) },
    { label: '热量单位', value: runtime.heatUnit },
    { label: '当前热量', value: n(runtime.currentHeat) },
    { label: '冷量单位', value: runtime.coldUnit },
    { label: '当前冷量', value: n(runtime.currentCold) },
  ];
}
