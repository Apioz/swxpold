import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';
import {
  countAllPersons,
  filterParticipantTree,
  getPersonIdsUnderNode,
  meetingParticipantTree,
  type ParticipantNode,
} from '../../../data/mockMeetingParticipants';
import '../components/MiniProgramCommon.css';
import './MeetingRoom.css';

interface ParticipantPickerLocationState {
  selectedIds?: string[];
  bookDraft?: unknown;
}

interface TreeNodeProps {
  node: ParticipantNode;
  depth: number;
  expanded: Record<string, boolean>;
  selectedIds: Set<string>;
  searchKeyword: string;
  onToggleExpand: (id: string) => void;
  onToggleNode: (node: ParticipantNode) => void;
}

function TreeNode({
  node,
  depth,
  expanded,
  selectedIds,
  searchKeyword,
  onToggleExpand,
  onToggleNode,
}: TreeNodeProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = searchKeyword ? true : expanded[node.id];
  const personIds = getPersonIdsUnderNode(node);
  const selectedCount = personIds.filter((id) => selectedIds.has(id)).length;
  const isChecked = personIds.length > 0 && selectedCount === personIds.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < personIds.length;

  return (
    <>
      <div
        className={`mp-participant-node mp-participant-node--${node.type}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={`mp-participant-expand${isExpanded ? ' mp-participant-expand--open' : ''}`}
            onClick={() => onToggleExpand(node.id)}
            aria-label={isExpanded ? '收起' : '展开'}
          >
            ›
          </button>
        ) : (
          <span className="mp-participant-expand mp-participant-expand--placeholder" />
        )}

        <label className="mp-participant-check">
          <input
            type="checkbox"
            checked={isChecked}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
            onChange={() => onToggleNode(node)}
          />
          <span className="mp-participant-check-box" />
        </label>

        <span className={`mp-participant-icon mp-participant-icon--${node.type}`} aria-hidden />

        <button type="button" className="mp-participant-label" onClick={() => onToggleNode(node)}>
          {node.name}
        </button>
      </div>

      {hasChildren && isExpanded && node.children!.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          selectedIds={selectedIds}
          searchKeyword={searchKeyword}
          onToggleExpand={onToggleExpand}
          onToggleNode={onToggleNode}
        />
      ))}
    </>
  );
}

export default function MeetingParticipantPicker() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state ?? {}) as ParticipantPickerLocationState;
  const totalCount = countAllPersons();

  const [keyword, setKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(locationState.selectedIds ?? []),
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    'company-0': true,
    'dept-0-0': true,
  }));

  const filteredTree = useMemo(
    () => filterParticipantTree(meetingParticipantTree, keyword),
    [keyword],
  );

  const handleToggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleNode = (node: ParticipantNode) => {
    const personIds = getPersonIdsUnderNode(node);
    const allSelected = personIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        personIds.forEach((id) => next.delete(id));
      } else {
        personIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleClearSearch = () => setKeyword('');

  const handleSubmit = () => {
    if (!roomId) return;
    navigate(`/mini-program/meeting-room/book/${roomId}`, {
      state: {
        fromParticipantPicker: true,
        selectedIds: Array.from(selectedIds),
        bookDraft: locationState.bookDraft,
      },
    });
  };

  const handleBack = () => {
    if (!roomId) {
      navigate(-1);
      return;
    }
    navigate(`/mini-program/meeting-room/book/${roomId}`, {
      state: {
        fromParticipantPicker: true,
        selectedIds: Array.from(selectedIds),
        bookDraft: locationState.bookDraft,
      },
    });
  };

  return (
    <div className="mp-page mp-participant-page">
      <div className="mp-participant-nav">
        <button type="button" className="mp-participant-nav-back" onClick={handleBack} aria-label="返回">
          ‹
        </button>
        <span className="mp-participant-nav-title">添加参会人</span>
        <span className="mp-participant-nav-actions">
          <span className="mp-participant-nav-dot">⋯</span>
          <span className="mp-participant-nav-circle" />
        </span>
      </div>

      <div className="mp-participant-search-wrap">
        <div className="mp-participant-search">
          <SearchOutlined className="mp-participant-search-icon" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="请输入姓名"
            className="mp-participant-search-input"
          />
        </div>
        <button type="button" className="mp-participant-search-clear" onClick={handleClearSearch}>
          清空
        </button>
      </div>

      <div className="mp-page-scroll mp-participant-scroll">
        <div className="mp-participant-tree-card">
          {filteredTree.length === 0 ? (
            <div className="mp-empty-tip">未找到匹配的参会人</div>
          ) : (
            filteredTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                expanded={expanded}
                selectedIds={selectedIds}
                searchKeyword={keyword}
                onToggleExpand={handleToggleExpand}
                onToggleNode={handleToggleNode}
              />
            ))
          )}
        </div>
      </div>

      <div className="mp-participant-footer">
        <div className="mp-participant-footer-count">
          已选择: {selectedIds.size}/{totalCount}
        </div>
        <button type="button" className="mp-btn-primary mp-participant-submit" onClick={handleSubmit}>
          提交
        </button>
      </div>
    </div>
  );
}
