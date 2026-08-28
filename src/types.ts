export interface VettedContractor {
  id: string;
  name: string;
  companyName: string;
  avatarUrl: string;
  phone: string;
  email: string;
  tradeType: string;
  certifications: string[];
  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  hourlyRateGBP: number;
  fixedQuoteEstimateGBP?: number;
  availability: 'Immediate (Within 2 hrs)' | 'Today' | 'Within 24 Hours' | 'Scheduled (3-5 Days)';
  distanceMiles: number;
  bio: string;
  isExternalDiscovered?: boolean;
  websiteUrl?: string;
  address?: string;
  invitationStatus?: 'none' | 'invited' | 'registered';
  invitedAt?: string;
}

export interface AIRepairEstimate {
  repairType: string;
  severityLevel: 'Urgent Emergency (24h)' | 'Priority Repair (3-7 Days)' | 'Standard Renovation';
  estimatedCostMinGBP: number;
  estimatedCostMaxGBP: number;
  estimatedDurationDays: number;
  mcpRecommendedGateway: PaymentGateway;
  gatewayReason: string;
  costBreakdown: {
    materialsGBP: number;
    laborGBP: number;
    inspectionEmergencyFeeGBP: number;
  };
  explanation: string;
  requiredMaterials: string[];
  suggestedContractors: VettedContractor[];
}

export interface ExtraPayMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
}

