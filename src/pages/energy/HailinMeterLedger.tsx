import { useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { HailinMeterDevice, HailinMeterStatus } from '../../types/hailinMeter';
import { HAILIN_MEDIUMS, HAILIN_ZONES } from '../../types/hailinMeter';
import { countHailinByStatus, mockHailinDevices } from '../../data/mockHailinMeters';
import HailinMeterDetailModal from './HailinMeterDetailModal';
import './HailinMeter.css';

const statusMap: Record<HailinMeterStatus, { text: string; color: string }> = {
  online: { text: '在线', color: 'success' },
  offline: { text: '离线', color: 'error' },
  alarm: { text: '异常', color: 'warning' },
};

interface SearchForm {
  medium?: string;
  status?: string;
  zone?: string;
  calibration?: string;
  rangeMin?: number;
  rangeMax?: number;
}

function StatusCell({ status }: { status: HailinMeterStatus }) {
  const s = statusMap[status];
  return (
    <Tag color={s.color}>
      <span className={`hailin-status-dot ${status}`} />
      {s.text}
    </Tag>
  );
}

export default function HailinMeterLedger() {
  const stats = countHailinByStatus();
  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailDevice, setDetailDevice] = useState<HailinMeterDevice | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  const filteredData = useMemo(() => {
    return mockHailinDevices.filter((item) => {
      if (search.medium && search.medium !== '全部' && item.medium !== search.medium) return false;
      if (search.zone && search.zone !== '全部' && item.zone !== search.zone) return false;
      if (search.status && item.status !== search.status) return false;
      if (search.calibration && item.calibrationStatus !== search.calibration) return false;
      if (search.rangeMin != null) {
        const max = parseInt(item.rangeSpec.replace(/\D/g, ''), 10);
        if (max < search.rangeMin) return false;
      }
      if (search.rangeMax != null) {
        const max = parseInt(item.rangeSpec.split('~')[1] || '0', 10);
        if (max > search.rangeMax) return false;
      }
      return true;
    });
  }, [search]);

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要删除的设备');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定删除选中的 ${selectedIds.length} 台海林能量计设备吗？`,
      okText: '确定删除',
      okButtonProps: { danger: true },
      onOk: () => {
        message.success(`已删除 ${selectedIds.length} 台设备（演示）`);
        setSelectedIds([]);
      },
    });
  };

  const columns: ColumnsType<HailinMeterDevice> = [
    {
      title: '能量计编号',
      dataIndex: 'code',
      width: 110,
      render: (code: string) => <span className="hailin-code-link">{code}</span>,
    },
    { title: '所属分区', dataIndex: 'zone', width: 120, ellipsis: true },
    { title: '介质', dataIndex: 'medium', width: 100 },
    { title: '安装位置', dataIndex: 'installLocation', width: 160, ellipsis: true },
    { title: '量程规格', dataIndex: 'rangeSpec', width: 120 },
    { title: '通讯协议', dataIndex: 'protocol', width: 100 },
    {
      title: '瞬时流量',
      dataIndex: 'instantFlow',
      width: 100,
      align: 'right',
      render: (v: number, r) => (r.status === 'offline' ? '-' : v.toFixed(1)),
    },
    {
      title: '今日累计',
      dataIndex: 'todayCumulative',
      width: 100,
      align: 'right',
      render: (v: number) => v.toFixed(1),
    },
    {
      title: '在线状态',
      dataIndex: 'status',
      width: 100,
      render: (status: HailinMeterStatus) => <StatusCell status={status} />,
    },
    {
      title: '下次校准',
      dataIndex: 'nextCalibration',
      width: 120,
      render: (v: string, r) => (
        <span className={r.calibrationStatus === '已过期' ? 'hailin-cal-expired' : undefined}>
          {v}
          {r.calibrationStatus === '已过期' && ' 已过期'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setDetailDevice(record)}>查看</a>
          <a>编辑</a>
          <a>历史</a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="hailin-page-header">
        <div className="hailin-page-header-left">
          <Breadcrumb items={[{ title: '海林能量计' }, { title: '能量计设备管理' }]} />
        </div>
        <div className="hailin-stat-pills">
          <span>共 <strong>{stats.total}</strong> 台设备</span>
          <span className="online"><span className="hailin-status-dot online" />在线 <strong>{stats.online}</strong></span>
          <span className="offline"><span className="hailin-status-dot offline" />离线 <strong>{stats.offline}</strong></span>
        </div>
      </div>

      <div className="hailin-search-bar">
        <Form form={form} layout="inline" className="hailin-search-form">
          <Form.Item label="介质类型" name="medium">
            <Select placeholder="全部" allowClear style={{ width: 120 }} options={HAILIN_MEDIUMS.map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item label="设备状态" name="status">
            <Select placeholder="全部" allowClear style={{ width: 100 }} options={[
              { label: '在线', value: 'online' },
              { label: '离线', value: 'offline' },
            ]} />
          </Form.Item>
          <Form.Item label="所属分区" name="zone">
            <Select placeholder="全部" allowClear style={{ width: 130 }} options={HAILIN_ZONES.map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item label="校准状态" name="calibration">
            <Select placeholder="全部" allowClear style={{ width: 110 }} options={[
              { label: '正常', value: '正常' },
              { label: '即将到期', value: '即将到期' },
              { label: '已过期', value: '已过期' },
            ]} />
          </Form.Item>
          <Form.Item label="量程范围">
            <Space>
              <Form.Item name="rangeMin" noStyle>
                <InputNumber placeholder="最小" min={0} style={{ width: 80 }} />
              </Form.Item>
              <span>~</span>
              <Form.Item name="rangeMax" noStyle>
                <InputNumber placeholder="最大 m³/h" min={0} style={{ width: 100 }} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => { setSearch(form.getFieldsValue()); setPagination((p) => ({ ...p, current: 1 })); }}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { form.resetFields(); setSearch({}); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="hailin-panel">
        <div className="hailin-table-toolbar">
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />}>新增能量计</Button>
            <Button icon={<UploadOutlined />}>批量导入</Button>
            <Button icon={<DownloadOutlined />}>批量导出</Button>
            <Button danger icon={<DeleteOutlined />} disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
              批量删除{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </Button>
          </Space>
          <Space size="middle" className="hailin-table-utils">
            <ReloadOutlined title="刷新" />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<HailinMeterDevice>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1400 }}
          rowSelection={{ selectedRowKeys: selectedIds, onChange: (keys) => setSelectedIds(keys as string[]) }}
          rowClassName={(record) => (record.status === 'offline' ? 'hailin-row-offline' : '')}
          pagination={{
            ...pagination,
            total: filteredData.length,
            onChange: (page, pageSize) => setPagination((p) => ({ ...p, current: page, pageSize })),
          }}
        />
      </div>

      <HailinMeterDetailModal
        device={detailDevice}
        open={detailDevice !== null}
        onClose={() => setDetailDevice(null)}
      />
    </div>
  );
}
