import { Button, Modal, Radio, Tag } from 'antd';
import type { AuditFlowConfig } from '../../../../types/auditFlowConfig';
import { getDynamicScopeLabel } from '../../../../data/auditFlowOptions';
import {
  formatConditionSummary,
  formatConditionsSummary,
  getAuditFlowDisplayName,
} from '../../../../utils/auditFlowMatcher';
import '../AuditFlowConfig.css';

interface AuditFlowConfigViewModalProps {
  open: boolean;
  record: AuditFlowConfig | null;
  onClose: () => void;
}

export default function AuditFlowConfigViewModal({
  open,
  record,
  onClose,
}: AuditFlowConfigViewModalProps) {
  if (!record) return null;

  const conditionsSummary = formatConditionsSummary(record.conditions);

  return (
    <Modal
      title="查看"
      open={open}
      onCancel={onClose}
      width={920}
      destroyOnHidden
      className="mid-platform-audit-flow-modal mid-platform-audit-flow-view-modal"
      footer={
        <Button onClick={onClose}>取消</Button>
      }
    >
      <section className="audit-flow-view-section">
        <div className="audit-flow-form-section-title">审核流程配置</div>
        <div className="audit-flow-view-grid">
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell">
              <span className="label">规则名称:</span>
              <span className="value">{getAuditFlowDisplayName(record)}</span>
            </div>
            <div className="audit-flow-view-cell">
              <span className="label">流程类型:</span>
              <span className="value">{record.processType}</span>
            </div>
          </div>
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell">
              <span className="label">匹配类型:</span>
              <span className="value">{record.matchType}</span>
            </div>
            <div className="audit-flow-view-cell">
              <span className="label">启用状态:</span>
              <span className="value">{record.enabled ? '启用' : '禁用'}</span>
            </div>
          </div>
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell">
              <span className="label">默认配置:</span>
              <span className="value">
                <Radio.Group value={record.isDefault} disabled>
                  <Radio value>是</Radio>
                  <Radio value={false}>否</Radio>
                </Radio.Group>
              </span>
            </div>
            <div className="audit-flow-view-cell">
              <span className="label">申请自动通过:</span>
              <span className="value">
                {record.selfApplyAutoPass ? '是（管理员申请时自动审批通过）' : '否'}
              </span>
            </div>
          </div>
          <div className="audit-flow-view-row">
            <div className="audit-flow-view-cell full-width">
              <span className="label">匹配条件:</span>
              <span className="value">
                {conditionsSummary ||
                  (record.isDefault ? '默认流程（无额外条件）' : '—')}
              </span>
            </div>
          </div>
          {record.conditions.length > 0 && (
            <div className="audit-flow-view-row">
              <div className="audit-flow-view-cell full-width">
                <span className="label">条件明细:</span>
                <span className="value audit-flow-condition-tags">
                  {record.conditions.map((condition, index) => (
                    <Tag key={`${condition.type}-${index}`}>
                      {formatConditionSummary(condition)}
                    </Tag>
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="audit-flow-view-section">
        <div className="audit-flow-form-section-title">审核人</div>
        <div className="audit-flow-approver-view">
          {record.approverSteps.map((step, index) => (
            <div key={`approver-step-${index}`} className="audit-flow-approver-view-group">
              {record.approverSteps.length > 1 && (
                <div className="audit-flow-approver-step-index">第 {index + 1} 组</div>
              )}
              <div
                className={`audit-flow-approver-view-row${index > 0 ? ' audit-flow-approver-view-row--bordered' : ''}`}
              >
                <div className="audit-flow-approver-view-cell">{step.orgLevel ?? '集团'}</div>
                <div className="audit-flow-approver-view-cell audit-flow-approver-view-org">
                  {step.orgName ?? ''}
                </div>
                <div className="audit-flow-approver-view-cell">
                  <Radio.Group value={step.signType ?? '或签'} disabled optionType="button">
                    <Radio.Button value="会签">会签</Radio.Button>
                    <Radio.Button value="或签">或签</Radio.Button>
                  </Radio.Group>
                </div>
                <div className="audit-flow-approver-view-cell audit-flow-approver-view-names">
                  <div className="audit-flow-approver-view-names-head">审核人</div>
                  <Radio.Group value={step.approverType ?? '指定人员'} disabled>
                    <Radio value="指定人员">指定人员</Radio>
                    <Radio value="动态人员">动态人员</Radio>
                  </Radio.Group>
                  {step.approverType === '动态人员' ? (
                    <div className="audit-flow-approver-tags">
                      <Tag color="processing">{getDynamicScopeLabel(step.dynamicScope)}</Tag>
                    </div>
                  ) : (
                    <div className="audit-flow-approver-tags">
                      {(step.approverNames ?? []).map((personName) => (
                        <Tag key={personName}>{personName}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Modal>
  );
}
