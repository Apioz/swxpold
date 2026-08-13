import type { ReactNode } from 'react';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FlowMeterDevice } from '../types/innovationCenter';

const monitorStatusMap = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  alarm: { color: 'error', text: '报警' },
} as const;

function renderText(value?: string) {
  return value?.trim() ? value : '-';
}

function renderMonitorStatus(status: FlowMeterDevice['status']) {
  const s = monitorStatusMap[status];
  return <Tag color={s.color}>{s.text}</Tag>;
}

/** 设备管理列表统一台账列（所有设备管理页面共用） */
export function buildDeviceLedgerColumns(
  renderAction: (device: FlowMeterDevice) => ReactNode,
): ColumnsType<FlowMeterDevice> {
  return [
    {
      title: '安装位置',
      dataIndex: 'installLocation',
      width: 160,
      ellipsis: true,
      fixed: 'left',
      render: (v: string, r) => renderText(v || r.roomNo),
    },
    { title: '设备类型', dataIndex: 'deviceType', width: 110 },
    {
      title: '对接地址',
      dataIndex: 'integrationAddress',
      width: 160,
      ellipsis: true,
      render: (v: string) => renderText(v),
    },
    { title: '设备名称', dataIndex: 'name', width: 200, ellipsis: true },
    { title: '设备编号', dataIndex: 'code', width: 150, ellipsis: true },
    {
      title: '序列号/SN',
      dataIndex: 'serialNo',
      width: 150,
      ellipsis: true,
      render: (v: string, r) => renderText(v || r.code),
    },
    {
      title: '通道号',
      dataIndex: 'channelNo',
      width: 80,
      align: 'center',
      render: (v: string) => renderText(v),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      width: 130,
      render: (v: string) => renderText(v),
    },
    {
      title: '绑定状态',
      dataIndex: 'bindingStatus',
      width: 90,
      align: 'center',
      render: (v: string) => renderText(v),
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      width: 90,
      render: (v: string) => renderText(v),
    },
    {
      title: '型号',
      dataIndex: 'model',
      width: 110,
      ellipsis: true,
      render: (v: string, r) => renderText(v || r.spec),
    },
    {
      title: '监测状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (status: FlowMeterDevice['status']) => renderMonitorStatus(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 88,
      fixed: 'right',
      align: 'center',
      render: (_, record) => renderAction(record),
    },
  ];
}
