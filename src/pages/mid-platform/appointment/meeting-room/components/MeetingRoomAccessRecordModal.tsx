import { useMemo, useState } from 'react';
import {
  ColumnHeightOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Modal, Select, Space, Table } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MeetingRoomAccessRecord } from '../../../../../types/midPlatformMeetingRoom';
import {
  MEETING_ROOM_ACCESS_TOTAL,
  meetingRoomAccessRecords,
} from '../../../../../data/mockMidPlatformMeetingRooms';

const { RangePicker } = DatePicker;

interface MeetingRoomAccessRecordModalProps {
  open: boolean;
  onClose: () => void;
}

interface AccessSearchForm {
  name?: string;
  meeting?: string;
  timeRange?: [unknown, unknown];
}

export default function MeetingRoomAccessRecordModal({
  open,
  onClose,
}: MeetingRoomAccessRecordModalProps) {
  const [form] = Form.useForm<AccessSearchForm>();
  const [search, setSearch] = useState<AccessSearchForm>({});
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: () => `共 ${MEETING_ROOM_ACCESS_TOTAL} 条`,
    pageSizeOptions: ['10', '20', '50', '100'],
  });

  const tableData = useMemo(() => {
    let data = meetingRoomAccessRecords;
    if (search.name?.trim()) {
      data = data.filter((item) => item.name.includes(search.name!.trim()));
    }
    if (search.meeting?.trim()) {
      data = data.filter((item) => item.meeting.includes(search.meeting!.trim()));
    }
    return data;
  }, [search]);

  const columns: ColumnsType<MeetingRoomAccessRecord> = [
    {
      title: '#',
      width: 60,
      align: 'center',
      render: (_, __, index) =>
        ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1,
    },
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '参加会议', dataIndex: 'meeting', width: 220 },
    { title: '记录时间', dataIndex: 'recordTime', width: 180 },
  ];

  return (
    <Modal
      title="人员通行记录"
      open={open}
      onCancel={onClose}
      width={960}
      destroyOnHidden
      footer={null}
      className="mid-platform-meeting-room-modal mid-platform-access-record-modal"
    >
      <div className="mid-platform-access-search-card">
        <Form form={form} layout="inline" className="mid-platform-access-search-form">
          <Form.Item label="姓名" name="name">
            <Input placeholder="请输入 姓名" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="参加会议" name="meeting">
            <Select
              placeholder="请选择 参加会议"
              allowClear
              style={{ width: 180 }}
              options={[
                { label: '信息', value: '信息' },
                { label: '物业例会', value: '物业例会' },
                { label: '服务平台例会', value: '服务平台例会' },
                { label: '数字孪生孵化器项目例会', value: '数字孪生孵化器项目例会' },
                { label: '数字化改造研讨会', value: '数字化改造研讨会' },
                { label: '微生物实验室换证', value: '微生物实验室换证' },
              ]}
            />
          </Form.Item>
          <Form.Item label="时间范围" name="timeRange">
            <RangePicker placeholder={['开始日期', '结束日期']} style={{ width: 280 }} />
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
                icon={<DeleteOutlined />}
                onClick={() => {
                  form.resetFields();
                  setSearch({});
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
              >
                清空
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="mid-platform-access-table-wrap">
        <div className="mid-platform-access-table-toolbar">
          <span />
          <Space size="middle" className="mid-platform-table-utils">
            <ReloadOutlined title="刷新" />
            <ColumnHeightOutlined title="密度" />
            <SearchOutlined title="搜索" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>
        <Table<MeetingRoomAccessRecord>
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          pagination={{
            ...pagination,
            total: MEETING_ROOM_ACCESS_TOTAL,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
          size="small"
        />
      </div>
    </Modal>
  );
}
