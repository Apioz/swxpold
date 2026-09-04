import { useMemo, useState } from 'react';
import {
  ColumnHeightOutlined,
  FullscreenOutlined,
  PictureOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Form, Image, Input, Select, Space, Table, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type {
  MeetingRoomEquipment,
  MeetingRoomStatus,
  MidPlatformMeetingRoom,
} from '../../../../types/midPlatformMeetingRoom';
import { MEETING_ROOM_BUILDING_OPTIONS } from '../../../../data/mockMidPlatformMeetingRooms';
import { getReservationMeetingRooms } from '../../../../data/meetingReservationList';
import MeetingRoomDayTimeline from './components/MeetingRoomDayTimeline';
import MeetingReservationCreateModal from './components/MeetingReservationCreateModal';
import '../../MidPlatformPages.css';
import './MeetingReservationList.css';

const STATUS_LABEL: Record<MeetingRoomStatus, string> = {
  disabled: '禁用',
  enabled: '启用',
  idle: '空闲',
};

interface SearchForm {
  keyword?: string;
  building?: string;
  status?: string;
}

export default function MeetingReservationList() {
  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm<SearchForm>();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50', '100'],
  });
  const [bookingRoom, setBookingRoom] = useState<MidPlatformMeetingRoom | null>(null);

  const tableData = useMemo(() => {
    let data = getReservationMeetingRooms();

    if (search.building) {
      data = data.filter((item) => item.building === search.building);
    }
    if (search.keyword?.trim()) {
      const keyword = search.keyword.trim();
      data = data.filter(
        (item) => item.roomNo.includes(keyword) || item.name.includes(keyword),
      );
    }
    if (search.status === 'enabled') {
      data = data.filter((item) => item.status === 'enabled');
    }
    if (search.status === 'disabled') {
      data = data.filter((item) => item.status === 'disabled');
    }
    if (search.status === 'idle') {
      data = data.filter((item) => item.status === 'idle');
    }

    return data;
  }, [search]);

  const columns: ColumnsType<MidPlatformMeetingRoom> = [
    {
      title: '#',
      width: 48,
      align: 'center',
      render: (_, __, index) =>
        ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1,
    },
    {
      title: '缩略图',
      dataIndex: 'cover',
      width: 72,
      align: 'center',
      render: (cover: MidPlatformMeetingRoom['cover']) =>
        cover?.imageUrl ? (
          <Image
            src={cover.imageUrl}
            alt={cover.imageName}
            width={48}
            height={36}
            className="meeting-reservation-thumb"
            preview={false}
          />
        ) : (
          <div className="meeting-reservation-thumb-placeholder">
            <PictureOutlined />
          </div>
        ),
    },
    {
      title: '会议室',
      dataIndex: 'name',
      width: 88,
    },
    {
      title: '容纳人数',
      dataIndex: 'capacity',
      width: 88,
      align: 'center',
    },
    {
      title: '面积',
      dataIndex: 'area',
      width: 80,
      align: 'center',
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      width: 160,
      render: (equipment: MeetingRoomEquipment[]) =>
        equipment.length > 0 ? (
          <div className="meeting-reservation-equipment-tags">
            {equipment.map((item) => (
              <span key={item} className="meeting-reservation-equipment-tag">
                {item}
              </span>
            ))}
          </div>
        ) : null,
    },
    {
      title: '地址',
      dataIndex: 'address',
      width: 240,
    },
    {
      title: '位置',
      dataIndex: 'planPoint',
      width: 72,
      render: () => null,
    },
    {
      title: '空间状态',
      key: 'spaceStatus',
      width: 420,
      render: (_, record) => <MeetingRoomDayTimeline roomId={record.id} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 72,
      align: 'center',
      render: (status: MeetingRoomStatus) => (
        <span
          className={`meeting-reservation-status-text${
            status === 'enabled' ? ' is-enabled' : ''
          }`}
        >
          {STATUS_LABEL[status]}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      align: 'center',
      render: (_, record) =>
        record.status === 'disabled' ? (
          <span className="mid-platform-link-disabled">预约</span>
        ) : (
          <a className="meeting-reservation-action-link" onClick={() => setBookingRoom(record)}>
            预约
          </a>
        ),
    },
  ];

  return (
    <div className="mid-platform-page meeting-reservation-page">
      <div className="mid-platform-search-card">
        <Form form={form} layout="inline" className="mid-platform-search-form">
          <Form.Item label="会议室" name="keyword">
            <Input placeholder="请输入 会议室" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="楼栋" name="building">
            <Select
              allowClear
              placeholder="请选择 楼栋"
              style={{ width: 180 }}
              options={MEETING_ROOM_BUILDING_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              allowClear
              placeholder="请选择 状态"
              style={{ width: 140 }}
              options={[
                { label: '启用', value: 'enabled' },
                { label: '禁用', value: 'disabled' },
                { label: '空闲', value: 'idle' },
              ]}
            />
          </Form.Item>
          <Form.Item className="mid-platform-search-actions">
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
                icon={<SyncOutlined />}
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

      <div className="mid-platform-table-card">
        <div className="mid-platform-table-toolbar meeting-reservation-table-toolbar">
          <span />
          <Space size="middle" className="mid-platform-table-utils">
            <ReloadOutlined title="刷新" onClick={() => message.success('已刷新')} />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<MidPlatformMeetingRoom>
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          scroll={{ x: 1500 }}
          className="meeting-reservation-table"
          pagination={{
            ...pagination,
            total: tableData.length,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
        />
      </div>

      <MeetingReservationCreateModal
        open={Boolean(bookingRoom)}
        room={bookingRoom}
        onCancel={() => setBookingRoom(null)}
        onSuccess={() => setBookingRoom(null)}
      />
    </div>
  );
}
