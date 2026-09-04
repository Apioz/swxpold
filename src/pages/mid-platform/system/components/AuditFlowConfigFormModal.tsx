import {
  CheckOutlined,
  CloseOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Modal, Radio, Select, Switch, Tag, message } from 'antd';
import { useEffect, useMemo } from 'react';
import type {
  AuditFlowApproverType,
  AuditFlowCondition,
  AuditFlowConfig,
  AuditFlowOrgScope,
  AuditFlowSignType,
} from '../../../../types/auditFlowConfig';
import { getOrgValueOptions } from '../../../../data/auditFlowOptions';
import {
  APPROVER_NAME_OPTIONS,
  APPROVE_MODE_OPTIONS,
  CONDITION_TYPE_OPTIONS,
  MATCH_TYPE_OPTIONS,
  ORG_ENTITY_OPTIONS,
  ORG_LEVEL_OPTIONS,
  ORG_SCOPE_OPTIONS,
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
  createAutoApproverStep,
  createDefaultApproverStep,
} from '../../../../utils/auditFlowApproverSteps';
import { ORG_ADMIN_SCOPE_LABEL } from '../../../../data/auditFlowOptions';
import '../AuditFlowConfig.css';

interface AuditFlowConfigFormModalProps {
  open: boolean;
  mode: 'add' | 'edit' | 'copy';
  record: AuditFlowConfig | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

const SELECT_PROPS = {
  allowClear: true,
  showSearch: true,
  optionFilterProp: 'label' as const,
};

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
  const approveMode = Form.useWatch('approveMode', form);
  const approverSteps = Form.useWatch('approverSteps', form) as
    | AuditFlowConfig['approverSteps']
    | undefined;
  const processType = Form.useWatch('processType', form);
  const conditions = Form.useWatch('conditions', form) as AuditFlowCondition[] | undefined;
  const ruleName = Form.useWatch('name', form) as string | undefined;

  const isAutoApprove = approveMode === 'auto';
  const stepCount = approverSteps?.length ?? 0;
  const hasDynamicStep = approverSteps?.some((s) => s?.approverType === '动态人员') ?? false;
  const modalTitle = mode === 'add' ? '新增' : mode === 'copy' ? '复制流程' : '编辑';
  const roomOptions = useMemo(() => getRoomOptions(), [meetingRooms]);
  const ruleShape = useMemo(() => getAuditRuleShape(conditions ?? []), [conditions]);
  const canSelfApplyAutoPass = ruleShape === 'orgRoom';
  const canStackable = ruleShape === 'roomOnly';

