import { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Select, Space, Table, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { MidPlatformPersonnel } from '../../../types/midPlatform';
import {
  MID_PLATFORM_PERSONNEL_TOTAL,
  formatDistributionChannels,
  getMidPlatformPersonnelPage,
  maskContact,
} from '../../../data/mockMidPlatformPersonnel';
import PersonnelFormModal from './components/PersonnelFormModal';
import PersonnelDetailModal from './components/PersonnelDetailModal';
import PersonnelDeleteModal from './components/PersonnelDeleteModal';
import '../MidPlatformPages.css';

interface SearchForm {
  participantCompany?: string;
  name?: string;
  contact?: string;
  distributionStatus?: string;
}

function renderCell(value: string) {
  return value?.trim() ? value : '';
}

export default function MidPlatformPersonnelManagement() {
  const [list, setList] = useState<MidPlatformPersonnel[]>(() =>
    getMidPlatformPersonnelPage(1, 10),
  );
  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50', '100'],
  });

  const [formModal, setFormModal] = useState<{ open: boolean; mode: 'add' | 'edit'; record: MidPlatformPersonnel | null }>({
    open: false,
    mode: 'add',
    record: null,
  });
  const [detailRecord, setDetailRecord] = useState<MidPlatformPersonnel | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<MidPlatformPersonnel | null>(null);

  const tableData = useMemo(() => {
    let data = list;

    if (search.name?.trim()) {
      data = data.filter((item) => item.name.includes(search.name!.trim()));
    }
    if (search.contact?.trim()) {
      data = data.filter((item) => item.contactMasked.includes(search.contact!.trim()));
    }
    if (search.participantCompany?.trim()) {
      data = data.filter((item) =>
        item.participantCompany.includes(search.participantCompany!.trim()),
      );
    }
    if (search.distributionStatus?.trim()) {
      data = data.filter(
        (item) =>
          item.distributionStatusRuanjie.includes(search.distributionStatus!.trim()) ||
          item.distributionStatusHikvision.includes(search.distributionStatus!.trim()),
      );
    }

    return data;
  }, [list, search]);

  const handleDelete = (record: MidPlatformPersonnel) => {
    setList((prev) => prev.filter((item) => item.id !== record.id));
    setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
    setDeleteRecord(null);
    message.success('删除成功');
  };

  const handleFormSubmit = (values: Record<string, unknown>) => {
    const channelsRuanjie = Boolean(values.channelsRuanjie);
    const channelsHikvision = Boolean(values.channelsHikvision);
    const accessRange = values.accessTimeRange as [{ format?: (f: string) => string }, { format?: (f: string) => string }] | undefined;
    const accessTimePermission =
      accessRange?.[0]?.format && accessRange?.[1]?.format
        ? `${accessRange[0].format('YYYY-MM-DD')}至${accessRange[1].format('YYYY-MM-DD')}`
        : formModal.mode === 'edit' && formModal.record
          ? formModal.record.accessTimePermission
          : '-';

    const identities = (values.identities as MidPlatformPersonnel['identities']) ?? [];
    const registerTime = identities[0]?.registerTime ?? '';

    if (formModal.mode === 'edit' && formModal.record) {
      setList((prev) =>
        prev.map((item) =>
          item.id === formModal.record!.id
            ? {
                ...item,
                name: values.name as string,
                contact: values.contact as string,
                contactMasked: maskContact(values.contact as string),
                wechat: values.wechat as string,
                idCard: values.idCard as string,
                gender: values.gender as string,
                channelsRuanjie,
                channelsHikvision,
                distributionChannels: formatDistributionChannels(channelsRuanjie, channelsHikvision),
                accessTimePermission,
                registerTime,
                identities,
              }
            : item,
        ),
      );
      message.success('编辑成功');
    } else {
      const nextIndex = list.length + 1;
      const newRecord: MidPlatformPersonnel = {
        id: `mp-p-${Date.now()}`,
        indexNo: nextIndex,
        name: values.name as string,
        contact: values.contact as string,
        contactMasked: maskContact(values.contact as string),
        participantCompany: '',
        registerTime,
        distributionChannels: formatDistributionChannels(channelsRuanjie, channelsHikvision),
        accessTimePermission,
        distributionStatusRuanjie: '未下发',
        distributionStatusHikvision: '未下发',
        retryEnabled: false,
        wechat: values.wechat as string,
        idCard: values.idCard as string,
        gender: values.gender as string,
        channelsRuanjie,
        channelsHikvision,
        identities,
        devices: [],
      };
      setList((prev) => [...prev, newRecord]);
      message.success('新增成功');
    }
    setFormModal({ open: false, mode: 'add', record: null });
  };

  const columns: ColumnsType<MidPlatformPersonnel> = [
    {
      title: '#',
      dataIndex: 'indexNo',
      width: 56,
      align: 'center',
    },
    {
      title: '人员名称',
      dataIndex: 'name',
      width: 100,
    },
    {
      title: '联系方式',
      dataIndex: 'contactMasked',
      width: 130,
    },
    {
      title: '参与方企业名称',
      dataIndex: 'participantCompany',
      width: 160,
      render: (v: string) => renderCell(v),
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      width: 120,
    },
    {
      title: '下发渠道',
      dataIndex: 'distributionChannels',
      width: 220,
      render: (v: string) => (
        <span className="mid-platform-cell-multiline">{renderCell(v)}</span>
      ),
    },
    {
      title: '通行时间权限（软杰）',
      dataIndex: 'accessTimePermission',
      width: 190,
    },
    {
      title: '下发状态（软杰）',
      dataIndex: 'distributionStatusRuanjie',
      width: 120,
    },
    {
      title: '下发状态（海康）',
      dataIndex: 'distributionStatusHikvision',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle" wrap className="mid-platform-action-links">
          <a
            onClick={() => {
              Modal.info({
                title: '查看号码',
                content: record.contact,
                okText: '确定',
              });
            }}
          >
            <EyeOutlined /> 查看号码
          </a>
          <a onClick={() => setDetailRecord(record)}>
            <SearchOutlined /> 详情
          </a>
          <a
            onClick={() =>
              setFormModal({ open: true, mode: 'edit', record })
            }
          >
            编辑
          </a>
          <a
            className="mid-platform-link-danger"
            onClick={() => setDeleteRecord(record)}
          >
            删除
          </a>
          {record.retryEnabled ? (
            <a onClick={() => message.info('已发起重试')}>
              <SyncOutlined /> 重试
            </a>
          ) : (
            <span className="mid-platform-link-disabled">重试</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="mid-platform-page">
      <div className="mid-platform-search-card">
        <Form form={form} layout="inline" className="mid-platform-search-form">
          <Form.Item label="参与方企业名称" name="participantCompany">
            <Select
              allowClear
              placeholder="请选择 参与方企业名称"
              style={{ width: 200 }}
              options={[]}
              notFoundContent={null}
            />
          </Form.Item>
          <Form.Item label="人员名称" name="name">
            <Input placeholder="请输入 人员名称" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="联系方式" name="contact">
            <Input placeholder="请输入 联系方式" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="下发状态" name="distributionStatus">
            <Select
              allowClear
              placeholder="请选择 下发状态"
              style={{ width: 160 }}
              options={[
                { label: '下发成功', value: '下发成功' },
                { label: '未下发', value: '未下发' },
                { label: '下发失败', value: '下发失败' },
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
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFormModal({ open: true, mode: 'add', record: null })}
            >
              新增
            </Button>
            <Button
              className="mid-platform-btn-delete"
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={() => {
                const first = list.find((item) => item.id === selectedRowKeys[0]);
                if (first) setDeleteRecord(first);
              }}
            >
              删除
            </Button>
            <Button className="mid-platform-btn-export" icon={<DownloadOutlined />}>
              导出
            </Button>
            <Button icon={<SettingOutlined />}>批量配置人员</Button>
          </Space>
          <Space size="middle" className="mid-platform-table-utils">
            <ReloadOutlined title="刷新" onClick={() => message.success('已刷新')} />
            <SettingOutlined title="列设置" />
            <ColumnHeightOutlined title="密度" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<MidPlatformPersonnel>
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          scroll={{ x: 1700 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          pagination={{
            ...pagination,
            total: MID_PLATFORM_PERSONNEL_TOTAL,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
        />
      </div>

      <button type="button" className="mid-platform-float-setting" aria-label="设置">
        <SettingOutlined />
      </button>

      <PersonnelFormModal
        open={formModal.open}
        mode={formModal.mode}
        record={formModal.record}
        onCancel={() => setFormModal({ open: false, mode: 'add', record: null })}
        onSubmit={handleFormSubmit}
      />

      <PersonnelDetailModal
        open={Boolean(detailRecord)}
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />

      <PersonnelDeleteModal
        open={Boolean(deleteRecord)}
        record={deleteRecord}
        onCancel={() => setDeleteRecord(null)}
        onConfirm={() => deleteRecord && handleDelete(deleteRecord)}
      />
    </div>
  );
}
