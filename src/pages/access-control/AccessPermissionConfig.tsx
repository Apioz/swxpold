import { useMemo, useState } from 'react';
import {
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
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
import type { AccessControlGroup, AccessControlPoint } from '../../types/accessControl';
import { getPersonById } from '../../data/mockPersonnel';
import { getEffectivePersonIds } from '../../utils/accessControlPermissions';
import { useAccessControlStore } from '../../store/accessControlStore';
import AccessPointConfigPanel from './AccessPointConfigPanel';
import PersonnelTreeSelector from './PersonnelTreeSelector';
import '../spare-parts/SpareModals.css';
import './AccessControl.css';

interface SearchForm {
  groupName?: string;
}

interface GroupFormValues {
  groupName: string;
  description?: string;
  doorPointIds: string[];
  authorizedPersonIds: string[];
}

function formatNow(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function resolvePoints(ids: string[], pointMap: Map<string, AccessControlPoint>): AccessControlPoint[] {
  return ids.map((id) => pointMap.get(id)).filter(Boolean) as AccessControlPoint[];
}

export default function AccessPermissionConfig() {
  const [groups, points, { setAccessControlGroups }] = useAccessControlStore();
  const pointMap = useMemo(
    () => new Map(points.map((p) => [p.deviceId, p])),
    [points],
  );

  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm();
  const [editForm] = Form.useForm<GroupFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewGroup, setViewGroup] = useState<AccessControlGroup | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50'],
  });

  const filteredData = useMemo(() => {
    return groups.filter((item) => {
      if (search.groupName && !item.groupName.includes(search.groupName.trim())) return false;
      return true;
    });
  }, [groups, search]);

  const doorOptions = useMemo(
    () =>
      points
        .filter((p) => p.enabled)
        .map((p) => ({
          label: `${p.pointName}（${p.deviceCode}）`,
          value: p.deviceId,
        })),
    [points],
  );

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    editForm.resetFields();
    editForm.setFieldsValue({
      doorPointIds: [],
      authorizedPersonIds: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (record: AccessControlGroup) => {
    setModalMode('edit');
    setEditingId(record.id);
    editForm.setFieldsValue({
      groupName: record.groupName,
      description: record.description,
      doorPointIds: record.doorPointIds,
      authorizedPersonIds: record.authorizedPersonIds,
    });
    setModalOpen(true);
  };

  const handleDelete = (record: AccessControlGroup) => {
    Modal.confirm({
      title: '温馨提示',
      content: `您确定要删除门禁组「${record.groupName}」吗？删除后该组下所有门禁点权限配置将失效。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setAccessControlGroups((prev) => prev.filter((g) => g.id !== record.id));
        setSelectedGroupIds((ids) => ids.filter((id) => id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedGroupIds.length === 0) {
      message.warning('请先选择要删除的门禁组');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定删除选中的 ${selectedGroupIds.length} 个门禁组吗？删除后对应门禁点权限配置将失效。`,
      okText: '确定删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setAccessControlGroups((prev) =>
          prev.filter((g) => !selectedGroupIds.includes(g.id)),
        );
        message.success(`已删除 ${selectedGroupIds.length} 个门禁组`);
        setSelectedGroupIds([]);
      },
    });
  };

  const saveGroup = async () => {
    try {
      const values = await editForm.validateFields();
      if (values.doorPointIds.length === 0) {
        message.warning('请至少选择一个门禁点');
        return;
      }
      if (values.authorizedPersonIds.length === 0) {
        message.warning('请至少授权一名人员，未授权人员无法通行');
        return;
      }

      const payload: Omit<AccessControlGroup, 'id'> = {
        groupName: values.groupName.trim(),
        description: values.description?.trim(),
        doorPointIds: values.doorPointIds,
        authorizedPersonIds: values.authorizedPersonIds,
        updater: '管理员1',
        updateTime: formatNow(),
      };

      if (modalMode === 'add') {
        setAccessControlGroups((prev) => [
          ...prev,
          { id: `acg-${Date.now()}`, ...payload },
        ]);
        message.success('新增门禁组成功');
      } else if (editingId) {
        setAccessControlGroups((prev) =>
          prev.map((g) => (g.id === editingId ? { ...g, ...payload } : g)),
        );
        message.success('修改成功');
      }
      setModalOpen(false);
    } catch {
      /* validation */
    }
  };

  const columns: ColumnsType<AccessControlGroup> = [
    {
      title: '门禁组名称',
      dataIndex: 'groupName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '门禁点',
      key: 'doors',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tag color="blue">{record.doorPointIds.length} 个</Tag>
      ),
    },
    {
      title: '授权人员',
      key: 'persons',
      width: 280,
      render: (_, record) => (
        <Space size={[4, 4]} wrap>
          {record.authorizedPersonIds.slice(0, 4).map((pid) => {
            const person = getPersonById(pid);
            return (
              <Tag key={pid} color="green">
                {person?.name ?? pid}
              </Tag>
            );
          })}
          {record.authorizedPersonIds.length > 4 && (
            <Tag>+{record.authorizedPersonIds.length - 4}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '更新人',
      dataIndex: 'updater',
      width: 100,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setViewGroup(record)}>查看</a>
          <a onClick={() => openEditModal(record)}>编辑</a>
          <a className="danger-link" onClick={() => handleDelete(record)}>
            删除
          </a>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: AccessControlGroup) => {
    const groupPoints = resolvePoints(record.doorPointIds, pointMap);
    const persons = record.authorizedPersonIds
      .map((id) => getPersonById(id))
      .filter(Boolean);

    return (
      <div className="access-group-expand">
        <div className="access-group-expand-block">
          <h4>组内门禁点（{groupPoints.length}）</h4>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={groupPoints}
            columns={[
              { title: '门禁点名称', dataIndex: 'pointName', ellipsis: true },
              { title: '设备编号', dataIndex: 'deviceCode', width: 160 },
              { title: '安装位置', dataIndex: 'installLocation', width: 160, ellipsis: true },
              {
                title: '有效权限人数',
                key: 'effective',
                width: 110,
                align: 'center',
                render: (_, point) => getEffectivePersonIds(point, groups).length,
              },
            ]}
          />
        </div>
        <div className="access-group-expand-block">
          <h4>组内批量授权人员（{persons.length}）— 对组内全部门禁点生效</h4>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={persons}
            columns={[
              { title: '公司', dataIndex: 'company', width: 160, ellipsis: true },
              { title: '工号', dataIndex: 'employeeNo', width: 100 },
              { title: '姓名', dataIndex: 'name', width: 90 },
              { title: '部门', dataIndex: 'department', width: 120 },
              { title: '卡号', dataIndex: 'cardNo', width: 120 },
            ]}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="access-control-page">
      <Tabs
        className="access-permission-tabs"
        defaultActiveKey="points"
        items={[
          {
            key: 'points',
            label: '门禁点',
            children: <AccessPointConfigPanel />,
          },
          {
            key: 'groups',
            label: '门禁组',
            children: (
              <>
                <p className="access-control-desc">
                  门禁组从已配置的门禁点中选取多个进行分组。
                  <strong>在门禁组中添加的人员，将批量获得组内全部门禁点的通行权限；</strong>
                  若仅需单个门禁点授权，请在「门禁点」Tab 中配置。
                </p>

                <div className="access-search-bar">
                  <Form form={form} layout="inline" className="access-search-form">
                    <Form.Item label="门禁组名称" name="groupName">
                      <Input placeholder="请输入 门禁组名称" allowClear style={{ width: 180 }} />
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
                        新增门禁组
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={selectedGroupIds.length === 0}
                        onClick={handleBatchDelete}
                      >
                        批量删除{selectedGroupIds.length > 0 ? ` (${selectedGroupIds.length})` : ''}
                      </Button>
                    </Space>
                    <Space size="middle" className="access-table-utils">
                      <ReloadOutlined title="刷新" />
                      <ColumnHeightOutlined title="密度" />
                      <SettingOutlined title="列设置" />
                      <FullscreenOutlined title="全屏" />
                    </Space>
                  </div>

                  <Table<AccessControlGroup>
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredData}
                    scroll={{ x: 1200 }}
                    rowSelection={{
                      selectedRowKeys: selectedGroupIds,
                      onChange: (keys) => setSelectedGroupIds(keys as string[]),
                    }}
                    expandable={{ expandedRowRender }}
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
            ),
          },
        ]}
      />

      {/* 新增 / 编辑 */}
      <Modal
        title={modalMode === 'add' ? '新增门禁组' : '编辑门禁组'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={saveGroup}
        width={800}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" className="access-group-form">
          <Form.Item
            label="门禁组名称"
            name="groupName"
            rules={[{ required: true, message: '请输入门禁组名称' }]}
          >
            <Input placeholder="如：净化室门禁组" maxLength={50} />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <Input.TextArea placeholder="门禁组用途说明" rows={2} maxLength={200} />
          </Form.Item>
          <Form.Item
            label="门禁点"
            name="doorPointIds"
            rules={[{ required: true, message: '请选择门禁点' }]}
            extra="从「门禁点」Tab 已配置列表中选取，可多选"
          >
            <Select
              mode="multiple"
              placeholder="搜索并选择门禁点"
              options={doorOptions}
              optionFilterProp="label"
              showSearch
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item
            label="批量授权通行人员"
            name="authorizedPersonIds"
            rules={[
              {
                validator: (_, ids: string[]) =>
                  ids?.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('请至少添加一名授权人员')),
              },
            ]}
            extra="所选人员将批量获得本组内全部门禁点的通行权限"
          >
            <PersonnelTreeSelector scopeHint="批量授权组内全部门禁点" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情 */}
      <Modal
        title={`门禁组详情 — ${viewGroup?.groupName ?? ''}`}
        open={viewGroup !== null}
        onCancel={() => setViewGroup(null)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {viewGroup && (
          <div className="access-view-detail">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="门禁组名称">{viewGroup.groupName}</Descriptions.Item>
              <Descriptions.Item label="更新人">{viewGroup.updater}</Descriptions.Item>
              <Descriptions.Item label="说明" span={2}>
                {viewGroup.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={2}>
                {viewGroup.updateTime}
              </Descriptions.Item>
            </Descriptions>

            <div className="access-view-section">
              <h4>组内门禁点（{viewGroup.doorPointIds.length}）</h4>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={resolvePoints(viewGroup.doorPointIds, pointMap)}
                columns={[
                  { title: '门禁点名称', dataIndex: 'pointName' },
                  { title: '设备编号', dataIndex: 'deviceCode', width: 160 },
                  { title: '安装位置', dataIndex: 'installLocation', width: 160 },
                ]}
              />
            </div>

            <div className="access-view-section">
              <h4>
                批量授权人员（{viewGroup.authorizedPersonIds.length}）
                <Tag color="orange" style={{ marginLeft: 8, fontWeight: 400 }}>
                  对组内全部门禁点生效
                </Tag>
              </h4>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={viewGroup.authorizedPersonIds
                  .map((id) => getPersonById(id))
                  .filter(Boolean)}
                columns={[
                  { title: '公司', dataIndex: 'company', width: 160 },
                  { title: '工号', dataIndex: 'employeeNo', width: 100 },
                  { title: '姓名', dataIndex: 'name', width: 90 },
                  { title: '部门', dataIndex: 'department' },
                  { title: '卡号', dataIndex: 'cardNo', width: 120 },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
