import { useMemo, useState } from 'react';
import {
  AutoComplete,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Upload,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { SparePart, WarehouseStock } from '../../types/spareParts';
import {
  SPARE_PART_TYPES,
  UNITS,
  WAREHOUSES,
} from '../../types/spareParts';
import { useSparePartsStore } from '../../store/sparePartsStore';
import {
  codeMatches,
  detectCodeSearchKind,
  findWarehouseIdsByStockCode,
  generateBjCode,
  isBjCode,
  isWarehouseStockCode,
} from '../../utils/sparePartCode';
import './SparePartsLedger.css';
import './SpareModals.css';

interface SearchForm {
  type?: string;
  name?: string;
  code?: string;
  warehouseIds?: string[];
}

/** 展开时子行可见的仓库范围 */
type ExpandWarehouseFilter = 'all' | string[];

interface SparePartRow extends SparePart {
  isWarehouseRow?: boolean;
  children?: SparePartRow[];
  /** 子行展示用的单仓库存编号 */
  displayCode?: string;
}

function buildWarehouseChildren(
  item: SparePart,
  warehouses: WarehouseStock[],
): SparePartRow[] {
  return warehouses.map((w) => ({
    ...item,
    id: `${item.id}__${w.warehouseId}`,
    code: w.stockCode,
    displayCode: w.stockCode,
    totalStock: w.quantity,
    warehouses: [w],
    isWarehouseRow: true,
  }));
}

function toTableRows(
  list: SparePart[],
  expandFilter: ExpandWarehouseFilter,
): SparePartRow[] {
  return list.map((item) => {
    const visibleWarehouses =
      expandFilter === 'all'
        ? item.warehouses
        : item.warehouses.filter((w) =>
            expandFilter.includes(w.warehouseId),
          );

    const children =
      visibleWarehouses.length > 0
        ? buildWarehouseChildren(item, visibleWarehouses)
        : undefined;

    return {
      ...item,
      displayCode: item.code,
      children,
    };
  });
}

export default function SparePartsLedger() {
  const [data, { setSpareParts, resetSpareParts }] = useSparePartsStore();
  const [search, setSearch] = useState<SearchForm>({});
  const [expandFilter, setExpandFilter] = useState<ExpandWarehouseFilter>('all');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50'],
  });

  const filteredData = useMemo(() => {
    const codeKw = search.code?.trim() ?? '';
    const codeKind = detectCodeSearchKind(codeKw);

    return data.filter((item) => {
      if (search.type && item.type !== search.type) return false;
      if (search.name && !item.name.includes(search.name.trim())) return false;

      if (codeKw) {
        if (codeKind === 'bj' || isBjCode(codeKw)) {
          if (!codeMatches(item.code, codeKw)) return false;
        } else if (codeKind === 'warehouseStock' || isWarehouseStockCode(codeKw)) {
          const hitIds = findWarehouseIdsByStockCode(item, codeKw);
          if (hitIds.length === 0) return false;
        } else {
          // 模糊：命中总库存编号或任一单仓库存编号
          const hitBj = codeMatches(item.code, codeKw);
          const hitWh = item.warehouses.some(
            (w) => w.stockCode && codeMatches(w.stockCode, codeKw),
          );
          if (!hitBj && !hitWh) return false;
        }
      }

      if (search.warehouseIds && search.warehouseIds.length > 0) {
        const hit = item.warehouses.some((w) =>
          search.warehouseIds!.includes(w.warehouseId),
        );
        if (!hit) return false;
      }
      return true;
    });
  }, [data, search]);

  const tableData = useMemo(
    () => toTableRows(filteredData, expandFilter),
    [filteredData, expandFilter],
  );

  const resolveExpandFilter = (values: SearchForm): ExpandWarehouseFilter => {
    const codeKw = values.code?.trim() ?? '';
    const warehouseIds = values.warehouseIds ?? [];

    if (codeKw && (isWarehouseStockCode(codeKw) || detectCodeSearchKind(codeKw) === 'warehouseStock')) {
      // 搜索单仓库存编号：展开仅显示命中的仓库
      const ids = new Set<string>();
      for (const item of data) {
        findWarehouseIdsByStockCode(item, codeKw).forEach((id) => ids.add(id));
      }
      if (ids.size > 0) return [...ids];
    }

    if (codeKw && (isBjCode(codeKw) || detectCodeSearchKind(codeKw) === 'bj')) {
      // 搜索总库存编号：展开显示全部仓库
      return 'all';
    }

    if (warehouseIds.length > 0) {
      // 搜索仓库：展开仅显示选中仓库
      return warehouseIds;
    }

    // 模糊编号命中单仓时，收窄展开范围
    if (codeKw) {
      const ids = new Set<string>();
      let hitBj = false;
      for (const item of data) {
        if (codeMatches(item.code, codeKw)) hitBj = true;
        findWarehouseIdsByStockCode(item, codeKw).forEach((id) => ids.add(id));
      }
      if (!hitBj && ids.size > 0) return [...ids];
    }

    return 'all';
  };

  const onSearch = () => {
    const values = form.getFieldsValue() as SearchForm;
    setSearch(values);
    setExpandFilter(resolveExpandFilter(values));
    setPagination((p) => ({ ...p, current: 1 }));
    setExpandedRowKeys([]);
  };

  const onReset = () => {
    form.resetFields();
    setSearch({});
    setExpandFilter('all');
    setPagination((p) => ({ ...p, current: 1 }));
    setExpandedRowKeys([]);
  };

  const openAdd = () => {
    setModalMode('add');
    setEditingId(null);
    editForm.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: SparePart) => {
    setModalMode('edit');
    setEditingId(record.id);
    editForm.setFieldsValue({
      code: record.code,
      name: record.name,
      spec: record.spec,
      type: record.type,
      manufacturer: record.manufacturer,
      price: record.price,
      unit: record.unit,
    });
    setModalOpen(true);
  };

  const handleDelete = (record: SparePart) => {
    Modal.confirm({
      title: '温馨提示',
      content: '您确定要删除该选中项吗?',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setSpareParts(data.filter((item) => item.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const formatNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const handleModalOk = async () => {
    try {
      const values = await editForm.validateFields();
      if (modalMode === 'add') {
        const newItem: SparePart = {
          id: String(Date.now()),
          code: generateBjCode(data),
          name: values.name,
          spec: values.spec,
          type: values.type,
          totalStock: 0,
          warehouses: [],
          price: values.price,
          unit: values.unit,
          manufacturer: values.manufacturer,
          updater: 'admin',
          updateTime: formatNow(),
        };
        setSpareParts([newItem, ...data]);
        message.success(`新增成功，备件编号：${newItem.code}`);
      } else if (editingId) {
        setSpareParts(
          data.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  // 备件编号不可编辑，保持原编号
                  name: values.name,
                  spec: values.spec,
                  type: values.type,
                  manufacturer: values.manufacturer,
                  price: values.price,
                  unit: values.unit,
                  updater: 'admin',
                  updateTime: formatNow(),
                }
              : item,
          ),
        );
        message.success('编辑成功');
      }
      setModalOpen(false);
    } catch {
      /* validation failed */
    }
  };

  const columns: ColumnsType<SparePartRow> = [
    {
      title: '#',
      width: 56,
      align: 'center',
      render: (_v, record) => {
        if (record.isWarehouseRow) return null;
        const idx = filteredData.findIndex((item) => item.id === record.id);
        if (idx < 0) return null;
        const current = pagination.current ?? 1;
        const pageSize = pagination.pageSize ?? 10;
        return (current - 1) * pageSize + idx + 1;
      },
    },
    {
      title: '备件编号',
      dataIndex: 'displayCode',
      width: 180,
      ellipsis: true,
      render: (_v, record) =>
        record.isWarehouseRow ? record.displayCode || record.code : record.code,
    },
    {
      title: '备件名称',
      dataIndex: 'name',
      width: 100,
      ellipsis: true,
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      width: 100,
      ellipsis: true,
    },
    {
      title: '备件类型',
      dataIndex: 'type',
      width: 110,
    },
    {
      title: '总库存',
      dataIndex: 'totalStock',
      width: 90,
      align: 'center',
    },
    {
      title: '所属仓库',
      dataIndex: 'warehouses',
      width: 220,
      ellipsis: true,
      render: (warehouses: WarehouseStock[], record) => {
        // 主行始终展示该备件全部仓库名称（总库存视角）
        if (!record.isWarehouseRow) {
          const source = data.find((p) => p.id === record.id);
          const list = source?.warehouses ?? warehouses;
          return list.map((w) => w.warehouseName).join('、') || '';
        }
        return warehouses.map((w) => w.warehouseName).join('、') || '';
      },
    },
    {
      title: '价格(元)',
      dataIndex: 'price',
      width: 100,
      align: 'center',
      render: (v: number) => v,
    },
    {
      title: '计量单位',
      dataIndex: 'unit',
      width: 90,
      align: 'center',
    },
    {
      title: '生产厂家',
      dataIndex: 'manufacturer',
      width: 100,
      ellipsis: true,
    },
    {
      title: '更新人',
      dataIndex: 'updater',
      width: 90,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_v, record) => {
        if (record.isWarehouseRow) return null;
        return (
          <Space size="middle">
            <a onClick={() => openEdit(record)}>编辑</a>
            <a className="link-danger" onClick={() => handleDelete(record)}>
              删除
            </a>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="spare-ledger-page">
      <div className="search-bar">
        <Form form={form} layout="inline" className="search-form">
          <Form.Item label="备件类型" name="type">
            <Select
              allowClear
              placeholder="请选择备件类型"
              style={{ width: 160 }}
              options={SPARE_PART_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Form.Item label="备件名称" name="name">
            <Input placeholder="请输入备件名称" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="备件编号" name="code">
            <Input
              placeholder="总库存BJ/单仓库存编号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label="所属仓库" name="warehouseIds">
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="请选择所属仓库"
              style={{ minWidth: 200 }}
              options={WAREHOUSES.map((w) => ({
                label: w.name,
                value: w.id,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
                搜索
              </Button>
              <Button onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              新增
            </Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
          <Space size="middle" className="table-utils">
            <ReloadOutlined
              title="刷新"
              onClick={() => {
                resetSpareParts();
                setExpandedRowKeys([]);
                message.success('已刷新');
              }}
            />
            <ColumnHeightOutlined title="密度" />
            <SettingOutlined title="列设置" />
            <FullscreenOutlined title="全屏" />
          </Space>
        </div>

        <Table<SparePartRow>
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          scroll={{ x: 1500 }}
          pagination={{
            ...pagination,
            total: filteredData.length,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
              setExpandedRowKeys([]);
            },
          }}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
            defaultExpandAllRows: false,
            indentSize: 20,
            rowExpandable: (record) =>
              !record.isWarehouseRow && (record.children?.length ?? 0) > 0,
          }}
        />
      </div>

      <Modal
        title={modalMode === 'add' ? '新增备件' : '编辑备件'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="确认"
        cancelText="取消"
        width={720}
        destroyOnHidden
        centered
        className="spare-modal"
      >
        <Form
          form={editForm}
          layout="vertical"
          className="spare-modal-form"
        >
          <div className="spare-modal-section">
            <div className="spare-modal-section-head">
              <span className="spare-modal-section-title">基本信息</span>
            </div>
            <Row gutter={[16, 0]}>
              {modalMode === 'edit' && (
                <Col span={12}>
                  <Form.Item label="备件编号" name="code">
                    <Input disabled className="spare-modal-code-tag" />
                  </Form.Item>
                </Col>
              )}
              <Col span={12}>
                <Form.Item
                  label="备件名称"
                  name="name"
                  rules={[{ required: true, message: '请输入备件名称' }]}
                >
                  <Input placeholder="请输入备件名称" allowClear />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="规格型号"
                  name="spec"
                  rules={[{ required: true, message: '请输入规格型号' }]}
                >
                  <Input placeholder="请输入规格型号" allowClear />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="备件类型"
                  name="type"
                  rules={[{ required: true, message: '请选择备件类型' }]}
                >
                  <Select
                    placeholder="请选择备件类型"
                    options={SPARE_PART_TYPES.map((t) => ({
                      label: t,
                      value: t,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="生产厂家"
                  name="manufacturer"
                  rules={[{ required: true, message: '请输入生产厂家' }]}
                >
                  <Input placeholder="请输入生产厂家" allowClear />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="价格（元）"
                  name="price"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    placeholder="请输入价格"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="计量单位"
                  name="unit"
                  rules={[{ required: true, message: '请选择或输入计量单位' }]}
                >
                  <AutoComplete
                    placeholder="请选择或输入计量单位"
                    options={UNITS.map((u) => ({ value: u }))}
                    filterOption={(input, option) =>
                      String(option?.value ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="备件图片" name="image" valuePropName="fileList">
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={() => false}
                    className="spare-modal-upload"
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="spare-modal-section">
            <div className="spare-modal-section-head">
              <span className="spare-modal-section-title">关联设备</span>
              <Button type="primary" size="small">
                选择设备
              </Button>
            </div>
            <Table
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无数据' }}
              columns={[
                { title: '设备编号', dataIndex: 'code' },
                { title: '设备名称', dataIndex: 'name' },
                { title: '设备分类', dataIndex: 'category' },
                { title: '设备位置', dataIndex: 'location' },
              ]}
              dataSource={[]}
              rowKey="id"
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
}
