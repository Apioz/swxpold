# 会议室预约与流程配置 PRD

> 版本：基于当前代码库（2026-09-07）  
> 范围：运营管理中台 · 会议室列表/预约、PC 中台 · 流程配置、小程序 · 会议室预约模块  
> **不含**：楼层平面图相关功能（该能力尚未定稿，本文档与 PRD 均不描述）

---

## 1. 文档概述

### 1.1 背景

生物芯片智能会议预约系统包含三个前端入口：

| 平台 | 路由前缀 | 职责 |
|------|----------|------|
| **PC 中台（MainLayout）** | `/` | 系统级配置：流程配置（审核流程 + 预约占用限制） |
| **运营管理中台（MidPlatformLayout）** | `/mid-platform` | 会议室台账、会议预约运营、人员管理等 |
| **小程序（MiniProgramLayout）** | `/mini-program` | 终端用户预约、我的预约、会议审核 |

### 1.2 核心设计原则

- **审核流程**：控制「能不能约、谁来审」
- **预约占用限制**：控制「约多久、约多频繁、约多少间」，与审核流程互补
- **流程配置仅存在于 PC 中台**（`/system/audit-flow`），运营管理中台**不包含**审批/流程配置菜单
- 已移除顶层「自动审批」模式；审批方式统一为**指定人员**或**动态人员（会议室管理员）**
- **会议室管理员申请自动通过**：非免审，管理员仍需正常提交，系统根据规则自动将预约置为已通过

---

## 2. 平台与菜单结构

### 2.1 PC 中台（MainLayout）

```
系统管理
└── 流程配置          /system/audit-flow
    ├── Tab：审核流程配置
    └── Tab：预约占用限制配置   (?tab=reservation-limit)
```

- `/system/reservation-limits` 重定向至 `/system/audit-flow?tab=reservation-limit`

### 2.2 运营管理中台（MidPlatformLayout）

```
预约管理
└── 会议室管理
    ├── 会议室报表      /mid-platform/appointment/meeting-rooms/report   （占位）
    ├── 会议室列表      /mid-platform/appointment/meeting-rooms/list
    ├── 会议预约        /mid-platform/appointment/meeting-rooms/reservations
    ├── 会议审核        /mid-platform/appointment/meeting-rooms/audit   （占位）
    └── 会议记录        /mid-platform/appointment/meeting-rooms/records  （占位）
```

### 2.3 小程序

```
/mini-program/meeting-room              会议室首页
/mini-program/meeting-room/list         会议室列表（树形）
/mini-program/meeting-room/book/:roomId 预约填写
/mini-program/meeting-room/book/:roomId/participants  参会人选择
/mini-program/meeting-room/reservation/:id  预约详情
/mini-program/meeting-room/my-reservations  我的预约
/mini-program/meeting-room/audit        会议审核
```

---

## 3. 运营管理中台 · 会议室列表

**页面路径**：`/mid-platform/appointment/meeting-rooms/list`  
**数据源**：`meetingRoomStore`（持久化 key：`sw.meeting-rooms-v1`）

### 3.1 列表查询

| 筛选项 | 说明 |
|--------|------|
| 楼栋 | 下拉，选项来自 `MEETING_ROOM_BUILDING_OPTIONS` |
| 会议室编号 | 模糊包含 |
| 会议室名称 | 模糊包含 |
| 状态 | 启用 / 禁用 / 空闲 |

支持搜索、重置、分页（10/20/50/100）。

### 3.2 列表字段

| 列 | 字段 | 说明 |
|----|------|------|
| # | 序号 | 分页序号 |
| 会议室编号 | roomNo | |
| 会议室名称 | name | |
| 地址 | address | 带定位图标 |
| 空间位置 | spaceLocation | 级联路径文本，如「楼栋 / 楼层 / 房间」 |
| 面积 | area | 单位 m² |
| 容纳人数 | capacity | 单位 人 |
| 设备 | equipment | Tag 展示：投影仪 / 白板 / 麦克风 |
| 预约屏设备 | screenDevice | |
| 状态 | status | 禁用(灰) / 启用(绿) / 空闲(蓝) |

### 3.3 操作

