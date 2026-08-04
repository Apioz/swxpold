import { useMemo, useState } from 'react';
import {
  Empty,
  Modal,
  Radio,
  Table,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { CloudUploadOutlined, FolderOpenOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { FileCenterDocument } from '../../types/floorPlan';
import type { FloorPlanImageSource } from '../../types/floorPlan';
import { floorPlanDetails } from '../../data/mockFloorPlans';
import { getFileCenterDocumentsByFloor } from '../../data/mockFileCenter';
import { setFloorPlanImage } from '../../store/floorPlanStore';

interface ImportFloorPlanModalProps {
  open: boolean;
  floorId: string;
  floorName: string;
  floorLabel: string;
  onClose: () => void;
}

export default function ImportFloorPlanModal({
  open,
  floorId,
  floorName,
  floorLabel,
  onClose,
}: ImportFloorPlanModalProps) {
  const [source, setSource] = useState<FloorPlanImageSource>('upload');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const floorDocuments = useMemo(
    () => getFileCenterDocumentsByFloor(floorId),
    [floorId],
  );
  const folderName = floorPlanDetails[floorId]?.buildingName ?? '';

  const handleImport = () => {
    if (source === 'upload') {
      const file = fileList[0]?.originFileObj;
      if (!file) {
        message.warning('请先上传图纸文件');
        return;
      }
      const url = URL.createObjectURL(file);
      setFloorPlanImage({
        floorId,
        fileName: file.name,
        source: 'upload',
        imageUrl: url,
        importedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success(`已导入图纸「${file.name}」`);
    } else {
      const doc = floorDocuments.find((d) => d.id === selectedDocId);
      if (!doc) {
        message.warning('请选择当前楼层对应的图纸文件');
        return;
      }
      setFloorPlanImage({
        floorId,
        fileName: doc.name,
        source: 'fileCenter',
        imageUrl: doc.previewUrl,
        fileCenterDocId: doc.id,
        importedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success(`已从文件中心导入「${doc.name}」`);
    }
    setFileList([]);
    setSelectedDocId(null);
    onClose();
  };

  return (
    <Modal
      title={`导入图纸 — ${floorName}`}
      open={open}
      onCancel={onClose}
      onOk={handleImport}
      okText="确认导入"
      cancelText="取消"
      width={640}
      destroyOnHidden
    >
      <Radio.Group
        value={source}
        onChange={(e) => setSource(e.target.value)}
        style={{ marginBottom: 16 }}
      >
        <Radio.Button value="upload">
          <CloudUploadOutlined /> 上传图纸文件
        </Radio.Button>
        <Radio.Button value="fileCenter">
          <FolderOpenOutlined /> 从底座文件中心选择
        </Radio.Button>
      </Radio.Group>

      {source === 'upload' ? (
        <Upload.Dragger
          accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.svg"
          maxCount={1}
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽图纸文件到此处</p>
          <p className="ant-upload-hint">支持 DWG、DXF、PDF、PNG、JPG 等格式</p>
        </Upload.Dragger>
      ) : (
        <>
          <div className="floor-import-folder">
            <FolderOpenOutlined />
            <span className="floor-import-folder-path">
              底座文件中心 / {folderName} / {floorLabel}
            </span>
          </div>
          <p className="floor-import-hint">
            图纸文件名须与目录名一一对应，如「{floorLabel}.dwg」
          </p>
          {floorDocuments.length === 0 ? (
            <Empty
              description={`「${folderName}」中暂无「${floorLabel}」对应图纸`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table<FileCenterDocument>
              size="small"
              rowKey="id"
              pagination={false}
              scroll={{ y: 240 }}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedDocId ? [selectedDocId] : [],
                onChange: (keys) => setSelectedDocId(keys[0] as string),
              }}
              columns={[
                { title: '文档名称', dataIndex: 'name', ellipsis: true },
                { title: '分类', dataIndex: 'category', width: 90 },
                { title: '格式', dataIndex: 'fileType', width: 70 },
                { title: '大小', dataIndex: 'size', width: 80 },
              ]}
              dataSource={floorDocuments}
            />
          )}
        </>
      )}
    </Modal>
  );
}
