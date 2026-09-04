/** 小程序会议室模块当前登录用户（演示用） */
export const meetingCurrentUser = {
  id: 'user-self',
  name: '当前用户',
  company: 'A公司',
  park: '生物芯片园区',
  department: '研发部',
  /** 设为 true 可模拟本公司管理员身份（自审自动通过公司级审批） */
  isCompanyAdmin: false,
  /** 设为 true 可模拟本园区管理员身份 */
  isParkAdmin: false,
  /** 设为 true 可模拟本部门管理员身份 */
  isDepartmentAdmin: false,
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

export function buildMeetingApplicantContext() {
  return {
    userId: meetingCurrentUser.id,
    name: meetingCurrentUser.name,
    company: meetingCurrentUser.company,
    park: meetingCurrentUser.park,
    department: meetingCurrentUser.department,
    isCompanyAdmin: meetingCurrentUser.isCompanyAdmin,
    isParkAdmin: meetingCurrentUser.isParkAdmin,
    isDepartmentAdmin: meetingCurrentUser.isDepartmentAdmin,
  };
}
