import { useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ProcessStatus, PushStatus, RealTimeEvent } from '../../types/security';
import {
  EVENT_LEVELS,
  EVENT_PUSH_DEVICES,
  PUSH_STATUSES,
} from '../../types/security';
import { mockRealTimeEvents } from '../../data/mockSecurity';
import './SecurityPages.css';

const { RangePicker } = DatePicker;

interface SearchForm {
  device?: string;
  location?: string;
  level?: string;
  pushStatus?: PushStatus;
  startTimeRange?: [Dayjs, Dayjs];
}

const STATUS_TABS: { label: string; value: ProcessStatus | '全部' }[] = [
  { label: '全部', value: '全部' },
  { label: '未处理', value: '未处理' },
  { label: '处理中', value: '处理中' },
  { label: '已处理', value: '已处理' },
];

export default function RealTimeEvents() {
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

  const filteredData = useMemo(() => {
    return mockRealTimeEvents.filter((item) => {
      if (statusTab !== '全部' && item.status !== statusTab) return false;
      if (search.device && item.device !== search.device) return false;
      if (search.location && !item.location.includes(search.location.trim())) {
        return false;
      }
      if (search.level && item.level !== search.level) return false;
      if (search.pushStatus && item.pushStatus !== search.pushStatus) return false;
      if (search.startTimeRange) {
        const [rangeStart, rangeEnd] = search.startTimeRange;
        const eventTime = dayjs(item.startTime, 'YYYY-MM-DD HH:mm:ss');
        if (
          eventTime.isBefore(rangeStart.startOf('second')) ||
          eventTime.isAfter(rangeEnd.endOf('second'))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [search, statusTab]);

  const onSearch = () => {
    setSearch(form.getFieldsValue());
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const onReset = () => {
    form.resetFields();
    setSearch({});
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const columns: ColumnsType<RealTimeEvent> = [
    {
      title: '序号',
      width: 60,
      align: 'center',
      render: (_v, _r, index) => {
        const current = pagination.current ?? 1;
        const pageSize = pagination.pageSize ?? 20;
        return (current - 1) * pageSize + index + 1;
      },
    },
    { title: '事件设备', dataIndex: 'device', width: 100 },
    {
      title: '所属位置',
      dataIndex: 'location',
      width: 160,
      ellipsis: true,
    },
    {
      title: '事件源名称',
      dataIndex: 'sourceName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      width: 140,
      ellipsis: true,
    },
    { title: '事件等级', dataIndex: 'level', width: 90, align: 'center' },
    { title: '处理状态', dataIndex: 'status', width: 90, align: 'center' },
    { title: '开始时间', dataIndex: 'startTime', width: 160 },
    { title: '结束时间', dataIndex: 'endTime', width: 160 },
    {
      title: '推送状态',
      dataIndex: 'pushStatus',
      width: 90,
      align: 'center',
      render: (status: RealTimeEvent['pushStatus']) => (
        <Tag color={status === '已推送' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: () => <a>查看</a>,
    },
  ];

  return (
    <div className="security-page">
      <p className="security-page-desc">
        展示全部实时事件数据。部分事件配置为「仅消息提醒」不会生成工单；配置为「工单推送」且已推送的事件会进入报警事件进行统计与跟踪处置。
      </p>
      <div className="security-search-bar">
        <Form form={form} layout="inline" className="security-search-form">
          <Form.Item label="事件设备" name="device">
            <Select
              allowClear
              placeholder="请选择 事件设备"
              style={{ width: 160 }}
              options={EVENT_PUSH_DEVICES.map((d) => ({ label: d, value: d }))}
            />
          </Form.Item>
          <Form.Item label="所属位置" name="location">
            <Input
              placeholder="请输入 所属位置"
              allowClear
              style={{ width: 160 }}
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
          <Form.Item label="事件起始时间" name="startTimeRange">
            <RangePicker
              showTime
              style={{ width: 360 }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
          <Form.Item label="推送状态" name="pushStatus">
            <Select
              allowClear
              placeholder="请选择 推送状态"
              style={{ width: 160 }}
              options={PUSH_STATUSES.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={onReset}>
                重置
              </Button>
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

        <Table<RealTimeEvent>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1400 }}
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
