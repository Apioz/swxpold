import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { PlcHvacSystem } from '../../types/innovationCenter';
import { mockPlcHvacSystems, plcModbusPorts } from '../../data/mockPlcHvac';
import HvacSystemRuntimeModal from './HvacSystemRuntimePanel';
import '../innovation-center/InnovationCenter.css';
import './PlcHvac.css';

interface SearchForm {
  roomNo?: string;
  systemName?: string;
  systemCode?: string;
}

const statusMap = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'warning', text: '离线' },
  alarm: { color: 'error', text: '报警' },
} as const;

function buildColumns(
  category: '暖通' | 'PLC',
  onView: (record: PlcHvacSystem) => void,
): ColumnsType<PlcHvacSystem> {
  const base: ColumnsType<PlcHvacSystem> = [
    { title: '设备编号', dataIndex: 'indexNo', width: 90, align: 'center' },
    {
      title: '房间号',
      dataIndex: 'roomNo',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: category === '暖通' ? '暖通系统命名' : 'PLC系统命名',
      dataIndex: 'systemName',
      width: 200,
      ellipsis: true,
    },
    {
      title: category === '暖通' ? '暖通屏幕名称' : '屏幕名称',
      dataIndex: 'screenName',
      width: 160,
      ellipsis: true,
    },
    {
      title: category === '暖通' ? '暖通系统编号' : '系统编号',
      dataIndex: 'systemCode',
      width: 140,
    },
    {
      title: '设备IP',
      dataIndex: 'ip',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (status: PlcHvacSystem['status']) => {
        const cfg = statusMap[status];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_v, record) => (
        <a onClick={() => onView(record)}>查看</a>
      ),
    },
  ];

  if (category === 'PLC') {
    base.splice(6, 0, {
      title: 'Modbus网关',
      dataIndex: 'modbusGateway',
      width: 110,
      render: (v: string) => v || '-',
    });
  }

  return base;
}

function SystemTable({ category }: { category: '暖通' | 'PLC' }) {
  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm();
  const [viewSystem, setViewSystem] = useState<PlcHvacSystem | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  const filteredData = useMemo(() => {
    return mockPlcHvacSystems
      .filter((item) => item.category === category)
      .filter((item) => {
        if (search.roomNo && !item.roomNo.includes(search.roomNo.trim())) {
          return false;
        }
        if (search.systemName && !item.systemName.includes(search.systemName.trim())) {
          return false;
        }
        if (search.systemCode && !item.systemCode.includes(search.systemCode.trim())) {
          return false;
        }
        return true;
      });
  }, [category, search]);

  const handleView = (record: PlcHvacSystem) => {
    if (category === '暖通') {
      setViewSystem(record);
    }
  };

  const selectedGateway = filteredData.find((d) => d.modbusGateway)?.modbusGateway;

  return (
    <>
      <div className="innovation-search-bar">
        <Form form={form} layout="inline" className="innovation-search-form">
          <Form.Item label="房间号" name="roomNo">
            <Input placeholder="请输入 房间号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="系统命名" name="systemName">
            <Input placeholder="请输入 系统命名" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="系统编号" name="systemCode">
            <Input placeholder="请输入 系统编号" allowClear style={{ width: 160 }} />
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
          <Select
            defaultValue="all"
            style={{ width: 160 }}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '在线', value: 'online' },
              { label: '离线', value: 'offline' },
            ]}
          />
          <Space size="middle" className="innovation-table-utils">
            <ReloadOutlined title="刷新" />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <DownloadOutlined title="导出" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<PlcHvacSystem>
          rowKey="id"
          columns={buildColumns(category, handleView)}
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

        {category === 'PLC' && selectedGateway && plcModbusPorts[selectedGateway] && (
          <div className="plc-modbus-card">
            <strong>{selectedGateway} 端口映射</strong>
            <div className="plc-modbus-ports">
              {plcModbusPorts[selectedGateway].map((port, i) => (
                <div key={port} className="plc-modbus-port">
                  port{i + 1}: {port}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {category === '暖通' && (
        <HvacSystemRuntimeModal
          system={viewSystem}
          open={!!viewSystem}
          onClose={() => setViewSystem(null)}
        />
      )}
    </>
  );
}

export default function PlcHvacManagement() {
  return (
    <div className="innovation-page">
      <Tabs
        defaultActiveKey="hvac"
        items={[
          {
            key: 'hvac',
            label: '暖通风系统',
            children: <SystemTable category="暖通" />,
          },
          {
            key: 'plc',
            label: 'PLC控制器',
            children: <SystemTable category="PLC" />,
          },
        ]}
      />
    </div>
  );
}
