export type TPaginationParams = {
  page?: number;
  limit?: number;
};

export type TDataResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export type TErrorResponse = {
  ok: false;
  error: any;
  err_code?: string;
  cause?: string;
};

export type TPaginatedResponse<T> = {
  ok: boolean;
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TScreeningCenterRegisterResponse = TDataResponse<{
  centerId: string;
  centerName: string;
  email: string;
  phoneNumber: string;
  address: string;
  state: string;
  localGovernment: string;
  services: string[];
}>;

export type TPatientRegisterResponse = TDataResponse<{
  patientId: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  state: string;
  localGovernment: string;
}>;

export type TDonorRegisterResponse = TDataResponse<{
  donorId: string;
  email: string;
  fullName: string;
  phone: string;
  organization?: string;
}>;

export type TLoginResponse = TDataResponse<{
  token: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    profile: "PATIENT" | "DONOR" | "CENTER" | "CENTER_STAFF" | "ADMIN";
  };
}>;

export type TAuthMeResponse = TDataResponse<{
  user: {
    id: string;
    fullName: string;
    email: string;
    profile: "PATIENT" | "DONOR" | "CENTER" | "CENTER_STAFF" | "ADMIN";
  };
}>;

export type TRefreshTokenResponse = TDataResponse<{
  token: string;
  // newRefreshToken: string;
}>;

export type TCheckProfilesResponse = TDataResponse<{
  profiles: ("PATIENT" | "DONOR")[];
}>;

export type TActors = "patient" | "donor" | "center" | "admin";

export type TNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type TNotificationRecipient = {
  id: string;
  userId: string;
  notificationId: string;
  read: boolean;
  readAt: string | null;
  notification: TNotification;
};

export type TGetNotificationsResponse = TDataResponse<TNotificationRecipient[]>;
export type TMarkNotificationReadResponse = TDataResponse<{
  id: string;
  read: boolean;
  readAt: string | null;
}>;
export type TCreateNotificationResponse = TDataResponse<TNotification>;

export type TForgotPasswordResponse = TDataResponse<{}>;
export type TResetPasswordResponse = TDataResponse<{}>;
export type TVerifyEmailResponse = TDataResponse<{}>;
export type TResendVerificationResponse = TDataResponse<{ message?: string }>;
export type TLogoutResponse = TDataResponse<{ message: string }>;

// Patient appointment/flow types
export type TPatientAppointment = {
  id: string;
  patientId: string;
  centerId: string;
  screeningTypeId: string;
  appointmentDateTime: string; // Combined date and time
  isDonation: boolean;
  status: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  transactionId?: string;
  checkInCode?: string;
  checkInCodeExpiresAt?: string | null;
  donationId?: string;
  center?: {
    id: string;
    centerName: string;
    address: string;
    state: string;
    lga: string;
  };
  screeningType?: { id: string; name: string };
  transaction?: any;
  result?: any;
};

// Detailed appointment type with full information for appointment details page
export type TPatientAppointmentDetails = {
  id: string;
  patientId: string;
  centerId: string;
  screeningTypeId: string;
  appointmentDateTime: string;
  isDonation: boolean;
  status:
    | "PENDING"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
  transactionId?: string;
  checkInCode?: string;
  checkInCodeExpiresAt?: string | null;
  donationId?: string;
  cancellationReason?: string;
  cancellationDate?: string;
  createdAt: string;
  center?: {
    id: string;
    centerName: string;
    address: string;
    state: string;
    lga: string;
    phoneNumber: string;
    email: string;
  };
  screeningType?: {
    id: string;
    name: string;
    description?: string;
  };
  transaction?: {
    id: string;
    type: "DONATION" | "APPOINTMENT" | "PAYOUT" | "REFUND";
    status: "PENDING" | "COMPLETED" | "FAILED";
    amount: number;
    paymentReference: string;
    paymentChannel: string;
    createdAt: string;
  };
  result?: {
    id: string;
    notes?: string;
    uploadedAt: string;
    files: Array<{
      id: string;
      fileName: string;
      fileType: string;
      cloudinaryUrl: string;
      uploadedAt: string;
    }>;
  };
  verification?: {
    id: string;
    verifiedAt: string;
    verifier?: {
      id: string;
      email: string;
    };
  };
};

