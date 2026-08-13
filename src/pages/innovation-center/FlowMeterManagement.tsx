import { useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Form,
  Input,
  Space,
  Table,
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { TablePaginationConfig } from 'antd/es/table';
import {
  CloudOutlined,
  ColumnHeightOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { FlowMeterManagementDeviceType, FlowMeterDevice } from '../../types/innovationCenter';
import { FLOW_METER_MANAGEMENT_TYPES } from '../../types/innovationCenter';
import { countDevicesByType, getDevicesByType } from '../../data/mockFlowMeters';
import { buildDeviceLedgerColumns } from '../../config/deviceLedgerColumns';
import FlowMeterDataChartModal from './FlowMeterDataChartModal';
import FlowMeterMeterAction from './FlowMeterMeterAction';
import './InnovationCenter.css';

interface SearchForm {
  installLocation?: string;
  name?: string;
  code?: string;
}

const typeIcons: Record<FlowMeterManagementDeviceType, ReactNode> = {
  纯水流量计: <ExperimentOutlined className="flow-meter-tree-icon" />,
  压差计: <ColumnHeightOutlined className="flow-meter-tree-icon" />,
  温湿度传感器: <CloudOutlined className="flow-meter-tree-icon" />,
};

function buildTreeData(): DataNode[] {
  return [
    {
      key: 'flow-meter-root',
      title: '创新中心设备',
      selectable: false,
      children: FLOW_METER_MANAGEMENT_TYPES.map((type) => ({
        key: type,
        title: `${type}（${countDevicesByType(type)}）`,
        icon: typeIcons[type],
        isLeaf: true,
      })),
    },
  ];
}

function filterTreeNodes(nodes: DataNode[], keyword: string): DataNode[] {
  if (!keyword.trim()) return nodes;
  const kw = keyword.trim().toLowerCase();

  return nodes
    .map((node) => {
      const children = node.children ? filterTreeNodes(node.children, keyword) : undefined;
      const titleText = String(node.title ?? '').toLowerCase();
      const matched = titleText.includes(kw) || Boolean(children?.length);
      if (!matched) return null;
      return { ...node, children };
    })
    .filter(Boolean) as DataNode[];
}

function DeviceTable({
  deviceType,
  onView,
}: {
  deviceType: FlowMeterManagementDeviceType;
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
      const location = item.installLocation || item.roomNo;
      if (search.installLocation && !location.includes(search.installLocation.trim())) return false;
      if (search.name && !item.name.includes(search.name.trim())) return false;
      if (search.code && !item.code.includes(search.code.trim())) return false;
      return true;
    });
  }, [deviceType, search]);

  const columns = useMemo(
    () =>
      buildDeviceLedgerColumns((record) => (
        <FlowMeterMeterAction device={record} onOpen={() => onView(record)} />
      )),
    [onView],
  );

  return (
    <>
      <div className="innovation-search-bar">
        <Form form={form} layout="inline" className="innovation-search-form">
          <Form.Item label="安装位置" name="installLocation">
            <Input placeholder="请输入 安装位置" allowClear style={{ width: 140 }} />
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

export default function FlowMeterManagement() {
  const [treeSearch, setTreeSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FlowMeterManagementDeviceType>('纯水流量计');
  const [detailDevice, setDetailDevice] = useState<FlowMeterDevice | null>(null);

  const treeData = useMemo(() => buildTreeData(), []);
  const filteredTreeData = useMemo(
    () => filterTreeNodes(treeData, treeSearch),
    [treeData, treeSearch],
  );

  const totalCount = FLOW_METER_MANAGEMENT_TYPES.reduce(
    (sum, type) => sum + countDevicesByType(type),
    0,
  );

  return (
    <div className="innovation-page flow-meter-manage-page">
      <div className="flow-meter-summary">
        <span>设备总数 <strong>{totalCount}</strong> 台</span>
        <span className="flow-meter-summary-divider">|</span>
        {FLOW_METER_MANAGEMENT_TYPES.map((type) => (
          <span key={type}>
            {type} {countDevicesByType(type)} 台
          </span>
        ))}
      </div>

      <div className="flow-meter-manage-body">
        <div className="flow-meter-tree-panel">
          <div className="flow-meter-tree-panel-head">
            <span className="panel-title">设备分类</span>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索设备类型..."
              allowClear
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
            />
          </div>
          <Tree
            blockNode
            showIcon
            defaultExpandAll
            treeData={filteredTreeData}
            selectedKeys={[selectedType]}
            onSelect={(keys) => {
              const key = keys[0] as FlowMeterManagementDeviceType | undefined;
              if (key && (FLOW_METER_MANAGEMENT_TYPES as readonly string[]).includes(key)) {
                setSelectedType(key);
              }
            }}
          />
        </div>

        <div className="flow-meter-manage-content">
          <div className="flow-meter-manage-content-head">
            <h3>{selectedType}</h3>
            <span>共 {countDevicesByType(selectedType)} 台设备</span>
          </div>

          <DeviceTable
            deviceType={selectedType}
            onView={(device) => setDetailDevice(device)}
          />
        </div>
      </div>

      <FlowMeterDataChartModal
        device={detailDevice}
        open={detailDevice !== null}
        onClose={() => setDetailDevice(null)}
      />
    </div>
  );
}
