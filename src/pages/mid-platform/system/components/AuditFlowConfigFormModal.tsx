import {
  CheckOutlined,
  CloseOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Modal, Radio, Select, Switch, Tag } from 'antd';
import { useEffect, useMemo } from 'react';
import type {
  AuditFlowApproverType,
  AuditFlowCondition,
  AuditFlowConfig,
  AuditFlowSignType,
} from '../../../../types/auditFlowConfig';
import {
  APPROVER_NAME_OPTIONS,
  MATCH_TYPE_OPTIONS,
  ORG_ENTITY_OPTIONS,
  ORG_LEVEL_OPTIONS,
  PROCESS_TYPE_OPTIONS,
  getRoomOptions,
} from '../../../../data/mockAuditFlowConfig';
import { useMeetingRoomStore } from '../../../../store/meetingRoomStore';
import {
  buildAuditFlowDefaultName,
  getAuditRuleShape,
} from '../../../../utils/auditFlowMatcher';
import {
  MAX_APPROVER_STEPS,
  createDefaultApproverStep,
} from '../../../../utils/auditFlowApproverSteps';
import AuditFlowConditionsEditor from './AuditFlowConditionsEditor';
import { getDynamicScopeHint, MEETING_ROOM_ADMIN_SCOPE_LABEL } from '../../../../data/auditFlowOptions';
import '../AuditFlowConfig.css';