| 操作 | 行为 |
|------|------|
| 查看 | 打开 `MeetingRoomViewModal`，只读展示全部字段 |
| 编辑 | 打开 `MeetingRoomFormModal`（edit 模式） |
| 删除 | 二次确认后从 store 移除 |
| 设置使用权限 | 打开 `MeetingRoomPermissionModal`（列表页入口为演示，确认后 toast） |
| 人员通行记录 | 打开 `MeetingRoomAccessRecordModal`（演示数据） |

### 3.4 新增/编辑表单（MeetingRoomFormModal）

#### 3.4.1 基本信息

| 字段 | 必填 | 说明 |
|------|------|------|
| 空间位置 | 是 | 三级级联（楼栋→楼层→房间），选完后自动填充 address、building |
| 地址 | 是 | 可手动改 |
| 会议室编号 | 是 | roomNo |
| 会议室名称 | 是 | name |
| 面积 | 是 | m²，数字 |
| 容纳人数 | 是 | 人，数字 |

#### 3.4.2 封面（全景图）

- 可选；从文档中心选取或本地上传
- 保存至 `cover: MeetingRoomCoverSelection`（imageId、imageUrl、documentPath、building、floor 等）
- **小程序列表卡片展示该封面缩略图**（`MeetingRoomPhoto` 组件）

> 楼层平面图、点位设置存在于代码中但**不在本 PRD 范围**，且小程序 PRD 不涉及平面图 Tab。

#### 3.4.3 预约配置

| 字段 | 说明 |
|------|------|
| **状态** | `disabled` 禁用：不可预约；`enabled` 启用：按使用权限管控；`idle` 空闲：不限制人员进出，任何人都可通过扫脸开启使用 |
| **使用权限** | `unlimited` 不限；`restricted` 限制人群使用（须选授权用户） |
| **授权用户** | `restricted` 时至少 1 人，通过 `MeetingRoomPermissionModal` 组织树选择 |
| **设备** | 多选：投影仪、白板、麦克风 |
| **预约屏设备** | 下拉，选项来自 `MEETING_ROOM_SCREEN_OPTIONS` |
| **描述** | 文本域 |

### 3.5 会议室状态对下游影响

| 状态 | 中台「会议预约」页 | 小程序预约 |
|------|-------------------|------------|
| disabled | 「预约」链接置灰不可点 | 仍可见（树形列表不过滤），实际业务应拦截（当前原型未单独拦截） |
| enabled | 可预约 | 可进入预约页 |
| idle | 可预约 | 可进入预约页；门禁侧不限制进出（文案说明） |

---

## 4. 运营管理中台 · 会议预约

**页面路径**：`/mid-platform/appointment/meeting-rooms/reservations`  
**数据源**：`getReservationMeetingRooms()`（基于 meetingRoomStore + 日程 mock）

### 4.1 列表查询

| 筛选项 | 说明 |
|--------|------|
| 会议室 | 编号或名称关键字 |
| 楼栋 | 同会议室列表 |
| 状态 | 启用 / 禁用 / 空闲 |

### 4.2 列表字段

| 列 | 说明 |
|----|------|
| 缩略图 | cover.imageUrl，无则占位图标 |
| 会议室 | name |
| 容纳人数 / 面积 / 设备 / 地址 | |
| 空间状态 | `MeetingRoomDayTimeline`：当日时间轴占用块 |
| 状态 | 启用/禁用文字 |
| 操作 | 非 disabled 时显示「预约」 |

### 4.3 预约弹窗（MeetingReservationCreateModal）

与中台/小程序共用 **`meetingSubmissionStore`** 提交逻辑。

#### 4.3.1 会议类型

- **标准会议**：选日期 + 开始/结束时间
- **周期会议**：日期区间 + 重复星期（含「每天」= 周一至周日）+ 统一时段

#### 4.3.2 表单字段

| 字段 | 标准 | 周期 |
|------|------|------|
| 会议室 | 只读 roomNo | 同左 |
| 会议日期 / 日期区间 | 单日 DatePicker | RangePicker |
| 开始/结束时间 | TimePicker | TimePicker（每日相同） |
| 重复星期 | — | 多选 Checkbox |
| 会议主题 | 必填 | 必填 |
| 参会人 | TreeSelect 多选 | 同左 |
| 会议需求 | 文本（茶水/设备等提示占位） | 同左 |
| 签到时间 | 不提前 / 15m / 30m / 45m / 1h / 2h | 同左 |
| 预约人 | 默认 admin | 同左 |

