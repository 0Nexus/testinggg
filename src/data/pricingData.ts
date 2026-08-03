export interface PlanTierDefinition {
  id: 'apprentice' | 'journeyman_pro' | 'essential_landlord' | 'professional_portfolio' | 'insurers_surveyors' | 'enterprise_os';
  name: string;
  subtitle: string;
  targetRole: string;
  monthlyPriceGBP: number;
  annualPriceGBP: number;
  monthlyCredits: number;
  transactionRate: string;
  isPopular?: boolean;
  features: string[];
  badgeColor: string;
}

export interface CarePackageDefinition {
  id: 'tidy_essentials' | 'tidy_homecare' | 'tidy_safecover';
  name: string;
  monthlyPriceGBP: number;
  tagline: string;
  description: string;
  features: string[];
  badge: string;
}

export interface CreditTokenScheduleItem {
  operationCategory: string;
  useCase: string;
  aiEngine: string;
  creditsRequired: number;
  equivGBP: string;
}

export const PLAN_TIERS: PlanTierDefinition[] = [
  {
    id: 'apprentice',
    name: 'Apprentice',
    subtitle: 'Entry & Verification',
    targetRole: 'Trades & Entry Level',
    monthlyPriceGBP: 0,
    annualPriceGBP: 0,
    monthlyCredits: 5000,
    transactionRate: '10% GTV (Capped at £150)',
    badgeColor: 'bg-slate-700 text-slate-200',
    features: [
      'Centralized Notification Hub',
      'Trade lead aggregator access',
      'Basic credential verification',
      'Mobile app access & job logger',
      '10% GTV fee capped strictly at £150 per milestone'
    ]
  },
  {
    id: 'journeyman_pro',
    name: 'Journeyman Pro',
    subtitle: 'Professional Trades',
    targetRole: 'Professional Tradespeople',
    monthlyPriceGBP: 40.00,
    annualPriceGBP: 400.00, // 17% discount
    monthlyCredits: 100000,
    transactionRate: '5% GTV Reduced Fee',
    isPopular: true,
    badgeColor: 'bg-[#FF7F00] text-slate-950 font-black',
    features: [
      'BSA 2022 Golden Thread Ledger',
      'Automated CIS tax withholding',
      'Xero & QuickBooks accounting sync',
      'Professional Passport 2.0 digital ID',
      'Reduced 5% platform fee structure'
    ]
  },
  {
    id: 'essential_landlord',
    name: 'Essential Landlord',
    subtitle: 'Property Owners',
    targetRole: 'Landlords (Up to 5 Properties)',
    monthlyPriceGBP: 16.50,
    annualPriceGBP: 165.00,
    monthlyCredits: 30000,
    transactionRate: '5% Everyday Living Fee',
    badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-800',
    features: [
      'Renters\' Rights Act Section 8 compliance logs',
      'Open Banking rent matching engine',
      'Automated compliance alerts (up to 5 properties)',
      'Digital tenant repair logging portal',
      'Standard 90-day escrow protection'
    ]
  },
  {
    id: 'professional_portfolio',
    name: 'Professional Portfolio',
    subtitle: 'Multi-Property Landlords',
    targetRole: 'Portfolio Managers (Up to 50 Units)',
    monthlyPriceGBP: 99.00,
    annualPriceGBP: 990.00,
    monthlyCredits: 150000,
    transactionRate: 'Excess Fee £1.50 / work order',
    badgeColor: 'bg-purple-950 text-purple-300 border border-purple-800',
    features: [
      'Up to 50 residential units supported',
      'Awaab\'s Law 24h / 10-day hazard countdown timers',
      'Portfolio risk dashboard & compliance tracking',
      'Bulk trade contractor dispatching',
      'Form 3A statutory evidence PDF generator'
    ]
  },
  {
    id: 'insurers_surveyors',
    name: 'Insurers & Surveyors',
    subtitle: 'Valuation & Risk Claims',
    targetRole: 'Surveyors, Loss Adjusters & Insurers',
    monthlyPriceGBP: 165.00,
    annualPriceGBP: 1650.00,
    monthlyCredits: 200000,
    transactionRate: 'API Fee £5.00 flat / validation',
    badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
    features: [
      'Automated RICS survey mapping',
      'Straight-through claims processing',
      'Open API access & custom webhooks',
      'Building Safety Act 2022 audit exports',
      'Geotagged photo evidence verification'
    ]
  },
  {
    id: 'enterprise_os',
    name: 'Enterprise OS',
    subtitle: 'Housing Associations',
    targetRole: 'Councils & Housing Associations',
    monthlyPriceGBP: -1, // Bespoke
    annualPriceGBP: -1, // Bespoke
    monthlyCredits: -1, // Custom Quota
    transactionRate: 'Pre-Committed Enterprise',
    badgeColor: 'bg-blue-950 text-blue-300 border border-blue-800',
    features: [
      'Autodesk Revit & Matterport 3D digital twins',
      'Direct CASS 10/15 regulatory export engine',
      'Custom SLA & dedicated account manager',
      'Bespoke multi-tenant housing authority portal',
      'Unlimited custom credit quota'
    ]
  }
];