export interface ExtraPayRequest {
  id: string;
  requestedBy: string;
  contractorId: string;
  amountGBP: number;
  reason: string;
  media: ExtraPayMedia[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

export interface UserSubscription {
  planId: 'apprentice' | 'journeyman_pro' | 'essential_landlord' | 'professional_portfolio' | 'insurers_surveyors' | 'enterprise_os';
  planName: string;
  billingInterval: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'trial';
  renewalDate: string;
  monthlyCreditsQuota: number;
  remainingCredits: number;
  transactionFeeRate: string;
  hasEscrowPrePurchasePass?: boolean;
  escrowPassVolumeUsedGBP?: number;
  activeCarePackageId?: 'none' | 'tidy_essentials' | 'tidy_homecare' | 'tidy_safecover';
}

export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  role: 'contractor' | 'homeowner' | 'inspector' | 'admin';
  createdAt: string;
  phone?: string;
  emailVerified?: boolean;
  subscription?: UserSubscription;
  contractorProfile?: {
    companyName: string;
    tradeType: string;
    hourlyRateGBP: number;
    fixedQuoteEstimateGBP: number;
    certifications: string[];
    bio: string;
    avatarUrl: string;
    availability: string;
  };
}

export type PaymentGateway = 'stripe' | 'airwallex';

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'disputed';

export type MilestoneStatus = 'pending' | 'invoiced' | 'escrow_locked' | 'awaiting_approval' | 'paid' | 'disputed' | 'overdue';

export interface PhotoEvidence {
  id: string;
  url: string;
  type: 'baseline' | 'completion';
  timestamp: string;
  geotag: string;
  uploadedBy: 'contractor' | 'homeowner' | 'inspector';
  verifiedByAI?: boolean;
}

export interface DisputeDetails {
  id: string;
  reason: string;
  description: string;
  images: string[];
  createdAt: string;
  resolvedByAdmin?: boolean;
  adminDecision?: 'contractor_revisit' | 'release_funds' | 'refund_client';
  adminNotes?: string;
  resolvedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  percentage: number;
  dueDate: string; // ISO string YYYY-MM-DD
  durationDaysFromStart: number;
  status: MilestoneStatus;
  assignedGateway: PaymentGateway;
  gatewayReason: string;
  paidAt?: string;
  transactionId?: string;
  emailReminderEnabled?: boolean;
  contractorCommitmentStake?: number; // 10% commitment balance
  autoApprovalTimerHours?: number; // 48-hour countdown timer
  autoApprovalExpiresAt?: string;
  platformFeeGBP?: number; // 15% platform commission
  contractorPayoutGBP?: number; // 85% net payout
  photoEvidence?: PhotoEvidence[];
  disputeDetails?: DisputeDetails;
}

export interface RenovationProject {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientId?: string;
  clientPhone?: string;
  assignedContractorId?: string;
  assignedContractorName?: string;
  contractorStatus?: 'pending_acceptance' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  address?: string;
  totalAmount: number;
  currency: string;
  startDate: string;
  estimatedDurationMonths: number;
  status: ProjectStatus;
  scheduleType?: 'standard' | 'long_term';
  milestones: Milestone[];
  extraPayRequests?: ExtraPayRequest[];
  damageDescription?: string;
  damageImages?: string[];
  notes?: string;
  createdAt: string;
  disputeNotes?: string;
  disputeDetails?: DisputeDetails;
}

export type MCPConditionType = 'duration_days' | 'amount_threshold' | 'currency_type' | 'payment_method_type';

export interface MCPRule {
  id: string;
  name: string;
  description: string;
  conditionType: MCPConditionType;
  operator: 'greater_than' | 'less_than_equal' | 'equals' | 'in_list';
  value: string | number;
  targetGateway: PaymentGateway;
  priority: number;
  isActive: boolean;
}

export interface GatewayFeeStructure {
  cardFeePercent: number;
  cardFixedFee: number;
  directDebitFeePercent: number;
  directDebitFixedFee: number;
  fxFeePercent: number;
  maxAuthPeriodDays: number;
}

export interface GatewayConfig {
  stripe: {
    enabled: boolean;
    publishableKey: string;
    secretKeySet: boolean;
    supportedCurrencies: string[];
    fees: GatewayFeeStructure;
  };
  airwallex: {
    enabled: boolean;
    clientId: string;
    apiKey?: string;
    webhookSecret?: string;
    apiKeySet: boolean;
    supportedCurrencies: string[];
    fees: GatewayFeeStructure;
  };
  airwallexResolved?: {
    isConfigured: boolean;
    env: 'demo' | 'prod';
    source?: 'env' | 'secret_manager' | 'firestore_gateway_config' | 'none';
    hasClientId: boolean;
    hasApiKey: boolean;
    hasWebhookSecret: boolean;
    diagnostics?: {
      gcpProjectId: string | null;
      projectResolutionMethod: 'env_var' | 'client_auto_detected' | 'unresolved';
      statusMessage: string;
      reasonCategory:
        | 'configured'
        | 'secrets_not_found'
        | 'permission_denied'
        | 'api_disabled'
        | 'gcp_project_unresolved'
        | 'missing_required_fields'
        | 'not_configured';
    };
  };
  mcpMode: 'auto_route' | 'force_stripe' | 'force_airwallex' | 'client_choice';
  mcpDefaultGateway: PaymentGateway;
}

export interface PaymentTransaction {
  id: string;
  projectId: string;
  projectTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  clientName: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  paymentMethodUsed: string;
  status: 'succeeded' | 'processing' | 'failed';
  gatewayRef: string;
  feeAmount: number;
  consumerEqualizedAmount?: number;
  contractorEqualizedAmount?: number;
  timestamp: string;
}

export interface MCPEvaluationResult {
  recommendedGateway: PaymentGateway;
  reason: string;
  matchingRuleId?: string;
  stripeFee: number;
  airwallexFee: number;
  estimatedSavings: number;
  isStripeAuthExpiredWarning?: boolean;
}

export interface AIAdvisorResponse {
  summary: string;
  suggestedMilestones: {
    title: string;
    percentage: number;
    durationDaysFromStart: number;
    recommendedGateway: PaymentGateway;
    reason: string;
  }[];
  riskAssessment: string;
  gatewayStrategy: string;
  projectedFeeSavings: number;
}

// --- Dream Wall & Renovation Types ---
export interface DreamWallMaterialItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  supplier: string;
  inStock: boolean;
}

export interface DreamWallDesignResult {
  id: string;
  roomType: string;
  originalPhotoUrl: string;
  redesignPhotoUrl: string;
  styleName: string;
  summary: string;
  keyChanges: string[];
  materials: DreamWallMaterialItem[];
  estimatedTotalMaterialsCost: number;
  estimatedLaborCost: number;
  tidyCreditsCost: number;
  rawTokenCogsGBP: number;
  infraCogsGBP: number;
  salePriceGBP: number;
}

// --- Regulatory & Awaab's Law Types ---
export interface HazardReport {
  id: string;
  propertyAddress: string;
  tenantName: string;
  hazardType: 'Damp & Mould' | 'Loss of Heating / Hot Water' | 'Major Water Leak' | 'Structural Defect' | 'Electrical Hazard';
  severity: 'Emergency (24h)' | 'Category 1 Hazard (10-Day RICS)' | 'Standard Repair';
  occupantVulnerability: {
    hasChildrenUnderFive: boolean;
    hasRespiratoryCondition: boolean;
    hasDisabledResident: boolean;
  };
  reportedDate: string;
  investigationDeadline: string; // ISO String
  remediationDeadline: string; // ISO String
  status: 'Investigation Pending' | 'Inspection Scheduled' | 'Remediation In Progress' | 'Resolved & Verified' | 'Breached / Escalated';
  moistureLevelPct?: number;
  form3aEvidenceReady?: boolean;
}

