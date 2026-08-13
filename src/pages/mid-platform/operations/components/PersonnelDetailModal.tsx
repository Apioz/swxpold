import { Button, Modal, Table } from 'antd';
import type { MidPlatformPersonnel } from '../../../../types/midPlatform';
import {
  formatAccessPermission,
  formatChannelDisplay,
} from '../../../../data/mockMidPlatformPersonnel';

interface PersonnelDetailModalProps {
  open: boolean;
  record: MidPlatformPersonnel | null;
  onClose: () => void;
}

function renderValue(value?: string) {
  return value?.trim() ? value : '';
}

export default function PersonnelDetailModal({
  open,
  record,
  onClose,
}: PersonnelDetailModalProps) {
  if (!record) return null;

  const identity = record.identities?.[0];

  return (
    <Modal
      title="详情"
      open={open}
      onCancel={onClose}
      footer={
        <Button onClick={onClose}>取消</Button>
      }
      width={920}
      destroyOnHidden
      className="mid-platform-personnel-modal"
    >
      <div className="mid-platform-detail-section">
        <div className="mid-platform-form-section-title">基本信息</div>
        <div className="mid-platform-detail-grid">
          <div className="mid-platform-detail-item">
            <span className="label">人员姓名</span>
            <span className="value">{record.name}</span>
          </div>
          <div className="mid-platform-detail-item">
            <span className="label">联系方式</span>
            <span className="value">{record.contact}</span>
          </div>
          <div className="mid-platform-detail-item">
            <span className="label">绑定微信</span>
            <span className="value">{renderValue(record.wechat)}</span>
          </div>
          <div className="mid-platform-detail-item">
            <span className="label">身份证号</span>
            <span className="value">{renderValue(record.idCard)}</span>
          </div>
          <div className="mid-platform-detail-item">
            <span className="label">性别</span>
            <span className="value">{renderValue(record.gender)}</span>
          </div>
          <div className="mid-platform-detail-item">
            <span className="label">下发渠道</span>
            <span className="value">
              {formatChannelDisplay(
                record.channelsRuanjie ?? false,
                record.channelsHikvision ?? false,
              )}
            </span>
          </div>
          <div className="mid-platform-detail-item mid-platform-detail-photo">
            <span className="label">人脸照片</span>
            <div className="mid-platform-face-photo-placeholder">
              <div className="mid-platform-face-photo-logo">BLM Digital</div>
            </div>
          </div>
          <div className="mid-platform-detail-item mid-platform-detail-full">
            <span className="label">通行时间权限（软杰）</span>
            <span className="value">
              {record.accessTimePermission === '-'
                ? '未配置'
                : record.accessTimePermission || formatAccessPermission()}
            </span>
          </div>
        </div>
      </div>

      <div className="mid-platform-detail-section">
        <div className="mid-platform-form-section-title">人员所属信息</div>
        <div className="mid-platform-identity-card">
          <div className="mid-platform-identity-card-head">
            <span>人员身份1</span>
          </div>
          <div className="mid-platform-detail-grid">
            <div className="mid-platform-detail-item">
              <span className="label">参与方企业名称</span>
              <span className="value">{renderValue(identity?.participantCompany)}</span>
            </div>
            <div className="mid-platform-detail-item">
              <span className="label">部门</span>
              <span className="value">{renderValue(identity?.department)}</span>
            </div>
            <div className="mid-platform-detail-item">
              <span className="label">工号</span>
              <span className="value">{renderValue(identity?.employeeNo)}</span>
            </div>
            <div className="mid-platform-detail-item">
              <span className="label">联系人</span>
              <span className="value">{renderValue(identity?.contactPerson)}</span>
            </div>
            <div className="mid-platform-detail-item">
              <span className="label">注册时间</span>
              <span className="value">{renderValue(identity?.registerTime || record.registerTime)}</span>
            </div>
            <div className="mid-platform-detail-item">
              <span className="label">车牌号</span>
              <span className="value">{renderValue(identity?.licensePlate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mid-platform-detail-section">
        <div className="mid-platform-form-section-title">设备清单</div>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无数据' }}
          dataSource={record.devices ?? []}
          columns={[
            { title: '序号', dataIndex: 'indexNo', width: 70, align: 'center' },
            { title: '设备类型', dataIndex: 'deviceType', width: 120 },
            { title: '设备名称', dataIndex: 'deviceName', ellipsis: true },
            { title: '是否在线', dataIndex: 'online', width: 100 },
            { title: '通行时间权限', dataIndex: 'accessTimePermission', width: 180 },
          ]}
        />
      </div>
    </Modal>
  );
}
