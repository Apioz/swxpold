import { useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  ColumnHeightOutlined,
  DownOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { NotificationConfig, NotificationType } from '../../types/security';
import {
  ALL_NOTIFY_METHODS,
  EVENT_CATEGORIES,
  getNotifyMethodDeleteBlockMessage,
  isNotifyMethodUsedInPush,
} from '../../types/security';
import { useSecurityStore } from '../../store/securityStore';
import '../spare-parts/SpareModals.css';
import './SecurityPages.css';

type AddNotifyType = NotificationType;

export default function NotificationMethodConfig() {
  const [{ notificationConfigs: data, eventPushConfigs }, { setNotificationConfigs: setData }] =
    useSecurityStore();
  const [search, setSearch] = useState<{
    name?: string;
    type?: string;
    status?: string;
  }>({});
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<AddNotifyType>('钉钉机器人');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search.name && !item.name.includes(search.name.trim())) return false;
      if (search.type && item.type !== search.type) return false;
      if (search.status && item.status !== search.status) return false;
      return true;
    });
  }, [data, search]);

  const openAddModal = (type: AddNotifyType) => {
    setModalType(type);
    configForm.resetFields();
    if (type === '钉钉机器人') {
      configForm.setFieldsValue({ securityType: 'keyword' });
    }
    setModalOpen(true);
  };

  const addMenuItems: MenuProps['items'] = ALL_NOTIFY_METHODS.map((type) => ({
    key: type,
    label: type,
    onClick: () => openAddModal(type),
  }));

  const handleDelete = (record: NotificationConfig) => {
    if (isNotifyMethodUsedInPush(record.type, eventPushConfigs)) {
      message.warning(getNotifyMethodDeleteBlockMessage(record.type));
      return;
    }

    Modal.confirm({
      title: '温馨提示',
      content: '您确定要删除该选中项吗?',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setData(data.filter((item) => item.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const saveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      setData([
        {
          id: String(Date.now()),
          name: values.name,
          type: modalType,
          status: '良好',
          lastTestTime: new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19),
          updater: '管理员',
        },
        ...data,
      ]);
      message.success('保存成功');
      setModalOpen(false);
    } catch {
      /* validation */
    }
  };

  const columns: ColumnsType<NotificationConfig> = [
    {
      title: '#',
      width: 56,
      align: 'center',
      render: (_v, _r, index) => {
        const current = pagination.current ?? 1;
        const pageSize = pagination.pageSize ?? 10;
        return (current - 1) * pageSize + index + 1;
      },
    },
    { title: '配置名称', dataIndex: 'name', width: 160 },
    { title: '通知类型', dataIndex: 'type', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <span style={{ color: status === '良好' ? '#52c41a' : '#ff4d4f' }}>
          {status}
        </span>
      ),
    },
    { title: '最后测试时间', dataIndex: 'lastTestTime', width: 170 },
    { title: '更新人', dataIndex: 'updater', width: 90 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_v, record) => {
        const inUse = isNotifyMethodUsedInPush(record.type, eventPushConfigs);
        return (
          <Space size="small">
            <Button type="primary" size="small" ghost className="notification-action-btn">
              详情
            </Button>
            <Button type="primary" size="small" className="notification-action-btn">
              编辑
            </Button>
            <Button
              size="small"
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                color: '#fff',
              }}
              className="notification-action-btn"
              onClick={() => message.success('测试消息已发送')}
            >
              测试
            </Button>
            <Button
              danger
              size="small"
              className="notification-action-btn"
              disabled={inUse}
              title={
                inUse ? getNotifyMethodDeleteBlockMessage(record.type) : undefined
              }
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="security-page">
      <div className="security-search-bar">
        <Form form={form} layout="inline" className="security-search-form">
          <Form.Item label="配置名称" name="name">
            <Input placeholder="请输入配置名称" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="通知类型" name="type">
            <Select
              allowClear
              placeholder="请选择通知类型"
              style={{ width: 160 }}
              options={ALL_NOTIFY_METHODS.map((type) => ({
                label: type,
                value: type,
              }))}
            />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              allowClear
              placeholder="请选择状态"
              style={{ width: 140 }}
              options={[
                { label: '良好', value: '良好' },
                { label: '异常', value: '异常' },
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

      <div className="security-table-card">
        <div className="security-table-toolbar">
          <Dropdown menu={{ items: addMenuItems }} trigger={['click']}>
            <Button type="primary" icon={<PlusOutlined />}>
              新增通知方式 <DownOutlined />
            </Button>
          </Dropdown>
          <Space size="middle" className="security-table-utils">
            <ReloadOutlined title="刷新" />
            <SettingOutlined title="列设置" />
            <SearchOutlined title="搜索" />
            <FullscreenOutlined title="全屏" />
            <ColumnHeightOutlined title="密度" />
          </Space>
        </div>

        <Table<NotificationConfig>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1000 }}
          rowSelection={{ type: 'checkbox' }}
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
        title={
          modalType === '钉钉机器人'
            ? '新增钉钉机器人配置'
            : '新增企业微信配置'
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={640}
        centered
        destroyOnHidden
        className="spare-modal"
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="test"
            style={{ background: '#fa8c16', borderColor: '#fa8c16', color: '#fff' }}
            onClick={() => message.success('测试消息已发送')}
          >
            测试
          </Button>,
          <Button key="save" type="primary" onClick={saveConfig}>
            保存
          </Button>,
        ]}
      >
        <Form form={configForm} layout="vertical" className="spare-modal-form">
          <Form.Item
            label="配置名称"
            name="name"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="请输入配置名称" />
          </Form.Item>

          {modalType === '钉钉机器人' ? (
            <>
              <Form.Item
                label="Webhook URL"
                name="webhook"
                rules={[{ required: true, message: '请输入Webhook URL' }]}
              >
                <Input placeholder="请输入Webhook URL" />
              </Form.Item>
              <Form.Item
                label="安全设置"
                name="securityType"
                rules={[{ required: true, message: '请选择安全设置' }]}
              >
                <Radio.Group>
                  <Radio value="keyword">自定义关键词</Radio>
                  <Radio value="sign">加签</Radio>
                  <Radio value="ip">IP地址段</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="关键词" name="keyword">
                <Input placeholder="请输入关键词" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="企业 ID"
                name="corpId"
                rules={[{ required: true, message: '请输入企业 ID' }]}
              >
                <Input placeholder="请输入企业 ID" />
              </Form.Item>
              <Form.Item
                label="AgentId"
                name="agentId"
                rules={[{ required: true, message: '请输入 AgentId' }]}
              >
                <Input placeholder="请输入 AgentId" />
              </Form.Item>
              <Form.Item
                label="Secret"
                name="secret"
                rules={[{ required: true, message: '请输入 Secret' }]}
              >
                <Input.Password placeholder="请输入 Secret" />
              </Form.Item>
            </>
          )}

          <Form.Item
            label="关联事件类型"
            name="eventType"
            rules={[{ required: true, message: '请选择事件类型' }]}
          >
            <Select
              placeholder="请选择事件类型"
              options={EVENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
