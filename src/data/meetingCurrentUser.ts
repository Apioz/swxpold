/** 小程序会议室模块当前登录用户（演示用） */
export const meetingCurrentUser = {
  id: 'user-self',
  name: '当前用户',
  /** 是否具备会议审批权限 */
  canApproveMeetings: true,
} as const;

export const meetingOtherApplicants = {
  zhang: { id: 'user-zhang', name: '张明' },
  li: { id: 'user-li', name: '李华' },
  wang: { id: 'user-wang', name: '王芳' },
} as const;

export function isOwnMeetingApplicant(applicantId: string): boolean {
  return applicantId === meetingCurrentUser.id;
}
