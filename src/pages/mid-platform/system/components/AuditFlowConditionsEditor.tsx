import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { AuditFlowCondition, AuditFlowOrgScope } from '../../../../types/auditFlowConfig';
import { getOrgValueOptions, ORG_SCOPE_OPTIONS } from '../../../../data/auditFlowOptions';
import { formatConditionsSummary } from '../../../../utils/auditFlowMatcher';

const SELECT_PROPS = {
  allowClear: true,
  showSearch: true,
  optionFilterProp: 'label' as const,
};

export type ConditionKindKey = `org:${AuditFlowOrgScope}` | 'room';

export function encodeConditionKind(
  type: AuditFlowCondition['type'],
  orgScope?: AuditFlowOrgScope,
): ConditionKindKey {
  if (type === 'room') return 'room';
  return `org:${orgScope ?? 'company'}`;
}

export function decodeConditionKind(key: ConditionKindKey): Pick<AuditFlowCondition, 'type'> & {
  orgScope?: AuditFlowOrgScope;
} {
  if (key === 'room') return { type: 'room' };
  return { type: 'org', orgScope: key.replace('org:', '') as AuditFlowOrgScope };
}

/** 条件类型：组织架构下直接展开公司/园区/部门/人员，无需额外层级选择框 */
export const GROUPED_CONDITION_KIND_OPTIONS = [
  {
    label: '组织架构',
    options: ORG_SCOPE_OPTIONS.map((item) => ({
      label: item.label,
      value: encodeConditionKind('org', item.value),
    })),
  },
  {
    label: '空间',
    options: [{ label: '会议室', value: 'room' as ConditionKindKey }],
  },
];

interface AuditFlowConditionsEditorProps {
  form: FormInstance;
  isDefault: boolean;
  roomOptions: { label: string; value: string }[];
  conditionsHint?: string;
}

export default function AuditFlowConditionsEditor({
  form,
  isDefault,
  roomOptions,
  conditionsHint,
}: AuditFlowConditionsEditorProps) {
  const conditions = Form.useWatch('conditions', form) as AuditFlowCondition[] | undefined;

  return (
    <div className="audit-flow-conditions-block">
      <div className="audit-flow-conditions-head">
        <span className="audit-flow-conditions-title">匹配条件（且关系）</span>
        {!isDefault && (
          <span className="audit-flow-conditions-hint">
            {conditionsHint ?? '非默认规则需至少配置一条条件'}
          </span>
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
                  hidden
                  rules={[{ required: true, message: '请选择条件类型' }]}
                >
                  <Input />
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
                      | AuditFlowCondition['type']
                      | undefined;
                    const orgScope = form.getFieldValue(['conditions', name, 'orgScope']) as
                      | AuditFlowOrgScope
                      | undefined;
                    const kindKey = type ? encodeConditionKind(type, orgScope) : undefined;

                    return (
                      <Select
                        className="audit-flow-condition-type"
                        placeholder="请选择条件类型"
                        value={kindKey}
                        options={GROUPED_CONDITION_KIND_OPTIONS}
                        onChange={(value: ConditionKindKey) => {
                          const decoded = decodeConditionKind(value);
                          form.setFieldValue(['conditions', name, 'type'], decoded.type);
                          form.setFieldValue(['conditions', name, 'orgScope'], decoded.orgScope);
                          form.setFieldValue(['conditions', name, 'values'], []);
                        }}
                      />
                    );
                  }}
                </Form.Item>
                <Form.Item {...restField} name={[name, 'orgScope']} hidden>
                  <Input />
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
                      | AuditFlowCondition['type']
                      | undefined;
                    const orgScope = form.getFieldValue(['conditions', name, 'orgScope']) as
                      | AuditFlowOrgScope
                      | undefined;
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
      {conditions && conditions.length > 0 && (
        <div className="audit-flow-auto-hint">预览：{formatConditionsSummary(conditions)}</div>
      )}
    </div>
  );
}
