import { useMemo, useState } from 'react';
import {
  ColumnHeightOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  EyeOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type {
  MeetingRoomEquipment,
  MeetingRoomStatus,
  MidPlatformMeetingRoom,
} from '../../../../types/midPlatformMeetingRoom';
import {
  MEETING_ROOM_BUILDING_OPTIONS,
} from '../../../../data/mockMidPlatformMeetingRooms';
import { useMeetingRoomStore } from '../../../../store/meetingRoomStore';
import { resolveBuildingFromSpaceLocation } from '../../../../data/meetingRoomSpaceOptions';
import MeetingRoomFormModal from './components/MeetingRoomFormModal';
import MeetingRoomViewModal from './components/MeetingRoomViewModal';
import MeetingRoomPermissionModal from './components/MeetingRoomPermissionModal';
import MeetingRoomAccessRecordModal from './components/MeetingRoomAccessRecordModal';
import '../../MidPlatformPages.css';
import './MeetingRoomList.css';

const MEETING_ROOM_STATUS_META: Record<
  MeetingRoomStatus,
  { label: string; color: 'default' | 'success' | 'processing' }
> = {
  disabled: { label: '禁用', color: 'default' },
  enabled: { label: '启用', color: 'success' },
  idle: { label: '空闲', color: 'processing' },
};

interface SearchForm {
  building?: string;
  roomNo?: string;
  name?: string;
  status?: string;
}

export default function MeetingRoomList() {
  const [list, { upsertMeetingRoom, removeMeetingRoom: removeRoom }] = useMeetingRoomStore();
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

  const [formModal, setFormModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    record: MidPlatformMeetingRoom | null;
  }>({ open: false, mode: 'add', record: null });
  const [viewRecord, setViewRecord] = useState<MidPlatformMeetingRoom | null>(null);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  const tableData = useMemo(() => {
    let data = list;

    if (search.building) {
      data = data.filter((item) => item.building === search.building);
    }
    if (search.roomNo?.trim()) {
      data = data.filter((item) => item.roomNo.includes(search.roomNo!.trim()));
    }
    if (search.name?.trim()) {
      data = data.filter((item) => item.name.includes(search.name!.trim()));
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
  }, [list, search]);

  const handleDelete = (record: MidPlatformMeetingRoom) => {
    Modal.confirm({
      title: '温馨提示',
      content: `确认删除会议室「${record.name}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        removeRoom(record.id);
        message.success('删除成功');
      },
    });
  };

  const handleFormSubmit = (values: Record<string, unknown>) => {
    const equipment = (values.equipment as MeetingRoomEquipment[] | undefined) ?? [];
    const spaceLocation = values.spaceLocation as string;
    const building = resolveBuildingFromSpaceLocation(spaceLocation);

    if (formModal.mode === 'edit' && formModal.record) {
      upsertMeetingRoom({
        ...formModal.record,
        roomNo: values.roomNo as string,
        name: values.name as string,
        address: values.address as string,
        spaceLocation,
        area: values.area as number,
        capacity: values.capacity as number,
        equipment,
        screenDevice: (values.screenDevice as string) ?? '',
        status: values.status as MidPlatformMeetingRoom['status'],
        usagePermission: values.usagePermission as MidPlatformMeetingRoom['usagePermission'],
        authorizedUserIds:
          values.usagePermission === 'restricted'
            ? ((values.authorizedUserIds as string[]) ?? [])
            : [],
        description: values.description as string,
        building,
        cover: (values.cover as MidPlatformMeetingRoom['cover']) ?? null,
        planPoint: (values.planPoint as MidPlatformMeetingRoom['planPoint']) ?? null,
      });
      message.success('修改成功');
    } else {
      const newItem: MidPlatformMeetingRoom = {
        id: `mr-${Date.now()}`,
        roomNo: values.roomNo as string,
        name: values.name as string,
        address: values.address as string,
        spaceLocation,
        area: values.area as number,
        capacity: values.capacity as number,
        equipment,
        screenDevice: (values.screenDevice as string) ?? '',
        status: values.status as MidPlatformMeetingRoom['status'],
        usagePermission: values.usagePermission as MidPlatformMeetingRoom['usagePermission'],
        authorizedUserIds:
          values.usagePermission === 'restricted'
            ? ((values.authorizedUserIds as string[]) ?? [])
            : [],
        description: values.description as string,
        building,
        cover: (values.cover as MidPlatformMeetingRoom['cover']) ?? null,
        planPoint: (values.planPoint as MidPlatformMeetingRoom['planPoint']) ?? null,
      };
      upsertMeetingRoom(newItem);
      message.success('保存成功');
    }

    setFormModal({ open: false, mode: 'add', record: null });
  };

  const columns: ColumnsType<MidPlatformMeetingRoom> = [
    {
      title: '#',
      width: 56,
      align: 'center',
      render: (_, __, index) =>
        ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1,
    },
    { title: '会议室编号', dataIndex: 'roomNo', width: 110 },
    { title: '会议室名称', dataIndex: 'name', width: 110 },
    {
      title: '地址',
      dataIndex: 'address',
      width: 240,
      render: (value: string) => (
        <Space size={4}>
          <EnvironmentOutlined className="mid-platform-address-icon" />
          <span>{value}</span>
        </Space>
      ),
    },
    { title: '空间位置', dataIndex: 'spaceLocation', width: 220 },
    {
      title: '面积',
      dataIndex: 'area',
      width: 80,
      render: (value: number) => `${value}m²`,
    },
    {
      title: '容纳人数',
      dataIndex: 'capacity',
      width: 90,
      render: (value: number) => `${value}人`,
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      width: 180,
      render: (equipment: MidPlatformMeetingRoom['equipment']) =>
        equipment.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {equipment.map((item) => (
              <Tag key={item} className="mid-platform-equipment-display-tag">
                {item}
              </Tag>
            ))}
          </Space>
        ) : null,
    },
    { title: '预约屏设备', dataIndex: 'screenDevice', width: 220 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: MidPlatformMeetingRoom['status']) => {
        const meta = MEETING_ROOM_STATUS_META[status];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 420,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle" wrap className="mid-platform-action-links">
          <a onClick={() => setViewRecord(record)}>
            <EyeOutlined /> 查看
          </a>
          <a onClick={() => setFormModal({ open: true, mode: 'edit', record })}>
            <EditOutlined /> 编辑
          </a>
          <a className="mid-platform-link-danger" onClick={() => handleDelete(record)}>
            <DeleteOutlined /> 删除
          </a>
          <a onClick={() => setPermissionOpen(true)}>
            <UserSwitchOutlined /> 设置使用权限
          </a>
          <a onClick={() => setAccessOpen(true)}>
            <ExportOutlined /> 人员通行记录
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div className="mid-platform-page">
      <div className="mid-platform-search-card">
        <Form form={form} layout="inline" className="mid-platform-search-form">
          <Form.Item label="楼栋" name="building">
            <Select
              allowClear
              placeholder="请选择 楼栋"
              style={{ width: 180 }}
              options={MEETING_ROOM_BUILDING_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="会议室编号" name="roomNo">
            <Input placeholder="请输入 会议室编号" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="会议室名称" name="name">
            <Input placeholder="请输入 会议室名称" allowClear style={{ width: 160 }} />
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
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="mid-platform-table-card">
        <div className="mid-platform-table-toolbar">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFormModal({ open: true, mode: 'add', record: null })}
          >
            新增
          </Button>
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
          scroll={{ x: 1800 }}
          pagination={{
            ...pagination,
            total: tableData.length,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
        />
      </div>

      <MeetingRoomFormModal
        open={formModal.open}
        mode={formModal.mode}
        record={formModal.record}
        onCancel={() => setFormModal({ open: false, mode: 'add', record: null })}
        onSubmit={handleFormSubmit}
      />

      <MeetingRoomViewModal
        open={Boolean(viewRecord)}
        record={viewRecord}
        onClose={() => setViewRecord(null)}
      />

      <MeetingRoomPermissionModal
        open={permissionOpen}
        onCancel={() => setPermissionOpen(false)}
        onConfirm={() => {
          setPermissionOpen(false);
          message.success('提交成功');
        }}
      />

      <MeetingRoomAccessRecordModal open={accessOpen} onClose={() => setAccessOpen(false)} />
    </div>
  );
}
