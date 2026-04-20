// ⚙️ TanStack Query Keys
export enum QueryKeys {
  authUser = 'authUser',
  patientAppointments = 'patientAppointments',
  patientWaitlists = 'patientWaitlists',
  allWaitlists = 'allWaitlists',
  patientResults = 'patientResults',
  patientQR = 'patientQR',
  patientReceipt = 'patientReceipt',

  donorCampaigns = 'donorCampaigns',
  donorCampaign = 'donorCampaign',
  donorReceipts = 'donorReceipts',
  donorImpact = 'donorImpact',
  verifyPayment = 'verifyPayment',

  centerAppointments = 'centerAppointments',
  centerResults = 'centerResults',
  centerStaff = 'centerStaff',
  centerStaffInvites = 'centerStaffInvites',
  validateStaffInvite = 'validateStaffInvite',
  centerReceipts = 'centerReceipts',
  centers = 'centers',
  centerById = 'centerById',

  adminUsers = 'adminUsers',
  adminCenters = 'adminCenters',
  adminCampaigns = 'adminCampaigns',
  adminAppointments = 'adminAppointments',
  adminTransactions = 'adminTransactions',
  adminWaitlist = 'adminWaitlist',
  adminStoreProducts = 'adminStoreProducts',
  adminAnalytics = 'adminAnalytics',
  adminStore = 'adminStore',
  adminRoles = 'adminRoles',
  checkProfiles = 'checkProfiles',

  // Screening type queries
  screeningTypes = 'screeningTypes',
  screeningTypesAll = 'screeningTypesAll',
  screeningTypeCategories = 'screeningTypeCategories',
  screeningTypesCategory = 'screeningTypesCategory',
  screeningType = 'screeningType',
  screeningTypeByName = 'screeningTypeByName',
  centerAppointmentById = 'centerAppointmentById',

  // V1 Receipt System
  receiptsV1 = 'receiptsV1',
  receiptV1 = 'receiptV1',

  // Analytics
  dashboardMetrics = 'dashboardMetrics',
  timeBasedReport = 'timeBasedReport',
  geographicReport = 'geographicReport',
  centerPerformance = 'centerPerformance',
  campaignAnalytics = 'campaignAnalytics',

  // Payouts
  payouts = 'payouts',
  // Waitlist admin keys
  waitlistMatchingStats = 'waitlist-matching-stats',
  waitlistMatchingStatus = 'waitlist-matching-status',

  // Waitlist Matching System
  matchingExecutions = 'matchingExecutions',
  matchingExecution = 'matchingExecution',
  executionLogs = 'executionLogs',
  allocations = 'allocations',
  expiredAllocations = 'expiredAllocations',
  patientAllocations = 'patientAllocations',
  matchingConfig = 'matchingConfig',
  systemHealth = 'systemHealth',
}

export enum MutationKeys {
  registerPatient = 'registerPatient',
  registerDonor = 'registerDonor',
  registerCenter = 'registerCenter',
  forgotPassword = 'forgotPassword',
  resetPassword = 'resetPassword',
  verifyEmail = 'verifyEmail',
  loginUser = 'loginUser',
  authUser = 'authUser',
  logoutUser = 'logoutUser',
  joinWaitlist = 'joinWaitlist',
  leaveWaitlist = 'leaveWaitlist',
  bookAppointment = 'bookAppointment',
  uploadResult = 'uploadResult',
  verifyPatient = 'verifyPatient',
  createCampaign = 'createCampaign',
  fundCampaign = 'fundCampaign',
  updateCampaign = 'updateCampaign',
  deleteCampaign = 'deleteCampaign',
  approveCenter = 'approveCenter',
  updateCampaignStatus = 'updateCampaignStatus',
  resendReceipt = 'resendReceipt',
  donateAnonymous = 'donateAnonymous',
  inviteStaff = 'inviteStaff',
  createCenterStaffPassword = 'createCenterStaffPassword',
  resendVerification = 'resendVerification',
  selectCenter = 'selectCenter',
  // Notification mutations
  markNotificationRead = 'markNotificationRead',
  createNotification = 'createNotification',
  centerStaffForgotPassword = 'centerStaffForgotPassword',
  centerStaffResetPassword = 'centerStaffResetPassword',
  centerStaffLogin = 'centerStaffLogin',
  // Appointment mutations
  cancelCenterAppointment = 'cancelCenterAppointment',
  verifyCheckInCode = 'verifyCheckInCode',
  // Result file mutations
  deleteResultFile = 'deleteResultFile',
  restoreResultFile = 'restoreResultFile',
  completeAppointment = 'completeAppointment',
  // Admin mutations
  adminLogin = 'adminLogin',
  adminForgotPassword = 'adminForgotPassword',
  adminResetPassword = 'adminResetPassword',
  createAdmin = 'createAdmin',
  updateCenterStatus = 'updateCenterStatus',
  updateAdminCampaignStatus = 'updateAdminCampaignStatus',
  createStoreProduct = 'createStoreProduct',
  updateStoreProduct = 'updateStoreProduct',

  // V1 Receipt System
  createReceiptV1 = 'createReceiptV1',
  resendReceiptV1 = 'resendReceiptV1',

  // Payouts
  createManualPayout = 'createManualPayout',
  processPayout = 'processPayout',
  retryPayout = 'retryPayout',
  verifyAccount = 'verifyAccount',

  triggerWaitlistMatching = 'trigger-waitlist-matching',
  cancelAppointment = 'cancelAppointment',

  // Waitlist Matching System
  triggerMatching = 'triggerMatching',
  expireAllocation = 'expireAllocation',
  updateMatchingConfig = 'updateMatchingConfig',
}

export const ACCESS_TOKEN_KEY = 'accessToken'