  useEffect(() => {
    if (!open) return;

    if ((mode === 'edit' || mode === 'copy') && record) {
      form.setFieldsValue({
        name: mode === 'copy' ? `${record.name}（副本）` : record.name,
        processType: record.processType,
        conditions: record.conditions.length > 0 ? record.conditions : undefined,
        matchType: record.matchType,
        isDefault: mode === 'copy' ? false : record.isDefault,
        approveMode: record.approveMode,
        enabled: record.enabled,
        selfApplyAutoPass: record.selfApplyAutoPass ?? false,
        stackable: record.stackable ?? false,
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
        approveMode: 'manual',
        enabled: true,
        selfApplyAutoPass: false,
        stackable: false,
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
    if (!canStackable) form.setFieldValue('stackable', false);
  }, [open, canSelfApplyAutoPass, canStackable, form]);

  useEffect(() => {
    if (!open || approveMode !== 'auto') return;
    form.setFieldValue('approverSteps', [createAutoApproverStep()]);
  }, [open, approveMode, form]);

  useEffect(() => {
    if (!open || approveMode !== 'manual') return;
    const steps = form.getFieldValue('approverSteps') as AuditFlowConfig['approverSteps'] | undefined;
    if (!steps || steps.length === 0) {
      form.setFieldValue('approverSteps', [createDefaultApproverStep()]);
    }
  }, [open, approveMode, form]);

  const handleApproverTypeChange = (stepIndex: number, nextType: AuditFlowApproverType) => {
    if (nextType !== '动态人员') return;

    const steps = (form.getFieldValue('approverSteps') as AuditFlowConfig['approverSteps']) ?? [];
    const duplicateDynamic = steps.some(
      (step, index) => index !== stepIndex && step.approverType === '动态人员',
    );
    if (duplicateDynamic) {
      message.warning('同一规则只能有一组「当前组织管理员」');
      form.setFieldValue(['approverSteps', stepIndex, 'approverType'], '指定人员');
      return;
    }

    form.setFieldsValue({
      approverSteps: steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              approverType: '动态人员',
              dynamicScope: 'orgAdmin',
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
            {canSelfApplyAutoPass && (
              <Form.Item
                name="selfApplyAutoPass"
                valuePropName="checked"
                className="full-width"
                extra="适用于「组织+会议室」专属规则：当前组织管理员申请时免审。请勿与「叠加审批」同开。"
              >
                <Checkbox>管理员自审自动通过</Checkbox>
              </Form.Item>
            )}
            {canStackable && (
              <Form.Item
                name="stackable"
                valuePropName="checked"
                className="full-width"
                extra="适用于「仅会议室」规则：不管申请人是谁，均需指定人审批（如 2 号会议室）。与「管理员自审」分属不同规则，勿混配同一会议室。"
              >
                <Checkbox>叠加审批（固定审批人）</Checkbox>
              </Form.Item>
            )}
            {ruleShape === 'other' && !isDefault && (
              <div className="audit-flow-auto-hint audit-flow-rule-shape-hint">
                提示：「管理员自审」需配置组织+会议室组合条件；「固定审批人」需配置仅会议室条件。建议拆成两条规则。
              </div>
            )}
          </div>

          <div className="audit-flow-conditions-block">
            <div className="audit-flow-conditions-head">
              <span className="audit-flow-conditions-title">匹配条件（且关系）</span>
              {!isDefault && (
                <span className="audit-flow-conditions-hint">非默认流程需至少配置一条条件</span>
              )}
            </div>
            <Form.List
              name="conditions"
              rules={[
                {
                  validator: async (_, value: AuditFlowCondition[] | undefined) => {
                    if (form.getFieldValue('isDefault')) return;
                    if (!value || value.length === 0) {
                      throw new Error('请添加至少一条匹配条件');
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="audit-flow-condition-row">
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        rules={[{ required: true, message: '请选择条件类型' }]}
                        className="audit-flow-condition-type"
                      >
                        <Select
                          placeholder="条件类型"
                          options={CONDITION_TYPE_OPTIONS}
                          onChange={(value) => {
                            if (value === 'org') {
                              form.setFieldValue(['conditions', name, 'orgScope'], 'company');
                            } else {
                              form.setFieldValue(['conditions', name, 'orgScope'], undefined);
                            }
                            form.setFieldValue(['conditions', name, 'values'], []);
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, cur) =>
                          prev.conditions?.[name]?.type !== cur.conditions?.[name]?.type
                        }
                      >
                        {() => {
                          const type = form.getFieldValue(['conditions', name, 'type']) as
                            | string
                            | undefined;
                          if (type !== 'org') return null;
                          return (
                            <Form.Item
                              {...restField}
                              name={[name, 'orgScope']}
                              rules={[{ required: true, message: '请选择组织层级' }]}
                              className="audit-flow-condition-scope"
                            >
                              <Select
                                placeholder="组织层级"
                                options={ORG_SCOPE_OPTIONS}
                                onChange={() => {
                                  form.setFieldValue(['conditions', name, 'values'], []);
                                }}
                              />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, cur) => {
                          const prevC = prev.conditions?.[name];
                          const curC = cur.conditions?.[name];
                          return prevC?.type !== curC?.type || prevC?.orgScope !== curC?.orgScope;
                        }}
                      >
                        {() => {
                          const type = form.getFieldValue(['conditions', name, 'type']) as
                            | string
                            | undefined;
                          const orgScope = form.getFieldValue([
                            'conditions',
                            name,
                            'orgScope',
                          ]) as AuditFlowOrgScope | undefined;
                          const options =
                            type === 'room' ? roomOptions : getOrgValueOptions(orgScope);
                          return (
                            <Form.Item
                              {...restField}
                              name={[name, 'values']}
                              rules={[{ required: true, message: '请选择匹配值' }]}
                              className="audit-flow-condition-value"
                            >
                              <Select
                                {...SELECT_PROPS}
                                mode="multiple"
                                placeholder="请选择匹配值（可多选）"
                                options={options}
                                maxTagCount="responsive"
                              />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        className="audit-flow-btn-minus audit-flow-condition-remove"
                        onClick={() => remove(name)}
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ type: 'org', orgScope: 'company', values: [] })}
                    className="audit-flow-add-condition-btn"
                  >
                    添加条件
                  </Button>
                </>
              )}
            </Form.List>
          </div>
        </section>

        <section className="audit-flow-form-section">
          <div className="audit-flow-form-section-title">审核人</div>
          <Form.Item
            label="审批类型"
            name="approveMode"
            rules={[{ required: true, message: '请选择审批类型' }]}
            required
          >
            <Select placeholder="请选择审批类型" options={APPROVE_MODE_OPTIONS} />
          </Form.Item>
          {isAutoApprove ? (
            <div className="audit-flow-auto-approver-panel">
              <div className="audit-flow-auto-approver-row">
                <span className="audit-flow-auto-approver-label">审批角色</span>
                <Tag color="processing">{ORG_ADMIN_SCOPE_LABEL}</Tag>
                <Tag color="default">动态人员</Tag>
              </div>
              <div className="audit-flow-auto-hint">
                自动审批由{ORG_ADMIN_SCOPE_LABEL}执行（按上方匹配条件中的组织层级解析），系统代为自动通过，并非无人审批。
              </div>
              <Form.Item name="approverSteps" hidden>
                <input type="hidden" />
              </Form.Item>
            </div>
          ) : (
            <>
              {stepCount > 1 && (
                <div className="audit-flow-auto-hint audit-flow-approver-multi-hint">
                  已配置 {stepCount} 组审核人，按顺序均需审批；同组内「会签」须全员通过，「或签」任一人通过即可。
                  {hasDynamicStep ? ' 「当前组织管理员」组全规则仅可配置一次。' : ''}
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
                                  disabled={hasDynamicStep && approverSteps?.[name]?.approverType !== '动态人员'}
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
                                  <Form.Item label="动态审核范围" className="audit-flow-dynamic-scope-item">
                                    <Tag color="processing">{ORG_ADMIN_SCOPE_LABEL}</Tag>
                                  </Form.Item>
                                  <div className="audit-flow-auto-hint">
                                    按上方匹配条件中的组织层级解析对应管理员。
                                  </div>
                                  <Form.Item {...restField} name={[name, 'dynamicScope']} hidden initialValue="orgAdmin">
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
            </>
          )}
        </section>
      </Form>
    </Modal>
  );
}
