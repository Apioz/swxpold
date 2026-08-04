import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Space,
  Table,
  Tabs,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { FacilityDeviceType, FlowMeterDevice } from '../../types/innovationCenter';
import {
  DEVICE_TYPE_COLUMN_LABELS,
  FACILITY_DEVICE_TYPES,
} from '../../types/innovationCenter';
import {
  countDevicesByType,
  getDevicesByType,
  mockFlowMeters,
} from '../../data/mockFlowMeters';
import FlowMeterDeviceDetailModal from './FlowMeterDeviceDetailModal';
import './InnovationCenter.css';

interface SearchForm {
  roomNo?: string;
  name?: string;
  code?: string;
}

function buildColumns(
  type: FacilityDeviceType,
  onView: (device: FlowMeterDevice) => void,
): ColumnsType<FlowMeterDevice> {
  const labels = DEVICE_TYPE_COLUMN_LABELS[type];
  const cols: ColumnsType<FlowMeterDevice> = [
    { title: '设备编号', dataIndex: 'indexNo', width: 90, align: 'center' },
    { title: '房间号', dataIndex: 'roomNo', width: 100, render: (v) => v || '-' },
    { title: labels.name, dataIndex: 'name', width: 240, ellipsis: true },
    { title: labels.code, dataIndex: 'code', width: 160, ellipsis: true },
  ];

  if (labels.ip) {
    cols.push({
      title: labels.ip,
      dataIndex: 'ip',
      width: 140,
      render: (v: string) => v || '-',
    });
  }

  if (type === '门禁控制器') {
    cols.splice(3, 0, {
      title: '规格',
      dataIndex: 'spec',
      width: 110,
      render: (v: string) => v || '-',
    });
  }

  if (type === '摄像头') {
    cols.push(
      { title: '账号', dataIndex: 'account', width: 90 },
      { title: '密码', dataIndex: 'password', width: 100 },
    );
  }

  if (type === '会议屏') {
    cols.push({
      title: 'MAC地址',
      dataIndex: 'mac',
      width: 150,
      render: (v: string) => v || '-',
    });
  }

  cols.push({
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right',
    render: (_, record) => (
      <a onClick={() => onView(record)}>查看</a>
    ),
  });

  return cols;
}

function DeviceTable({
  deviceType,
  onView,
}: {
  deviceType: FacilityDeviceType;
  onView: (device: FlowMeterDevice) => void;
}) {
  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50'],
  });

  const filteredData = useMemo(() => {
    return getDevicesByType(deviceType).filter((item) => {
      if (search.roomNo && !item.roomNo.includes(search.roomNo.trim())) return false;
      if (search.name && !item.name.includes(search.name.trim())) return false;
      if (search.code && !item.code.includes(search.code.trim())) return false;
      return true;
    });
  }, [deviceType, search]);

  return (
    <>
      <div className="innovation-search-bar">
        <Form form={form} layout="inline" className="innovation-search-form">
          <Form.Item label="房间号" name="roomNo">
            <Input placeholder="请输入 房间号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="设备命名" name="name">
            <Input placeholder="请输入 设备命名" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="设备编号" name="code">
            <Input placeholder="请输入 设备编号" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  setSearch(form.getFieldsValue());
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields();
                  setSearch({});
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="innovation-table-card">
        <div className="innovation-table-toolbar">
          <Button type="primary" icon={<PlusOutlined />}>
            新增
          </Button>
          <Space size="middle" className="innovation-table-utils">
            <ReloadOutlined title="刷新" />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <DownloadOutlined title="导出" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<FlowMeterDevice>
          rowKey="id"
          columns={buildColumns(deviceType, onView)}
          dataSource={filteredData}
          scroll={{ x: 1100 }}
          pagination={{
            ...pagination,
            total: filteredData.length,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
        />
      </div>
    </>
  );
}

export default function FlowMeterManagement() {
  const totalCount = mockFlowMeters.length;
  const [detailDevice, setDetailDevice] = useState<FlowMeterDevice | null>(null);

  return (
    <div className="innovation-page">
      <div className="flow-meter-summary">
        <span>设备总数 <strong>{totalCount}</strong> 台</span>
        <span className="flow-meter-summary-divider">|</span>
        {FACILITY_DEVICE_TYPES.map((type) => (
          <span key={type}>
            {type} {countDevicesByType(type)} 台
          </span>
        ))}
      </div>

      <Tabs
        className="flow-meter-tabs"
        defaultActiveKey="纯水流量计"
        items={FACILITY_DEVICE_TYPES.map((type) => ({
          key: type,
          label: `${type}（${countDevicesByType(type)}）`,
          children: (
            <DeviceTable
              deviceType={type}
              onView={(device) => setDetailDevice(device)}
            />
          ),
        }))}
      />
      <FlowMeterDeviceDetailModal
        device={detailDevice}
        open={detailDevice !== null}
        onClose={() => setDetailDevice(null)}
      />
    </div>
  );
}
