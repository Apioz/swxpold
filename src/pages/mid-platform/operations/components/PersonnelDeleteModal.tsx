import { Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import type { MidPlatformPersonnel } from '../../../../types/midPlatform';

interface PersonnelDeleteModalProps {
  open: boolean;
  record: MidPlatformPersonnel | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PersonnelDeleteModal({
  open,
  record,
  onCancel,
  onConfirm,
}: PersonnelDeleteModalProps) {
  return (
    <Modal
      title="温馨提示"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="确定"
      cancelText="取消"
      width={560}
      destroyOnHidden
      className="mid-platform-delete-modal"
    >
      <div className="mid-platform-delete-content">
        <ExclamationCircleFilled className="mid-platform-delete-icon" />
        <div>
          <p>
            当前人员的下发状态为【未下发】，确认执行删除操作后，将触发以下结果：
          </p>
          <p>
            1. 若该人员已与相关设备建立绑定关系(仅下发成功时存在)，绑定关系将自动解绑；
          </p>
          <p>2. 系统向第三方渠道发起同步移除请求：</p>
          <p className="mid-platform-delete-sub">
            - 若下发状态为&quot;下发成功&quot;，该人员信息将从渠道侧同步删除；
          </p>
          <p className="mid-platform-delete-sub">
            - 若下发状态为&quot;下发失败&quot;，该人员信息将从渠道下发失败中移除；
          </p>
          <p>3. 该人员的信息将从本列表中删除，同步至人员删除记录。</p>
          {record && (
            <p className="mid-platform-delete-target">即将删除：{record.name}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
