import { useEffect, useMemo, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  Button,
  Calendar,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  TimePicker,
  TreeSelect,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { MidPlatformMeetingRoom } from '../../../../../types/midPlatformMeetingRoom';
import {
  collectPersons,
  meetingParticipantTree,
  type ParticipantNode,
} from '../../../../../data/mockMeetingParticipants';
import {
  buildSlotsFromTimeRange,
  getRecurringCalendarEvents,
  getReservationDayBlocks,
  getReservationTimelineDate,
  isTimeRangeConflict,
} from '../../../../../data/mockMeetingReservationSchedule';
import {
  findRecurringConflictDates,
  formatRecurringConflictMessage,
} from '../../../../../data/recurringMeetingSchedule';
import {
  submitRecurringMeeting,
  submitStandardMeeting,
  ReservationLimitError,
} from '../../../../../data/meetingSubmissionStore';
import { WEEKDAY_OPTIONS } from '../../../../mini-program/meeting-room/MeetingRoomBook';
import MeetingReservationStatusTimeline from './MeetingReservationStatusTimeline';

interface MeetingReservationCreateModalProps {
  open: boolean;
  room: MidPlatformMeetingRoom | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const CHECK_IN_OPTIONS = [
  { label: '不提前签到', value: 'none' },
  { label: '提前15分钟', value: '15m' },
  { label: '提前30分钟', value: '30m' },
  { label: '提前45分钟', value: '45m' },
  { label: '提前一个小时', value: '1h' },
  { label: '提前两个小时', value: '2h' },
];

const RECURRENCE_WEEKDAY_OPTIONS = [
  { label: '每天', value: 0 },
  ...WEEKDAY_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
];

const MEETING_REQUIREMENT_PLACEHOLDER =
  '请填写所需茶水与设备(灯光/投影仪/签到台/音响/茶水/水果/点心/茶歇/无线话筒/有线话筒/电池/矿泉水)';

interface ParticipantTreeOption {
  value: string;
  title: string;
  disabled?: boolean;
  children?: ParticipantTreeOption[];
}

function toParticipantTreeData(nodes: ParticipantNode[]): ParticipantTreeOption[] {
  return nodes.map((node) => ({
    value: node.id,
    title: node.name,
    disabled: node.type !== 'person',
    children: node.children ? toParticipantTreeData(node.children) : undefined,
  }));
}

function resolveRecurrenceWeekdays(values: number[]): number[] {
  if (values.includes(0)) {
    return [1, 2, 3, 4, 5, 6, 7];
  }
  return values.filter((value) => value >= 1 && value <= 7);
}

export default function MeetingReservationCreateModal({
  open,
  room,
  onCancel,
  onSuccess,
}: MeetingReservationCreateModalProps) {
  const [form] = Form.useForm();
  const [bookingType, setBookingType] = useState<'standard' | 'recurring'>('standard');
  const [calendarMonth, setCalendarMonth] = useState(dayjs());

  const participantTreeData = useMemo(() => toParticipantTreeData(meetingParticipantTree), []);
  const allPersons = useMemo(() => collectPersons(meetingParticipantTree), []);

  useEffect(() => {
    if (!open || !room) return;
    const today = dayjs();
    form.setFieldsValue({
      roomLabel: room.roomNo,
      meetingDate: today,
      startTime: dayjs('11:00', 'HH:mm'),
      endTime: dayjs('11:30', 'HH:mm'),
      dateRange: [today, today.add(30, 'day')],
      recurrenceWeekdays: [1, 2, 3, 4, 5],
      checkInTime: 'none',
      booker: 'admin',
      requirements: '',
    });
    setBookingType('standard');
    setCalendarMonth(today);
  }, [open, room, form]);

  const meetingDate = Form.useWatch('meetingDate', form) as Dayjs | undefined;
  const startTime = Form.useWatch('startTime', form) as Dayjs | undefined;
  const endTime = Form.useWatch('endTime', form) as Dayjs | undefined;
  const dateRange = Form.useWatch('dateRange', form) as [Dayjs, Dayjs] | undefined;

  const dateKey = meetingDate?.format('YYYY-MM-DD') ?? getReservationTimelineDate();
  const startTimeStr = startTime?.format('HH:mm') ?? '';
  const endTimeStr = endTime?.format('HH:mm') ?? '';

  const conflictBlock = useMemo(() => {
    if (!room || !startTimeStr || !endTimeStr || bookingType !== 'standard') return undefined;
    return isTimeRangeConflict(getReservationDayBlocks(room.id, dateKey), startTimeStr, endTimeStr);
  }, [room, dateKey, startTimeStr, endTimeStr, bookingType]);

  const calendarEvents = useMemo(() => {
    if (!room) return [];
    return getRecurringCalendarEvents(room.id, calendarMonth);
  }, [room, calendarMonth]);

  const submitRecurring = (values: Record<string, unknown>) => {
    if (!room) return;
    const [startDate, endDate] = values.dateRange as [Dayjs, Dayjs];
    const start = (values.startTime as Dayjs).format('HH:mm');
    const end = (values.endTime as Dayjs).format('HH:mm');
    const rawWeekdays = (values.recurrenceWeekdays as number[]) ?? [];
    const weekdays = resolveRecurrenceWeekdays(rawWeekdays);
    const weekdayLabels = rawWeekdays.includes(0)
      ? '每天'
      : WEEKDAY_OPTIONS.filter((item) => weekdays.includes(item.value))
          .map((item) => item.label)
          .join('、');
    const selectedSlots = buildSlotsFromTimeRange('recurring', start, end);

    const conflictDates = findRecurringConflictDates(
      room.id,
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
      weekdays,
      selectedSlots,
    );

    const doSubmit = () => {
      try {
        submitRecurringMeeting({
          roomId: room.id,
          roomName: room.roomNo,
          address: room.address,
          title: values.title as string,
          description: values.requirements as string,
          recurrenceStartDate: startDate.format('YYYY-MM-DD'),
          recurrenceEndDate: endDate.format('YYYY-MM-DD'),
          recurrenceWeekdays: weekdays,
          recurrenceWeekdaysLabel: weekdayLabels,
          selectedSlots,
        });
        message.success('周期预约提交成功');
        onSuccess();
      } catch (error) {
        if (error instanceof ReservationLimitError) {
          message.error(error.message);
          return;
        }
        throw error;
      }
    };

    if (conflictDates.length > 0) {
      Modal.confirm({
        title: '周期预约提示',
        content: formatRecurringConflictMessage(conflictDates, room.roomNo),
        okText: '继续提交',
        cancelText: '取消',
        onOk: doSubmit,
      });
      return;
    }

    doSubmit();
  };

  const handleSubmit = async () => {
    if (!room) return;
    try {
      const values = await form.validateFields();
      const participantIds = (values.participants as string[]) ?? [];
      const participantNames = participantIds
        .map((id) => allPersons.find((p) => p.id === id)?.name)
        .filter(Boolean)
        .join('、');

      if (bookingType === 'standard') {
        const date = (values.meetingDate as Dayjs).format('YYYY-MM-DD');
        const start = (values.startTime as Dayjs).format('HH:mm');
        const end = (values.endTime as Dayjs).format('HH:mm');

        if (
          (values.startTime as Dayjs).isAfter(values.endTime as Dayjs) ||
          (values.startTime as Dayjs).isSame(values.endTime as Dayjs)
        ) {
          message.warning('开始时间必须早于结束时间');
          return;
        }

        const selectedSlots = buildSlotsFromTimeRange(date, start, end);
        try {
          submitStandardMeeting({
            roomId: room.id,
            roomName: room.roomNo,
            address: room.address,
            title: values.title as string,
            description: values.requirements as string,
            selectedSlots,
            activeDate: date,
            participants: participantNames,
            participantCount: participantIds.length,
          });
        } catch (error) {
          if (error instanceof ReservationLimitError) {
            message.error(error.message);
            return;
          }
          throw error;
        }
        message.success('预约提交成功');
        onSuccess();
        return;
      }

      if (
        (values.startTime as Dayjs).isAfter(values.endTime as Dayjs) ||
        (values.startTime as Dayjs).isSame(values.endTime as Dayjs)
      ) {
        message.warning('开始时间必须早于结束时间');
        return;
      }

      submitRecurring(values);
    } catch {
      /* validation */
    }
  };

  if (!room) return null;

  return (
    <Modal
      title="创建预约"
      open={open}
      onCancel={onCancel}
      width={920}
      destroyOnHidden
      className="mid-platform-meeting-reservation-modal"
      footer={
        <div className="meeting-room-modal-footer">
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleSubmit}>
            提交
          </Button>
        </div>
      }
    >
      <div className="meeting-reservation-type-tabs">
        <Radio.Group
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="standard">标准预约</Radio.Button>
          <Radio.Button value="recurring">周期预约</Radio.Button>
        </Radio.Group>
      </div>

      <Form form={form} layout="vertical" className="meeting-reservation-create-form">
        <Form.Item label="会议室" name="roomLabel">
          <Input readOnly />
        </Form.Item>

        <Form.Item
          label="会议主题"
          name="title"
          rules={[{ required: true, message: '请输入 会议主题' }]}
          required
        >
          <Input placeholder="请输入 会议主题" maxLength={50} showCount />
        </Form.Item>

        {bookingType === 'standard' ? (
          <>
            <Form.Item label="签到时间" name="checkInTime">
              <Select options={CHECK_IN_OPTIONS} />
            </Form.Item>
            <div className="meeting-reservation-inline-row">
              <Form.Item
                label="会议日期"
                name="meetingDate"
                rules={[{ required: true, message: '请选择 会议日期' }]}
                required
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="开始时间"
                name="startTime"
                rules={[{ required: true, message: '请选择 开始时间' }]}
                required
              >
                <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="结束时间"
                name="endTime"
                rules={[{ required: true, message: '请选择 结束时间' }]}
                required
                help={
                  conflictBlock ? (
                    <span className="meeting-reservation-conflict-hint">
                      您时间点可能与{conflictBlock.title}冲突
                    </span>
                  ) : undefined
                }
              >
                <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item label="查询状态">
              <MeetingReservationStatusTimeline
                roomId={room.id}
                dateKey={dateKey}
                startTime={startTimeStr}
                endTime={endTimeStr}
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              label="开始/结束日期"
              name="dateRange"
              rules={[{ required: true, message: '请选择 开始/结束日期' }]}
              required
            >
              <DatePicker.RangePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="重复周期"
              name="recurrenceWeekdays"
              rules={[{ required: true, message: '请选择 重复周期' }]}
              required
            >
              <Checkbox.Group options={RECURRENCE_WEEKDAY_OPTIONS} />
            </Form.Item>
            <Form.Item label="时间选择" required className="meeting-reservation-time-select">
              <div className="meeting-reservation-inline-row meeting-reservation-time-row">
                <Form.Item
                  name="startTime"
                  rules={[{ required: true, message: '请选择 开始时间' }]}
                  noStyle
                >
                  <TimePicker format="HH:mm" minuteStep={15} placeholder="开始时间" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  name="endTime"
                  rules={[{ required: true, message: '请选择 结束时间' }]}
                  noStyle
                >
                  <TimePicker format="HH:mm" minuteStep={15} placeholder="结束时间" style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item label="全天状态">
              <MeetingReservationStatusTimeline
                roomId={room.id}
                dateKey={dateRange?.[0]?.format('YYYY-MM-DD') ?? dateKey}
                startTime={startTimeStr}
                endTime={endTimeStr}
              />
            </Form.Item>
            <Form.Item label="月历">
              <Calendar
                fullscreen={false}
                value={calendarMonth}
                onPanelChange={(value) => setCalendarMonth(value)}
                cellRender={(current, info) => {
                  if (info.type !== 'date') return info.originNode;
                  const dayEvents = calendarEvents.filter(
                    (event) => event.date === current.format('YYYY-MM-DD'),
                  );
                  if (dayEvents.length === 0) return info.originNode;
                  return (
                    <div className="meeting-reservation-calendar-cell">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={`${event.date}-${event.start}-${event.title}`}
                          className="meeting-reservation-calendar-event"
                        >
                          {event.start}-{event.end} {event.title}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="参会人员"
          name="participants"
          rules={[{ required: true, message: '请选择 参会人员' }]}
          required
        >
          <TreeSelect
            treeData={participantTreeData}
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            placeholder="请选择 参会人员"
            style={{ width: '100%' }}
            maxTagCount="responsive"
          />
        </Form.Item>
        <Form.Item label="预约人" name="booker">
          <Input readOnly />
        </Form.Item>
        <Form.Item
          label={bookingType === 'standard' ? '会议需求' : '会议内容'}
          name="requirements"
          rules={[
            {
              required: true,
              message: bookingType === 'standard' ? '请填写 会议需求' : '请填写 会议内容',
            },
          ]}
          required
        >
          <Input.TextArea
            rows={4}
            maxLength={200}
            showCount
            placeholder={MEETING_REQUIREMENT_PLACEHOLDER}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