#### 4.3.3 冲突与提交

1. **标准会议**：检测当日时间轴冲突（`isTimeRangeConflict`），冲突时禁止提交
2. **周期会议**：检测区间内冲突日期（`findRecurringConflictDates`），有冲突时弹窗确认是否继续（冲突日期写入 `excludedDates`）
3. 提交前走 **占用限制校验** → **审核流程解析**（见第 6、7 节）
4. 捕获 `ReservationLimitError` 时 message 展示规则名 + 违规说明

#### 4.3.4 提交后

- 调用 `submitStandardMeeting` 或 `submitRecurringMeeting`
- 生成 `MeetingReservation` + `MeetingAuditItem` 写入内存动态列表
- 弹窗关闭，toast 成功

---

## 5. PC 中台 · 流程配置

**页面路径**：`/system/audit-flow`  
**组件**：`SystemFlowConfigPage`（双 Tab）

页面说明文案：

> 审核流程控制「能不能约」；预约占用限制控制「约多久、约多频繁、约多少间」，用于预防恶意占用会议室资源。

配置持久化：

| Store | LocalStorage Key |
|-------|------------------|
| auditFlowConfigStore | `sw.audit-flow-configs-v1` |
| reservationLimitConfigStore | `sw.reservation-limit-configs-v1` |

---

## 5.1 审核流程配置

### 5.1.1 列表（AuditFlowConfigList）

**筛选**：流程类型、是否默认、启用状态

**列**：

| 列 | 说明 |
|----|------|
| 规则名称 | `name`，空则自动生成 |
| 流程类型 | 访问预约 / 会议室预约 |
| 匹配条件 | 多条件「且」关系摘要 |
| 匹配类型 | 精确匹配 / 模糊匹配 |
| 默认配置 | 是/否 |
| 启用 | Switch 切换 |
| 操作 | 查看 / 编辑 / 复制 / 删除 |

**排序**：按匹配权重降序（组织+会议室 > 仅会议室 > 仅组织 > 默认）

**批量**：导出、删除选中（演示）

### 5.1.2 规则数据结构（AuditFlowConfig）

```typescript
{
  id, name, processType,           // '访问预约' | '会议室预约'
  conditions: AuditFlowCondition[], // 且关系
  matchType,                       // '精确匹配' | '模糊匹配'
  isDefault, enabled,
  approveMode: 'manual',           // 固定 manual，UI 无自动审批选项
  selfApplyAutoPass?: boolean,     // 仅「组织+会议室」非默认规则可用
  approverSteps: AuditFlowApproverStep[]
}
```

**条件（AuditFlowCondition）**：

| type | orgScope（type=org 时） | values |
|------|-------------------------|--------|
| org | company / park / department / person | 多选 |
| room | — | 会议室 ID 多选 |

**审批步骤（AuditFlowApproverStep）**：

| 字段 | 说明 |
|------|------|
| orgLevel | 集团 / 园区 / 公司 / 部门 |
| orgName | 组织实体名称 |
| signType | 会签（全员通过）/ 或签（任一人通过） |
| approverType | 指定人员 / 动态人员 |
| approverNames | 指定人员时多选 |
| dynamicScope | 动态人员时固定 `orgAdmin`（会议室管理员） |

**最多 5 组审批节点**（`MAX_APPROVER_STEPS`）；多组按顺序均需审批。

### 5.1.3 规则形态与 UI 约束

| 形态 | 条件组合 | selfApplyAutoPass | 审批人含义 |
|------|----------|-------------------|------------|
| 默认 | 无 / isDefault=true | 不可用 | 兜底审批人 |
| 组织+会议室 | org + room | **可勾选**「会议室管理员申请自动通过」 | 该组合专属审批链 |
| 仅会议室 | 仅 room | 不可用 | **固定审批人**，任何申请人均需审批 |
| 仅组织 / 其它 | 仅 org 等 | 不可用 | 按配置审批 |

**已移除**：顶层「自动审批」模式、`stackable` 叠加开关（引擎自动处理多规则合并）