export const CARE_PACKAGES: CarePackageDefinition[] = [
  {
    id: 'tidy_essentials',
    name: 'Tidy Essentials',
    monthlyPriceGBP: 15.40,
    tagline: 'Annual Gas Safe Boiler Service & CO Monitoring',
    description: 'Essential annual maintenance and 24/7 smart safety tracking for single-property homeowners.',
    badge: 'Popular Entry Care',
    features: [
      'Annual Gas Safe boiler inspection & service',
      'Smart carbon monoxide safety monitoring',
      '24/7 emergency triage tracking with AI agent',
      'Guaranteed emergency contractor response'
    ]
  },
  {
    id: 'tidy_homecare',
    name: 'Tidy HomeCare',
    monthlyPriceGBP: 22.00,
    tagline: 'Heating, Plumbing Leakage & Moisture Protection',
    description: 'Comprehensive central heating, drainage leak protection, and smart damp prevention.',
    badge: 'Best Value for Families',
    features: [
      'Includes all Tidy Essentials features',
      'Central heating system continuous monitoring',
      'Plumbing & drainage leakage protection',
      'Smart moisture mapping to prevent damp & mould'
    ]
  },
  {
    id: 'tidy_safecover',
    name: 'Tidy SafeCover',
    monthlyPriceGBP: 33.00,
    tagline: 'Full Electrics, Predictive AI Failure & RICS Triage',
    description: 'Total home peace of mind with predictive appliance failure alerts and priority emergency dispatch.',
    badge: 'Ultimate Home Protection',
    features: [
      'Includes all Tidy HomeCare features',
      'Home electrics & circuit safety monitoring',
      'Smart appliance predictive failure alerts',
      'Automated RICS survey triage & priority dispatch'
    ]
  }
];

export const CREDIT_SCHEDULE: CreditTokenScheduleItem[] = [
  {
    operationCategory: 'Low-Complexity Task',
    useCase: 'Chat Query / Basic Triage',
    aiEngine: 'Flash-Lite',
    creditsRequired: 10,
    equivGBP: '£0.005'
  },
  {
    operationCategory: 'Mid-Complexity Scoping',
    useCase: 'Multimodal Image BOQ',
    aiEngine: 'Gemini Flash',
    creditsRequired: 50,
    equivGBP: '£0.025'
  },
  {
    operationCategory: 'High-Complexity Verification',
    useCase: 'OCR / Credential Audit',
    aiEngine: 'Document AI',
    creditsRequired: 100,
    equivGBP: '£0.050'
  },
  {
    operationCategory: 'Enterprise Legal Audit',
    useCase: 'BSA 2022 / Awaab\'s Review',
    aiEngine: 'Gemini Pro',
    creditsRequired: 250,
    equivGBP: '£0.125'
  },
  {
    operationCategory: 'Immutable Ledger Commit',
    useCase: 'SHA-256 Block Write',
    aiEngine: 'Cloud Ledger',
    creditsRequired: 1,
    equivGBP: '£0.0005'
  }
];

export const ESCROW_BOOKING_FEES = {
  minorWorksMaxGBP: 1000,
  minorWorksFeeGBP: 16.50,
  mediumWorksMaxGBP: 3000,
  mediumWorksFeeGBP: 38.50,
  majorWorksFeeGBP: 82.50,
  onDemandPercentage: 5.5
};

export const STANDARD_ESCROW_POLICY = {
  standardSplitPartyRatePct: 2.25,
  standardSplitFixedGBP: 0.30,
  totalProcessingChargePct: 4.56, // 50/50 split
  trustDiscountPartyRatePct: 1.90,
  trustDiscountFixedGBP: 0.30,
  apprenticeCapGBP: 150.00,
  escrowPrePurchasePassCostGBP: 500.00,
  escrowPrePurchasePassLimitGBP: 25000.00,
  escrowPrePurchasePassSavingsGBP: 1125.00,
  sharedSecurityBonusCredits: 50000
};
