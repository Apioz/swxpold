import { useEffect, useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import type { SelectedDocumentImage } from '../../types/foundationDocument';
import {
  buildLocalCoverSelection,
  isDisplayableFloorPlanImage,
  readLocalImageAsDataUrl,
} from '../../utils/meetingRoomFloorContext';
import './DocumentExplorer.css';

const LOCAL_ACCEPT = '.png,.jpg,.jpeg,.svg,.webp';

interface DocumentImagePickerModalProps {
  open: boolean;
  title?: string;
  expectedBuilding?: string;
  expectedFloor?: string;
  initialSelection?: SelectedDocumentImage | null;
  onCancel: () => void;
  onConfirm: (selection: SelectedDocumentImage) => void;
}

export default function DocumentImagePickerModal({
  open,
  title = '上传会议室封面',
  expectedBuilding,
  expectedFloor,
  initialSelection,
  onCancel,
  onConfirm,
}: DocumentImagePickerModalProps) {
  const [preview, setPreview] = useState<SelectedDocumentImage | null>(null);
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPreview(initialSelection ?? null);
    setUploadFileList(
      initialSelection
        ? [{ uid: initialSelection.imageId, name: initialSelection.imageName, status: 'done' }]
        : [],
    );
    setLocalLoading(false);
  }, [open, initialSelection]);

  const handleLocalUpload = (file: File) => {
    if (!expectedBuilding || !expectedFloor) {
      message.warning('请先选择空间位置（至少到楼层），以便关联楼栋与楼层');
      return Upload.LIST_IGNORE;
    }

    const isImage = file.type.startsWith('image/');
    if (!isImage && !/\.(png|jpe?g|svg|webp)$/i.test(file.name)) {
      message.error('请上传 PNG、JPG、SVG 或 WEBP 格式的图片');
      return Upload.LIST_IGNORE;
    }

    setLocalLoading(true);
    setUploadFileList([
      {
        uid: `local-${Date.now()}`,
        name: file.name,
        status: 'uploading',
      },
    ]);

    void readLocalImageAsDataUrl(file)
      .then((dataUrl) => {
        const selection = buildLocalCoverSelection(
          file,
          expectedBuilding,
          expectedFloor,
          dataUrl,
        );
        setPreview(selection);
        setUploadFileList([
          {
            uid: selection.imageId,
            name: file.name,
            status: 'done',
          },
        ]);
      })
      .catch(() => {
        message.error('图片读取失败，请重试');
        setUploadFileList([]);
        setPreview(null);
      })
      .finally(() => setLocalLoading(false));

    return false;
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={720}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            disabled={!preview || localLoading}
            onClick={() => preview && onConfirm(preview)}
          >
            确定
          </Button>
        </Space>
      }
      className="doc-image-picker-modal doc-cover-picker-modal"
    >
      <div className="doc-floor-plan-picker-tip">
        上传室内全景图作为会议室封面（可选），保存后写入数据库并在小程序列表展示；与楼层平面图互不影响。
        {expectedBuilding && expectedFloor
          ? ` 当前会议室：${expectedBuilding} · ${expectedFloor}`
          : ' 请先选择空间位置（至少到楼层），以便关联楼栋与楼层。'}
      </div>

      <div className="doc-floor-plan-upload-layout">
        <Upload.Dragger
          accept={LOCAL_ACCEPT}
          maxCount={1}
          fileList={uploadFileList}
          beforeUpload={handleLocalUpload}
          onRemove={() => {
            setPreview(null);
            setUploadFileList([]);
          }}
          className="doc-floor-plan-upload-dragger"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
          <p className="ant-upload-hint">支持 PNG、JPG、SVG 或 WEBP 格式</p>
        </Upload.Dragger>
        <div className="doc-image-picker-preview doc-floor-plan-upload-preview">
          <div className="doc-image-picker-preview-title">封面预览</div>
          {localLoading ? (
            <div className="meeting-room-cover-preview is-empty" style={{ width: '100%', height: 160 }}>
              正在读取图片...
            </div>
          ) : preview ? (
            <>
              {isDisplayableFloorPlanImage(preview.imageUrl, preview.imageName) ? (
                <img src={preview.imageUrl} alt={preview.imageName} />
              ) : (
                <div className="doc-floor-plan-file-preview">
                  <InboxOutlined />
                  <span>{preview.imageName}</span>
                </div>
              )}
              <div className="doc-image-picker-preview-meta">
                <div>{preview.imageName}</div>
                <div>{preview.documentPath}</div>
              </div>
            </>
          ) : (
            <div className="meeting-room-cover-preview is-empty" style={{ width: '100%', height: 160 }}>
              请上传封面图片
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
