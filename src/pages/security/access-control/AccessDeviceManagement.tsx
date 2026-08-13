import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Space,
  Table,
  Tabs,
} from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { FacilityDeviceType, FlowMeterDevice } from '../../../types/innovationCenter';
import { countDevicesByType, getDevicesByType } from '../../../data/mockFlowMeters';
import { buildDeviceLedgerColumns } from '../../../config/deviceLedgerColumns';
import DeviceLedgerDetailModal from '../../../components/DeviceLedgerDetailModal';
import '../../innovation-center/InnovationCenter.css';
import '../SecurityPages.css';

const ACCESS_DEVICE_TYPES: FacilityDeviceType[] = ['门禁', '门禁控制器'];

interface SearchForm {
  installLocation?: string;
  name?: string;
  code?: string;
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

  const columns = useMemo(
    () =>
      buildDeviceLedgerColumns((record) => (
        <a onClick={() => onView(record)}>查看详情</a>
      )),
    [onView],
  );

  const filteredData = useMemo(() => {
    return getDevicesByType(deviceType).filter((item) => {
      const location = item.installLocation || item.roomNo;
      if (search.installLocation && !location.includes(search.installLocation.trim())) return false;
      if (search.name && !item.name.includes(search.name.trim())) return false;
      if (search.code && !item.code.includes(search.code.trim())) return false;
      return true;
    });
  }, [deviceType, search]);

  return (
    <>
      <div className="security-search-bar">
        <Form form={form} layout="inline" className="security-search-form">
          <Form.Item label="安装位置" name="installLocation">
            <Input placeholder="请输入 安装位置" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="设备名称" name="name">
            <Input placeholder="请输入 设备名称" allowClear style={{ width: 180 }} />
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

      <div className="security-table-card">
        <div className="security-table-toolbar">
          <Button type="primary" icon={<PlusOutlined />}>
            新增
          </Button>
          <Space size="middle" className="security-table-utils">
            <ReloadOutlined title="刷新" />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <DownloadOutlined title="导出" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<FlowMeterDevice>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1800 }}
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

export default function AccessDeviceManagement() {
  const totalCount = ACCESS_DEVICE_TYPES.reduce((sum, t) => sum + countDevicesByType(t), 0);
  const [detailDevice, setDetailDevice] = useState<FlowMeterDevice | null>(null);

  return (
    <div className="security-page">
      <div className="flow-meter-summary">
        <span>门禁设备总数 <strong>{totalCount}</strong> 台</span>
        <span className="flow-meter-summary-divider">|</span>
        {ACCESS_DEVICE_TYPES.map((type) => (
          <span key={type}>
            {type} {countDevicesByType(type)} 台
          </span>
        ))}
      </div>

      <Tabs
        className="flow-meter-tabs"
        defaultActiveKey="门禁"
        items={ACCESS_DEVICE_TYPES.map((type) => ({
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

      <DeviceLedgerDetailModal
        device={detailDevice}
        open={detailDevice !== null}
        onClose={() => setDetailDevice(null)}
      />
    </div>
  );
}
