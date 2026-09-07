import { useMemo, useState } from 'react';
import {
  ColumnHeightOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Form, Modal, Radio, Select, Space, Switch, Table, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { AuditFlowCondition, AuditFlowConfig } from '../../../types/auditFlowConfig';
import {
  PROCESS_TYPE_OPTIONS,
} from '../../../data/mockAuditFlowConfig';
import {
  setAuditFlowConfigs,
  useAuditFlowConfigs,
} from '../../../store/auditFlowConfigStore';
import {
  buildAuditFlowDefaultName,
  findDuplicateAuditFlow,
  formatConditionsSummary,
  getAuditFlowDisplayName,
  getAuditFlowMatchWeight,
  getAuditRuleShape,
  normalizeAuditFlowCondition,
} from '../../../utils/auditFlowMatcher';
import {
  normalizeFormApproverSteps,
  validateApproverSteps,
} from '../../../utils/auditFlowApproverSteps';
import AuditFlowConfigFormModal from './components/AuditFlowConfigFormModal';
import AuditFlowConfigViewModal from './components/AuditFlowConfigViewModal';
import '../MidPlatformPages.css';
import './AuditFlowConfig.css';

interface SearchForm {
  processType?: string;
  isDefault?: boolean;
  enabled?: boolean;
}

interface AuditFlowConfigListProps {
  embedded?: boolean;
}

function normalizeFormConditions(raw: unknown): AuditFlowCondition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeAuditFlowCondition(item))
    .filter((item) => item.values.length > 0);
}

