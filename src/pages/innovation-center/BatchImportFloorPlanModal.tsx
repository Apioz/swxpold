import { useMemo, useState } from 'react';
import {
  Alert,
  Checkbox,
  Modal,
  Radio,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { CloudUploadOutlined, FolderOpenOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { FloorPlanImageConfig, FloorPlanImageSource } from '../../types/floorPlan';
import {
  getFileCenterDocumentsByFolder,
  getFileCenterFolders,
  mockFileCenterDocuments,
} from '../../data/mockFileCenter';
import { batchSetFloorPlanImages } from '../../store/floorPlanStore';
import {
  countCampusFloors,
  getBuildingFloorGroups,
  matchUploadFileToFloor,
} from '../../utils/floorPlanImportMatch';

interface BatchImportFloorPlanModalProps {
  open: boolean;
  campusName: string;
  onClose: () => void;
}

type PreviewRow = {
  key: string;
  kind: 'upload' | 'fileCenter';
  fileName: string;
  matched: boolean;
  catalogPath: string;
  reason?: string;
  floorId?: string;
  imageUrl?: string;
  fileCenterDocId?: string;
};

export default function BatchImportFloorPlanModal({
  open,
  campusName,
  onClose,
}: BatchImportFloorPlanModalProps) {
  const [source, setSource] = useState<FloorPlanImageSource>('upload');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>(() =>
    getFileCenterFolders().map((f) => f.folderName),
  );
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() =>
    mockFileCenterDocuments.map((d) => d.id),
  );

  const folders = useMemo(() => getFileCenterFolders(), []);
  const buildingGroups = useMemo(() => getBuildingFloorGroups(), []);

  const uploadPreview = useMemo((): PreviewRow[] => {
    return fileList.map((f) => {
      const fileName = f.name;
      const file = f.originFileObj;
      const result = matchUploadFileToFloor(fileName, 'campus');
      return {
        key: fileName,
        kind: 'upload',
        fileName,
        matched: result.matched,
        catalogPath: result.target?.catalogPath ?? '-',
        reason: result.reason,
        floorId: result.target?.floorId,
        imageUrl: file ? URL.createObjectURL(file) : undefined,
      };
    });
  }, [fileList]);

  const fileCenterPreview = useMemo((): PreviewRow[] => {
    const rows: PreviewRow[] = [];
    selectedFolders.forEach((folderName) => {
      const group = buildingGroups.find((g) => g.folderName === folderName);
      if (!group) return;
      getFileCenterDocumentsByFolder(folderName).forEach((doc) => {
        const floor = group.floors.find((f) => f.floorId === doc.floorId);
        rows.push({
          key: doc.id,
          kind: 'fileCenter',
          fileName: doc.name,
          matched: true,
          catalogPath: floor ? `${group.buildingTitle} / ${floor.title}` : '-',
          floorId: doc.floorId,
          imageUrl: doc.previewUrl,
          fileCenterDocId: doc.id,
        });
      });
    });
    return rows;
  }, [selectedFolders, buildingGroups]);

  const previewRows = source === 'upload' ? uploadPreview : fileCenterPreview;
  const selectedFileCenterRows = fileCenterPreview.filter((r) => selectedDocIds.includes(r.key));
  const matchedCount =
    source === 'upload'
      ? uploadPreview.filter((r) => r.matched && r.floorId).length
      : selectedFileCenterRows.length;

  const handleImport = () => {
    const configs: FloorPlanImageConfig[] = [];
    const importedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (source === 'upload') {
      if (fileList.length === 0) {
        message.warning('请先上传图纸文件');
        return;
      }
      const unmatched = uploadPreview.filter((r) => !r.matched);
      if (unmatched.length > 0) {
        message.error(`有 ${unmatched.length} 个文件未能匹配图纸目录，请修正后重试`);
        return;
      }
      uploadPreview.forEach((row) => {
        if (!row.floorId || !row.imageUrl) return;
        configs.push({
          floorId: row.floorId,
          fileName: row.fileName,
          source: 'upload',
          imageUrl: row.imageUrl,
          importedAt,
        });
      });
    } else {
      if (selectedFolders.length === 0) {
        message.warning('请至少选择一个底座文件中心文件夹');
        return;
      }
      if (selectedFileCenterRows.length === 0) {
        message.warning('请至少选择一张要导入的图纸');
        return;
      }
      selectedFileCenterRows.forEach((row) => {
        if (!row.floorId || !row.imageUrl) return;
        configs.push({
          floorId: row.floorId,
          fileName: row.fileName,
          source: 'fileCenter',
          imageUrl: row.imageUrl,
          fileCenterDocId: row.fileCenterDocId,
          importedAt,
        });
      });
    }

    if (configs.length === 0) {
      message.warning('没有可导入的图纸');
      return;
    }

    batchSetFloorPlanImages(configs);
    message.success(`已成功批量导入 ${configs.length} 张图纸`);
    setFileList([]);
    onClose();
  };

  const toggleFolder = (folderName: string, checked: boolean) => {
    const folderDocIds = getFileCenterDocumentsByFolder(folderName).map((d) => d.id);
    setSelectedFolders((prev) =>
      checked ? [...prev, folderName] : prev.filter((f) => f !== folderName),
    );
    setSelectedDocIds((prev) => {
      if (checked) {
        return [...new Set([...prev, ...folderDocIds])];
      }
      const removeSet = new Set(folderDocIds);
      return prev.filter((id) => !removeSet.has(id));
    });
  };

  const toggleAllFolders = (checked: boolean) => {
    setSelectedFolders(checked ? folders.map((f) => f.folderName) : []);
    setSelectedDocIds(checked ? mockFileCenterDocuments.map((d) => d.id) : []);
  };

  return (
    <Modal
      title={`批量导入图纸 — ${campusName}`}
      open={open}
      onCancel={onClose}
      onOk={handleImport}
      okText={`确认导入${matchedCount > 0 ? `（${matchedCount} 张）` : ''}`}
      cancelText="取消"
      width={780}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        className="floor-batch-import-tip"
        message="图纸文件名须与左侧图纸目录名称一一对应"
        description={
          source === 'upload'
            ? '批量上传命名格式：8号楼-一楼.dwg 或 生物芯片智慧园区8号楼-一楼.dwg'
            : '将从底座文件中心各楼栋文件夹导入；可在下方列表取消不需要导入的图纸'
        }
      />

      <Radio.Group
        value={source}
        onChange={(e) => setSource(e.target.value)}
        style={{ margin: '16px 0' }}
      >
        <Radio.Button value="upload">
          <CloudUploadOutlined /> 一键上传导入
        </Radio.Button>
        <Radio.Button value="fileCenter">
          <FolderOpenOutlined /> 从底座文件中心导入
        </Radio.Button>
      </Radio.Group>

      {source === 'upload' ? (
        <Upload.Dragger
          multiple
          accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.svg"
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: fl }) => setFileList(fl)}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽多个图纸文件到此处</p>
          <p className="ant-upload-hint">
            文件名示例：8号楼-一楼.dwg、8号楼-二楼.dwg（共 {countCampusFloors()} 张楼层图纸）
          </p>
        </Upload.Dragger>
      ) : (
        <div className="floor-batch-folder-list">
          <div className="floor-batch-folder-head">
            <Checkbox
              indeterminate={
                selectedFolders.length > 0 && selectedFolders.length < folders.length
              }
              checked={selectedFolders.length === folders.length}
              onChange={(e) => toggleAllFolders(e.target.checked)}
            >
              全选文件夹
            </Checkbox>
            <span className="floor-batch-folder-hint">底座文件中心 / 生物芯片智慧园区</span>
          </div>
          {folders.map((folder) => (
            <div key={folder.folderName} className="floor-batch-folder-item">
              <Checkbox
                checked={selectedFolders.includes(folder.folderName)}
                onChange={(e) => toggleFolder(folder.folderName, e.target.checked)}
              >
                <FolderOpenOutlined /> {folder.folderName}
              </Checkbox>
              <span className="floor-batch-folder-meta">
                {folder.documentCount} 张 · 与「{folder.buildingTitle}」目录对应
              </span>
            </div>
          ))}
        </div>
      )}

      {previewRows.length > 0 && (
        <div className="floor-batch-preview">
          <div className="floor-batch-preview-head">
            <span>匹配预览</span>
            <Space size={8}>
              <Tag color="success">已选 {matchedCount}</Tag>
              {source === 'fileCenter' && fileCenterPreview.length > matchedCount && (
                <Tag>共 {fileCenterPreview.length} 张</Tag>
              )}
              {source === 'upload' && (
                <Tag color="error">未匹配 {uploadPreview.filter((r) => !r.matched).length}</Tag>
              )}
            </Space>
          </div>
          <Table<PreviewRow>
            size="small"
            rowKey="key"
            pagination={false}
            scroll={{ y: 220 }}
            dataSource={previewRows}
            rowSelection={
              source === 'fileCenter'
                ? {
                    selectedRowKeys: selectedDocIds.filter((id) =>
                      fileCenterPreview.some((r) => r.key === id),
                    ),
                    onChange: (keys) => {
                      const visibleIds = new Set(fileCenterPreview.map((r) => r.key));
                      setSelectedDocIds((prev) => {
                        const kept = prev.filter((id) => !visibleIds.has(id));
                        return [...kept, ...(keys as string[])];
                      });
                    },
                  }
                : undefined
            }
            columns={[
              { title: '文件名', dataIndex: 'fileName', ellipsis: true, width: 180 },
              { title: '图纸目录', dataIndex: 'catalogPath', ellipsis: true },
              {
                title: '匹配状态',
                width: 100,
                render: (_, row) =>
                  row.matched ? (
                    <Tag color="success">已匹配</Tag>
                  ) : (
                    <Tag color="error">未匹配</Tag>
                  ),
              },
              {
                title: '说明',
                ellipsis: true,
                render: (_, row) =>
                  row.kind === 'upload' && !row.matched ? (
                    <span className="floor-batch-unmatch-reason">{row.reason}</span>
                  ) : (
                    '-'
                  ),
              },
            ]}
          />
        </div>
      )}
    </Modal>
  );
}
