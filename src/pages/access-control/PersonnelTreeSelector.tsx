import { useEffect, useMemo, useState, type Key } from 'react';
import { Button, Input, Space, Table, Tree } from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { Person } from '../../types/personnel';
import { getActivePersonnel, getPersonById } from '../../data/mockPersonnel';
import {
  buildPersonnelTreeData,
  computeTreeCheckedKeys,
  resolvePersonIdsFromCheckedKeys,
} from '../../utils/accessControlPermissions';
import './AccessControl.css';

interface PersonnelTreeSelectorProps {
  value?: string[];
  onChange?: (ids: string[]) => void;
  /** 权限说明，如「仅对本门禁点生效」 */
  scopeHint?: string;
}

export default function PersonnelTreeSelector({
  value = [],
  onChange,
  scopeHint = '未添加的人员无法通行',
}: PersonnelTreeSelectorProps) {
  const personnel = useMemo(() => getActivePersonnel(), []);
  const [keyword, setKeyword] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedPersonKeys, setSelectedPersonKeys] = useState<string[]>([]);

  const { treeData, searchExpandedKeys, nodeToPersonIds, deptPersonIds, companyPersonIds } =
    useMemo(() => buildPersonnelTreeData(personnel, keyword), [personnel, keyword]);

  useEffect(() => {
    if (keyword.trim()) {
      setExpandedKeys(searchExpandedKeys);
    }
  }, [keyword, searchExpandedKeys]);

  const treeCheckedKeys = useMemo(
    () => computeTreeCheckedKeys(value, deptPersonIds, companyPersonIds),
    [value, deptPersonIds, companyPersonIds],
  );

  const selectedPersons = useMemo(
    () =>
      value
        .map((id) => getPersonById(id))
        .filter(Boolean) as Person[],
    [value],
  );

  const handleTreeCheck = (
    checked: Key[] | { checked: Key[]; halfChecked: Key[] },
  ) => {
    const keys = (Array.isArray(checked) ? checked : checked.checked) as string[];
    onChange?.(resolvePersonIdsFromCheckedKeys(keys, nodeToPersonIds));
  };

  const removePerson = (personId: string) => {
    onChange?.(value.filter((id) => id !== personId));
    setSelectedPersonKeys((keys) => keys.filter((k) => k !== personId));
  };

  const batchRemovePersons = () => {
    if (selectedPersonKeys.length === 0) return;
    onChange?.(value.filter((id) => !selectedPersonKeys.includes(id)));
    setSelectedPersonKeys([]);
  };

  return (
    <div className="access-person-selector">
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="输入员工姓名、工号、公司名称、部门名称等关键字搜索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="access-person-tree-hint">
        可勾选公司或部门批量添加人员；点击节点左侧箭头展开/收起
      </div>

      <div className="access-person-tree-wrap">
        <Tree
          checkable
          blockNode
          selectable={false}
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          checkedKeys={treeCheckedKeys}
          onCheck={handleTreeCheck}
          className="access-person-tree"
        />
      </div>

      <div className="access-person-list-head">
        <span>已选人员（{selectedPersons.length}）</span>
        <Space size="middle">
          <span className="access-person-list-hint">{scopeHint}</span>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={selectedPersonKeys.length === 0}
            onClick={batchRemovePersons}
          >
            批量删除{selectedPersonKeys.length > 0 ? ` (${selectedPersonKeys.length})` : ''}
          </Button>
        </Space>
      </div>

      <Table
        size="small"
        rowKey="id"
        pagination={false}
        locale={{ emptyText: '请从上方组织树中选择人员' }}
        dataSource={selectedPersons}
        className="access-person-list-table"
        rowSelection={{
          selectedRowKeys: selectedPersonKeys,
          onChange: (keys) => setSelectedPersonKeys(keys as string[]),
        }}
        columns={[
          { title: '公司', dataIndex: 'company', width: 160, ellipsis: true },
          { title: '部门', dataIndex: 'department', width: 120, ellipsis: true },
          { title: '工号', dataIndex: 'employeeNo', width: 100 },
          { title: '姓名', dataIndex: 'name', width: 90 },
          { title: '卡号', dataIndex: 'cardNo', width: 120 },
          {
            title: '操作',
            width: 70,
            align: 'center',
            render: (_, record) => (
              <a className="danger-link" onClick={() => removePerson(record.id)}>
                删除
              </a>
            ),
          },
        ]}
      />
    </div>
  );
}
