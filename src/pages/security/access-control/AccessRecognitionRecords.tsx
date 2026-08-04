import { useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
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
import type { AccessRecognitionRecord } from '../../../types/accessRecognition';
import { mockAccessRecognitionRecords } from '../../../data/mockAccessRecognition';
import '../SecurityPages.css';

const { RangePicker } = DatePicker;

interface SearchForm {
  personName?: string;
  doorName?: string;
  result?: string;
  recordTimeRange?: [Dayjs, Dayjs];
}

export default function AccessRecognitionRecords() {
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
    return mockAccessRecognitionRecords.filter((item) => {
      if (search.personName && !item.personName.includes(search.personName.trim())) return false;
      if (search.doorName && !item.doorName.includes(search.doorName.trim())) return false;
      if (search.result && item.result !== search.result) return false;
      if (search.recordTimeRange) {
        const [start, end] = search.recordTimeRange;
        const t = dayjs(item.recordTime);
        if (t.isBefore(start) || t.isAfter(end)) return false;
      }
      return true;
    });
  }, [search]);

  const columns: ColumnsType<AccessRecognitionRecord> = [
    { title: '识别时间', dataIndex: 'recordTime', width: 170 },
    { title: '姓名', dataIndex: 'personName', width: 90 },
    { title: '工号', dataIndex: 'employeeNo', width: 100 },
    { title: '部门', dataIndex: 'department', width: 110, ellipsis: true },
    { title: '门禁点', dataIndex: 'doorName', width: 220, ellipsis: true },
    { title: '设备编号', dataIndex: 'doorCode', width: 150, ellipsis: true },
    { title: '房间号', dataIndex: 'roomNo', width: 90 },
    {
      title: '识别方式',
      dataIndex: 'recognitionType',
      width: 90,
      align: 'center',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '识别结果',
      dataIndex: 'result',
      width: 90,
      align: 'center',
      render: (v: AccessRecognitionRecord['result']) => (
        <Tag color={v === '成功' ? 'success' : 'error'}>{v}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'denyReason',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div className="security-page">
      <p className="security-page-desc">
        记录所有门禁识别通行事件。识别成功表示人员拥有对应门禁通行权限；识别拒绝通常因人员未在门禁权限配置中授权。
      </p>

      <div className="security-search-bar">
        <Form form={form} layout="inline" className="security-search-form">
          <Form.Item label="姓名" name="personName">
            <Input placeholder="请输入 姓名" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="门禁点" name="doorName">
            <Input placeholder="请输入 门禁点" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="识别结果" name="result">
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 110 }}
              options={[
                { label: '成功', value: '成功' },
                { label: '拒绝', value: '拒绝' },
              ]}
            />
          </Form.Item>
          <Form.Item label="识别时间" name="recordTimeRange">
            <RangePicker showTime style={{ width: 360 }} />
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
          <span />
          <Space size="middle" className="security-table-utils">
            <ReloadOutlined title="刷新" />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <DownloadOutlined title="导出" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<AccessRecognitionRecord>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1300 }}
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
