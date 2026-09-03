import { useEffect, useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import type { SelectedFloorPlan } from '../../types/foundationDocument';
import { getFloorPlan } from '../../store/meetingRoomFloorPlanStore';
import {
  buildLocalFloorPlanSelection,
  isDisplayableFloorPlanImage,
  readLocalImageAsDataUrl,
  resolveManagedFloorPlanId,
} from '../../utils/meetingRoomFloorContext';
import './DocumentExplorer.css';

const LOCAL_ACCEPT = '.png,.jpg,.jpeg,.svg,.webp';

interface DocumentFloorPlanPickerModalProps {
  open: boolean;
  title?: string;
  expectedBuilding?: string;
  expectedFloor?: string;
  initialSelection?: SelectedFloorPlan | null;
  onCancel: () => void;
  onConfirm: (selection: SelectedFloorPlan) => void;
}

export default function DocumentFloorPlanPickerModal({
  open,
  title = '上传楼层平面图',
  expectedBuilding,
  expectedFloor,
  initialSelection,
  onCancel,
  onConfirm,
}: DocumentFloorPlanPickerModalProps) {
  const [preview, setPreview] = useState<SelectedFloorPlan | null>(null);
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
      message.warning('请先填写包含楼栋与楼层信息的地址');
      return Upload.LIST_IGNORE;
    }

    const isImage = file.type.startsWith('image/');
    if (!isImage && !/\.(png|jpe?g|svg|webp)$/i.test(file.name)) {
      message.error('请上传 PNG、JPG、SVG 或 WEBP 格式的平面图');
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
        const existingPlan = getFloorPlan(expectedBuilding, expectedFloor);
        const selection = buildLocalFloorPlanSelection(
          file,
          expectedBuilding,
          expectedFloor,
          dataUrl,
          existingPlan?.floorPlanId ?? resolveManagedFloorPlanId(expectedBuilding, expectedFloor),
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
      className="doc-image-picker-modal doc-floor-plan-picker-modal"
    >
      <div className="doc-floor-plan-picker-tip">
        上传楼层平面图，保存后将写入数据库并应用于 {expectedBuilding ?? '-'} ·{' '}
        {expectedFloor ?? '-'} 全部会议室，小程序平面图页同步展示。
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
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">支持 PNG、JPG、SVG 或 WEBP 格式</p>
        </Upload.Dragger>
        <div className="doc-image-picker-preview doc-floor-plan-upload-preview">
          <div className="doc-image-picker-preview-title">平面图预览</div>
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
              请上传平面图文件
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
