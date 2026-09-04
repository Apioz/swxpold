import { useEffect, useMemo, useState } from 'react';
import {
  AudioOutlined,
  BorderOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  SaveOutlined,
  UploadOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Cascader,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Tag,
  message,
} from 'antd';
import type { SelectedDocumentImage } from '../../../../../types/foundationDocument';
import type {
  MeetingRoomCoverSelection,
  MeetingRoomEquipment,
  MeetingRoomPlanPoint,
  MidPlatformMeetingRoom,
} from '../../../../../types/midPlatformMeetingRoom';
import {
  MEETING_ROOM_EQUIPMENT_OPTIONS,
  MEETING_ROOM_SCREEN_OPTIONS,
} from '../../../../../data/mockMidPlatformMeetingRooms';
import {
  MEETING_ROOM_SPACE_CASCADER_OPTIONS,
  applyMeetingRoomSpaceSelection,
  parseMeetingRoomSpacePath,
} from '../../../../../data/meetingRoomSpaceOptions';
import DocumentImagePickerModal from '../../../../../components/foundation/DocumentImagePickerModal';
import DocumentFloorPlanPickerModal from '../../../../../components/foundation/DocumentFloorPlanPickerModal';
import FloorPlanPointModal from '../../../../../components/foundation/FloorPlanPointModal';
import MeetingRoomPermissionModal from './MeetingRoomPermissionModal';
import {
  getFloorPlan,
  useMeetingRoomFloorPlanStore,
} from '../../../../../store/meetingRoomFloorPlanStore';
import { resolveMeetingRoomFloorContext, getMeetingRoomFloorKey } from '../../../../../utils/meetingRoomFloorContext';
import '../../../../../components/foundation/DocumentExplorer.css';

interface MeetingRoomFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  record: MidPlatformMeetingRoom | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

const equipmentIcons: Record<MeetingRoomEquipment, React.ReactNode> = {
  投影仪: <DesktopOutlined />,
  白板: <BorderOutlined />,
  麦克风: <AudioOutlined />,
};

function toCoverSelection(selection: SelectedDocumentImage): MeetingRoomCoverSelection {
  return {
    imageId: selection.imageId,
    imageName: selection.imageName,
    imageUrl: selection.imageUrl,
    documentPath: selection.documentPath,
    campus: selection.campus,
    building: selection.building,
    floor: selection.floor,
  };
}