### 5.1.4 表单校验

- 规则名称必填
- 非默认规则须至少一条有效条件（values 非空）
- 不允许与已有非默认规则条件组合完全重复（`findDuplicateAuditFlow`）
- 至少一组审核人；指定人员须选人

### 5.1.5 匹配引擎（auditFlowMatcher）

**匹配上下文**：

```
processType, roomId, roomName,
userId, name, company, park?, department?
```

**单条件匹配**：

- room：roomId 或 roomName 命中 values（精确/模糊）
- org/company：company 命中
- org/park：park 命中
- org/department：department 命中
- org/person：userId 或 name 命中

**多规则命中时**：

1. 取所有 enabled、非默认、条件全满足的规则，按权重排序
2. 分为 **primaryRules**（非仅会议室）与 **roomOnlyRules**（仅会议室）
3. primary 第一条为主规则；roomOnly 作为固定审批人**叠加**（审批人合并去重）

**会议室管理员申请自动通过（selfApplyAutoPass）**：

- 条件：主规则为「组织+会议室」且 `selfApplyAutoPass=true`
- 判定：申请人是否为对应层级管理员（`isApplicantOrgAdmin`）
  - 层级推断：条件含 department → 部门管理员；含 company → 公司管理员；含 park → 园区管理员；默认公司
- 管理员本人提交 → 主规则步骤 skipped → `approveMode: auto`，状态「会议室管理员已自动通过」
- 非管理员 → 走 approverSteps 解析出的审批人
- **特殊**：管理员自动通过时，同会议室的「仅会议室」固定审批规则**不再叠加**

**动态人员解析**：

- 仅「会议室管理员」（`orgAdmin`）
- 按规则条件中的 orgScope 推断解析层级，从 `COMPANY_ADMIN_MAP` / `PARK_ADMIN_MAP` / `DEPARTMENT_ADMIN_MAP` 取人
- 解析失败时使用 `GLOBAL_FALLBACK_APPROVERS`（默认「管理员」）

**兜底**：无命中规则时使用 isDefault=true 的默认流程；仍无审批人则系统兜底审批人。

### 5.1.6 演示规则（mockAuditFlowConfig）

| ID | 名称 | 条件 | 特殊 |
|----|------|------|------|
| afc-2 | 会议室预约默认流程 | 默认 | 指定人员：黄莹、王磊、陈昊、管理员 |
| afc-a-room1 | A公司专属·2204 | A公司 + mr-2204 | selfApplyAutoPass=true，指定王磊、陈昊 |
| afc-room2-fixed | 1104固定审批 | 仅 mr-1104 | 固定黄莹 |
| afc-1103-manual | 1103管理员审批 | 仅 mr-1103 | 动态会议室管理员 |

---

## 5.2 预约占用限制配置

### 5.2.1 列表（ReservationLimitConfigList）

**筛选**：是否默认、启用状态

**列**：规则名称、匹配条件、限制摘要、超限处置、默认、启用、操作

### 5.2.2 规则数据结构（ReservationLimitConfig）

```typescript
{
  id, name,
  conditions, matchType, isDefault, enabled,
  limits: ReservationLimitParams,
  violationAction: 'reject' | 'requireApproval',
  approverSteps  // requireApproval 时生效
}
```

### 5.2.3 占用管控参数（limits）

| 参数 key | 含义 | 空/0 |
|----------|------|------|
| maxDurationMinutes | 单次预约最长时长（分钟） | 不限制 |
| maxDailyBookingCount | 同一用户单日预约总次数 | 不限制 |
| maxDailySameRoomCount | 同一用户单日同室预约次数 | 不限制 |
| maxWeeklySameRoomCount | 近 7 天同室预约次数 | 不限制 |
| maxWeeklySameRoomDurationMinutes | 近 7 天同室占用总时长（分钟） | 不限制 |
| maxWeeklyTotalDurationMinutes | 近 7 天全部会议室占用总时长 | 不限制 |
| maxConsecutiveDaysSameRoom | 连续 N 天预约同一会议室 | 不限制 |
| maxConcurrentRooms | 同一时段并发占用间数 | 不限制 |

统计范围：用户已有有效预约（非 cancelled/rejected）+ 本次拟提交场次；周期会议按展开 occurrence 计算。

