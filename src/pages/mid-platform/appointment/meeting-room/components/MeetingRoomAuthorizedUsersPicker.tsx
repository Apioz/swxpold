import { useMemo, useState } from 'react';
import { Input, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { MeetingRoomPermissionNode } from '../../../../../types/midPlatformMeetingRoom';
import {
  filterMeetingRoomPermissionTree,
  meetingRoomPermissionTree,
} from '../../../../../data/mockMidPlatformMeetingRooms';

interface MeetingRoomAuthorizedUsersPickerProps {
  value?: string[];
  onChange?: (userIds: string[]) => void;
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

export default function MeetingRoomAuthorizedUsersPicker({
  value = [],
  onChange,
}: MeetingRoomAuthorizedUsersPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const treeData = useMemo(
    () => toTreeData(filterMeetingRoomPermissionTree(meetingRoomPermissionTree, keyword)),
    [keyword],
  );

  return (
    <div className="mid-platform-permission-users-inline">
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
        checkedKeys={value}
        onCheck={(keys) => onChange?.(keys as string[])}
        className="mid-platform-permission-tree"
      />
    </div>
  );
}