export default function MeetingRoomFormModal({
  open,
  mode,
  record,
  onCancel,
  onSubmit,
}: MeetingRoomFormModalProps) {
  const [form] = Form.useForm();
  const [floorPlans, { upsertFloorPlanFromSelection, removeFloorPlan }] =
    useMeetingRoomFloorPlanStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [floorPlanPickerOpen, setFloorPlanPickerOpen] = useState(false);
  const [floorPlanPickerMode, setFloorPlanPickerMode] = useState<'upload' | 'replace'>('upload');
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [openPointAfterFloorPlan, setOpenPointAfterFloorPlan] = useState(false);
  const [cover, setCover] = useState<MeetingRoomCoverSelection | null>(null);
  const [planPoint, setPlanPoint] = useState<MeetingRoomPlanPoint | null>(null);
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [spaceLocationPath, setSpaceLocationPath] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && record) {
      form.setFieldsValue({
        spaceLocation: record.spaceLocation,
        address: record.address,
        roomNo: record.roomNo,
        name: record.name,
        area: record.area,
        capacity: record.capacity,
        status: record.status,
        usagePermission: record.usagePermission,
        equipment: record.equipment,
        screenDevice: record.screenDevice.includes('、')
          ? record.screenDevice.split('、')[0]?.trim() ?? record.screenDevice
          : record.screenDevice,
        description: record.description ?? '',
      });
      setCover(record.cover ?? null);
      setPlanPoint(record.planPoint ?? null);
      setAuthorizedUserIds(record.authorizedUserIds ?? []);
      setSpaceLocationPath(parseMeetingRoomSpacePath(record.spaceLocation));
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'enabled',
        usagePermission: 'unlimited',
      });
      setCover(null);
      setPlanPoint(null);
      setAuthorizedUserIds([]);
      setSpaceLocationPath([]);
    }
  }, [open, mode, record, form]);

  const address = Form.useWatch('address', form) as string | undefined;
  const spaceLocation = Form.useWatch('spaceLocation', form) as string | undefined;
  const usagePermission = Form.useWatch('usagePermission', form) as
    | MidPlatformMeetingRoom['usagePermission']
    | undefined;
  const roomStatus = Form.useWatch('status', form) as MidPlatformMeetingRoom['status'] | undefined;

  const floorCtx = useMemo(() => {
    const resolved = resolveMeetingRoomFloorContext({
      spaceLocation,
      address,
      cover,
      building: record?.building ?? spaceLocationPath[0],
    });
    if (resolved) return resolved;

    if (spaceLocationPath.length >= 2) {
      const building = spaceLocationPath[0]?.trim() ?? '';
      const floor = spaceLocationPath[1]?.trim() ?? '';
      if (building && floor) {
        return { building, floor, floorKey: getMeetingRoomFloorKey(building, floor) };
      }
    }
    return null;
  }, [spaceLocation, address, cover, record?.building, floorPlans, spaceLocationPath]);

  const pickerBuilding = floorCtx?.building ?? spaceLocationPath[0];
  const pickerFloor = floorCtx?.floor ?? spaceLocationPath[1];

  const floorPlan = floorCtx
    ? getFloorPlan(floorCtx.building, floorCtx.floor)
    : undefined;

  const handleSpaceLocationChange = (path: string[]) => {
    setSpaceLocationPath(path);
    const selection = applyMeetingRoomSpaceSelection(path);
    if (!selection) return;
    form.setFieldsValue({
      spaceLocation: selection.spaceLocation,
      address: selection.address,
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!values.spaceLocation || parseMeetingRoomSpacePath(values.spaceLocation as string).length < 3) {
        message.warning('请选择完整的空间位置（楼栋、楼层、房间）');
        return;
      }
      if (values.usagePermission === 'restricted' && authorizedUserIds.length === 0) {
        message.warning('限制人群使用时，请至少选择一名授权用户');
        return;
      }
      onSubmit({ ...values, cover, planPoint, authorizedUserIds });
    } catch {
      /* validation */
    }
  };

  const warnMissingFloorContext = () => {
    message.warning('请先选择空间位置（至少到楼层），或上传封面/平面图以确定楼栋与楼层');
  };

  const handleOpenPointModal = () => {
    if (!floorCtx) {
      warnMissingFloorContext();
      return;
    }
    if (!floorPlan) {
      message.info('请先上传该楼层的平面图，再设置点位');
      setFloorPlanPickerMode('upload');
      setOpenPointAfterFloorPlan(true);
      setFloorPlanPickerOpen(true);
      return;
    }
    setPointModalOpen(true);
  };

  const handleUploadFloorPlan = () => {
    if (!floorCtx) {
      warnMissingFloorContext();
      return;
    }
    setFloorPlanPickerMode('upload');
    setOpenPointAfterFloorPlan(false);
    setFloorPlanPickerOpen(true);
  };

  const handleReplaceFloorPlan = () => {
    if (!floorCtx) return;
    setFloorPlanPickerMode('replace');
    setOpenPointAfterFloorPlan(false);
    setFloorPlanPickerOpen(true);
  };

  const handleOpenCoverPicker = () => {
    setPickerOpen(true);
  };

  const handleDeleteFloorPlan = () => {
    if (!floorCtx) return;
    Modal.confirm({
      title: '删除楼层平面图',
      content: `确定删除 ${floorCtx.building} ${floorCtx.floor} 的平面图吗？删除后该楼层所有会议室点位将清除，小程序平面图页也将不再展示该楼层。`,
      okText: '确定删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        removeFloorPlan(floorCtx.building, floorCtx.floor);
        setPlanPoint(null);
        message.success('楼层平面图已删除');
      },
    });
  };

  return (
    <>
      <Modal
        title={mode === 'add' ? '新增' : '编辑'}
        open={open}
        onCancel={onCancel}
        width={960}
        destroyOnHidden
        footer={
          <div className="meeting-room-modal-footer">
            <Button icon={<CloseOutlined />} onClick={onCancel}>
              取消
            </Button>
            <Button
              type="primary"
              icon={mode === 'add' ? <SaveOutlined /> : <CheckOutlined />}
              onClick={handleOk}
            >
              {mode === 'add' ? '保存' : '修改'}
            </Button>
          </div>
        }
        className="mid-platform-meeting-room-modal"
      >
        <Form form={form} layout="vertical" className="mid-platform-meeting-room-form">
          <section className="meeting-room-form-section">
            <div className="meeting-room-form-section-title">基本信息</div>
            <div className="meeting-room-form-grid">
              <Form.Item
                label="空间位置"
                required
                className="full-width"
              >
                <Cascader
                  options={MEETING_ROOM_SPACE_CASCADER_OPTIONS}
                  value={spaceLocationPath}
                  onChange={(path) => handleSpaceLocationChange(path as string[])}
                  placeholder="请选择 空间位置"
                  expandTrigger="hover"
                  style={{ width: '100%' }}
                  showSearch={{
                    filter: (input, path) =>
                      path.some((option) =>
                        String(option.label ?? '')
                          .toLowerCase()
                          .includes(input.toLowerCase()),
                      ),
                  }}
                />
                <Form.Item name="spaceLocation" hidden rules={[{ required: true, message: '请选择 空间位置' }]}>
                  <Input />
                </Form.Item>
              </Form.Item>
              <Form.Item
                label="地址"
                name="address"
                rules={[{ required: true, message: '请输入 地址' }]}
                required
              >
                <Input placeholder="请输入 地址" />
              </Form.Item>
              <Form.Item
                label="会议室编号"
                name="roomNo"
                rules={[{ required: true, message: '请输入 会议室编号' }]}
                required
              >
                <Input placeholder="请输入 会议室编号" />
              </Form.Item>
              <Form.Item
                label="会议室名称"
                name="name"
                rules={[{ required: true, message: '请输入 会议室名称' }]}
                required
              >
                <Input placeholder="请输入 会议室名称" />
              </Form.Item>
              <Form.Item
                label="面积"
                name="area"
                rules={[{ required: true, message: '请输入 面积' }]}
                required
              >
                <InputNumber
                  placeholder="请输入 面积"
                  min={0}
                  style={{ width: '100%' }}
                  addonAfter="m²"
                />
              </Form.Item>
              <Form.Item
                label="容纳人数"
                name="capacity"
                rules={[{ required: true, message: '请输入 容纳人数' }]}
                required
              >
                <InputNumber
                  placeholder="请输入 容纳人数"
                  min={0}
                  style={{ width: '100%' }}
                  addonAfter="人"
                />
              </Form.Item>
            </div>
          </section>

          <section className="meeting-room-form-section">
            <div className="meeting-room-form-section-title">封面与点位</div>

            <div className="meeting-room-media-row">
              <div className="meeting-room-form-subsection">
                <div className="meeting-room-form-subsection-label">会议室全景图</div>
                <div className={`meeting-room-cover-panel meeting-room-media-panel${cover ? ' has-cover' : ''}`}>
                  <div className="meeting-room-cover-panel-media">
                    {cover ? (
                      <img src={cover.imageUrl} alt={cover.imageName} />
                    ) : (
                      <div className="meeting-room-cover-panel-placeholder">
                        <PictureOutlined />
                        <span>暂未上传封面</span>
                      </div>
                    )}
                  </div>
                  <div className="meeting-room-cover-panel-body">
                    {cover ? (
                      <>
                        <div className="meeting-room-cover-panel-name">{cover.imageName}</div>
                        <div className="meeting-room-cover-panel-path">{cover.documentPath}</div>
                        <div className="meeting-room-cover-panel-meta">
                          {cover.building} · {cover.floor}
                        </div>
                      </>
                    ) : (
                      <div className="meeting-room-cover-panel-tip">
                        可选。本地上传室内全景图，保存后写入数据库并在小程序列表展示
                      </div>
                    )}
                    <div className="meeting-room-cover-panel-actions">
                      <Button icon={<PictureOutlined />} onClick={handleOpenCoverPicker}>
                        {cover ? '更换封面' : '上传封面'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="meeting-room-form-subsection">
                <div className="meeting-room-form-subsection-label">
                  楼层平面图
                  {floorCtx && (
                    <span className="meeting-room-form-subsection-meta">
                      {floorCtx.building} · {floorCtx.floor}
                    </span>
                  )}
                </div>
                {!floorCtx ? (
                  <div className="meeting-room-floor-plan-empty meeting-room-media-panel">
                    选择空间位置（至少到楼层）后可管理平面图；与封面互不影响，可先传平面图或跳过封面
                  </div>
                ) : (
                  <div className={`meeting-room-floor-plan-panel meeting-room-media-panel${floorPlan ? ' has-plan' : ''}`}>
                    {floorPlan ? (
                      <>
                        <div className="meeting-room-floor-plan-preview">
                          <img src={floorPlan.imageUrl} alt={floorPlan.imageName} />
                        </div>
                        <div className="meeting-room-floor-plan-body">
                          <div className="meeting-room-cover-panel-name">{floorPlan.imageName}</div>
                          <div className="meeting-room-cover-panel-path">{floorPlan.documentPath}</div>
                          <div className="meeting-room-floor-plan-tip">
                            本楼层共用平面图，更换或删除将影响该楼层全部会议室及小程序展示
                          </div>
                          <div className="meeting-room-cover-panel-actions">
                            <Button icon={<EnvironmentOutlined />} onClick={handleOpenPointModal}>
                              设置点位
                            </Button>
                            <Button icon={<UploadOutlined />} onClick={handleReplaceFloorPlan}>
                              更换平面图
                            </Button>
                            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteFloorPlan}>
                              删除平面图
                            </Button>
                            <Tag color={planPoint ? 'success' : 'default'}>
                              {planPoint ? '已设置点位' : '未设置点位'}
                            </Tag>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="meeting-room-floor-plan-empty-panel">
                        <div className="meeting-room-floor-plan-tip">
                          该楼层尚未上传平面图。同楼层会议室将共用一张平面图，与是否上传封面无关。
                        </div>
                        <Button type="primary" icon={<UploadOutlined />} onClick={handleUploadFloorPlan}>
                          上传楼层平面图
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="meeting-room-form-section">
            <div className="meeting-room-form-section-title">预约配置</div>
            <div className="meeting-room-form-grid">
              <Form.Item label="状态" name="status" className="full-width">
                <Radio.Group>
                  <Radio value="disabled">禁用</Radio>
                  <Radio value="enabled">启用</Radio>
                  <Radio value="idle">空闲</Radio>
                </Radio.Group>
              </Form.Item>
              {roomStatus === 'idle' && (
                <div className="meeting-room-idle-notice full-width">
                  <Tag color="success" className="meeting-room-idle-tag">
                    空闲
                  </Tag>
                  <span className="meeting-room-idle-desc">
                    空闲状态下不限制人员进出，任何人都可通过扫脸开启使用
                  </span>
                </div>
              )}
              <Form.Item label="使用权限" name="usagePermission">
                <Radio.Group
                  onChange={(e) => {
                    if (e.target.value === 'unlimited') {
                      setAuthorizedUserIds([]);
                    }
                  }}
                >
                  <Radio value="unlimited">不限</Radio>
                  <Radio value="restricted">限制人群使用</Radio>
                </Radio.Group>
              </Form.Item>
              {usagePermission === 'restricted' && (
                <Form.Item label="授权用户" className="full-width">
                  <Button
                    type="link"
                    icon={<UserSwitchOutlined />}
                    className="meeting-room-permission-link"
                    onClick={() => setPermissionModalOpen(true)}
                  >
                    设置使用权限
                  </Button>
                </Form.Item>
              )}
              <Form.Item label="设备" name="equipment" className="full-width">
                <Checkbox.Group className="mid-platform-equipment-group">
                  {MEETING_ROOM_EQUIPMENT_OPTIONS.map((item) => (
                    <Checkbox
                      key={item.value}
                      value={item.value}
                      className="mid-platform-equipment-tag"
                    >
                      {equipmentIcons[item.value]} {item.label}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
              <Form.Item label="预约屏设备" name="screenDevice" className="full-width">
                <Select
                  placeholder="请选择 预约屏设备"
                  options={MEETING_ROOM_SCREEN_OPTIONS}
                  allowClear
                />
              </Form.Item>
              <Form.Item label="描述" name="description" className="full-width">
                <Input.TextArea placeholder="请输入 描述" rows={3} />
              </Form.Item>
            </div>
          </section>
        </Form>
      </Modal>

      <DocumentImagePickerModal
        open={pickerOpen}
        title={cover ? '更换会议室封面' : '上传会议室封面'}
        expectedBuilding={pickerBuilding}
        expectedFloor={pickerFloor}
        initialSelection={
          cover
            ? {
                ...cover,
                floorPlanId: '',
                floorPlanUrl: '',
              }
            : null
        }
        onCancel={() => setPickerOpen(false)}
        onConfirm={(selection) => {
          const prevCtx = resolveMeetingRoomFloorContext({
            spaceLocation,
            address,
            cover,
            building: record?.building,
          });
          const nextCover = toCoverSelection(selection);
          const nextCtx = resolveMeetingRoomFloorContext({
            spaceLocation,
            address,
            cover: nextCover,
            building: record?.building,
          });
          setCover(nextCover);
          if (prevCtx?.floorKey !== nextCtx?.floorKey) {
            setPlanPoint(null);
          }
          setPickerOpen(false);
        }}
      />

      {floorCtx && (
        <DocumentFloorPlanPickerModal
          open={floorPlanPickerOpen}
          title={floorPlanPickerMode === 'replace' ? '更换楼层平面图' : '上传楼层平面图'}
          expectedBuilding={floorCtx.building}
          expectedFloor={floorCtx.floor}
          initialSelection={
            floorPlanPickerMode === 'replace' && floorPlan
              ? {
                  imageId: floorPlan.imageId,
                  imageName: floorPlan.imageName,
                  imageUrl: floorPlan.imageUrl,
                  documentPath: floorPlan.documentPath,
                  campus: floorPlan.campus,
                  building: floorPlan.building,
                  floor: floorPlan.floor,
                  floorPlanId: floorPlan.floorPlanId,
                }
              : null
          }
          onCancel={() => {
            setFloorPlanPickerOpen(false);
            setOpenPointAfterFloorPlan(false);
          }}
          onConfirm={(selection) => {
            if (
              selection.building !== floorCtx.building ||
              selection.floor !== floorCtx.floor
            ) {
              message.error('所选平面图与当前会议室楼层不一致');
              return;
            }
            upsertFloorPlanFromSelection(selection);
            setFloorPlanPickerOpen(false);
            message.success(floorPlanPickerMode === 'replace' ? '平面图已更换' : '平面图已上传');
            if (openPointAfterFloorPlan) {
              setOpenPointAfterFloorPlan(false);
              setPointModalOpen(true);
            }
          }}
        />
      )}

      {floorPlan && floorCtx && (
        <FloorPlanPointModal
          open={pointModalOpen}
          floorPlanUrl={floorPlan.imageUrl}
          building={floorCtx.building}
          floor={floorCtx.floor}
          point={planPoint}
          onCancel={() => setPointModalOpen(false)}
          onConfirm={(nextPoint) => {
            setPlanPoint(nextPoint);
            setPointModalOpen(false);
          }}
        />
      )}

      <MeetingRoomPermissionModal
        open={permissionModalOpen}
        initialUsagePermission={usagePermission ?? 'restricted'}
        initialAuthorizedUserIds={authorizedUserIds}
        onCancel={() => setPermissionModalOpen(false)}
        onConfirm={({ usagePermission: nextPermission, authorizedUserIds: nextUserIds }) => {
          form.setFieldValue('usagePermission', nextPermission);
          setAuthorizedUserIds(nextUserIds);
          setPermissionModalOpen(false);
        }}
      />
    </>
  );
}