### 5.2.4 超限处置

| violationAction | 行为 |
|-----------------|------|
| reject | 抛出 `ReservationLimitError`，前端 message 拦截，**不可提交** |
| requireApproval | 允许提交，额外追加 `limitViolationApproverNames` 至待审批人（与审核流程审批人**合并去重**），状态文案「占用超限审批中」 |

### 5.2.5 匹配规则

与审核流程共用 `matchAuditFlowConditions`、权重排序；无命中时用默认规则。

### 5.2.6 演示规则（mockReservationLimitConfig）

| ID | 名称 | 条件 | 限制要点 | 超限 |
|----|------|------|----------|------|
| rlc-default | 默认 | 默认 | 单次≤480min，同时段≤3间 | reject |
| rlc-a-company-8403 | A公司·8403 | A公司+r-2204 | 单次≤180min，同室单日1次，7天同室≤360min 等 | requireApproval，王磊+陈昊→黄莹 |
| rlc-b-company-video | B公司·视频会议室 | B公司+r-2108 | 单次≤120min，单日≤2次，同时段≤1间 | reject |

---

## 6. 小程序 · 会议室预约模块

> **不含**平面图 Tab（代码中存在「列表/平面图」切换，本 PRD 不描述平面图能力）

### 6.1 会议室首页（MeetingRoomHome）

**入口**：`/mini-program/meeting-room`

| 模块 | 跳转 |
|------|------|
| 会议室预约 | `/mini-program/meeting-room/list` |
| 我的预约 | `/mini-program/meeting-room/my-reservations` |
| 会议审核 | `/mini-program/meeting-room/audit` |
| 扫码签到 | 展示卡片（未接后端） |
| 公告 | 静态文案 |

### 6.2 会议室列表（MeetingRoomList）

**PRD 范围：列表视图**

- 树形结构：楼栋 → 楼层 → 会议室卡片
- 折叠/展开
- 卡片信息：名称、封面缩略图（MeetingRoomPhoto）、楼栋楼层、容纳人数、roomType
- 点击卡片 → `/mini-program/meeting-room/book/:roomId`

数据源：`getMeetingRoomTree()`，与中台 `meetingRoomStore` 同步。

### 6.3 预约页（MeetingRoomBook）

#### 6.3.1 页头

会议室名称、封面、楼栋楼层、roomType、容纳人数

#### 6.3.2 会议类型

| 类型 | 说明 |
|------|------|
| 标准会议 | 在 `MeetingTimeSlotGrid` 选单日时段 |
| 周期会议 | 开始/截止日期 + 重复星期 + 统一时段网格（recurring 模式） |

#### 6.3.3 必填校验

1. 至少选一个时段
2. 周期：日期区间合法、至少一个重复星期
3. 会议主题（≤50 字）
4. 参会人（跳转 `MeetingParticipantPicker` 组织树多选）
5. 会议描述（≤200 字）

#### 6.3.4 参会人选择（MeetingParticipantPicker）

- 从中台人员组织树 `meetingParticipantTree` 选人
- 返回时通过 location.state 恢复预约表单草稿（`bookDraft`）

#### 6.3.5 提交逻辑

与中台完全一致，调用 `meetingSubmissionStore`：

```
resolveLimitCheck()  →  reject 则 ReservationLimitError
resolveSubmissionAuditOutcome()  →  解析审核 + 合并超限审批人
写入 dynamicReservations + dynamicAudits
```

- 周期冲突：Modal 确认后提交，冲突日期记入 excludedDates
- 成功跳转：`/mini-program/meeting-room/my-reservations?tab=processing`

#### 6.3.6 当前演示用户（meetingCurrentUser）

| 字段 | 默认值 | 用途 |
|------|--------|------|
| company | A公司 | 匹配 org 条件 |
| park | 生物芯片园区 | |
| department | 研发部 | |
| isCompanyAdmin | false | 改为 true 可测 selfApplyAutoPass |
| canApproveMeetings | true | 审批权限演示 |

### 6.4 我的预约（MyReservations）

**Tab**：待参加 / 审批中 / 已完成 / 已驳回 / 已取消

**卡片字段**：主题、状态、时间（标准/周期分开展示）、会议室、申请人（他人待审场景）

