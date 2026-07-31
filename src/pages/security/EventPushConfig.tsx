import { useMemo, useState, useEffect } from 'react';
import {
  Button,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  ColumnHeightOutlined,
  DeleteOutlined,
  DownOutlined,
  FullscreenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type {
  EventDevice,
  EventLevel,
  EventPushConfig,
  HandleType,
  LevelPushConfig,
  NotifyMethod,
} from '../../types/security';
import {
  EVENT_PUSH_DEVICES,
  EVENT_LEVELS,
  EVENT_TYPE_DICT,
  HANDLE_TYPE_OPTIONS,
  PUSH_PREVIEW,
  PUSH_TEMPLATE,
  buildNotifyMethodOptions,
  deviceSupportsLevel,
  getConfiguredNotifyMethods,
  getDefaultNotifyMethod,
  sanitizeNotifyMethod,
} from '../../types/security';
import { useSecurityStore } from '../../store/securityStore';
import { mockNotificationConfigs } from '../../data/mockSecurity';
import '../spare-parts/SpareModals.css';
import './SecurityPages.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

function createLevelConfig(
  level: EventLevel,
  defaultNotify: NotifyMethod,
  partial?: Partial<LevelPushConfig>,
): LevelPushConfig {
  return {
    id: partial?.id ?? `lc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    level,
    notifyMethod: partial?.notifyMethod ?? defaultNotify,
    handleType: partial?.handleType ?? 'simple',
  };
}

function nextAvailableLevel(used: EventLevel[]): EventLevel | null {
  return EVENT_LEVELS.find((l) => !used.includes(l)) ?? null;
}

interface BatchPushRow {
  id: string;
  eventTypeCode: string;
  eventTypeName: string;
  level: EventLevel | null;
  notifyMethod: NotifyMethod;
  handleType: HandleType;
}

interface BatchDefaults {
  level: EventLevel;
  notifyMethod: NotifyMethod;
  handleType: HandleType;
}

type BatchField = 'level' | 'notifyMethod' | 'handleType';

function CustomizedBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="batch-custom-badge">
      <span className="batch-custom-dot" />
      <span className="batch-custom-text">已自定义</span>
    </span>
  );
}

const createInitialBatchDefaults = (defaultNotify: NotifyMethod): BatchDefaults => ({
  level: '中',
  notifyMethod: defaultNotify,
  handleType: 'simple',
});

function createDefaultFlatRow(
  eventDevice: EventDevice,
  item: (typeof EVENT_TYPE_DICT)[number],
  defaultNotify: NotifyMethod,
  existing?: EventPushConfig,
): BatchPushRow {
  const cfg = existing?.levelConfigs[0];
  return {
    id: `${eventDevice}_${item.code}`,
    eventTypeCode: item.code,
    eventTypeName: item.name,
    level: null,
    notifyMethod: cfg?.notifyMethod ?? defaultNotify,
    handleType: cfg?.handleType ?? 'simple',
  };
}

function createDefaultLevelRow(
  eventDevice: EventDevice,
  item: (typeof EVENT_TYPE_DICT)[number],
  level: EventLevel,
  defaultNotify: NotifyMethod,
  existing?: EventPushConfig,
): BatchPushRow {
  const cfg = existing?.levelConfigs.find((c) => c.level === level);
  return {
    id: `${eventDevice}_${item.code}_${level}`,
    eventTypeCode: item.code,
    eventTypeName: item.name,
    level,
    notifyMethod: cfg?.notifyMethod ?? defaultNotify,
    handleType: cfg?.handleType ?? 'simple',
  };
}

function buildBatchRows(
  eventDevice: EventDevice,
  configs: EventPushConfig[],
  defaultNotify: NotifyMethod,
  configuredMethods: NotifyMethod[],
): BatchPushRow[] {
  const types = EVENT_TYPE_DICT.filter((d) => d.device === eventDevice);
  const supportsLevel = deviceSupportsLevel(eventDevice);

  const findExisting = (eventTypeCode: string) =>
    configs.find(
      (c) => c.device === eventDevice && c.eventType === eventTypeCode,
    );

  if (!supportsLevel) {
    return types.map((item) => {
      const row = createDefaultFlatRow(
        eventDevice,
        item,
        defaultNotify,
        findExisting(item.code),
      );
      return {
        ...row,
        notifyMethod: sanitizeNotifyMethod(row.notifyMethod, configuredMethods),
      };
    });
  }

  return types.flatMap((item) =>
    EVENT_LEVELS.map((level) => {
      const row = createDefaultLevelRow(
        eventDevice,
        item,
        level,
        defaultNotify,
        findExisting(item.code),
      );
      return {
        ...row,
        notifyMethod: sanitizeNotifyMethod(row.notifyMethod, configuredMethods),
      };
    }),
  );
}

function mergeLevelConfigs(
  existing: LevelPushConfig[],
  incoming: LevelPushConfig[],
): LevelPushConfig[] {
  const map = new Map<string, LevelPushConfig>();
  existing.forEach((lc) => {
    const key = lc.level ?? 'null';
    map.set(key, lc);
  });
  incoming.forEach((lc) => {
    const key = lc.level ?? 'null';
    map.set(key, lc);
  });
  return Array.from(map.values());
}

export default function EventPushConfig() {
  const [{ eventPushConfigs: data, notificationConfigs }, { setEventPushConfigs: setData }] =
    useSecurityStore();
  const configuredNotifyMethods = useMemo(
    () => getConfiguredNotifyMethods(notificationConfigs),
    [notificationConfigs],
  );
  const notifyMethodOptions = useMemo(
    () => buildNotifyMethodOptions(configuredNotifyMethods),
    [configuredNotifyMethods],
  );
  const defaultNotifyMethod = useMemo(
    () => getDefaultNotifyMethod(configuredNotifyMethods),
    [configuredNotifyMethods],
  );
  const [search, setSearch] = useState<{
    device?: string;
    eventType?: string;
    level?: string;
  }>({});
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [levelConfigs, setLevelConfigs] = useState<LevelPushConfig[]>([]);
  const [batchDevice, setBatchDevice] = useState<EventDevice | undefined>();
  const [batchRows, setBatchRows] = useState<BatchPushRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [customizedRowIds, setCustomizedRowIds] = useState<string[]>([]);
  const [batchDefaults, setBatchDefaults] = useState<BatchDefaults>(() =>
    createInitialBatchDefaults(
      getDefaultNotifyMethod(getConfiguredNotifyMethods(mockNotificationConfigs)),
    ),
  );
  const [batchSettingOpen, setBatchSettingOpen] = useState(false);
  const [batchSettingField, setBatchSettingField] = useState<BatchField | null>(
    null,
  );
  const [batchSettingValue, setBatchSettingValue] = useState<
    EventLevel | NotifyMethod | HandleType | null
  >(null);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [listBatchEditOpen, setListBatchEditOpen] = useState(false);
  const [listBatchForm] = Form.useForm();
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  useEffect(() => {
    setBatchDefaults((prev) => ({
      ...prev,
      notifyMethod: sanitizeNotifyMethod(prev.notifyMethod, configuredNotifyMethods),
    }));
    if (batchDevice) {
      setBatchRows((prev) =>
        prev.map((row) => ({
          ...row,
          notifyMethod: sanitizeNotifyMethod(
            row.notifyMethod,
            configuredNotifyMethods,
          ),
        })),
      );
    }
  }, [configuredNotifyMethods, batchDevice]);

  const eventTypeOptions = useMemo(() => {
    const list = selectedDevice
      ? EVENT_TYPE_DICT.filter((d) => d.device === selectedDevice)
      : EVENT_TYPE_DICT;
    return list.map((d) => ({
      label: d.name,
      value: d.code,
      name: d.name,
    }));
  }, [selectedDevice]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search.device && item.device !== search.device) return false;
      if (search.eventType && item.eventType !== search.eventType) return false;
      if (
        search.level &&
        !item.levelConfigs.some((c) => c.level === search.level)
      ) {
        return false;
      }
      return true;
    });
  }, [data, search]);

  const resetLevelConfigs = (configs?: LevelPushConfig[]) => {
    setLevelConfigs(
      configs ?? [createLevelConfig('低', defaultNotifyMethod)],
    );
  };

  const resetBatchModalState = () => {
    setSelectedRowIds([]);
    setCustomizedRowIds([]);
    setBatchDefaults(createInitialBatchDefaults(defaultNotifyMethod));
    setBatchSettingOpen(false);
    setBatchSettingField(null);
    setBatchSettingValue(null);
    setBatchConfirmOpen(false);
  };

  const openAdd = () => {
    setModalMode('add');
    setEditingId(null);
    modalForm.resetFields();
    setSelectedDevice(undefined);
    setBatchDevice(undefined);
    setBatchRows([]);
    resetBatchModalState();
    resetLevelConfigs();
    modalForm.setFieldsValue({ pushContent: PUSH_TEMPLATE });
    setModalOpen(true);
  };

  const handleBatchDeviceChange = (device: EventDevice) => {
    setBatchDevice(device);
    setBatchRows(
      buildBatchRows(
        device,
        data,
        defaultNotifyMethod,
        configuredNotifyMethods,
      ),
    );
    resetBatchModalState();
    modalForm.setFieldValue('device', device);
  };

  const updateBatchRow = (id: string, patch: Partial<BatchPushRow>) => {
    setBatchRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const updateBatchRowManual = (
    id: string,
    patch: Partial<BatchPushRow>,
  ) => {
    updateBatchRow(id, patch);
    setCustomizedRowIds((prev) =>
      prev.includes(id) ? prev : [...prev, id],
    );
  };

  const resetBatchRowToDefault = (row: BatchPushRow) => {
    const patch: Partial<BatchPushRow> = {
      notifyMethod: batchDefaults.notifyMethod,
      handleType: batchDefaults.handleType,
    };
    if (row.level !== null) {
      patch.level = batchDefaults.level;
    }
    updateBatchRow(row.id, patch);
    setCustomizedRowIds((prev) => prev.filter((id) => id !== row.id));
    message.success('已恢复为批量默认值');
  };

  const getGroupRowIds = (eventTypeCode: string) =>
    batchRows
      .filter((row) => row.eventTypeCode === eventTypeCode)
      .map((row) => row.id);

  const toggleSelectAll = (checked: boolean) => {
    setSelectedRowIds(checked ? batchRows.map((row) => row.id) : []);
  };

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedRowIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id),
    );
  };

  const toggleGroupSelection = (eventTypeCode: string, checked: boolean) => {
    const ids = getGroupRowIds(eventTypeCode);
    setSelectedRowIds((prev) =>
      checked
        ? [...new Set([...prev, ...ids])]
        : prev.filter((id) => !ids.includes(id)),
    );
  };

  const isGroupAllSelected = (eventTypeCode: string) => {
    const ids = getGroupRowIds(eventTypeCode);
    return ids.length > 0 && ids.every((id) => selectedRowIds.includes(id));
  };

  const isGroupIndeterminate = (eventTypeCode: string) => {
    const ids = getGroupRowIds(eventTypeCode);
    const selectedCount = ids.filter((id) => selectedRowIds.includes(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  };

  const allRowsSelected =
    batchRows.length > 0 && selectedRowIds.length === batchRows.length;
  const someRowsSelected =
    selectedRowIds.length > 0 && selectedRowIds.length < batchRows.length;

  const openBatchSetting = (field: BatchField) => {
    if (selectedRowIds.length === 0) {
      message.warning('请先选择要配置的行');
      return;
    }
    const supportsLevel = batchDevice ? deviceSupportsLevel(batchDevice) : false;
    if (field === 'level' && !supportsLevel) {
      message.info('当前设备不支持事件等级配置');
      return;
    }
    if (field === 'notifyMethod' && configuredNotifyMethods.length === 0) {
      message.warning('请先在通知方式配置中添加可用的通知方式');
      return;
    }
    setBatchSettingField(field);
    setBatchSettingValue(
      field === 'level'
        ? batchDefaults.level
        : field === 'notifyMethod'
          ? batchDefaults.notifyMethod
          : batchDefaults.handleType,
    );
    setBatchSettingOpen(true);
  };

  const applyBatchSetting = (mode: 'all' | 'skipCustom') => {
    if (!batchSettingField || batchSettingValue === null) return;

    const targetIds =
      mode === 'skipCustom'
        ? selectedRowIds.filter((id) => !customizedRowIds.includes(id))
        : selectedRowIds;

    if (targetIds.length === 0) {
      message.info('没有可应用的行');
      setBatchConfirmOpen(false);
      setBatchSettingOpen(false);
      return;
    }

    setBatchRows((prev) =>
      prev.map((row) => {
        if (!targetIds.includes(row.id)) return row;
        if (batchSettingField === 'level') {
          if (row.level === null) return row;
          return { ...row, level: batchSettingValue as EventLevel };
        }
        if (batchSettingField === 'notifyMethod') {
          return { ...row, notifyMethod: batchSettingValue as NotifyMethod };
        }
        return { ...row, handleType: batchSettingValue as HandleType };
      }),
    );

    setBatchDefaults((prev) => ({
      ...prev,
      [batchSettingField]: batchSettingValue,
    }));

    setCustomizedRowIds((prev) => {
      const cleared = prev.filter((id) => !targetIds.includes(id));
      if (mode === 'all') return cleared;
      return cleared;
    });

    setBatchConfirmOpen(false);
    setBatchSettingOpen(false);
    message.success(`已批量更新 ${targetIds.length} 行`);
  };

  const handleBatchSettingApply = () => {
    if (!batchSettingField || batchSettingValue === null) return;

    const hasCustomized = selectedRowIds.some((id) =>
      customizedRowIds.includes(id),
    );
    if (hasCustomized) {
      setBatchConfirmOpen(true);
      return;
    }
    applyBatchSetting('all');
  };

  const fillModal = (record: EventPushConfig) => {
    setSelectedDevice(record.device);
    resetLevelConfigs(
      record.levelConfigs.map((c) => ({
        ...c,
        notifyMethod: sanitizeNotifyMethod(c.notifyMethod, configuredNotifyMethods),
      })),
    );
    modalForm.setFieldsValue({
      device: record.device,
      eventType: record.eventType,
      pushContent: record.pushContent || PUSH_TEMPLATE,
    });
  };

  const openEdit = (record: EventPushConfig) => {
    setModalMode('edit');
    setEditingId(record.id);
    fillModal(record);
    setModalOpen(true);
  };

  const openView = (record: EventPushConfig) => {
    setModalMode('view');
    setEditingId(record.id);
    fillModal(record);
    setModalOpen(true);
  };

  const handleDelete = (record: EventPushConfig) => {
    Modal.confirm({
      title: '温馨提示',
      content: '您确定要删除该选中项吗?',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setData((prev) => prev.filter((item) => item.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const updateLevelConfig = (
    id: string,
    patch: Partial<LevelPushConfig>,
  ) => {
    setLevelConfigs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const addLevelConfig = () => {
    const used = levelConfigs
      .map((c) => c.level)
      .filter((l): l is EventLevel => l !== null);
    const next = nextAvailableLevel(used);
    if (!next) {
      message.warning('所有事件等级均已配置，不可重复添加');
      return;
    }
    setLevelConfigs((prev) => [...prev, createLevelConfig(next, defaultNotifyMethod)]);
  };

  const removeLevelConfig = (id: string) => {
    if (levelConfigs.length <= 1) {
      message.warning('至少需保留一个等级配置');
      return;
    }
    setLevelConfigs((prev) => prev.filter((item) => item.id !== id));
  };

  const validateLevelConfigs = (): boolean => {
    const levels = levelConfigs
      .map((c) => c.level)
      .filter((l): l is EventLevel => l !== null);
    if (levels.length === 0) return true;
    if (new Set(levels).size !== levels.length) {
      message.error('事件等级不可重复，请检查各等级配置');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    try {
      const values = await modalForm.validateFields();
      if (!validateLevelConfigs()) return;

      const typeItem = EVENT_TYPE_DICT.find(
        (d) => d.code === values.eventType && d.device === values.device,
      );
      const payload: Omit<EventPushConfig, 'id'> = {
        device: values.device,
        eventType: values.eventType,
        eventTypeName: typeItem?.name ?? values.eventType,
        levelConfigs: levelConfigs.map((c) => ({ ...c })),
        effectiveTime: values.timeRange
          ? `${values.timeRange[0].format('YYYY-MM-DD HH:mm')} 至 ${values.timeRange[1].format('YYYY-MM-DD HH:mm')}`
          : '永久有效',
        pushContent: values.pushContent,
        enabled: true,
        updater: '管理员',
      };

      if (modalMode === 'edit' && editingId) {
        setData((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...payload } : item,
          ),
        );
        message.success('保存成功');
        setModalOpen(false);
      }
    } catch {
      /* validation */
    }
  };

  const handleSaveBatch = async () => {
    try {
      const values = await modalForm.validateFields(['device', 'pushContent']);
      if (!batchDevice) {
        message.warning('请选择事件设备');
        return;
      }
      if (batchRows.length === 0) {
        message.warning('该设备下暂无事件类型可配置');
        return;
      }
      if (selectedRowIds.length === 0) {
        message.warning('请勾选要新增的事件类型与事件等级');
        return;
      }

      const effectiveTime = values.timeRange
        ? `${values.timeRange[0].format('YYYY-MM-DD HH:mm')} 至 ${values.timeRange[1].format('YYYY-MM-DD HH:mm')}`
        : '永久有效';

      const selectedRows = batchRows.filter((row) =>
        selectedRowIds.includes(row.id),
      );

      const eventTypeMap = new Map<string, BatchPushRow[]>();
      selectedRows.forEach((row) => {
        const list = eventTypeMap.get(row.eventTypeCode) ?? [];
        list.push(row);
        eventTypeMap.set(row.eventTypeCode, list);
      });

      setData((prev) => {
        const next = [...prev];
        eventTypeMap.forEach((rows, eventTypeCode) => {
          const row = rows[0];
          const incomingLevelConfigs = rows.map((r) => ({
            id: `lc_${r.id}`,
            level: r.level,
            notifyMethod: r.notifyMethod,
            handleType: r.handleType,
          }));
          const idx = next.findIndex(
            (item) =>
              item.device === batchDevice && item.eventType === eventTypeCode,
          );
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              levelConfigs: mergeLevelConfigs(
                next[idx].levelConfigs,
                incomingLevelConfigs,
              ),
              effectiveTime,
              pushContent: values.pushContent,
              enabled: true,
              updater: '管理员',
            };
          } else {
            next.unshift({
              id: `cfg_${batchDevice}_${eventTypeCode}_${Date.now()}`,
              device: batchDevice,
              eventType: eventTypeCode,
              eventTypeName: row.eventTypeName,
              levelConfigs: incomingLevelConfigs,
              effectiveTime,
              pushContent: values.pushContent,
              enabled: true,
              updater: '管理员',
            });
          }
        });
        return next;
      });

      message.success(
        `已保存 ${eventTypeMap.size} 条推送配置，共 ${selectedRows.length} 个等级项`,
      );
      setModalOpen(false);
    } catch {
      /* validation */
    }
  };

  const handleListBatchDelete = () => {
    if (selectedListIds.length === 0) {
      message.warning('请先选择要删除的配置');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定删除选中的 ${selectedListIds.length} 条推送配置吗？删除后不可恢复。`,
      okText: '确定删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setData((prev) =>
          prev.filter((item) => !selectedListIds.includes(item.id)),
        );
        setSelectedListIds([]);
        message.success(`已删除 ${selectedListIds.length} 条配置`);
      },
    });
  };

  const openListBatchEdit = () => {
    if (selectedListIds.length === 0) {
      message.warning('请先选择要变更的配置');
      return;
    }
    listBatchForm.resetFields();
    setListBatchEditOpen(true);
  };

  const handleListBatchUpdate = async () => {
    try {
      const values = await listBatchForm.validateFields();
      const {
        targetLevels,
        notifyMethod,
        handleType,
        timeRange,
        pushContent,
        enabled,
      } = values;

      const changesLevelFields = Boolean(notifyMethod || handleType);

      if (
        !notifyMethod &&
        !handleType &&
        !timeRange &&
        !pushContent &&
        enabled === undefined
      ) {
        message.warning('请至少填写一项要变更的内容');
        return;
      }

      if (changesLevelFields && (!targetLevels || targetLevels.length === 0)) {
        message.warning('变更通知方式或处理方式时，请选择事件等级');
        return;
      }

      const levelTargets: (EventLevel | '无等级')[] = targetLevels ?? [];

      setData((prev) =>
        prev.map((item) => {
          if (!selectedListIds.includes(item.id)) return item;
          const next: EventPushConfig = { ...item, updater: '管理员' };

          if (changesLevelFields) {
            next.levelConfigs = item.levelConfigs.map((lc) => {
              const matched =
                lc.level === null
                  ? levelTargets.includes('无等级')
                  : lc.level !== null && levelTargets.includes(lc.level);
              if (!matched) return lc;
              return {
                ...lc,
                ...(notifyMethod ? { notifyMethod } : {}),
                ...(handleType ? { handleType } : {}),
              };
            });
          }
          if (timeRange) {
            next.effectiveTime = `${timeRange[0].format('YYYY-MM-DD HH:mm')} 至 ${timeRange[1].format('YYYY-MM-DD HH:mm')}`;
          }
          if (pushContent) {
            next.pushContent = pushContent;
          }
          if (enabled !== undefined) {
            next.enabled = enabled;
          }
          return next;
        }),
      );

      message.success(`已批量变更 ${selectedListIds.length} 条配置`);
      setListBatchEditOpen(false);
      setSelectedListIds([]);
    } catch {
      /* validation */
    }
  };

  const columns: ColumnsType<EventPushConfig> = [
    {
      title: '序号',
      width: 60,
      align: 'center',
      render: (_v, _r, index) => {
        const current = pagination.current ?? 1;
        const pageSize = pagination.pageSize ?? 10;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: '事件设备',
      dataIndex: 'device',
      width: 120,
    },
    { title: '事件类型', dataIndex: 'eventTypeName', width: 120 },
    {
      title: '事件等级',
      dataIndex: 'levelConfigs',
      width: 120,
      render: (configs: LevelPushConfig[]) => {
        const levels = configs
          .map((c) => c.level)
          .filter((l): l is EventLevel => l !== null);
        return levels.length > 0 ? levels.join(', ') : '-';
      },
    },
    {
      title: '通知方式',
      dataIndex: 'levelConfigs',
      width: 140,
      render: (configs: LevelPushConfig[]) =>
        [...new Set(configs.map((c) => c.notifyMethod))].join(', '),
    },
    {
      title: '生效时间',
      dataIndex: 'effectiveTime',
      width: 220,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled: boolean, record) => (
        <Switch
          checked={enabled}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => {
            setData((prev) =>
              prev.map((item) =>
                item.id === record.id ? { ...item, enabled: checked } : item,
              ),
            );
          }}
        />
      ),
    },
    { title: '更新人', dataIndex: 'updater', width: 90 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_v, record) => (
        <Space size="middle">
          <a onClick={() => openView(record)}>查看</a>
          <a onClick={() => openEdit(record)}>编辑</a>
          <a className="link-danger" onClick={() => handleDelete(record)}>
            删除
          </a>
        </Space>
      ),
    },
  ];

  const isReadonly = modalMode === 'view';
  const isAddMode = modalMode === 'add';
  const batchSupportsLevel = batchDevice
    ? deviceSupportsLevel(batchDevice)
    : false;

  const batchEventGroups = useMemo(() => {
    if (!batchDevice || !batchSupportsLevel) return [];
    const types = EVENT_TYPE_DICT.filter((d) => d.device === batchDevice);
    return types.map((t) => ({
      code: t.code,
      name: t.name,
      rows: batchRows.filter((r) => r.eventTypeCode === t.code),
    }));
  }, [batchDevice, batchRows, batchSupportsLevel]);

  const batchSettingMenuItems: MenuProps['items'] = [
    {
      key: 'level',
      label: '事件等级',
      disabled: !batchSupportsLevel,
    },
    { key: 'notifyMethod', label: '通知方式' },
    { key: 'handleType', label: '处理方式' },
  ];

  const customizedCountInSelection = selectedRowIds.filter((id) =>
    customizedRowIds.includes(id),
  ).length;

  const selectionColumn: ColumnsType<BatchPushRow>[number] = {
    title: (
      <Checkbox
        checked={allRowsSelected}
        indeterminate={someRowsSelected}
        onChange={(e) => toggleSelectAll(e.target.checked)}
      />
    ),
    width: 48,
    align: 'center',
    render: (_v, record) => (
      <Checkbox
        checked={selectedRowIds.includes(record.id)}
        onChange={(e) => toggleRowSelection(record.id, e.target.checked)}
      />
    ),
  };

  const configuredNotifyMethodSelectOptions = useMemo(
    () => configuredNotifyMethods.map((m) => ({ label: m, value: m })),
    [configuredNotifyMethods],
  );

  const notifyMethodColumn = {
    title: '通知方式',
    dataIndex: 'notifyMethod' as const,
    width: 140,
    render: (method: NotifyMethod, record: BatchPushRow) => (
      <Select
        size="small"
        value={method}
        options={notifyMethodOptions}
        onChange={(val) =>
          updateBatchRowManual(record.id, { notifyMethod: val })
        }
      />
    ),
  };

  const handleTypeColumn = {
    title: '预警推送处理方式',
    dataIndex: 'handleType' as const,
    width: 200,
    render: (handleType: HandleType, record: BatchPushRow) => (
      <Select
        size="small"
        value={handleType}
        options={HANDLE_TYPE_OPTIONS}
        onChange={(val) => updateBatchRowManual(record.id, { handleType: val })}
      />
    ),
  };

  const actionColumn = {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center' as const,
    render: (_v: unknown, record: BatchPushRow) =>
      customizedRowIds.includes(record.id) ? (
        <a onClick={() => resetBatchRowToDefault(record)}>重置</a>
      ) : (
        <span className="batch-action-placeholder">-</span>
      ),
  };

  const groupedLevelColumns: ColumnsType<BatchPushRow> = [
    selectionColumn,
    {
      title: '事件等级',
      dataIndex: 'level',
      width: 130,
      render: (level: EventLevel | null, record) => (
        <Space size={6}>
          {level ? <Tag color="blue">{level}</Tag> : '-'}
          <CustomizedBadge visible={customizedRowIds.includes(record.id)} />
        </Space>
      ),
    },
    notifyMethodColumn,
    handleTypeColumn,
    actionColumn,
  ];

  const flatBatchColumns: ColumnsType<BatchPushRow> = [
    selectionColumn,
    {
      title: '事件类型',
      dataIndex: 'eventTypeName',
      width: 180,
      render: (name: string, record) => (
        <Space size={6}>
          <span>{name}</span>
          <CustomizedBadge visible={customizedRowIds.includes(record.id)} />
        </Space>
      ),
    },
    notifyMethodColumn,
    handleTypeColumn,
    actionColumn,
  ];

  return (
    <div className="security-page">
      <div className="security-search-bar">
        <Form form={form} layout="inline" className="security-search-form">
          <Form.Item label="事件设备" name="device">
            <Select
              allowClear
              placeholder="请选择事件设备"
              style={{ width: 160 }}
              options={EVENT_PUSH_DEVICES.map((d) => ({ label: d, value: d }))}
            />
          </Form.Item>
          <Form.Item label="事件类型" name="eventType">
            <Select
              allowClear
              placeholder="请选择"
              style={{ width: 160 }}
              options={EVENT_TYPE_DICT.map((d) => ({
                label: `${d.device} / ${d.name}`,
                value: d.code,
              }))}
            />
          </Form.Item>
          <Form.Item label="事件等级" name="level">
            <Select
              allowClear
              placeholder="请选择"
              style={{ width: 160 }}
              options={EVENT_LEVELS.map((l) => ({ label: l, value: l }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  setSearch(form.getFieldsValue());
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
              >
                搜索
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setSearch({});
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
              >
                清空
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="security-table-card">
        <div className="security-table-toolbar">
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              新增
            </Button>
            <Button
              disabled={selectedListIds.length === 0}
              onClick={openListBatchEdit}
            >
              批量变更
              {selectedListIds.length > 0 ? ` (${selectedListIds.length})` : ''}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedListIds.length === 0}
              onClick={handleListBatchDelete}
            >
              批量删除
              {selectedListIds.length > 0 ? ` (${selectedListIds.length})` : ''}
            </Button>
          </Space>
          <Space size="middle" className="security-table-utils">
            <ReloadOutlined title="刷新" />
            <SettingOutlined title="列设置" />
            <SearchOutlined title="搜索" />
            <FullscreenOutlined title="全屏" />
            <ColumnHeightOutlined title="密度" />
          </Space>
        </div>

        <Table<EventPushConfig>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys: selectedListIds,
            onChange: (keys) => setSelectedListIds(keys as string[]),
          }}
          pagination={{
            ...pagination,
            total: filteredData.length,
            onChange: (page, pageSize) => {
              setPagination((p) => ({ ...p, current: page, pageSize }));
            },
          }}
        />
      </div>

      <Modal
        title={
          modalMode === 'add'
            ? '新增'
            : modalMode === 'edit'
              ? '编辑'
              : '查看'
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={isAddMode ? 920 : 860}
        centered
        destroyOnHidden
        className={`spare-modal${isAddMode ? ' batch-push-modal' : ''}`}
        footer={
          isReadonly
            ? [
                <Button key="close" onClick={() => setModalOpen(false)}>
                  关闭
                </Button>,
              ]
            : isAddMode
              ? [
                  <Button key="cancel" onClick={() => setModalOpen(false)}>
                    取消
                  </Button>,
                  <Button key="save" type="primary" onClick={handleSaveBatch}>
                    保存全部配置
                  </Button>,
                ]
              : [
                  <Button key="cancel" onClick={() => setModalOpen(false)}>
                    取消
                  </Button>,
                  <Button key="save" type="primary" onClick={handleSave}>
                    保存配置
                  </Button>,
                ]
        }
      >
        <Form
          form={modalForm}
          layout="vertical"
          className="spare-modal-form"
          disabled={isReadonly}
        >
          {isAddMode ? (
            <>
              <Form.Item
                label="事件设备"
                name="device"
                className="batch-push-device-row"
                rules={[{ required: true, message: '请选择事件设备' }]}
              >
                <Select
                  placeholder="请选择事件设备"
                  style={{ width: 360 }}
                  options={EVENT_PUSH_DEVICES.map((d) => ({
                    label: d,
                    value: d,
                  }))}
                  onChange={(val) => handleBatchDeviceChange(val)}
                />
              </Form.Item>

              {batchDevice && batchRows.length > 0 && (
                <div className="batch-push-toolbar">
                  <Checkbox
                    checked={allRowsSelected}
                    indeterminate={someRowsSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  >
                    全选
                  </Checkbox>
                  <span className="batch-push-selected-count">
                    已选 {selectedRowIds.length} / {batchRows.length} 项
                  </span>
                  {configuredNotifyMethods.length === 0 && (
                    <span className="batch-push-notify-hint">
                      请先在「通知方式配置」中添加钉钉机器人或企业微信
                    </span>
                  )}
                  <Dropdown
                    menu={{
                      items: batchSettingMenuItems,
                      onClick: ({ key }) =>
                        openBatchSetting(key as BatchField),
                    }}
                    trigger={['click']}
                  >
                    <Button type="primary" icon={<SettingOutlined />}>
                      批量设置 <DownOutlined />
                    </Button>
                  </Dropdown>
                </div>
              )}

              {batchDevice && batchRows.length > 0 ? (
                <div className="batch-push-config-body">
                  {batchSupportsLevel ? (
                    <Collapse
                      className="batch-push-group-collapse"
                      defaultActiveKey={batchEventGroups.map((g) => g.code)}
                      items={batchEventGroups.map((group) => ({
                        key: group.code,
                        label: (
                          <div
                            className="batch-group-label"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isGroupAllSelected(group.code)}
                              indeterminate={isGroupIndeterminate(group.code)}
                              onChange={(e) =>
                                toggleGroupSelection(
                                  group.code,
                                  e.target.checked,
                                )
                              }
                            />
                            <span className="batch-group-label-text">
                              {group.name}
                            </span>
                            <span className="batch-group-label-count">
                              {group.rows.length} 项
                            </span>
                          </div>
                        ),
                        children: (
                          <Table<BatchPushRow>
                            rowKey="id"
                            size="small"
                            className="batch-push-inner-table"
                            columns={groupedLevelColumns}
                            dataSource={group.rows}
                            pagination={false}
                          />
                        ),
                      }))}
                    />
                  ) : (
                    <div className="batch-push-table-wrap">
                      <Table<BatchPushRow>
                        rowKey="id"
                        size="small"
                        columns={flatBatchColumns}
                        dataSource={batchRows}
                        pagination={false}
                        scroll={{ y: 280 }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="batch-push-empty">
                  {batchDevice
                    ? '该设备下暂无事件类型'
                    : '请先选择事件设备，勾选需要新增的事件类型与等级后保存'}
                </div>
              )}

              <div className="batch-push-common">
                <div className="batch-push-common-title">公共配置</div>
                <Form.Item label="生效时间" name="timeRange">
                  <RangePicker showTime style={{ width: '100%' }} />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="推送内容"
                      name="pushContent"
                      rules={[{ required: true, message: '请输入推送内容' }]}
                    >
                      <TextArea rows={4} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="消息预览">
                      <TextArea rows={4} value={PUSH_PREVIEW} readOnly />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </>
          ) : (
            <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="事件设备"
                name="device"
                rules={[{ required: true, message: '请选择事件设备' }]}
              >
                <Select
                  placeholder="请选择事件设备"
                  options={EVENT_PUSH_DEVICES.map((d) => ({ label: d, value: d }))}
                  onChange={(val) => {
                    setSelectedDevice(val);
                    modalForm.setFieldValue('eventType', undefined);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="事件类型"
                name="eventType"
                rules={[{ required: true, message: '请选择事件类型' }]}
              >
                <Select
                  placeholder="请选择事件类型"
                  options={eventTypeOptions}
                  disabled={!selectedDevice && !modalForm.getFieldValue('device')}
                />
              </Form.Item>
            </Col>
          </Row>

          {levelConfigs.map((config, index) => {
            const usedLevels = levelConfigs
              .filter((c) => c.id !== config.id)
              .map((c) => c.level);
            return (
              <div key={config.id} className="level-config-block">
                <div className="level-config-block-head">
                  <span className="level-config-block-title">
                    等级配置 {index + 1}
                  </span>
                  {levelConfigs.length > 1 && !isReadonly && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeLevelConfig(config.id)}
                    >
                      删除
                    </Button>
                  )}
                </div>
                <Form.Item label="事件等级" required>
                  <Radio.Group
                    value={config.level}
                    disabled={isReadonly}
                    onChange={(e) => {
                      const newLevel = e.target.value as EventLevel;
                      if (usedLevels.includes(newLevel)) {
                        message.warning('该事件等级已配置，不可重复选择');
                        return;
                      }
                      updateLevelConfig(config.id, { level: newLevel });
                    }}
                    options={EVENT_LEVELS.map((l) => ({
                      label: l,
                      value: l,
                      disabled: usedLevels.includes(l),
                    }))}
                  />
                </Form.Item>
                <Form.Item label="通知方式" required>
                  <Radio.Group
                    value={config.notifyMethod}
                    disabled={isReadonly}
                    onChange={(e) =>
                      updateLevelConfig(config.id, {
                        notifyMethod: e.target.value as NotifyMethod,
                      })
                    }
                    options={notifyMethodOptions}
                  />
                </Form.Item>
                <Form.Item label="报警推送处理方式" required>
                  <Radio.Group
                    value={config.handleType}
                    disabled={isReadonly}
                    onChange={(e) =>
                      updateLevelConfig(config.id, {
                        handleType: e.target.value as HandleType,
                      })
                    }
                  >
                    <Radio value="simple">
                      简易工单处理(填写处理建议说明即可闭环)
                    </Radio>
                    <Radio value="full">
                      完整工单处理(需要派单、审核、接单、报修、关单等完整流程使用)
                    </Radio>
                    <Radio value="remind">仅消息提醒，无需工单</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
            );
          })}

          {!isReadonly && (
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              className="add-level-config-btn"
              onClick={addLevelConfig}
              disabled={levelConfigs.length >= EVENT_LEVELS.length}
            >
              + 其他等级配置
            </Button>
          )}

          <Form.Item label="生效时间" name="timeRange" style={{ marginTop: 16 }}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="推送内容"
                name="pushContent"
                rules={[{ required: true, message: '请输入推送内容' }]}
              >
                <TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="消息预览">
                <TextArea rows={4} value={PUSH_PREVIEW} readOnly />
              </Form.Item>
            </Col>
          </Row>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title={
          batchSettingField === 'level'
            ? '批量设置 - 事件等级'
            : batchSettingField === 'notifyMethod'
              ? '批量设置 - 通知方式'
              : '批量设置 - 处理方式'
        }
        open={batchSettingOpen}
        onCancel={() => setBatchSettingOpen(false)}
        onOk={handleBatchSettingApply}
        okText="应用"
        cancelText="取消"
        destroyOnHidden
        width={420}
        centered
        className="spare-modal"
      >
        {batchSettingField === 'level' && (
          <Select
            style={{ width: '100%' }}
            value={batchSettingValue as EventLevel}
            options={EVENT_LEVELS.map((l) => ({ label: l, value: l }))}
            onChange={setBatchSettingValue}
          />
        )}
        {batchSettingField === 'notifyMethod' && (
          <Select
            style={{ width: '100%' }}
            value={batchSettingValue as NotifyMethod}
            options={configuredNotifyMethodSelectOptions}
            onChange={setBatchSettingValue}
          />
        )}
        {batchSettingField === 'handleType' && (
          <Select
            style={{ width: '100%' }}
            value={batchSettingValue as HandleType}
            options={HANDLE_TYPE_OPTIONS}
            onChange={setBatchSettingValue}
          />
        )}
        <div className="batch-setting-hint">
          将应用到已选中的 {selectedRowIds.length} 行
        </div>
      </Modal>

      <Modal
        title="批量设置确认"
        open={batchConfirmOpen}
        onCancel={() => setBatchConfirmOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setBatchConfirmOpen(false)}>
            取消
          </Button>,
          <Button
            key="skip"
            onClick={() => applyBatchSetting('skipCustom')}
          >
            跳过自定义行
          </Button>,
          <Button
            key="all"
            type="primary"
            onClick={() => applyBatchSetting('all')}
          >
            全部覆盖
          </Button>,
        ]}
        destroyOnHidden
        width={440}
        centered
        className="spare-modal"
      >
        <p>
          选中的 {selectedRowIds.length} 行中有{' '}
          <strong>{customizedCountInSelection}</strong>{' '}
          行已自定义，请选择处理方式：
        </p>
      </Modal>

      <Modal
        title={`批量变更${selectedListIds.length > 0 ? `（${selectedListIds.length} 条）` : ''}`}
        open={listBatchEditOpen}
        onCancel={() => setListBatchEditOpen(false)}
        onOk={handleListBatchUpdate}
        okText="确认变更"
        cancelText="取消"
        destroyOnHidden
        width={560}
        centered
        className="spare-modal"
      >
        <p className="list-batch-edit-hint">
          通知方式、处理方式按所选事件等级分别变更；生效时间、推送内容、状态作用于整条配置。留空表示不修改。
        </p>
        <Form form={listBatchForm} layout="vertical" className="spare-modal-form">
          <Form.Item
            label="事件等级"
            name="targetLevels"
            extra="变更通知方式或处理方式时必选，仅更新对应等级的配置"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择要变更的等级"
              options={[
                ...EVENT_LEVELS.map((l) => ({ label: l, value: l })),
                { label: '无等级', value: '无等级' },
              ]}
            />
          </Form.Item>
          <Form.Item label="通知方式" name="notifyMethod">
            <Select
              allowClear
              placeholder="不修改"
              options={notifyMethodOptions}
            />
          </Form.Item>
          <Form.Item label="预警推送处理方式" name="handleType">
            <Select
              allowClear
              placeholder="不修改"
              options={HANDLE_TYPE_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="生效时间" name="timeRange">
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="推送内容" name="pushContent">
            <TextArea rows={3} placeholder="留空表示不修改" />
          </Form.Item>
          <Form.Item label="状态" name="enabled">
            <Select
              allowClear
              placeholder="不修改"
              options={[
                { label: '启用', value: true },
                { label: '禁用', value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
