import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { AccessControlGroup, AccessControlPoint, AccessDirection } from '../../types/accessControl';
import { getDevicesByType } from '../../data/mockFlowMeters';
import { useAccessControlStore } from '../../store/accessControlStore';
import { getPersonById } from '../../data/mockPersonnel';
import { getEffectivePersonIds } from '../../utils/accessControlPermissions';
import PersonnelTreeSelector from './PersonnelTreeSelector';
import './AccessControl.css';

interface SearchForm {
  pointName?: string;
  deviceName?: string;
  deviceCode?: string;
  installLocation?: string;
  direction?: AccessDirection;
  enabled?: boolean;
}

interface PointFormValues {
  deviceId: string;
  deviceName: string;
  pointName: string;
  installLocation: string;
  deviceCode: string;
  direction: AccessDirection;
  enabled: boolean;
  authorizedPersonIds: string[];
  remark?: string;
}

function formatNow(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function resolveGroupNames(deviceId: string, groups: AccessControlGroup[]): string[] {
  return groups
    .filter((g) => g.doorPointIds.includes(deviceId))
    .map((g) => g.groupName);
}

export default function AccessPointConfigPanel() {
  const [groups, points, { setAccessControlPoints }] = useAccessControlStore();
  const doorDevices = useMemo(() => getDevicesByType('门禁'), []);
  const doorMap = useMemo(
    () => new Map(doorDevices.map((d) => [d.id, d])),
    [doorDevices],
  );

  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm();
  const [editForm] = Form.useForm<PointFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50'],
  });

  const configuredDeviceIds = useMemo(
    () => new Set(points.map((p) => p.deviceId)),
    [points],
  );

  const filteredData = useMemo(() => {
    return points.filter((item) => {
      if (search.pointName && !item.pointName.includes(search.pointName.trim())) return false;
      if (search.deviceName && !item.deviceName.includes(search.deviceName.trim())) return false;
      if (search.deviceCode && !item.deviceCode.includes(search.deviceCode.trim())) return false;
      if (search.installLocation && !item.installLocation.includes(search.installLocation.trim())) {
        return false;
      }
      if (search.direction && item.direction !== search.direction) return false;
      if (search.enabled !== undefined && item.enabled !== search.enabled) return false;
      return true;
    });
  }, [points, search]);

  const availableDoorOptions = useMemo(
    () =>
      doorDevices
        .filter(
          (d) =>
            !configuredDeviceIds.has(d.id) ||
            (modalMode === 'edit' && d.id === editingDeviceId),
        )
        .map((d) => ({
          label: `${d.name}（${d.code}）`,
          value: d.id,
        })),
    [doorDevices, configuredDeviceIds, modalMode, editingDeviceId],
  );

  const fillFromDevice = (deviceId: string) => {
    const device = doorMap.get(deviceId);
    if (!device) return;
    editForm.setFieldsValue({
      deviceName: device.name,
      pointName: device.name.replace(/门禁$/, '') || device.name,
      installLocation: device.installLocation || device.roomNo,
      deviceCode: device.code,
    });
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setEditingDeviceId(null);
    editForm.resetFields();
    editForm.setFieldsValue({
      direction: '进',
      enabled: true,
      authorizedPersonIds: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (record: AccessControlPoint) => {
    setModalMode('edit');
    setEditingId(record.id);
    setEditingDeviceId(record.deviceId);
    editForm.setFieldsValue({
      deviceId: record.deviceId,
      deviceName: record.deviceName,
      pointName: record.pointName,
      installLocation: record.installLocation,
      deviceCode: record.deviceCode,
      direction: record.direction,
      enabled: record.enabled,
      authorizedPersonIds: record.authorizedPersonIds,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleDelete = (record: AccessControlPoint) => {
    Modal.confirm({
      title: '温馨提示',
      content: `您确定要删除门禁点「${record.pointName}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setAccessControlPoints((prev) => prev.filter((p) => p.id !== record.id));
        setSelectedPointIds((ids) => ids.filter((id) => id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedPointIds.length === 0) {
      message.warning('请先选择要删除的门禁点');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定删除选中的 ${selectedPointIds.length} 个门禁点吗？`,
      okText: '确定删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setAccessControlPoints((prev) =>
          prev.filter((p) => !selectedPointIds.includes(p.id)),
        );
        message.success(`已删除 ${selectedPointIds.length} 个门禁点`);
        setSelectedPointIds([]);
      },
    });
  };

  const savePoint = async () => {
    try {
      const values = await editForm.validateFields();
      const payload: Omit<AccessControlPoint, 'id'> = {
        deviceId: values.deviceId,
        deviceName: values.deviceName.trim(),
        pointName: values.pointName.trim(),
        installLocation: values.installLocation.trim(),
        deviceCode: values.deviceCode.trim(),
        direction: values.direction,
        enabled: values.enabled,
        authorizedPersonIds: values.authorizedPersonIds ?? [],
        remark: values.remark?.trim(),
        updater: '管理员1',
        updateTime: formatNow(),
      };

      if (modalMode === 'add') {
        if (configuredDeviceIds.has(values.deviceId)) {
          message.warning('该门禁设备已配置门禁点');
          return;
        }
        setAccessControlPoints((prev) => [
          ...prev,
          { id: `acp-${Date.now()}`, ...payload },
        ]);
        message.success('新增门禁点成功');
      } else if (editingId) {
        setAccessControlPoints((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)),
        );
        message.success('修改成功');
      }
      setModalOpen(false);
    } catch {
      /* validation */
    }
  };

  const columns: ColumnsType<AccessControlPoint> = [
    {
      title: '门禁设备名称',
      dataIndex: 'deviceName',
      width: 220,
      ellipsis: true,
      fixed: 'left',
    },
    {
      title: '门禁点名称',
      dataIndex: 'pointName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '安装位置',
      dataIndex: 'installLocation',
      width: 180,
      ellipsis: true,
    },
    { title: '设备编号', dataIndex: 'deviceCode', width: 160, ellipsis: true },
    {
      title: '进出方向',
      dataIndex: 'direction',
      width: 90,
      align: 'center',
      render: (v: AccessDirection) => (
        <Tag color={v === '进' ? 'blue' : 'orange'}>{v}</Tag>
      ),
    },
    {
      title: '直接授权',
      key: 'directPersons',
      width: 160,
      render: (_, record) => {
        if (record.authorizedPersonIds.length === 0) return '-';
        return (
          <Space size={[4, 4]} wrap>
            {record.authorizedPersonIds.slice(0, 2).map((pid) => {
              const person = getPersonById(pid);
              return (
                <Tag key={pid} color="green">
                  {person?.name ?? pid}
                </Tag>
              );
            })}
            {record.authorizedPersonIds.length > 2 && (
              <Tag>+{record.authorizedPersonIds.length - 2}</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '有效权限',
      key: 'effectivePersons',
      width: 90,
      align: 'center',
      render: (_, record) => {
        const count = getEffectivePersonIds(record, groups).length;
        return count > 0 ? <Tag color="blue">{count} 人</Tag> : '-';
      },
    },
    {
      title: '所属门禁组',
      key: 'groups',
      width: 200,
      render: (_, record) => {
        const names = resolveGroupNames(record.deviceId, groups);
        if (names.length === 0) return '-';
        return (
          <Space size={[4, 4]} wrap>
            {names.slice(0, 2).map((name) => (
              <Tag key={name} color="geekblue">
                {name}
              </Tag>
            ))}
            {names.length > 2 && <Tag>+{names.length - 2}</Tag>}
          </Space>
        );
      },
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      width: 90,
      align: 'center',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '说明',
      dataIndex: 'remark',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    { title: '更新人', dataIndex: 'updater', width: 100 },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => openEditModal(record)}>编辑</a>
          <a className="danger-link" onClick={() => handleDelete(record)}>
            删除
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <p className="access-control-desc">
        先配置门禁点基础信息，再为本门禁点单独授权通行人员。
        <strong>此处添加的人员权限仅对当前门禁点生效；</strong>
        门禁组中的批量授权请在「门禁组」Tab 中配置。
      </p>

      <div className="access-search-bar">
        <Form form={form} layout="inline" className="access-search-form">
          <Form.Item label="门禁点名称" name="pointName">
            <Input placeholder="请输入 门禁点名称" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="门禁设备名称" name="deviceName">
            <Input placeholder="请输入 门禁设备名称" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="安装位置" name="installLocation">
            <Input placeholder="请输入 安装位置" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="设备编号" name="deviceCode">
            <Input placeholder="请输入 设备编号" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="进出方向" name="direction">
            <Select
              allowClear
              placeholder="全部"
              style={{ width: 100 }}
              options={[
                { label: '进', value: '进' },
                { label: '出', value: '出' },
              ]}
            />
          </Form.Item>
          <Form.Item label="启用状态" name="enabled">
            <Select
              allowClear
              placeholder="全部"
              style={{ width: 100 }}
              options={[
                { label: '启用', value: true },
                { label: '停用', value: false },
              ]}
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
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="access-table-card">
        <div className="access-table-toolbar">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
              新增门禁点
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedPointIds.length === 0}
              onClick={handleBatchDelete}
            >
              批量删除{selectedPointIds.length > 0 ? ` (${selectedPointIds.length})` : ''}
            </Button>
          </Space>
          <Space size="middle" className="access-table-utils">
            <ReloadOutlined title="刷新" />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<AccessControlPoint>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1500 }}
          rowSelection={{
            selectedRowKeys: selectedPointIds,
            onChange: (keys) => setSelectedPointIds(keys as string[]),
          }}
          pagination={{
            ...pagination,
            total: filteredData.length,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
        />
      </div>

      <Modal
        title={modalMode === 'add' ? '新增门禁点' : '编辑门禁点'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={savePoint}
        width={820}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" className="access-group-form">
          <Form.Item
            label="关联门禁设备"
            name="deviceId"
            rules={[{ required: true, message: '请选择门禁设备' }]}
          >
            <Select
              placeholder="从门禁设备列表中选择"
              options={availableDoorOptions}
              optionFilterProp="label"
              showSearch
              disabled={modalMode === 'edit'}
              onChange={(deviceId: string) => fillFromDevice(deviceId)}
            />
          </Form.Item>
          <Form.Item
            label="门禁设备名称"
            name="deviceName"
            rules={[{ required: true, message: '请选择关联门禁设备以带入设备名称' }]}
          >
            <Input placeholder="选择关联门禁设备后自动带入" readOnly />
          </Form.Item>
          <Form.Item
            label="门禁点名称"
            name="pointName"
            rules={[{ required: true, message: '请输入门禁点名称' }]}
          >
            <Input placeholder="如：8415-净化室4" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="安装位置"
            name="installLocation"
            rules={[{ required: true, message: '请输入安装位置' }]}
          >
            <Input placeholder="安装位置" maxLength={100} />
          </Form.Item>
          <Form.Item
            label="设备编号"
            name="deviceCode"
            rules={[{ required: true, message: '请输入设备编号' }]}
          >
            <Input placeholder="设备编号" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="进出方向"
            name="direction"
            rules={[{ required: true, message: '请选择进出方向' }]}
          >
            <Select
              options={[
                { label: '进', value: '进' },
                { label: '出', value: '出' },
              ]}
            />
          </Form.Item>
          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item label="说明" name="remark">
            <Input.TextArea placeholder="备注说明" rows={2} maxLength={200} />
          </Form.Item>
          <Form.Item
            label="授权通行人员"
            name="authorizedPersonIds"
            extra="仅对本门禁点生效，不影响其他门禁点"
          >
            <PersonnelTreeSelector scopeHint="仅对本门禁点生效" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
