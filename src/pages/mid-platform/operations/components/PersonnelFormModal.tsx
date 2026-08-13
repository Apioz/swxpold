import { useEffect } from 'react';
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Upload,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { MidPlatformPersonnel, MidPlatformPersonnelIdentity } from '../../../../types/midPlatform';

const { RangePicker } = DatePicker;

interface PersonnelFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  record: MidPlatformPersonnel | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

function createEmptyIdentity(): MidPlatformPersonnelIdentity {
  return {
    id: `identity-${Date.now()}`,
    participantCompany: '',
    contact: '',
    department: '',
    employeeNo: '',
    registerTime: dayjs().format('YYYY-MM-DD'),
    licensePlate: '',
  };
}

export default function PersonnelFormModal({
  open,
  mode,
  record,
  onCancel,
  onSubmit,
}: PersonnelFormModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && record) {
      form.setFieldsValue({
        name: record.name,
        contact: record.contact,
        wechat: record.wechat ?? '',
        idCard: record.idCard ?? '',
        gender: record.gender ?? undefined,
        channelsRuanjie: record.channelsRuanjie ?? false,
        channelsHikvision: record.channelsHikvision ?? false,
        facePhoto: 'uploaded',
        identities: record.identities?.length ? record.identities : [createEmptyIdentity()],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        channelsRuanjie: true,
        channelsHikvision: true,
        identities: [createEmptyIdentity()],
      });
    }
  }, [open, mode, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch {
      /* validation */
    }
  };

  return (
    <Modal
      title={mode === 'add' ? '新增' : '编辑'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      width={920}
      destroyOnHidden
      okText="确定"
      cancelText="取消"
      className="mid-platform-personnel-modal"
    >
      <Form form={form} layout="vertical" className="mid-platform-personnel-form">
        <div className="mid-platform-form-section">
          <div className="mid-platform-form-section-title">基本信息</div>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="人员姓名"
                name="name"
                rules={[{ required: true, message: '请输入人员姓名' }]}
              >
                <Input placeholder="请输入 人员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="联系方式"
                name="contact"
                rules={[{ required: true, message: '请输入联系方式' }]}
              >
                <Input placeholder="请输入 联系方式" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="绑定微信" name="wechat">
                <Input placeholder="请输入 绑定微信" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="身份证号"
                name="idCard"
                rules={[{ required: true, message: '请输入身份证号' }]}
              >
                <Input placeholder="请输入 身份证号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="性别"
                name="gender"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select
                  placeholder="请选择 性别"
                  options={[
                    { label: '男', value: '男' },
                    { label: '女', value: '女' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="人脸照片"
                name="facePhoto"
                rules={mode === 'add' ? [{ required: true, message: '请上传人脸照片' }] : []}
              >
                <Upload listType="picture-card" maxCount={1} showUploadList={false}>
                  {mode === 'edit' ? (
                    <div className="mid-platform-face-photo-placeholder mid-platform-face-photo-sm">
                      <div className="mid-platform-face-photo-logo">BLM Digital</div>
                    </div>
                  ) : (
                    <div className="mid-platform-upload-box">+</div>
                  )}
                </Upload>
              </Form.Item>
              <div className="mid-platform-upload-hint">
                只能上传jpg/png用户头像，且不超过200kb
              </div>
            </Col>
            <Col span={24}>
              <Form.Item label="下发渠道">
                <Form.Item name="channelsRuanjie" valuePropName="checked" noStyle>
                  <Checkbox>软杰(同步人员及设备)</Checkbox>
                </Form.Item>
                <Form.Item name="channelsHikvision" valuePropName="checked" noStyle>
                  <Checkbox style={{ marginLeft: 24 }}>海康(仅同步人员)</Checkbox>
                </Form.Item>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="通行时间权限（软杰）"
                name="accessTimeRange"
                rules={[{ required: mode === 'add', message: '请选择通行时间权限' }]}
              >
                <RangePicker style={{ width: '100%' }} placeholder={['开始 年/月/日', '结束 年/月/日']} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="mid-platform-form-section">
          <div className="mid-platform-form-section-head">
            <div className="mid-platform-form-section-title">人员所属信息</div>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                const identities = form.getFieldValue('identities') ?? [];
                form.setFieldValue('identities', [...identities, createEmptyIdentity()]);
              }}
            >
              新增身份
            </Button>
          </div>

          <Form.List name="identities">
            {(fields, { remove }) =>
              fields.map((field, index) => (
                <div key={field.key} className="mid-platform-identity-card">
                  <div className="mid-platform-identity-card-head">
                    <span>人员身份{index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item
                        {...field}
                        label="参与方企业名称"
                        name={[field.name, 'participantCompany']}
                        rules={[{ required: true, message: '请选择参与方企业名称' }]}
                      >
                        <Select placeholder="请选择参与方企业名称" options={[{ label: '0', value: '0' }]} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...field} label="联系方式" name={[field.name, 'contact']}>
                        <Input disabled placeholder="" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...field}
                        label="部门"
                        name={[field.name, 'department']}
                        rules={[{ required: true, message: '请选择部门' }]}
                      >
                        <Select
                          placeholder="请选择部门"
                          options={[{ label: '研发平台部', value: '研发平台部' }]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...field}
                        label="工号"
                        name={[field.name, 'employeeNo']}
                        rules={[{ required: true, message: '请输入工号' }]}
                      >
                        <Input placeholder="请输入工号" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...field}
                        label="注册时间"
                        name={[field.name, 'registerTime']}
                        rules={[{ required: true, message: '请选择注册时间' }]}
                        getValueProps={(value) => ({
                          value: value ? dayjs(value) : undefined,
                        })}
                        normalize={(value) => (value ? value.format('YYYY-MM-DD') : undefined)}
                      >
                        <DatePicker style={{ width: '100%' }} placeholder="请选择注册时间" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...field} label="车牌号" name={[field.name, 'licensePlate']}>
                        <Input placeholder="请输入车牌号" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))
            }
          </Form.List>
        </div>
      </Form>
    </Modal>
  );
}
