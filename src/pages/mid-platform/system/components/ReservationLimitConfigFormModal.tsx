import {
  CheckOutlined,
  CloseOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Radio, Select, Switch, message } from 'antd';
import { useEffect, useMemo } from 'react';
import type {
  AuditFlowApproverStep,
  AuditFlowCondition,
} from '../../../../types/auditFlowConfig';
import type { ReservationLimitConfig } from '../../../../types/reservationLimitConfig';
import {
  APPROVER_NAME_OPTIONS,
  MATCH_TYPE_OPTIONS,
  ORG_ENTITY_OPTIONS,
  ORG_LEVEL_OPTIONS,
} from '../../../../data/mockAuditFlowConfig';
import {
  LIMIT_FIELD_META,
  VIOLATION_ACTION_OPTIONS,
  getRoomOptions,
} from '../../../../data/mockReservationLimitConfig';
import { useMeetingRoomStore } from '../../../../store/meetingRoomStore';
import {
  MAX_APPROVER_STEPS,
  createDefaultApproverStep,
} from '../../../../utils/auditFlowApproverSteps';
import { buildReservationLimitDefaultName } from '../../../../utils/reservationLimitMatcher';
import AuditFlowConditionsEditor from './AuditFlowConditionsEditor';
import { ORG_ADMIN_SCOPE_LABEL } from '../../../../data/auditFlowOptions';
import '../AuditFlowConfig.css';

