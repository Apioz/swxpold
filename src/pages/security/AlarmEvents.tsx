import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Table,
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
import type { AlarmEvent, ProcessStatus } from '../../types/security';
import { computeAlarmStats, EVENT_LEVELS, EVENT_PUSH_DEVICES } from '../../types/security';
import { mockAlarmEvents } from '../../data/mockSecurity';
import './SecurityPages.css';

interface SearchForm {
  location?: string;
  device?: string;
  level?: string;
}

const STATUS_TABS: { label: string; value: ProcessStatus | '全部' }[] = [
  { label: '全部', value: '全部' },
  { label: '未处理', value: '未处理' },
  { label: '处理中', value: '处理中' },
  { label: '已处理', value: '已处理' },
];

export default function AlarmEvents() {
  const [search, setSearch] = useState<SearchForm>({});
  const [statusTab, setStatusTab] = useState<ProcessStatus | '全部'>('全部');
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50'],
  });

  const alarmStats = useMemo(() => computeAlarmStats(mockAlarmEvents), []);

  const statCards = [
    { label: '报警总数(个)', value: alarmStats.total },
    { label: '今日截止当前新增报警(个)', value: alarmStats.todayNew },
    { label: '未处理报警数(个)', value: alarmStats.pending },
    { label: '处理中报警数(个)', value: alarmStats.processing },
    { label: '已处理报警数(个)', value: alarmStats.processed },
  ];

  const filteredData = useMemo(() => {
    return mockAlarmEvents.filter((item) => {
      if (statusTab !== '全部' && item.status !== statusTab) return false;
      if (search.device && item.device !== search.device) return false;
      if (search.location && !item.location.includes(search.location.trim())) {
        return false;
      }
      if (search.level && item.level !== search.level) return false;
      return true;
    });
  }, [search, statusTab]);

  const columns: ColumnsType<AlarmEvent> = [
    {
      title: '#',
      width: 56,
      align: 'center',
      render: (_v, _r, index) => {
        const current = pagination.current ?? 1;
        const pageSize = pagination.pageSize ?? 20;
        return (current - 1) * pageSize + index + 1;
      },
    },
    { title: '事件设备', dataIndex: 'device', width: 90 },
    {
      title: '所属位置',
      dataIndex: 'location',
      width: 150,
      ellipsis: true,
    },
    {
      title: '事件源名称',
      dataIndex: 'sourceName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      width: 130,
      ellipsis: true,
    },
    { title: '事件等级', dataIndex: 'level', width: 90, align: 'center' },
    {
      title: '报警内容',
      dataIndex: 'alarmContent',
      width: 220,
      ellipsis: true,
      render: (content: string) => <a>{content}</a>,
    },
    { title: '报警时间', dataIndex: 'alarmTime', width: 160 },
    {
      title: '报警通知人员',
      dataIndex: 'notifyPersons',
      width: 120,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    { title: '处理状态', dataIndex: 'status', width: 90, align: 'center' },
    { title: '推送状态', dataIndex: 'pushStatus', width: 90, align: 'center' },
    {
      title: '报警解决时间',
      dataIndex: 'resolvedTime',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: () => <a>详情</a>,
    },
  ];

  return (
    <div className="security-page">
      <p className="security-page-desc">
        展示已推送并生成工单的实时事件，用于报警统计与工单跟踪处置。「仅消息提醒」类事件不会出现在此列表。
      </p>
      <div className="security-stat-cards">
        {statCards.map((card) => (
          <div key={card.label} className="security-stat-card">
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="security-search-bar">
        <Form form={form} layout="inline" className="security-search-form">
          <Form.Item label="所属位置" name="location">
            <Input placeholder="请输入 所属位置" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="事件设备" name="device">
            <Select
              allowClear
              placeholder="请选择 事件设备"
              style={{ width: 160 }}
              options={EVENT_PUSH_DEVICES.map((d) => ({ label: d, value: d }))}
            />
          </Form.Item>
          <Form.Item label="事件等级" name="level">
            <Select
              allowClear
              placeholder="请选择 事件等级"
              style={{ width: 160 }}
              options={EVENT_LEVELS.map((l) => ({ label: l, value: l }))}
            />
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
              <Button type="link">展开</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="security-table-card">
        <div className="security-table-toolbar">
          <Radio.Group
            className="security-status-tabs"
            value={statusTab}
            onChange={(e) => {
              setStatusTab(e.target.value);
              setPagination((p) => ({ ...p, current: 1 }));
            }}
            optionType="button"
            buttonStyle="solid"
            options={STATUS_TABS.map((t) => ({
              label: t.label,
              value: t.value,
            }))}
          />
          <Space>
            <Button icon={<DownloadOutlined />} style={{ color: '#fa8c16', borderColor: '#fa8c16' }}>
              导出
            </Button>
            <Space size="middle" className="security-table-utils">
              <ReloadOutlined title="刷新" />
              <ColumnHeightOutlined title="密度" />
              <SettingOutlined title="列设置" />
              <FullscreenOutlined title="全屏" />
            </Space>
          </Space>
        </div>

        <Table<AlarmEvent>
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
    </div>
  );
}