interface AuditFlowConfigFormModalProps {
  open: boolean;
  mode: 'add' | 'edit' | 'copy';
  record: AuditFlowConfig | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

export default function AuditFlowConfigFormModal({
  open,
  mode,
  record,
  onCancel,
  onSubmit,
}: AuditFlowConfigFormModalProps) {
  const [form] = Form.useForm();
  const [meetingRooms] = useMeetingRoomStore();

  const isDefault = Form.useWatch('isDefault', form);
  const approverSteps = Form.useWatch('approverSteps', form) as
    | AuditFlowConfig['approverSteps']
    | undefined;
  const processType = Form.useWatch('processType', form);
  const conditions = Form.useWatch('conditions', form) as AuditFlowCondition[] | undefined;
  const ruleName = Form.useWatch('name', form) as string | undefined;

  const stepCount = approverSteps?.length ?? 0;
  const modalTitle = mode === 'add' ? '新增' : mode === 'copy' ? '复制流程' : '编辑';
  const roomOptions = useMemo(() => getRoomOptions(), [meetingRooms]);
  const ruleShape = useMemo(() => getAuditRuleShape(conditions ?? []), [conditions]);
  const isDefaultRule = Boolean(isDefault);
  const isVisitFlow = processType === '访问预约';
  const showMeetingRoomOptions = !isVisitFlow;
  const canSelfApplyAutoPass = ruleShape === 'orgRoom' && !isDefaultRule;

  useEffect(() => {
    if (!open) return;

    if ((mode === 'edit' || mode === 'copy') && record) {
      form.setFieldsValue({
        name: mode === 'copy' ? `${record.name}（副本）` : record.name,
        processType: record.processType,
        conditions: record.conditions.length > 0 ? record.conditions : undefined,
        matchType: record.matchType,
        isDefault: mode === 'copy' ? false : record.isDefault,
        enabled: record.enabled,
        selfApplyAutoPass: record.selfApplyAutoPass ?? false,
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
        selfApplyAutoPass: false,
        approverSteps: [createDefaultApproverStep()],
      });
    }
  }, [open, mode, record, form]);

  useEffect(() => {
    if (!open || ruleName?.trim()) return;
    if (!processType) return;
    form.setFieldValue(
      'name',
      buildAuditFlowDefaultName(processType, conditions ?? [], Boolean(isDefault)),
    );
  }, [open, processType, conditions, isDefault, ruleName, form]);

  useEffect(() => {
    if (!open) return;
    if (!canSelfApplyAutoPass) form.setFieldValue('selfApplyAutoPass', false);
  }, [open, canSelfApplyAutoPass, form]);

  const handleApproverTypeChange = (stepIndex: number, nextType: AuditFlowApproverType) => {
    if (nextType !== '动态人员') return;

    form.setFieldsValue({
      approverSteps: ((form.getFieldValue('approverSteps') as AuditFlowConfig['approverSteps']) ?? []).map(
        (step, index) =>
          index === stepIndex
            ? {
                ...step,
                approverType: '动态人员',
                dynamicScope: step.dynamicScope ?? 'orgAdmin',
                approverNames: [],
              }
            : step,
      ),
    });
  };

  const canAddApproverStep = stepCount < MAX_APPROVER_STEPS;

  const handleOk = async () => {
    try {
      await form.validateFields();
      onSubmit(form.getFieldsValue(true));
    } catch {
      /* validation */
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
          <div className="audit-flow-form-section-title">审核流程配置</div>
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
              label="流程类型"
              name="processType"
              rules={[{ required: true, message: '请选择 流程类型' }]}
              required
            >
              <Select placeholder="请选择 流程类型" options={PROCESS_TYPE_OPTIONS} />
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
            {ruleShape === 'other' && !isDefault && (
              <div className="audit-flow-auto-hint audit-flow-rule-shape-hint full-width">
                提示：「会议室管理员申请自动通过」需配置组织+会议室组合条件；固定审批人规则请配置仅会议室条件并指定审核人。
              </div>
            )}
          </div>

          <AuditFlowConditionsEditor form={form} isDefault={Boolean(isDefault)} roomOptions={roomOptions} />

          {showMeetingRoomOptions && (
            <div className="audit-flow-strategy-block">
              <div className="audit-flow-form-section-title">审批策略</div>
              <Form.Item
                name="selfApplyAutoPass"
                valuePropName="checked"
                extra={
                  isDefaultRule
                    ? '默认流程不支持，请将「默认配置」设为「否」。'
                    : processType !== '会议室预约'
                      ? '请先选择流程类型「会议室预约」。'
                      : canSelfApplyAutoPass
                        ? '适用于「组织+会议室」专属规则：会议室管理员本人提交预约时，系统自动审批通过，无需他人审批。'
                        : '请先在上方匹配条件中同时配置「组织架构」与「会议室」后，方可启用。'
                }
              >
                <Checkbox
                  disabled={
                    isDefaultRule || processType !== '会议室预约' || !canSelfApplyAutoPass
                  }
                >
                  会议室管理员申请自动通过
                </Checkbox>
              </Form.Item>
            </div>
          )}

        </section>

        <section className="audit-flow-form-section">
          <div className="audit-flow-form-section-title">审核人</div>
          {ruleShape === 'roomOnly' && !isDefaultRule && (
            <div className="audit-flow-auto-hint audit-flow-approver-multi-hint">
              仅会议室规则：下方指定人员为固定审批人，任何申请人均需审批。
            </div>
          )}
          {stepCount > 1 && (
            <div className="audit-flow-auto-hint audit-flow-approver-multi-hint">
              已配置 {stepCount} 组审核人，按顺序均需审批；同组内「会签」须全员通过，「或签」任一人通过即可。
            </div>
          )}
          <Form.List
            name="approverSteps"
            rules={[
              {
                validator: async (_, value: AuditFlowConfig['approverSteps'] | undefined) => {
                  if (!value || value.length === 0) {
                    throw new Error('请至少配置一组审核人');
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="audit-flow-approver-step-block">
                    {fields.length > 1 && (
                      <div className="audit-flow-approver-step-index">第 {index + 1} 组</div>
                    )}
                    <div className="audit-flow-approver-toolbar">
                      <Form.Item {...restField} name={[name, 'orgLevel']} noStyle>
                        <Select
                          allowClear
                          placeholder="请选择"
                          style={{ width: 96 }}
                          options={ORG_LEVEL_OPTIONS}
                        />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'orgName']} noStyle>
                        <Select
                          allowClear
                          style={{ width: 220 }}
                          options={ORG_ENTITY_OPTIONS}
                          placeholder="请选择"
                        />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'signType']} noStyle>
                        <Radio.Group optionType="button" buttonStyle="solid">
                          <Radio.Button value={'会签' satisfies AuditFlowSignType}>
                            会签
                          </Radio.Button>
                          <Radio.Button value={'或签' satisfies AuditFlowSignType}>
                            或签
                          </Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                      <div className="audit-flow-approver-label-wrap">
                        <span className="audit-flow-required-label">审核人</span>
                        <Form.Item {...restField} name={[name, 'approverType']} noStyle>
                          <Radio.Group
                            onChange={(event) =>
                              handleApproverTypeChange(name, event.target.value)
                            }
                          >
                            <Radio value={'指定人员' satisfies AuditFlowApproverType}>
                              指定人员
                            </Radio>
                            <Radio
                              value={'动态人员' satisfies AuditFlowApproverType}
                            >
                              动态人员
                            </Radio>
                          </Radio.Group>
                        </Form.Item>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={!canAddApproverStep}
                          title={
                            canAddApproverStep
                              ? '增加一组审核人'
                              : `最多 ${MAX_APPROVER_STEPS} 组`
                          }
                          onClick={() => add(createDefaultApproverStep())}
                        />
                        <Button
                          size="small"
                          icon={<MinusOutlined />}
                          className="audit-flow-btn-minus"
                          title={fields.length <= 1 ? '至少保留一组' : '删除本组'}
                          disabled={fields.length <= 1}
                          onClick={() => remove(name)}
                        />
                      </div>
                    </div>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) =>
                        prev.approverSteps?.[name]?.approverType !==
                        cur.approverSteps?.[name]?.approverType
                      }
                    >
                      {() => {
                        const stepType = form.getFieldValue([
                          'approverSteps',
                          name,
                          'approverType',
                        ]) as AuditFlowApproverType | undefined;

                        if (stepType === '动态人员') {
                          return (
                            <div className="audit-flow-auto-approver-panel audit-flow-approver-step-dynamic">
                              <Form.Item label="动态审批角色" className="audit-flow-dynamic-scope-item">
                                <Tag color="processing">{MEETING_ROOM_ADMIN_SCOPE_LABEL}</Tag>
                              </Form.Item>
                              <div className="audit-flow-auto-hint">
                                {getDynamicScopeHint('orgAdmin')}
                              </div>
                              <Form.Item
                                {...restField}
                                name={[name, 'dynamicScope']}
                                hidden
                                initialValue="orgAdmin"
                              >
                                <input type="hidden" />
                              </Form.Item>
                            </div>
                          );
                        }

                        return (
                          <Form.Item
                            {...restField}
                            name={[name, 'approverNames']}
                            rules={[{ required: true, message: '请选择审核人' }]}
                          >
                            <Select
                              mode="multiple"
                              allowClear
                              placeholder="请选择审核人"
                              options={APPROVER_NAME_OPTIONS}
                              style={{ width: '100%' }}
                              tagRender={({ label, closable, onClose }) => (
                                <Tag
                                  closable={closable}
                                  onClose={(event) => {
                                    event.preventDefault();
                                    onClose();
                                  }}
                                  className="audit-flow-approver-select-tag"
                                >
                                  {label}
                                </Tag>
                              )}
                            />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </section>
      </Form>
    </Modal>
  );
}