export type TWaitlist = {
  id: string;
  screeningTypeId: string;
  patientId: string;
  status: string;
};

export type TCenterSummary = {
  id: string;
  centerName: string;
  address: string;
  state: string;
  lga: string;
};

export type TCenter = {
  id: string;
  email: string;
  centerName: string;
  address: string;
  state: string;
  lga: string;
  phone: string | null;
  bankAccount: string | null;
  bankName: string | null;
  status: string;
  createdAt: string;
  services: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  staff: Array<{
    id: string;
    email: string;
    status?: "ACTIVE" | "SUSPENDED" | "PENDING";
  }>;
};

export type TGetCentersResponse = TDataResponse<{
  centers: TCenter[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetCenterByIdResponse = TDataResponse<TCenter>;

export type TResultFile = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  uploadedAt: string;
  // Soft delete fields
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
};

export type TPatientResult = {
  id: string;
  notes: string | null;
  uploadedAt: string;
  appointment: {
    id: string;
    appointmentDateTime: string; // Combined date and time
    screeningType: {
      id: string;
      name: string;
    };
    center: {
      id: string;
      centerName: string;
      address?: string;
    };
  };
  files: TResultFile[];
  folders: Record<string, TResultFile[]>;
};

export type TUploadResultsResponse = TDataResponse<{
  resultId: string;
  filesCount: number;
}>;

export type TGetPatientResultByIdResponse = TDataResponse<TPatientResult>;

export type TGetAppointmentResultsResponse =
  TDataResponse<TPatientResult | null>;

// Soft delete and completion response types
export type TDeleteResultFileResponse = TDataResponse<{
  fileId: string;
  deletedAt: string;
}>;

export type TRestoreResultFileResponse = TDataResponse<{
  fileId: string;
  restoredAt: string;
}>;

export type TCompleteAppointmentResponse = TDataResponse<{
  appointmentId: string;
  completedAt: string;
  status: "COMPLETED";
}>;

// For admin (post-MVP)
export type TGetDeletedFilesResponse = TDataResponse<{
  files: Array<
    TResultFile & {
      appointmentId: string;
      patientName: string;
      centerName: string;
      deletedByStaffName: string;
    }
  >;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

// Enhanced appointment type with completion info
export type TAppointmentDetails = {
  id: string;
  status: string;
  // ... other existing appointment fields would be here
  completedAt?: string;
  completionNotes?: string;
  canBeCompleted: boolean; // Computed field indicating if results exist
};

// Center-facing appointment types
export type TCenterAppointment = {
  id: string;
  patientId: string;
  centerId: string;
  screeningTypeId: string;
  donationId: string | null;
  isDonation: boolean;
  appointmentDateTime: string; // Combined date and time
  transactionId: string | null;
  status: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  cancellationReason: string | null;
  cancellationDate: string | null;
  checkInCode: string | null;
  checkInCodeExpiresAt: string | null;

  // Relations (based on backend includes)
  patient: {
    id: string;
    fullName: string;
  };
  center?: {
    id: string;
    centerName: string;
  };
  screeningType: {
    id: string;
    name: string;
  };
  verification?: {
    id: string;
    verifiedAt?: string;
  } | null;
};

export type TGetCenterAppointmentsResponse = TDataResponse<{
  appointments: TCenterAppointment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetCenterAppointmentByIdResponse =
  TDataResponse<TCenterAppointment>;

export type TCancelCenterAppointmentResponse = TDataResponse<{
  id: string;
}>;

// ...existing types continue...

export type TBookSelfPayAppointmentResponse = TDataResponse<{
  appointment: TPatientAppointment;
  payment: {
    transactionId: string;
    reference: string;
    authorizationUrl: string;
    accessCode: string;
  };
}>;
export type TJoinWaitlistResponse = TDataResponse<{ waitlist: TWaitlist }>;
export type TLeaveWaitlistResponse = TDataResponse<{
  waitlistId: string;
  message: string;
}>;

export type TGetPatientWaitlistResponse = TDataResponse<{
  waitlist: {
    id: string;
    screeningTypeId: string;
    patientId: string;
    status: string;
    joinedAt: string;
    claimedAt: string | null;
    screeningType: {
      id: string;
      name: string;
    };
    allocation?: {
      id: string;
      campaign: {
        id: string;
        purpose: string;
        donor: {
          id: string;
          fullName: string;
        };
      };
    } | null;
  };
}>;

export type TCheckWaitlistStatusResponse = TDataResponse<{
  inWaitlist: boolean;
  waitlist?: {
    id: string;
    screeningTypeId: string;
    patientId: string;
    status: string;
    joinedAt: string;
    claimedAt: string | null;
    screeningType: {
      id: string;
      name: string;
    };
    allocation?: {
      id: string;
      claimedAt?: string | null;
      campaign: {
        title: string;
        purpose: string | null;
      } | null;
    } | null;
  } | null;
}>;

export type TGetPatientWaitlistsResponse = TDataResponse<{
  waitlists: Array<{
    id: string;
    screeningTypeId: string;
    patientId: string;
    status: string;
    joinedAt: string;
    claimedAt: string | null;
    screeningType: {
      id: string;
      name: string;
    };
    allocation?: {
      id: string;
      campaign: {
        id: string;
        purpose: string;
      };
    } | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetAllWaitlistsResponse = TDataResponse<{
  waitlists: Array<{
    screeningTypeId: string;
    screeningType: {
      id: string;
      name: string;
    };
    pendingCount: number;
    totalCount: number;
    demand: number; // Same as pendingCount, for clarity
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetEligibleCentersResponse = TDataResponse<{
  centers: TCenterSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;
export type TSelectCenterResponse = TDataResponse<{
  appointment: TPatientAppointment;
}>;
export type TGetPatientAppointmentsResponse = TDataResponse<{
  appointments: TPatientAppointment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;
export type TGetCheckInCodeResponse = TDataResponse<{
  checkInCode: string;
  expiresAt: string | null;
}>;

// Get patient appointment by ID response
export type TGetPatientAppointmentByIdResponse =
  TDataResponse<TPatientAppointmentDetails>;

export type TVerifyCheckInCodeResponse = TDataResponse<{
  valid: boolean;
  appointmentId?: string;
  message?: string;
}>;
export type TGetPatientResultsResponse = TDataResponse<{
  results: TPatientResult[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

// Placeholder for receipt types (to be implemented later)
export type TPatientReceipt = {
  id: string;
  // Add receipt properties later
};

export type TGetPatientReceiptsResponse = TDataResponse<{
  receipts: TPatientReceipt[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;
export type TGetPatientReceiptResponse = TDataResponse<TPatientReceipt>;

// V1 Receipt System Types
export type TReceipt = {
  id: string;
  transactionId: string;
  receiptNumber: string;
  receiptData: {
    receiptNumber: string;
    transactionId: string;
    type: "DONATION" | "APPOINTMENT" | "PAYOUT" | "REFUND";
    amount: number;
    date: string;
    paymentReference: string | null;
    paymentChannel: string | null;
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string | null;
    campaignName: string | null;
    campaignDescription: string | null;
    taxDeductible: boolean;
    centerName: string | null;
    centerAddress: string | null;
    appointmentDateTime: string | null; // Combined date and time
    serviceType: string | null;
    organizationName: string;
    organizationAddress: string;
    organizationTaxId: string;
    organizationEmail: string;
    organizationPhone: string;
  };
  pdfPath: string | null;
  emailSentAt: string | null;
  emailRecipient: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TReceiptListData = {
  receipts: TReceipt[];
  total: number;
  page: number;
  limit: number;
};

export type TReceiptResponse = TDataResponse<TReceipt>;
export type TReceiptListResponse = TDataResponse<TReceiptListData>;
export type TCreateReceiptResponse = TDataResponse<TReceipt>;
export type TResendReceiptResponse = TDataResponse<{ success: boolean }>;

export type TScreeningType = {
  id: string;
  name: string;
  description?: string | null;
  screeningTypeCategoryId: string;
  active: boolean;
};

export type TScreeningTypeCategory = {
  id: string;
  name: string;
};

export type TGetScreeningTypesResponse = {
  ok: boolean;
  data: TScreeningType[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type TGetScreeningTypeCategoriesResponse = {
  ok: boolean;
  data: TScreeningTypeCategory[];
};

export type TGetScreeningTypeResponse = {
  ok: boolean;
  data: TScreeningType;
};

export type TInviteStaffResponse = TDataResponse<{
  invites: Array<{ email: string; token: string; expiresAt: string | null }>;
}>;

export type TCreateCenterStaffPasswordResponse = TDataResponse<{
  staffId: string;
}>;

export type TCenterStaffForgotPasswordResponse = TDataResponse<{
  message: string;
}>;
export type TCenterStaffResetPasswordResponse = TDataResponse<{
  message: string;
}>;

export type TCenterStaffLoginResponse = TDataResponse<{
  token: string;
  user: {
    userId: string;
    email: string;
    profile: "CENTER_STAFF";
    centerId: string;
  };
}>;

export type TAdminLoginResponse = TDataResponse<{
  token: string;
  user: {
    userId: string;
    email: string;
    fullName: string;
    profile: "ADMIN";
  };
}>;

export type TAdminForgotPasswordResponse = TDataResponse<{
  message: string;
}>;

export type TAdminResetPasswordResponse = TDataResponse<{
  message: string;
}>;

export type TCreateAdminResponse = TDataResponse<{
  adminId: string;
  email: string;
  fullName: string;
}>;

// ========================================
// DONATION & CAMPAIGN TYPES
// ========================================

export type TDonationCampaign = {
  id: string;
  donorId: string;
  title: string;
  description: string;
  fundingAmount: number; // What is currently in account
  usedAmount: number; // What is available for allocation
  purpose?: string;
  targetGender?: "MALE" | "FEMALE" | "ALL";
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetStates?: string[];
  targetLgas?: string[];
  status: "ACTIVE" | "COMPLETED" | "DELETED" | "PENDING" | "SUSPENDED";
  expiryDate: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  donor: {
    id: string;
    fullName: string;
    email: string;
    organizationName?: string;
  };
  screeningTypes: Array<{
    id: string;
    name: string;
  }>;
  patientAllocations: {
    patientsHelped: number;
    patientPendingAcceptance: number;
    patientAppointmentInProgress: number;
    patientAppointmentScheduled: number;
    allocationsCount: number;
  };
};

export type TDonationTransaction = {
  id: string;
  type: "DONATION" | "APPOINTMENT" | "PAYOUT" | "REFUND";
  status: "PENDING" | "COMPLETED" | "FAILED";
  amount: number;
  paymentReference: string;
  paymentChannel: string;
  createdAt: string;

  // For donations
  donationData?: {
    message?: string;
    isAnonymous: boolean;
    campaignId?: string;
  };
};

// export type TCampaignAnalytics = {
//   overview: {
//     totalFunded: number;
//     totalUsed: number;
//     totalReserved: number;
//     availableAmount: number;
//     patientsHelped: number;
//     averagePerPatient: number;
//     completionPercentage: number;
//   };
//   timeline: Array<{
//     date: string;
//     allocations: number;
//     amountUsed: number;
//     patientsHelped: number;
//   }>;
//   demographics: {
//     ageGroups: Record<string, number>;
//     genderDistribution: Record<string, number>;
//     stateDistribution: Record<string, number>;
//     lgaDistribution: Record<string, number>;
//   };
//   screeningTypes: Array<{
//     id: string;
//     name: string;
//     count: number;
//     totalAmount: number;
//     percentage: number;
//   }>;
//   centers: Array<{
//     id: string;
//     name: string;
//     patientCount: number;
//     totalAmount: number;
//   }>;
// };

// Analytics Types
export type TDashboardMetrics = {
  // Financial Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  averageTransactionValue: number;

  // User Metrics
  totalUsers: number;
  newUsersThisMonth: number;
  activePatients: number;
  activeDonors: number;

  // Appointment Metrics
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  appointmentCompletionRate: number;

  // Campaign Metrics
  activeCampaigns: number;
  totalDonationAmount: number;
  averageCampaignFunding: number;

  // Center Metrics
  activeCenters: number;
  centerUtilizationRate: number;

  // Waitlist Metrics
  totalWaitlistUsers: number;
  averageWaitTime: number;
  matchingSuccessRate: number;
};

export type TTimeBasedReport = {
  period: "daily" | "weekly" | "monthly" | "yearly";
  dateRange: { from: string; to: string };
  revenueByDay: Array<{ date: string; amount: number }>;
  appointmentsByDay: Array<{ date: string; count: number }>;
  registrationsByDay: Array<{ date: string; count: number }>;
  userGrowthRate: number;
  revenueGrowthRate: number;
  appointmentGrowthRate: number;
};

export type TGeographicReport = {
  usersByState: Array<{ state: string; count: number }>;
  centersByState: Array<{ state: string; count: number }>;
  appointmentsByState: Array<{ state: string; count: number }>;
  revenueByState: Array<{ state: string; amount: number }>;
  waitlistHotZones: Array<{
    state: string;
    waitlistCount: number;
    averageWaitTime: number;
  }>;
};

export type TCenterPerformanceReport = {
  centerId: string;
  centerName: string;
  totalAppointments: number;
  completedAppointments: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  averageAppointmentValue: number;
  payoutsPending: number;
  averageProcessingTime: number;
  resultUploadRate: number;
};

export type TCampaignAnalytics = {
  campaignId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  fundingPercentage: number;
  donorCount: number;
  averageDonation: number;
  patientsMatched: number;
  appointmentsCompleted: number;
  utilizationRate: number;
  daysSinceCreated: number;
  estimatedDepletion: number | null;
};

// Analytics Response Types
export type TDashboardMetricsResponse = TDataResponse<TDashboardMetrics>;
export type TTimeBasedReportResponse = TDataResponse<TTimeBasedReport>;
export type TGeographicReportResponse = TDataResponse<TGeographicReport>;
export type TCenterPerformanceResponse = TDataResponse<
  TCenterPerformanceReport[]
>;
export type TCampaignAnalyticsResponse = TDataResponse<TCampaignAnalytics[]>;

// ========================================
// DONATION API RESPONSE TYPES
// ========================================

export type TAnonymousDonationResponse = TDataResponse<{
  transactionId: string;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}>;

export type TCreateCampaignResponse = TDataResponse<{
  campaign: TDonationCampaign;
  payment: {
    transactionId: string;
    reference: string;
    authorizationUrl: string;
    accessCode: string;
  };
}>;

export type TFundCampaignResponse = TDataResponse<{
  campaignId: string;
  transactionId: string;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}>;

export type TGetCampaignsResponse = TDataResponse<{
  campaigns: TDonationCampaign[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetCampaignResponse = TDataResponse<TDonationCampaign>;

export type TGetCampaignAnalyticsResponse = TDataResponse<TCampaignAnalytics>;

export type TUpdateCampaignResponse = TDataResponse<{
  campaign: TDonationCampaign;
}>;

export type TDeleteCampaignResponse = TDataResponse<{
  campaignId: string;
  action: "recycle_to_general" | "transfer_to_campaign" | "request_refund";
  amountProcessed: number;
  message: string;
}>;

// ========================================
// PAYMENT VERIFICATION TYPES
// ========================================

export type TPaymentVerificationResponse = TDataResponse<{
  reference: string;
  amount: number;
  status: "success" | "failed" | "abandoned" | "pending";
  paymentType:
    | "anonymous_donation"
    | "campaign_creation"
    | "campaign_funding"
    | "appointment_booking";
  paidAt: string | null;
  channel: string;
  currency: string;
  transactionDate: string;
  context: TPaymentContext;
}>;

export type TPaymentContext =
  | {
      type: "anonymous_donation";
      wantsReceipt: boolean;
      message: string | null;
      campaignId?: string | null;
      campaign: TDonationCampaign | null;
    }
  | {
      type: "campaign_creation";
      campaignId: string;
      campaign: TDonationCampaign | null;
      initialFunding: number;
    }
  | {
      type: "campaign_funding";
      campaignId: string;
      campaign: TDonationCampaign | null;
      fundingAmount: number;
    }
  | {
      type: "appointment_booking";
      appointmentId: string;
      appointment: {
        id: string;
        patientId: string;
        patientName: string;
        status: string;
        centerId: string;
        centerName: string;
        appointmentDateTime: string; // Combined date and time
        screeningTypeId: string;
        screeningTypeName: string;
      } | null;
    };

export type TValidateStaffInviteResponse = TDataResponse<{
  isValid: boolean;
  centerName: string;
  centerAddress: string;
  email: string;
  expiresAt: string | null;
  isExpired: boolean;
}>;