**操作**：

| 场景 | 按钮 |
|------|------|
| 本人 processing/completed | 查看详情、取消预定（UI 有，取消逻辑为演示） |
| 他人 pending 待我审 | 查看详情、去审核（UI 有） |

### 6.5 预约详情（MeetingReservationDetail）

**展示字段**：

| 字段 | 说明 |
|------|------|
| 会议状态 | statusLabel |
| 审核规则 | matchedAuditFlowName |
| 待审批人 | pendingApproverNames（processing 时） |
| 审批人 | approvedByNames + autoApproverScopeLabel（自动通过时显示「会议室管理员自动通过」） |
| 会议主题/时间/会议室/参会人/描述 | 标准 vs 周期字段分支 |
| 占用限制命中 | matchedLimitRuleName（有则展示，代码字段支持） |

**编辑**：status=processing 时可编辑并「保存」（演示 toast，未写回 store）

### 6.6 会议审核（MeetingAudit）

**Tab**：待审核 / 已通过 / 已驳回 / 审批中

**待审核卡片**：申请人、时间、会议室、查看详情、去审核

**已通过周期会议**：展示拆分的多场标准会议列表（`getExpandedReservationsForAudit`）

---

## 7. 中台与小程序对应关系

### 7.1 数据同源

| 数据 | 中台维护 | 小程序消费 |
|------|----------|------------|
| 会议室台账 | 会议室列表 CRUD | 列表树、预约页 room 信息、封面 |
| 审核流程 | PC 中台流程配置 | 提交时 `resolveAuditApprovalPlan` |
| 占用限制 | PC 中台流程配置 Tab2 | 提交时 `validateReservationLimits` |
| 预约单/审核单 | 中台预约弹窗 / 小程序提交 | 我的预约、会议审核、详情页 |

### 7.2 配置 → 行为映射

```
用户提交预约（中台或小程序）
        │
        ▼
┌───────────────────────┐
│ 1. 占用限制匹配        │  resolveReservationLimitRule
│    校验 limits         │  validateReservationLimits
└───────────┬───────────┘
            │ reject → 前端报错，终止
            │ requireApproval → 记录 limitViolationApproverNames
            ▼
┌───────────────────────┐
│ 2. 审核流程匹配        │  resolveAuditApprovalPlan
│    多规则合并          │
│    selfApplyAutoPass   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 3. 生成预约单状态      │
│ auto → completed      │  「会议室管理员已自动通过」
│ manual → processing   │  「审批中」或「占用超限审批中」
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 4. 写入记录字段        │
│ matchedAuditFlowId/Name│
│ matchedLimitRuleId/Name│
│ pendingApproverNames   │  人工审批
│ approvedByNames        │  自动通过
└───────────────────────┘
```

### 7.3 功能入口对照

| 能力 | 中台（运营） | PC 中台 | 小程序 |
|------|-------------|---------|--------|
| 维护会议室 | 会议室列表 | — | — |
| 代客预约 | 会议预约页弹窗 | — | 用户自助 book 页 |
| 配置审批人 | — | 审核流程 Tab | — |
| 配置占用上限 | — | 占用限制 Tab | — |
| 查看我的预约 | — | — | 我的预约 |
| 审批操作 | 占位页 | — | 会议审核（UI） |
| 预约详情/规则追溯 | — | — | 预约详情 |

### 7.4 审批人合并规则

最终 `pendingApproverNames` = **审核流程解析审批人** ∪ **占用超限审批人**（去重）

自动通过仅当：`approveMode=auto` 且 **无** limitViolationApproverNames

---

## 8. 完整业务闭环

### 8.1 标准会议闭环

```
1. 管理员在 PC 中台配置会议室 + 流程规则 + 占用限制
2. 用户在小程序（或运营在中台）选择会议室及时段，填写信息
3. 系统校验占用限制
   ├─ 超限且 reject → 提示错误，结束
   └─ 通过或 requireApproval → 继续
4. 系统匹配审核流程
   ├─ 管理员 + selfApplyAutoPass → 自动通过，status=completed
   └─ 否则 → status=processing，pendingApproverNames 有值
5. 用户在「我的预约-审批中」查看；详情页可见规则名与待审批人
6. （待实现）审批人在「会议审核」通过/驳回 → 状态流转
7. （待实现）通过后占用时间轴，门禁/签到联动
```

