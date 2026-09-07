import { Button, Modal, Tag } from 'antd';
import type { ReservationLimitConfig } from '../../../../types/reservationLimitConfig';
import { VIOLATION_ACTION_OPTIONS, LIMIT_FIELD_META } from '../../../../data/mockReservationLimitConfig';
import {
  formatLimitsSummary,
  getReservationLimitDisplayName,
} from '../../../../utils/reservationLimitMatcher';
import { formatConditionsSummary } from '../../../../utils/auditFlowMatcher';
import { ORG_ADMIN_SCOPE_LABEL } from '../../../../data/auditFlowOptions';
import '../AuditFlowConfig.css';

interface ReservationLimitConfigViewModalProps {
  open: boolean;
  record: ReservationLimitConfig | null;
  onClose: () => void;
}

export default function ReservationLimitConfigViewModal({
  open,
  record,
  onClose,
}: ReservationLimitConfigViewModalProps) {
  if (!record) return null;

  const violationLabel =
    VIOLATION_ACTION_OPTIONS.find((item) => item.value === record.violationAction)?.label ??
    record.violationAction;

  return (
    <Modal
      title="查看占用限制配置"
      open={open}
      onCancel={onClose}
      width={880}
      className="mid-platform-audit-flow-modal mid-platform-audit-flow-view-modal"
      footer={
        <Button type="primary" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <section className="audit-flow-view-section">
        <div className="audit-flow-form-section-title">策略匹配</div>
        <div className="audit-flow-view-grid">
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell">
              <span className="label">规则名称</span>
              <span className="value">{getReservationLimitDisplayName(record)}</span>
            </div>
            <div className="audit-flow-view-cell">
              <span className="label">匹配类型</span>
              <span className="value">{record.matchType}</span>
            </div>
          </div>
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell">
              <span className="label">启用状态</span>
              <span className="value">{record.enabled ? '启用' : '禁用'}</span>
            </div>
            <div className="audit-flow-view-cell">
              <span className="label">默认配置</span>
              <span className="value">{record.isDefault ? '是' : '否'}</span>
            </div>
          </div>
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell full-width">
              <span className="label">匹配条件</span>
              <span className="value audit-flow-condition-tags">
                {record.conditions.length > 0 ? (
                  formatConditionsSummary(record.conditions)
                ) : (
                  <Tag>默认策略</Tag>
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="audit-flow-view-section">
        <div className="audit-flow-form-section-title">占用管控参数</div>
        <div className="audit-flow-view-grid">
          {LIMIT_FIELD_META.map((field) => {
            const value = record.limits[field.key];
            if (!value) return null;
            return (
              <div key={field.key} className="audit-flow-view-row">
                <div className="audit-flow-view-cell full-width">
                  <span className="label">{field.label}</span>
                  <span className="value">
                    {value} {field.unit}
                  </span>
                </div>
              </div>
            );
          })}
          {!formatLimitsSummary(record.limits) || formatLimitsSummary(record.limits) === '—' ? (
            <div className="audit-flow-view-row">
              <div className="audit-flow-view-cell full-width">
                <span className="value">未配置限制参数</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="audit-flow-view-section">
        <div className="audit-flow-form-section-title">超限处置</div>
        <div className="audit-flow-view-grid">
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell full-width">
              <span className="label">处置方式</span>
              <span className="value">
                {record.violationAction === 'requireApproval' ? (
                  <Tag color="orange">{violationLabel}</Tag>
                ) : (
                  violationLabel
                )}
              </span>
            </div>
          </div>
        </div>

        {record.violationAction === 'requireApproval' && record.approverSteps.length > 0 && (
          <div className="audit-flow-approver-view">
            {record.approverSteps.map((step, index) => (
              <div key={`limit-approver-${index}`} className="audit-flow-approver-view-group">
                {record.approverSteps.length > 1 && (
                  <div className="audit-flow-approver-step-index">第 {index + 1} 组</div>
                )}
                <div
                  className={`audit-flow-approver-view-row${index > 0 ? ' audit-flow-approver-view-row--bordered' : ''}`}
                >
                  <div className="audit-flow-approver-view-cell">{step.orgLevel ?? '集团'}</div>
                  <div className="audit-flow-approver-view-cell audit-flow-approver-view-org">
                    {step.orgName}
                  </div>
                  <div className="audit-flow-approver-view-cell">{step.signType}</div>
                  <div className="audit-flow-approver-view-cell audit-flow-approver-view-names">
                    <div className="audit-flow-approver-view-names-head">审批人</div>
                    {step.approverType === '动态人员' ? (
                      <Tag>{ORG_ADMIN_SCOPE_LABEL}</Tag>
                    ) : (
                      <div className="audit-flow-approver-tags">
                        {step.approverNames.map((name) => (
                          <Tag key={name}>{name}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Modal>
  );
}