export default function AuditFlowConfigList({ embedded }: AuditFlowConfigListProps) {
  const list = useAuditFlowConfigs();
  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm<SearchForm>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
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
    mode: 'add' | 'edit' | 'copy';
    record: AuditFlowConfig | null;
  }>({ open: false, mode: 'add', record: null });
  const [viewRecord, setViewRecord] = useState<AuditFlowConfig | null>(null);

  const tableData = useMemo(() => {
    let data = list;

    if (search.processType) {
      data = data.filter((item) => item.processType === search.processType);
    }
    if (search.isDefault === true) {
      data = data.filter((item) => item.isDefault);
    }
    if (search.isDefault === false) {
      data = data.filter((item) => !item.isDefault);
    }
    if (search.enabled === true) {
      data = data.filter((item) => item.enabled);
    }
    if (search.enabled === false) {
      data = data.filter((item) => !item.enabled);
    }

    return [...data].sort((a, b) => getAuditFlowMatchWeight(b) - getAuditFlowMatchWeight(a));
  }, [list, search]);

  const handleToggleEnabled = (record: AuditFlowConfig, enabled: boolean) => {
    setAuditFlowConfigs(
      list.map((item) => (item.id === record.id ? { ...item, enabled } : item)),
    );
    message.success(enabled ? '已启用' : '已禁用');
  };

  const handleDelete = (record: AuditFlowConfig) => {
    Modal.confirm({
      title: '温馨提示',
      content: `确认删除该审核流程配置吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setAuditFlowConfigs(list.filter((item) => item.id !== record.id));
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据');
      return;
    }
    Modal.confirm({
      title: '温馨提示',
      content: `确认删除选中的 ${selectedRowKeys.length} 条数据吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setAuditFlowConfigs(list.filter((item) => !selectedRowKeys.includes(item.id)));
        setSelectedRowKeys([]);
        message.success('删除成功');
      },
    });
  };

  const handleFormSubmit = (values: Record<string, unknown>) => {
    const conditions = normalizeFormConditions(values.conditions);
    const isDefault = values.isDefault as boolean;
    const processType = values.processType as AuditFlowConfig['processType'];
    const editingId = formModal.mode === 'edit' ? formModal.record?.id : undefined;

    if (values.selfApplyAutoPass && getAuditRuleShape(conditions) !== 'orgRoom') {
      message.error('「会议室管理员申请自动通过」仅适用于「组织+会议室」组合条件');
      return;
    }

    const approverSteps = normalizeFormApproverSteps(values.approverSteps);
    const approverValidationError = validateApproverSteps(approverSteps);
    if (approverValidationError) {
      message.error(approverValidationError);
      return;
    }

    const duplicate = findDuplicateAuditFlow(list, {
      id: editingId,
      processType,
      conditions,
      isDefault,
    });
    if (duplicate) {
      message.error(
        `已存在相同组合条件的规则「${getAuditFlowDisplayName(duplicate)}」，请勿重复配置`,
      );
      return;
    }

    const name =
      (values.name as string)?.trim() ||
      buildAuditFlowDefaultName(processType, conditions, isDefault);

    const payload: AuditFlowConfig = {
      id: editingId ?? `afc-${Date.now()}`,
      name,
      processType,
      conditions,
      matchType: values.matchType as AuditFlowConfig['matchType'],
      isDefault,
      approveMode: 'manual',
      enabled: values.enabled as boolean,
      selfApplyAutoPass: values.selfApplyAutoPass as boolean,
      approverSteps,
    };

    if (formModal.mode === 'edit' && formModal.record) {
      setAuditFlowConfigs(list.map((item) => (item.id === formModal.record!.id ? payload : item)));
      message.success('修改成功');
    } else {
      setAuditFlowConfigs([...list, payload]);
      message.success(formModal.mode === 'copy' ? '复制成功' : '保存成功');
    }

    setFormModal({ open: false, mode: 'add', record: null });
  };

  const columns: ColumnsType<AuditFlowConfig> = [
    {
      title: '#',
      width: 56,
      align: 'center',
      render: (_, __, index) =>
        ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 10) + index + 1,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
      render: (_, record) => getAuditFlowDisplayName(record),
    },
    {
      title: '流程类型',
      dataIndex: 'processType',
      width: 120,
    },
    {
      title: '匹配条件',
      key: 'conditions',
      width: 240,
      render: (_, record) =>
        formatConditionsSummary(record.conditions) ||
        (record.isDefault ? '（默认配置 = 是）' : '—'),
    },
    {
      title: '申请自动通过',
      dataIndex: 'selfApplyAutoPass',
      width: 100,
      align: 'center',
      render: (value: boolean | undefined) => (value ? '是' : '否'),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      align: 'center',
      render: (enabled: boolean, record) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle" className="mid-platform-action-links">
          <a onClick={() => setViewRecord(record)}>
            <EyeOutlined /> 查看
          </a>
          <a onClick={() => setFormModal({ open: true, mode: 'edit', record })}>
            <EditOutlined /> 编辑
          </a>
          <a onClick={() => setFormModal({ open: true, mode: 'copy', record })}>
            <CopyOutlined /> 复制
          </a>
          <a className="mid-platform-link-danger" onClick={() => handleDelete(record)}>
            <DeleteOutlined /> 删除
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div className={`mid-platform-page${embedded ? ' mid-platform-page--embedded' : ''}`}>
      <div className="mid-platform-search-card">
        <Form form={form} layout="inline" className="mid-platform-search-form">
          <Form.Item label="流程类型" name="processType">
            <Select
              allowClear
              placeholder="请选择 流程类型"
              style={{ width: 180 }}
              options={PROCESS_TYPE_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="启用状态" name="enabled">
            <Radio.Group>
              <Radio value>启用</Radio>
              <Radio value={false}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="默认配置" name="isDefault">
            <Radio.Group>
              <Radio value>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
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

      <div className="mid-platform-table-card">
        <div className="mid-platform-table-toolbar">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFormModal({ open: true, mode: 'add', record: null })}
            >
              新增
            </Button>
            <Button
              icon={<DeleteOutlined />}
              className="mid-platform-btn-delete"
              onClick={handleBatchDelete}
            >
              删除
            </Button>
            <Button icon={<DownloadOutlined />} className="mid-platform-btn-export">
              导出
            </Button>
          </Space>
          <Space size="middle" className="mid-platform-table-utils">
            <ReloadOutlined title="刷新" onClick={() => message.success('已刷新')} />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<AuditFlowConfig>
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          pagination={{
            ...pagination,
            total: tableData.length,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
        />
      </div>

      <AuditFlowConfigFormModal
        open={formModal.open}
        mode={formModal.mode}
        record={formModal.record}
        onCancel={() => setFormModal({ open: false, mode: 'add', record: null })}
        onSubmit={handleFormSubmit}
      />

      <AuditFlowConfigViewModal
        open={Boolean(viewRecord)}
        record={viewRecord}
        onClose={() => setViewRecord(null)}
      />
    </div>
  );
}