// --- Quoting Agent Types ---
export interface QuoteMaterialItem {
  id: string;
  name: string;
  sku: string;
  merchant: 'Travis Perkins' | 'Screwfix' | 'Jewson' | 'City Plumbing' | 'Selco';
  category: string;
  quantity: number;
  unit: string;
  unitPriceGBP: number;
  totalPriceGBP: number;
  stockStatus: 'In Stock Local Branch' | 'Next Day Delivery' | 'Special Order';
}

export interface QuoteLaborItem {
  id: string;
  tradeRole: string;
  requiredHours: number;
  hourlyRateGBP: number;
  totalLaborGBP: number;
  qualificationRequired: string;
}

export interface QuoteMerchantComparison {
  merchantName: 'Travis Perkins' | 'Screwfix' | 'Jewson' | 'City Plumbing' | 'Selco';
  totalMaterialsGBP: number;
  deliveryTime: string;
  priceDifferencePct: number;
  recommended: boolean;
}

export interface QuotingAgentResponse {
  id: string;
  projectTitle: string;
  tradeCategory: string;
  region: string;
  fairMarketStatus: 'fair_market' | 'under_scoped_risk' | 'predatory_overcharge';
  fairMarketRangeMinGBP: number;
  fairMarketRangeMaxGBP: number;
  recommendedTotalGBP: number;
  materialsTotalGBP: number;
  laborTotalGBP: number;
  statutoryContingencyGBP: number;
  platformFeeGBP: number;
  estimatedDaysToComplete: number;
  materialsList: QuoteMaterialItem[];
  laborList: QuoteLaborItem[];
  merchantComparisons: QuoteMerchantComparison[];
  suggestedMilestones: {
    title: string;
    percentage: number;
    amountGBP: number;
    durationDaysFromStart: number;
    recommendedGateway: PaymentGateway;
    reason: string;
  }[];
  complianceNotes: string[];
  contractorWarningFlags: string[];
  aiConfidenceScorePct: number;
  creditsUsed: number;
}

export interface ExternalDiscoveredContractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  hasEmail: boolean;
  phone: string;
  websiteUrl: string;
  address: string;
  tradeType: string;
  certifications: string[];
  googleRating: number;
  reviewCount: number;
  estimatedHourlyRateGBP: number;
  sourceUrl?: string;
  verificationStatus: 'Email Verified' | 'Phone & Web Verified';
  invited: boolean;
  invitedAt?: string;
  inviteToken?: string;
}

export interface ContractorInvitationLog {
  id: string;
  contractorEmail: string;
  companyName: string;
  tradeCategory: string;
  jobTitle?: string;
  budgetGBP?: number;
  sentAt: string;
  inviteToken: string;
  deliveryStatus: 'delivered' | 'failed';
  emailSubject: string;
  emailBodyHtml: string;
  invitedBy: string;
}

// UK GDPR & PECR Cookie Consent
export interface CookieConsentPreferences {
  strictlyNecessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
  consentVersion: string;
  userIpHash?: string;
}

export interface CookieConsentAudit {
  id: string;
  userId?: string;
  userEmail?: string;
  preferences: CookieConsentPreferences;
  userAgent: string;
  timestamp: string;
}

// Airwallex Checkout Sessions
export type AirwallexCheckoutSessionStatus = 'pending' | 'succeeded' | 'failed' | 'expired';

export interface AirwallexCheckoutSession {
  id: string;
  paymentIntentId?: string;
  clientSecret: string;
  checkoutUrl: string;
  itemType: 'plan' | 'care_package' | 'credits' | 'escrow_pass';
  itemId: string;
  planName: string;
  billingInterval: 'monthly' | 'annual';
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  companyName?: string;
  companyVatNumber?: string;
  billingAddress?: string;
  status: AirwallexCheckoutSessionStatus;
  airwallexStatus?: string;
  airwallexEnv?: 'demo' | 'prod';
  successUrl: string;
  cancelUrl: string;
  createdAt: string;
  completedAt?: string;
  gatewayRef?: string;
  paymentMethodUsed?: string;
  webhookDelivered?: boolean;
}

export interface AirwallexWebhookEvent {
  id?: string;
  name?: string;
  data?: {
    object?: {
      id?: string;
      checkoutSessionId?: string;
      customerEmail?: string;
      customerName?: string;
      amount?: number;
      paymentMethod?: string;
      gatewayRef?: string;
      metadata?: {
        itemId?: string;
        itemType?: string;
        billingInterval?: string;
      };
    };
  };
}
