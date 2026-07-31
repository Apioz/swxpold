import { useMemo, useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  ColumnHeightOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { OutboundRecord, StockOrderItem } from '../../types/spareParts';
import {
  DEPARTMENTS,
  OUTBOUND_TYPES,
  PERSONS,
  WAREHOUSES,
} from '../../types/spareParts';
import { useSparePartsStore } from '../../store/sparePartsStore';
import { mockOutboundRecords } from '../../data/mockStockOrders';
import './StockOrderPages.css';
import './SpareModals.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface SearchForm {
  orderNo?: string;
  type?: string;
  person?: string;
  timeRange?: [Dayjs, Dayjs];
  sparePartId?: string;
  department?: string;
}

export default function OutboundManagement() {
  const [spareParts] = useSparePartsStore();
  const [data, setData] = useState<OutboundRecord[]>(mockOutboundRecords);
  const [search, setSearch] = useState<SearchForm>({});
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<StockOrderItem[]>([]);
  const [selectPartsOpen, setSelectPartsOpen] = useState(false);
  const [tempSelectedKeys, setTempSelectedKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search.orderNo && !item.orderNo.includes(search.orderNo.trim())) {
        return false;
      }
      if (search.type && item.type !== search.type) return false;
      if (search.person && item.person !== search.person) return false;
      if (search.department && item.department !== search.department) {
        return false;
      }
      if (search.sparePartId) {
        const part = spareParts.find((p) => p.id === search.sparePartId);
        if (
          part &&
          !item.sparePartCodes.includes(part.code) &&
          !item.sparePartNames.includes(part.name)
        ) {
          return false;
        }
      }
      if (search.timeRange?.[0] && search.timeRange?.[1]) {
        const t = dayjs(item.time, 'YYYY/M/D HH:mm');
        if (
          t.isBefore(search.timeRange[0].startOf('day')) ||
          t.isAfter(search.timeRange[1].endOf('day'))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [data, search, spareParts]);

  const onSearch = () => {
    setSearch(form.getFieldsValue());
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const onReset = () => {
    form.resetFields();
    setSearch({});
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const openAdd = () => {
    addForm.resetFields();
    addForm.setFieldsValue({ time: dayjs() });
    setSelectedItems([]);
    setModalOpen(true);
  };

  const handleDelete = (record: OutboundRecord) => {
    Modal.confirm({
      title: '温馨提示',
      content: '您确定要删除该选中项吗?',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setData((prev) => prev.filter((item) => item.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const confirmSelectParts = () => {
    const items: StockOrderItem[] = spareParts
      .filter((p) => tempSelectedKeys.includes(p.id))
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        spec: p.spec,
        type: p.type,
        totalStock: p.totalStock,
        price: p.price,
        totalPrice: p.price,
        manufacturer: p.manufacturer,
        unit: p.unit,
        quantity: 1,
      }));
    setSelectedItems(items);
    setSelectPartsOpen(false);
  };

  const handleSave = async () => {
    try {
      const values = await addForm.validateFields();
      if (selectedItems.length === 0) {
        message.warning('请选择备件清单');
        return;
      }
      const warehouse = WAREHOUSES.find((w) => w.id === values.warehouseId);
      const qty = selectedItems.reduce((s, i) => s + i.quantity, 0);
      const totalPrice = selectedItems.reduce((s, i) => s + i.totalPrice, 0);
      const now = dayjs();
      const record: OutboundRecord = {
        id: String(Date.now()),
        orderNo: `CK${now.format('YYYYMMDDHHmmss')}`,
        type: values.type,
        warehouseId: values.warehouseId,
        warehouseName: warehouse?.name ?? '',
        person: values.person,
        time: values.time.format('YYYY/M/D HH:mm'),
        quantity: qty,
        unit: selectedItems[0]?.unit ?? '',
        unitPrice: selectedItems[0]?.price ?? null,
        totalPrice,
        sparePartNames: selectedItems.map((i) => i.name).join('、'),
        sparePartCodes: selectedItems.map((i) => i.code).join('、'),
        spec: selectedItems.map((i) => i.spec).join('、'),
        department: values.department,
        operateTime: now.format('YYYY/M/D HH:mm'),
        remark: values.remark ?? '',
        items: selectedItems,
      };
      setData((prev) => [record, ...prev]);
      message.success('保存成功');
      setModalOpen(false);
    } catch {
      /* validation failed */
    }
  };

  const columns: ColumnsType<OutboundRecord> = [
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
    { title: '出库单号', dataIndex: 'orderNo', width: 160, ellipsis: true },
    { title: '出库类型', dataIndex: 'type', width: 110 },
    { title: '出库仓库', dataIndex: 'warehouseName', width: 120 },
    { title: '出库人', dataIndex: 'person', width: 100 },
    { title: '出库时间', dataIndex: 'time', width: 140 },
    {
      title: '出库数量',
      dataIndex: 'quantity',
      width: 90,
      align: 'center',
    },
    { title: '计量单位', dataIndex: 'unit', width: 90, align: 'center' },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 90,
      align: 'right',
      render: (v: number | null) => (v == null ? '' : v.toFixed(2)),
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      width: 90,
      align: 'right',
      render: (v: number | null) => (v == null ? '' : v.toFixed(2)),
    },
    {
      title: '备件清单',
      dataIndex: 'sparePartNames',
      width: 140,
      ellipsis: true,
    },
    { title: '规格型号', dataIndex: 'spec', width: 110, ellipsis: true },
    { title: '领用部门', dataIndex: 'department', width: 110 },
    { title: '操作时间', dataIndex: 'operateTime', width: 140 },
    { title: '备注', dataIndex: 'remark', width: 120, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_v, record) => (
        <a className="link-danger" onClick={() => handleDelete(record)}>
          删除
        </a>
      ),
    },
  ];

  const itemColumns: ColumnsType<StockOrderItem> = [
    { title: '备件编号', dataIndex: 'code', width: 140 },
    { title: '备件名称', dataIndex: 'name', width: 120 },
    { title: '规格型号', dataIndex: 'spec', width: 100 },
    { title: '备件类型', dataIndex: 'type', width: 100 },
    {
      title: '总库存',
      dataIndex: 'totalStock',
      width: 80,
      align: 'center',
    },
    {
      title: '价格(元)',
      dataIndex: 'price',
      width: 90,
      align: 'right',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      width: 90,
      align: 'right',
      render: (v: number) => v.toFixed(2),
    },
    { title: '生产厂家', dataIndex: 'manufacturer', width: 110 },
    { title: '计量单位', dataIndex: 'unit', width: 90, align: 'center' },
  ];

  return (
    <div className="stock-order-page">
      <div className="search-bar">
        <Form form={form} layout="inline" className="search-form">
          <Form.Item label="出库单号" name="orderNo">
            <Input placeholder="请输入出库单号" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="出库类型" name="type">
            <Select
              allowClear
              placeholder="请选择出库类型"
              style={{ width: 160 }}
              options={OUTBOUND_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Form.Item label="出库人" name="person">
            <Select
              allowClear
              placeholder="请选择出库人"
              style={{ width: 140 }}
              options={PERSONS.map((p) => ({ label: p, value: p }))}
            />
          </Form.Item>
          <Form.Item label="出库时间" name="timeRange">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item label="备件清单" name="sparePartId">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="请选择备件清单"
              style={{ width: 160 }}
              options={spareParts.map((p) => ({
                label: `${p.code} / ${p.name}`,
                value: p.id,
              }))}
            />
          </Form.Item>
          <Form.Item label="领用部门" name="department">
            <Select
              allowClear
              placeholder="请选择领用部门"
              style={{ width: 160 }}
              options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            新增出库
          </Button>
          <Space size="middle" className="table-utils">
            <ReloadOutlined
              title="刷新"
              onClick={() => {
                setData([...mockOutboundRecords]);
                message.success('已刷新');
              }}
            />
            <SettingOutlined title="列设置" />
            <SearchOutlined title="搜索" />
            <FullscreenOutlined title="全屏" />
            <ColumnHeightOutlined title="密度" />
          </Space>
        </div>

        <Table<OutboundRecord>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1800 }}
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
        title="新增出库"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={880}
        destroyOnHidden
        centered
        className="spare-modal"
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            保存
          </Button>,
        ]}
      >
        <Form form={addForm} layout="vertical" className="spare-modal-form">
          <div className="spare-modal-section">
            <div className="spare-modal-section-head">
              <span className="spare-modal-section-title">出库信息</span>
            </div>
            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item
                  label="出库类型"
                  name="type"
                  rules={[{ required: true, message: '请选择出库类型' }]}
                >
                  <Select
                    placeholder="请选择出库类型"
                    options={OUTBOUND_TYPES.map((t) => ({
                      label: t,
                      value: t,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="出库仓库"
                  name="warehouseId"
                  rules={[{ required: true, message: '请选择出库仓库' }]}
                >
                  <Select
                    placeholder="请选择出库仓库"
                    options={WAREHOUSES.map((w) => ({
                      label: w.name,
                      value: w.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="出库人"
                  name="person"
                  rules={[{ required: true, message: '请选择出库人' }]}
                >
                  <Select
                    placeholder="请选择出库人"
                    options={PERSONS.map((p) => ({ label: p, value: p }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="出库时间"
                  name="time"
                  rules={[{ required: true, message: '请选择出库时间' }]}
                >
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="领用部门"
                  name="department"
                  rules={[{ required: true, message: '请选择领用部门' }]}
                >
                  <Select
                    placeholder="请选择领用部门"
                    options={DEPARTMENTS.map((d) => ({
                      label: d,
                      value: d,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="备注" name="remark">
                  <TextArea rows={1} placeholder="请输入备注" allowClear />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="spare-modal-section">
            <div className="spare-modal-section-head">
              <span className="spare-modal-section-title">
                <span className="spare-modal-required">*</span>
                备件清单
              </span>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setTempSelectedKeys(selectedItems.map((i) => i.id));
                  setSelectPartsOpen(true);
                }}
              >
                选择备件名称
              </Button>
            </div>
            <Table<StockOrderItem>
              rowKey="id"
              size="small"
              pagination={false}
              columns={itemColumns}
              dataSource={selectedItems}
              locale={{ emptyText: '暂无数据，请先选择备件' }}
              scroll={{ x: 900 }}
            />
          </div>
        </Form>
      </Modal>

      <Modal
        title="选择备件"
        open={selectPartsOpen}
        onOk={confirmSelectParts}
        onCancel={() => setSelectPartsOpen(false)}
        okText="确认"
        cancelText="取消"
        width={800}
        destroyOnHidden
        centered
        className="spare-modal spare-modal-select"
      >
        <Table
          rowKey="id"
          size="small"
          dataSource={spareParts}
          pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条` }}
          rowSelection={{
            selectedRowKeys: tempSelectedKeys,
            onChange: setTempSelectedKeys,
          }}
          columns={[
            { title: '备件编号', dataIndex: 'code', width: 160 },
            { title: '备件名称', dataIndex: 'name' },
            { title: '规格型号', dataIndex: 'spec' },
            { title: '备件类型', dataIndex: 'type' },
            {
              title: '总库存',
              dataIndex: 'totalStock',
              align: 'center' as const,
              width: 90,
            },
            {
              title: '价格(元)',
              dataIndex: 'price',
              width: 100,
              render: (v: number) => v.toFixed(2),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
