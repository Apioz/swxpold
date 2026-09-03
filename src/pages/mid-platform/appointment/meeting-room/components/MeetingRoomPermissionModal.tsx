import { useEffect, useMemo, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Radio, Space, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { MeetingRoomPermissionNode } from '../../../../../types/midPlatformMeetingRoom';
import {
  filterMeetingRoomPermissionTree,
  meetingRoomPermissionTree,
} from '../../../../../data/mockMidPlatformMeetingRooms';

interface MeetingRoomPermissionModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function toTreeData(nodes: MeetingRoomPermissionNode[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.name,
    children: node.children ? toTreeData(node.children) : undefined,
    disableCheckbox: node.type !== 'person',
    selectable: false,
  }));
}

export default function MeetingRoomPermissionModal({
  open,
  onCancel,
  onSubmit,
}: MeetingRoomPermissionModalProps) {
  const [usagePermission, setUsagePermission] = useState<'unlimited' | 'restricted'>('restricted');
  const [keyword, setKeyword] = useState('');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setExpandedKeys([]);
  }, [open]);

  const treeData = useMemo(
    () => toTreeData(filterMeetingRoomPermissionTree(meetingRoomPermissionTree, keyword)),
    [keyword],
  );

  return (
    <Modal
      title="设置使用权限"
      open={open}
      onCancel={onCancel}
      width={720}
      destroyOnHidden
      footer={
        <Space>
          <Button type="primary" icon={<CheckOutlined />} onClick={onSubmit}>
            提交
          </Button>
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            取消
          </Button>
        </Space>
      }
      className="mid-platform-meeting-room-modal"
    >
      <div className="mid-platform-permission-form">
        <div className="mid-platform-permission-row">
          <span className="mid-platform-permission-label">使用权限</span>
          <Radio.Group
            value={usagePermission}
            onChange={(e) => setUsagePermission(e.target.value)}
          >
            <Radio value="unlimited">不限</Radio>
            <Radio value="restricted">限制人群使用</Radio>
          </Radio.Group>
        </div>
        {usagePermission === 'restricted' && (
          <div className="mid-platform-permission-row mid-platform-permission-users">
            <span className="mid-platform-permission-label">授权用户</span>
            <div className="mid-platform-permission-tree-wrap">
              <Input
                placeholder="请输入用户名搜索"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
                className="mid-platform-permission-search"
              />
              <Tree
                checkable
                treeData={treeData}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys as string[])}
                checkedKeys={checkedKeys}
                onCheck={(keys) => setCheckedKeys(keys as string[])}
                className="mid-platform-permission-tree"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
