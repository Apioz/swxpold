import { useMemo, useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { SpaceCenterRecord } from '../../../types/foundationSpace';
import {
  SPACE_CENTER_TOTAL,
  spaceCenterRecords,
  spaceCenterStats,
} from '../../../data/mockSpaceCenter';
import './SpaceCenter.css';

const { RangePicker } = DatePicker;

interface SearchForm {
  unit?: string;
  name?: string;
  code?: string;
  category?: string;
  model?: string;
  usage?: string;
  status?: string;
  usageUnit?: string;
}

const columns: ColumnsType<SpaceCenterRecord> = [
  { title: '空间名称', dataIndex: 'name', width: 140, fixed: 'left' },
  { title: '空间编码', dataIndex: 'code', width: 130 },
  { title: '空间大类', dataIndex: 'category', width: 90 },
  { title: 'ElementId', dataIndex: 'elementId', width: 100 },
  { title: '关联模型', dataIndex: 'relatedModel', width: 130 },
  { title: '空间用途', dataIndex: 'usage', width: 90 },
  { title: '空间状态', dataIndex: 'status', width: 90 },
  { title: '建筑面积', dataIndex: 'buildingArea', width: 100, align: 'right' },
  { title: '出租面积', dataIndex: 'rentArea', width: 100, align: 'right' },
  { title: '面积单价', dataIndex: 'unitPrice', width: 100, align: 'right' },
  { title: '整套单价', dataIndex: 'totalPrice', width: 100, align: 'right' },
  { title: '使用单位', dataIndex: 'usageUnit', width: 100 },
  { title: '竣工日期', dataIndex: 'completionDate', width: 110 },
  { title: '楼层', dataIndex: 'floor', width: 70 },
  { title: '创建时间', dataIndex: 'createdAt', width: 170 },
];

export default function SpaceCenter() {
  const [searchForm] = Form.useForm();
  const [search, setSearch] = useState<SearchForm>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const tableData = useMemo(() => {
    let data = spaceCenterRecords;
    if (search.name?.trim()) {
      data = data.filter((item) => item.name.includes(search.name!.trim()));
    }
    if (search.code?.trim()) {
      data = data.filter((item) => item.code.includes(search.code!.trim()));
    }
    if (search.status?.trim()) {
      data = data.filter((item) => item.status.includes(search.status!.trim()));
    }
    return data;
  }, [search]);

  const statItems = [
    { label: '单体总数（个）', value: spaceCenterStats.unitTotal },
    { label: '空间总数（个）', value: spaceCenterStats.spaceTotal },
    { label: '总建筑面积（m²）', value: spaceCenterStats.buildingAreaTotal },
    { label: '总出租面积（m²）', value: spaceCenterStats.rentAreaTotal },
    { label: '空间总费用（元）', value: spaceCenterStats.costTotal },
  ];

  return (
    <div className="space-center-page">
      <div className="space-center-stats">
        {statItems.map((item) => (
          <div key={item.label} className="space-center-stat-item">
            <div className="space-center-stat-label">{item.label}</div>
            <div className="space-center-stat-value">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="space-center-search-card">
        <Form
          form={searchForm}
          layout="horizontal"
          labelCol={{ flex: '88px' }}
          wrapperCol={{ flex: 1 }}
          className="space-center-search-form"
          onFinish={(values) => setSearch(values)}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="所属单体" name="unit">
                <Select placeholder="请选择" allowClear options={[]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="空间名称" name="name">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="空间编码" name="code">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="空间分类" name="category">
                <Select placeholder="请选择" allowClear options={[]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="关联模型" name="model">
                <Select placeholder="请选择" allowClear options={[]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="空间用途" name="usage">
                <Select placeholder="请选择" allowClear options={[]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="空间状态" name="status">
                <Select placeholder="请选择" allowClear options={[]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="使用单位" name="usageUnit">
                <Select placeholder="请选择" allowClear options={[]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="创建时间" name="createdRange">
                <RangePicker style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} />
              </Form.Item>
            </Col>
            <Col span={18}>
              <div className="space-center-search-actions">
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button
                  onClick={() => {
                    searchForm.resetFields();
                    setSearch({});
                  }}
                >
                  清空
                </Button>
                <span className="space-center-collapse-link">收起</span>
              </div>
            </Col>
          </Row>
        </Form>
      </div>

      <div className="space-center-table-card">
        <div className="space-center-table-toolbar">
          <div className="space-center-table-toolbar-left">
            <Button className="space-center-btn-export" icon={<DownloadOutlined />}>
              导出
            </Button>
          </div>
          <Space size="middle" className="space-center-table-utils">
            <ReloadOutlined />
            <ColumnHeightOutlined />
            <SearchOutlined />
            <FullscreenOutlined />
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          scroll={{ x: 1900 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          pagination={{
            total: SPACE_CENTER_TOTAL,
            current: 1,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      </div>
    </div>
  );
}