interface ReservationLimitConfigFormModalProps {
  open: boolean;
  mode: 'add' | 'edit' | 'copy';
  record: ReservationLimitConfig | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

const SELECT_PROPS = {
  allowClear: true,
  showSearch: true,
  optionFilterProp: 'label' as const,
};

export default function ReservationLimitConfigFormModal({
  open,
  mode,
  record,
  onCancel,
  onSubmit,
}: ReservationLimitConfigFormModalProps) {
  const [form] = Form.useForm();
  const [meetingRooms] = useMeetingRoomStore();

  const isDefault = Form.useWatch('isDefault', form);
  const violationAction = Form.useWatch('violationAction', form);
  const approverSteps = Form.useWatch('approverSteps', form) as
    | AuditFlowApproverStep[]
    | undefined;
  const conditions = Form.useWatch('conditions', form) as AuditFlowCondition[] | undefined;
  const ruleName = Form.useWatch('name', form) as string | undefined;

  const stepCount = approverSteps?.length ?? 0;
  const hasDynamicStep = approverSteps?.some((s) => s?.approverType === '动态人员') ?? false;
  const modalTitle = mode === 'add' ? '新增占用限制' : mode === 'copy' ? '复制占用限制' : '编辑占用限制';
  const roomOptions = useMemo(() => getRoomOptions(), [meetingRooms]);
  const requireApproval = violationAction === 'requireApproval';

  useEffect(() => {
    if (!open) return;

    if ((mode === 'edit' || mode === 'copy') && record) {
      form.setFieldsValue({
        name: mode === 'copy' ? `${record.name}（副本）` : record.name,
        conditions: record.conditions.length > 0 ? record.conditions : undefined,
        matchType: record.matchType,
        isDefault: mode === 'copy' ? false : record.isDefault,
        enabled: record.enabled,
        limits: record.limits,
        violationAction: record.violationAction,
        approverSteps:
          record.approverSteps.length > 0
            ? record.approverSteps
            : [createDefaultApproverStep()],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        matchType: '精确匹配',
        isDefault: false,
        enabled: true,
        violationAction: 'reject',
        approverSteps: [createDefaultApproverStep()],
      });
    }
  }, [open, mode, record, form]);

  useEffect(() => {
    if (!open || ruleName?.trim()) return;
    form.setFieldValue(
      'name',
      buildReservationLimitDefaultName(conditions ?? [], Boolean(isDefault)),
    );
  }, [open, conditions, isDefault, ruleName, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch {
      message.warning('请完善表单信息');
    }
  };

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      width={960}
      destroyOnHidden
      className="mid-platform-audit-flow-modal"
      footer={
        <div className="audit-flow-modal-footer">
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleOk}>
            {mode === 'edit' ? '修改' : '保存'}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="audit-flow-form">
        <section className="audit-flow-form-section">
          <div className="audit-flow-form-section-title">策略匹配</div>
          <div className="audit-flow-form-grid">
            <Form.Item
              label="规则名称"
              name="name"
              rules={[{ required: true, message: '请输入规则名称' }]}
              required
            >
              <Input placeholder="用于预约单追溯展示" maxLength={80} />
            </Form.Item>
            <Form.Item
              label="匹配类型"
              name="matchType"
              rules={[{ required: true, message: '请选择 匹配类型' }]}
              required
            >
              <Select placeholder="请选择 匹配类型" options={MATCH_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item label="启用状态" name="enabled" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
            <Form.Item label="默认配置" name="isDefault">
              <Radio.Group>
                <Radio value>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          <AuditFlowConditionsEditor
            form={form}
            isDefault={Boolean(isDefault)}
            roomOptions={roomOptions}
            conditionsHint="建议配置「适用企业 + 会议室」组合，非默认策略需至少一条条件"
          />
        </section>

        <section className="audit-flow-form-section">
          <div className="audit-flow-form-section-title">占用管控参数</div>
          <div className="audit-flow-auto-hint audit-flow-rule-shape-hint">
            控制「约多久、约多频繁、约多少间」，与审核流程（能不能约）互补。留空表示不限制。
          </div>
          <div className="audit-flow-form-grid reservation-limit-fields">
            {LIMIT_FIELD_META.map((field) => (
              <Form.Item
                key={field.key}
                label={field.label}
                name={['limits', field.key]}
                extra={field.hint}
              >
                <InputNumber
                  min={1}
                  precision={0}
                  placeholder={field.placeholder}
                  addonAfter={field.unit}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            ))}
          </div>
        </section>

        <section className="audit-flow-form-section">
          <div className="audit-flow-form-section-title">超限处置</div>
          <Form.Item
            name="violationAction"
            rules={[{ required: true, message: '请选择超限处置方式' }]}
          >
            <Radio.Group options={[...VIOLATION_ACTION_OPTIONS]} />
          </Form.Item>
          {requireApproval && (
            <>
              <div className="audit-flow-auto-hint audit-flow-approver-multi-hint">
                超限时需走以下多级审批节点（可与审核流程审批人叠加）
              </div>
              <Form.List
                name="approverSteps"
                rules={[
                  {
                    validator: async (_, value: AuditFlowApproverStep[] | undefined) => {
                      if (!requireApproval) return;
                      if (!value || value.length === 0) {
                        throw new Error('触发审批时须至少配置一组审批节点');
                      }
                    },
                  },
                ]}
              >
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <div key={key} className="audit-flow-approver-step-block">
                        <div className="audit-flow-approver-step-header">
                          {fields.length > 1 && (
                            <div className="audit-flow-approver-step-index">第 {index + 1} 组</div>
                          )}
                          <Button
                            size="small"
                            icon={<MinusOutlined />}
                            className="audit-flow-btn-minus"
                            title={fields.length <= 1 ? '至少保留一组' : '删除本组'}
                            disabled={fields.length <= 1}
                            onClick={() => remove(name)}
                          >
                            删除
                          </Button>
                        </div>
                        <div className="audit-flow-approver-toolbar">
                          <Form.Item
                            {...restField}
                            name={[name, 'orgLevel']}
                            label="组织层级"
                            rules={[{ required: true, message: '请选择' }]}
                          >
                            <Select options={ORG_LEVEL_OPTIONS} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'orgName']}
                            label="组织名称"
                            rules={[{ required: true, message: '请选择' }]}
                          >
                            <Select {...SELECT_PROPS} options={ORG_ENTITY_OPTIONS} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'signType']}
                            label="签批方式"
                            rules={[{ required: true, message: '请选择' }]}
                          >
                            <Select
                              options={[
                                { label: '会签', value: '会签' },
                                { label: '或签', value: '或签' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'approverType']}
                            label="审核人类型"
                            rules={[{ required: true, message: '请选择' }]}
                          >
                            <Select
                              options={[
                                { label: '指定人员', value: '指定人员' },
                                { label: '动态人员', value: '动态人员', disabled: hasDynamicStep && approverSteps?.[index]?.approverType !== '动态人员' },
                              ]}
                            />
                          </Form.Item>
                        </div>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prev, cur) =>
                            prev.approverSteps?.[name]?.approverType !==
                            cur.approverSteps?.[name]?.approverType
                          }
                        >
                          {() => {
                            const approverType = form.getFieldValue([
                              'approverSteps',
                              name,
                              'approverType',
                            ]) as string | undefined;
                            if (approverType === '动态人员') {
                              return (
                                <div className="audit-flow-auto-approver-panel audit-flow-approver-step-dynamic">
                                  <div className="audit-flow-auto-approver-row">
                                    <span className="audit-flow-auto-approver-label">审批角色</span>
                                    <span>{ORG_ADMIN_SCOPE_LABEL}</span>
                                  </div>
                                  <div className="audit-flow-auto-hint">
                                    按匹配条件中的组织层级解析当前组织管理员
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <Form.Item
                                {...restField}
                                name={[name, 'approverNames']}
                                label="审批人"
                                rules={[{ required: true, message: '请选择审批人' }]}
                              >
                                <Select
                                  {...SELECT_PROPS}
                                  mode="multiple"
                                  placeholder="请选择审批人"
                                  options={APPROVER_NAME_OPTIONS}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </div>
                    ))}
                    <div className="audit-flow-approver-toolbar">
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => {
                          if (stepCount >= MAX_APPROVER_STEPS) {
                            message.warning(`最多配置 ${MAX_APPROVER_STEPS} 组审批节点`);
                            return;
                          }
                          add(createDefaultApproverStep());
                        }}
                      >
                        添加审批节点
                      </Button>
                      <Button
                        onClick={() => {
                          if (hasDynamicStep) {
                            message.warning('同一规则只能配置一组「当前组织管理员」');
                            return;
                          }
                          if (stepCount >= MAX_APPROVER_STEPS) {
                            message.warning(`最多配置 ${MAX_APPROVER_STEPS} 组审批节点`);
                            return;
                          }
                          add({
                            orgLevel: '公司',
                            orgName: '按匹配条件组织层级',
                            signType: '或签',
                            approverType: '动态人员',
                            dynamicScope: 'orgAdmin',
                            approverNames: [],
                          });
                        }}
                        disabled={hasDynamicStep}
                      >
                        添加{ORG_ADMIN_SCOPE_LABEL}
                      </Button>
                    </div>
                  </>
                )}
              </Form.List>
            </>
          )}
        </section>
      </Form>
    </Modal>
  );
}
