import { useMemo, useState } from 'react';
import {
  AppstoreOutlined,
  FileImageOutlined,
  FolderFilled,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Input, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DocumentNode, SelectedDocumentImage, SelectedFloorPlan } from '../../types/foundationDocument';
import {
  buildSelectedDocumentImage,
  buildSelectedFloorPlan,
  filterDocumentTree,
  foundationDocumentTree,
  getDocumentChildren,
  getDocumentPath,
} from '../../data/mockFoundationDocuments';
import './DocumentExplorer.css';

interface DocumentExplorerProps {
  mode?: 'browse' | 'pick-image' | 'pick-floor-plan';
  defaultFolderId?: string;
  selectedImageId?: string;
  onSelectFolder?: (folderId: string) => void;
  onSelectImage?: (image: SelectedDocumentImage) => void;
  onSelectFloorPlan?: (plan: SelectedFloorPlan) => void;
  treeKeyword?: string;
  fileKeyword?: string;
  onTreeKeywordChange?: (value: string) => void;
  onFileKeywordChange?: (value: string) => void;
}

function toTreeNodes(nodes: DocumentNode[]): DocumentNode[] {
  return nodes;
}

function TreeNode({
  node,
  depth,
  selectedFolderId,
  expandedKeys,
  onToggle,
  onSelect,
}: {
  node: DocumentNode;
  depth: number;
  selectedFolderId: string;
  expandedKeys: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const expanded = expandedKeys.has(node.id);
  const isSelected = selectedFolderId === node.id;

  return (
    <>
      <div
        className={`doc-explorer-tree-node${isSelected ? ' is-selected' : ''}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => {
          if (node.type === 'folder' || node.type === 'campus') onSelect(node.id);
          if (hasChildren) onToggle(node.id);
        }}
      >
        {hasChildren ? (
          <span className="doc-explorer-tree-arrow">{expanded ? '▼' : '▶'}</span>
        ) : (
          <span className="doc-explorer-tree-arrow is-placeholder" />
        )}
        <FolderFilled className="doc-explorer-folder-icon" />
        <span className="doc-explorer-tree-label">{node.name}</span>
      </div>
      {hasChildren && expanded
        ? node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </>
  );
}

export default function DocumentExplorer({
  mode = 'browse',
  defaultFolderId = 'campus-root',
  selectedImageId,
  onSelectFolder,
  onSelectImage,
  onSelectFloorPlan,
  treeKeyword = '',
  fileKeyword = '',
  onTreeKeywordChange,
  onFileKeywordChange,
}: DocumentExplorerProps) {
  const [selectedFolderId, setSelectedFolderId] = useState(defaultFolderId);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () =>
      new Set([
        'campus-root',
        'ref-drawings',
        'building-office2',
        'office2-2f',
        'office2-2f-arch',
      ]),
  );
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const treeData = useMemo(
    () => toTreeNodes(filterDocumentTree(foundationDocumentTree, treeKeyword)),
    [treeKeyword],
  );

  const folderChildren = useMemo(() => {
    let children = getDocumentChildren(selectedFolderId);
    if (mode === 'pick-image') {
      children = children.filter((item) => item.type !== 'image' || !item.id.endsWith('-plan'));
    }
    if (mode === 'pick-floor-plan') {
      children = children.filter((item) => item.type === 'folder' || item.id.endsWith('-plan'));
    }
    if (!fileKeyword.trim()) return children;
    const q = fileKeyword.trim().toLowerCase();
    return children.filter((item) => item.name.toLowerCase().includes(q));
  }, [selectedFolderId, fileKeyword, mode]);

  const handleSelectFolder = (id: string) => {
    setSelectedFolderId(id);
    onSelectFolder?.(id);
  };

  const handleToggle = (id: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: ColumnsType<DocumentNode> = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name: string, record) => (
        <span className="doc-explorer-file-name">
          {record.type === 'image' ? (
            <FileImageOutlined className="doc-explorer-file-icon image" />
          ) : (
            <FolderFilled className="doc-explorer-file-icon folder" />
          )}
          {name}
        </span>
      ),
    },
    {
      title: '类型',
      width: 100,
      render: (_, record) => (record.type === 'image' ? '图片' : '文件夹'),
    },
    {
      title: '上传日期',
      dataIndex: 'uploadDate',
      width: 170,
      render: (value?: string) => value ?? '-',
    },
  ];

  return (
    <div className="doc-explorer">
      <div className="doc-explorer-tree-panel">
        {onTreeKeywordChange && (
          <Input
            placeholder="请输入内容"
            prefix={<SearchOutlined />}
            value={treeKeyword}
            onChange={(e) => onTreeKeywordChange(e.target.value)}
            allowClear
            className="doc-explorer-tree-search"
          />
        )}
        <div className="doc-explorer-tree-body">
          {treeData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedFolderId={selectedFolderId}
              expandedKeys={expandedKeys}
              onToggle={handleToggle}
              onSelect={handleSelectFolder}
            />
          ))}
        </div>
      </div>

      <div className="doc-explorer-list-panel">
        <div className="doc-explorer-list-toolbar">
          {onFileKeywordChange && (
            <Input
              placeholder="请输入文件名称"
              prefix={<SearchOutlined />}
              value={fileKeyword}
              onChange={(e) => onFileKeywordChange(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />
          )}
          <div className="doc-explorer-view-toggle">
            <UnorderedListOutlined
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            />
            <AppstoreOutlined
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            />
          </div>
        </div>

        {viewMode === 'list' ? (
          <Table<DocumentNode>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={folderChildren}
            pagination={false}
            rowSelection={
              mode === 'pick-image' || mode === 'pick-floor-plan'
                ? {
                    type: 'radio',
                    selectedRowKeys: selectedImageId ? [selectedImageId] : [],
                    onChange: (_, selectedRows) => {
                      const record = selectedRows[0];
                      if (record?.type === 'image' && mode === 'pick-image') {
                        const selected = buildSelectedDocumentImage(record);
                        if (selected) onSelectImage?.(selected);
                      }
                      if (record?.type === 'image' && mode === 'pick-floor-plan') {
                        const selected = buildSelectedFloorPlan(record);
                        if (selected) onSelectFloorPlan?.(selected);
                      }
                    },
                    getCheckboxProps: (record) => ({
                      disabled: record.type !== 'image',
                    }),
                  }
                : undefined
            }
            rowClassName={(record) =>
              record.id === selectedImageId ? 'doc-explorer-row-selected' : ''
            }
            onRow={(record) => ({
              onClick: () => {
                if (record.type === 'folder') {
                  handleSelectFolder(record.id);
                  setExpandedKeys((prev) => new Set(prev).add(record.id));
                } else if (record.type === 'image' && mode === 'pick-image') {
                  const selected = buildSelectedDocumentImage(record);
                  if (selected) onSelectImage?.(selected);
                } else if (record.type === 'image' && mode === 'pick-floor-plan') {
                  const selected = buildSelectedFloorPlan(record);
                  if (selected) onSelectFloorPlan?.(selected);
                }
              },
              onDoubleClick: () => {
                if (record.type === 'folder') {
                  handleSelectFolder(record.id);
                }
              },
            })}
          />
        ) : (
          <div className="doc-explorer-grid">
            {folderChildren.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`doc-explorer-grid-item${item.id === selectedImageId ? ' is-selected' : ''}`}
                onClick={() => {
                  if (item.type === 'folder') handleSelectFolder(item.id);
                  else if (item.type === 'image' && mode === 'pick-image') {
                    const selected = buildSelectedDocumentImage(item);
                    if (selected) onSelectImage?.(selected);
                  } else if (item.type === 'image' && mode === 'pick-floor-plan') {
                    const selected = buildSelectedFloorPlan(item);
                    if (selected) onSelectFloorPlan?.(selected);
                  }
                }}
              >
                {item.type === 'image' && item.url ? (
                  <img src={item.url} alt={item.name} />
                ) : (
                  <FolderFilled className="doc-explorer-grid-folder" />
                )}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="doc-explorer-path">当前路径：{getDocumentPath(selectedFolderId)}</div>
      </div>
    </div>
  );
}