### 8.2 周期会议闭环

```
1. 用户选择周期类型、日期区间、重复星期、统一时段
2. 检测冲突日期 → 可选确认排除
3. 占用限制按「展开后的所有 occurrence」校验
4. 审核逻辑同标准会议
5. 审批通过后按 recurrence 展开为多场标准会议（getExpandedReservationsForAudit）
6. excludedDates 的场次不生成
```

### 8.3 多规则叠加示例

**场景**：A公司用户预约 mr-1104

- 命中「A公司+2204」主规则（若非 2204 则不命中此项）
- 同时命中「仅 mr-1104 → 黄莹固定审批」roomOnly 规则
- 审批人 = 主规则审批人 + 黄莹（去重）
- 若申请人是 A公司管理员且 2204 规则 selfApplyAutoPass：2204 主规则跳过，但若预约的是 1104 且命中 1104 roomOnly，仍要黄莹审批

**场景**：占用超限 requireApproval

- 审核流程解析出 [王磊, 陈昊]
- 占用规则解析出 [黄莹]
- pendingApproverNames = [王磊, 陈昊, 黄莹]
- statusLabel = 「占用超限审批中」

---

## 9. 预约单关键字段（MeetingReservation）

| 字段 | 说明 |
|------|------|
| status | pending / processing / completed / rejected / cancelled |
| statusLabel | 展示文案 |
| meetingType | standard / recurring |
| applicantId/Name/Company | 申请人 |
| matchedAuditFlowId/Name | 命中审核规则 |
| matchedLimitRuleId/Name | 命中占用规则 |
| pendingApproverNames | 待审批人 |
| approvedByNames | 已自动通过记录 |
| autoApproverScopeLabel | 自动通过角色说明 |
| limitViolationApproverNames | 超限追加审批人 |
| excludedDates | 周期会议冲突排除日期 |

---

## 10. 占位 / 未完全实现功能

以下在代码中为 Placeholder 或 UI 无后端逻辑，**不在本 PRD 承诺范围**：

| 功能 | 位置 |
|------|------|
| 楼层平面图（中台编辑、小程序 Tab） | 未定稿，本文档不描述 |
| 会议审核（中台） | PlaceholderPage |
| 会议记录、会议室报表 | PlaceholderPage |
| 小程序「去审核」「取消预定」按钮 | 无完整审批/取消 API |
| 扫码签到 | 静态 UI |
| 详情页「保存」 | 仅 toast，未持久化 |
| 访问预约流程 | 配置存在，无小程序/中台预约页 |

---

## 11. 验收要点清单

### 11.1 流程配置

- [ ] 流程配置仅在 PC 中台 `/system/audit-flow`，运营中台无入口
- [ ] 审核流程无「自动审批」顶层模式，仅有指定人员 + 动态会议室管理员
- [ ] 「会议室管理员申请自动通过」仅在组织+会议室非默认规则可勾选
- [ ] 仅会议室规则审批人作为固定审批人叠加
- [ ] 占用限制 reject 阻止提交；requireApproval 合并审批人
- [ ] 配置修改持久化到 localStorage

### 11.2 预约提交

- [ ] 中台弹窗与小程序提交走同一 store
- [ ] 命中 selfApplyAutoPass 时管理员自动 completed
- [ ] 详情页展示 matchedAuditFlowName、pendingApproverNames、自动通过文案

### 11.3 会议室列表

- [ ] CRUD、状态三态、使用权限、封面同步小程序展示
- [ ] disabled 会议室在中台预约列表不可点预约

---

## 附录 A：路由速查

| URL | 页面 |
|-----|------|
| https://apioz.github.io/swxpold/system/audit-flow | PC 流程配置 |
| https://apioz.github.io/swxpold/mid-platform/appointment/meeting-rooms/list | 会议室列表 |
| https://apioz.github.io/swxpold/mid-platform/appointment/meeting-rooms/reservations | 会议预约 |
| https://apioz.github.io/swxpold/mini-program/meeting-room | 小程序会议室首页 |

---

*本文档严格依据仓库源码整理，如有实现变更以代码为准。*
