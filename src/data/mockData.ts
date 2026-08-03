import { RenovationProject, MCPRule, GatewayConfig, PaymentTransaction, VettedContractor } from '../types';

export const initialVettedContractors: VettedContractor[] = [
  {
    id: 'ctr-101',
    name: 'James Callaway',
    companyName: 'Callaway Emergency Plumbing & Heating',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    phone: '+44 20 7946 0192',
    email: 'j.callaway@callawayplumbing.co.uk',
    tradeType: 'Emergency Plumbing, Boilers & Water Leaks',
    certifications: ['Gas Safe Registered (#582091)', 'WaterSafe Approved', 'NVQ Level 3 Plumbing'],
    rating: 4.9,
    reviewCount: 128,
    completedJobsCount: 184,
    hourlyRateGBP: 75,
    fixedQuoteEstimateGBP: 450,
    availability: 'Immediate (Within 2 hrs)',
    distanceMiles: 2.4,
    bio: '15+ years experience responding to burst pipes, boiler breakdowns, and emergency leak containment in London and Surrey.'
  },
  {
    id: 'ctr-102',
    name: 'David O\'Connor',
    companyName: 'O\'Connor Damp & Mould Remediation Ltd',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    phone: '+44 20 7946 0881',
    email: 'david@oconnordamp.co.uk',
    tradeType: 'Damp & Mould Specialist (Awaab\'s Law Certified)',
    certifications: ['Property Care Assoc. (PCA) Certified', 'RICS Approved Surveyor', 'IICRC Mold Remediation'],
    rating: 4.95,
    reviewCount: 210,
    completedJobsCount: 290,
    hourlyRateGBP: 85,
    fixedQuoteEstimateGBP: 720,
    availability: 'Today',
    distanceMiles: 3.8,
    bio: 'Specialist in structural damp proofing, thermal imaging leak detection, PIV ventilation system installation, and statutory Category 1 Mould eradication.'
  },
  {
    id: 'ctr-103',
    name: 'Marcus Sterling',
    companyName: 'Sterling Electrical & NICEIC Contractors',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    phone: '+44 20 7946 0332',
    email: 'marcus@sterlingelectrical.co.uk',
    tradeType: 'Electrical Faults, Rewiring & Consumer Units',
    certifications: ['NICEIC Approved Contractor', 'BS 7671 18th Edition Qualified', 'Part P Electrical Safety'],
    rating: 4.88,
    reviewCount: 95,
    completedJobsCount: 142,
    hourlyRateGBP: 70,
    fixedQuoteEstimateGBP: 380,
    availability: 'Within 24 Hours',
    distanceMiles: 5.1,
    bio: 'Full domestic and commercial electrical safety inspections, emergency circuit repair, consumer unit replacements, and EICR certification.'
  },
  {
    id: 'ctr-104',
    name: 'Elena Rostova',
    companyName: 'Apex Roofing & Structural Building Ltd',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    phone: '+44 20 7946 0774',
    email: 'elena@apexroofing.co.uk',
    tradeType: 'Roof Repairs, Slate Masonry & Structural Framing',
    certifications: ['Guild of Master Craftsmen', 'National Federation of Roofing Contractors', 'TrustMark Registered'],
    rating: 4.92,
    reviewCount: 167,
    completedJobsCount: 220,
    hourlyRateGBP: 90,
    fixedQuoteEstimateGBP: 950,
    availability: 'Scheduled (3-5 Days)',
    distanceMiles: 4.2,
    bio: 'Specializing in slate & tile roof leak repairs, chimney stack rebuilding, structural RSJ beam placement, and weatherproofing extensions.'
  }
];

export const initialProjects: RenovationProject[] = [
  {
    id: 'proj-001',
    title: 'Heritage Villa Full Restoration & Extension',
    clientName: 'Arthur & Eleanor Vance',
    clientEmail: 'a.vance@example.com',
    clientPhone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, San Francisco, CA',
    totalAmount: 120000,
    currency: 'USD',
    startDate: '2026-06-01',
    estimatedDurationMonths: 18,
    status: 'active',
    createdAt: '2026-05-15',
    notes: 'Long-term 18-month renovation. Early deposit on Stripe; main long-term installments (Months 4-18) routed via Airwallex to bypass Stripe 90-day pre-auth expiration and reduce FX/Direct Debit fees.',
    milestones: [
      {
        id: 'ms-101',
        title: 'Initial Architectural Deposit & Permits',
        description: 'Initial site plan, architectural blue prints, and municipal permit submittals.',
        amount: 12000,
        percentage: 10,
        dueDate: '2026-06-01',
        durationDaysFromStart: 0,
        status: 'paid',
        assignedGateway: 'stripe',
        gatewayReason: 'Short term initial deposit (< 30 days) processed instantly via Stripe Card.',
        paidAt: '2026-06-01T10:15:00Z',
        transactionId: 'tx-001',
        emailReminderEnabled: true
      },
      {
        id: 'ms-102',
        title: 'Foundation & Structural Framing',
        description: 'Excavation, poured concrete footings, and load-bearing timber framing.',
        amount: 30000,
        percentage: 25,
        dueDate: '2026-08-15',
        durationDaysFromStart: 75,
        status: 'paid',
        assignedGateway: 'stripe',
        gatewayReason: 'Within 90-day threshold, fast milestone confirmation.',
        paidAt: '2026-08-14T14:20:00Z',
        transactionId: 'tx-002',
        emailReminderEnabled: false
      },
      {
        id: 'ms-103',
        title: 'Roofing, Insulation & Rough-In Utilities',
        description: 'Slate roof installation, thermal insulation, electrical wiring, and plumbing rough-in.',
        amount: 30000,
        percentage: 25,
        dueDate: '2026-12-01',
        durationDaysFromStart: 180,
        status: 'invoiced',
        assignedGateway: 'airwallex',
        gatewayReason: 'Duration is 180 days (> 90 days Stripe limit). Airwallex Direct Debit handles long-term schedule seamlessly without re-authorization.',
        emailReminderEnabled: true
      },
      {
        id: 'ms-104',
        title: 'Custom Joinery, Kitchen & Bathrooms',
        description: 'Custom hardwood cabinetry, marble countertops, fixtures, and luxury tile work.',
        amount: 30000,
        percentage: 25,
        dueDate: '2027-05-01',
        durationDaysFromStart: 330,
        status: 'pending',
        assignedGateway: 'airwallex',
        gatewayReason: 'Duration 330 days (> 90 days Stripe limit). Airwallex recurring schedule locks in direct debit.',
        emailReminderEnabled: true
      },
      {
        id: 'ms-105',
        title: 'Final Exterior Landscaping & Handover',
        description: 'Final paint coat, land grading, paving, quality sign-off, and client key handover.',
        amount: 18000,
        percentage: 15,
        dueDate: '2027-11-30',
        durationDaysFromStart: 540,
        status: 'pending',
        assignedGateway: 'airwallex',
        gatewayReason: 'Duration 540 days (18 months). Airwallex handles multi-year installment agreements without auth expiry.',
        emailReminderEnabled: false
      }
    ]
  },
  {
    id: 'proj-002',
    title: 'Modern Kitchen & Living Room Remodel',
    clientName: 'Dr. Sophia Martinez',
    clientEmail: 'sophia.m@example.com',
    clientPhone: '+1 (555) 876-5432',
    address: '1088 Ocean Drive, Miami, FL',
    totalAmount: 38000,
    currency: 'USD',
    startDate: '2026-07-01',
    estimatedDurationMonths: 2,
    status: 'active',
    createdAt: '2026-06-20',
    notes: 'Fast 60-day residential remodeling project. Entire project falls under 90-day threshold, so Stripe is recommended by MCP rule engine.',
    milestones: [
      {
        id: 'ms-201',
        title: 'Demolition & Materials Order Deposit',
        description: 'Cabinets order deposit and wall removal demolition.',
        amount: 11400,
        percentage: 30,
        dueDate: '2026-07-01',
        durationDaysFromStart: 0,
        status: 'paid',
        assignedGateway: 'stripe',
        gatewayReason: 'Immediate payment under 90 days. Stripe instant checkout.',
        paidAt: '2026-07-01T09:00:00Z',
        transactionId: 'tx-003'
      },
      {
        id: 'ms-202',
        title: 'Cabinetry & Appliance Installation',
        description: 'Custom cabinet fit-out and high-end appliance hookups.',
        amount: 19000,
        percentage: 50,
        dueDate: '2026-08-01',
        durationDaysFromStart: 31,
        status: 'pending',
        assignedGateway: 'stripe',
        gatewayReason: 'Duration 31 days (<= 90 days threshold). Standard Stripe flow.'
      },
      {
        id: 'ms-203',
        title: 'Final Countertops & Punch List Sign-Off',
        description: 'Quartz countertop polish, splashback tile, and final walkthrough.',
        amount: 7600,
        percentage: 20,
        dueDate: '2026-08-28',
        durationDaysFromStart: 58,
        status: 'pending',
        assignedGateway: 'stripe',
        gatewayReason: 'Duration 58 days (<= 90 days threshold). Standard Stripe flow.'
      }
    ]
  },
  {
    id: 'proj-003',
    title: 'Commercial Office Fit-Out & Tech Hub',
    clientName: 'Apex Innovations Ltd',
    clientEmail: 'finance@apexinnovations.io',
    clientPhone: '+44 20 7946 0912',
    address: '25 Finsbury Circus, London, UK',
    totalAmount: 250000,
    currency: 'GBP',
    startDate: '2026-05-01',
    estimatedDurationMonths: 12,
    status: 'active',
    createdAt: '2026-04-10',
    notes: 'Large commercial project billed over 12 months in monthly installments. Airwallex selected due to > 90 days duration, high transaction volume, and BACS direct debit support.',
    milestones: [
      {
        id: 'ms-301',
        title: 'Project Commitment & Initial Procurement',
        description: 'Contract signing, architectural layouts, HVAC & glass partition deposit.',
        amount: 50000,
        percentage: 20,
        dueDate: '2026-05-01',
        durationDaysFromStart: 0,
        status: 'paid',
        assignedGateway: 'airwallex',
        gatewayReason: 'High value multi-currency GBP project with Airwallex low transaction fee.',
        paidAt: '2026-05-02T11:30:00Z',
        transactionId: 'tx-004'
      },
      {
        id: 'ms-302',
        title: 'Phase 1: Glass Partitions & MEP Services',
        description: 'Acoustic glass walls, raised access flooring, cabling.',
        amount: 62500,
        percentage: 25,
        dueDate: '2026-08-01',
        durationDaysFromStart: 92,
        status: 'invoiced',
        assignedGateway: 'airwallex',
        gatewayReason: 'Duration 92 days (> 90 days limit). Airwallex Direct Debit schedule.'
      },
      {
        id: 'ms-303',
        title: 'Phase 2: Executive Suites & Boardrooms',
        description: 'AV equipment integration, custom furniture, lighting control.',
        amount: 62500,
        percentage: 25,
        dueDate: '2026-11-01',
        durationDaysFromStart: 184,
        status: 'pending',
        assignedGateway: 'airwallex',
        gatewayReason: 'Duration 184 days (> 90 days limit). Airwallex recurring collection.'
      },
      {
        id: 'ms-304',
        title: 'Phase 3: Cafeteria & Final Commissioning',
        description: 'Commercial kitchen installation, fire safety sign-off, final handover.',
        amount: 75000,
        percentage: 30,
        dueDate: '2027-04-30',
        durationDaysFromStart: 364,
        status: 'pending',
        assignedGateway: 'airwallex',
        gatewayReason: 'Duration 364 days (12 months). Airwallex long-term mandate.'
      }
    ]
  }
];

export const defaultMCPRules: MCPRule[] = [
  {
    id: 'rule-01',
    name: 'Long-Term Installments (>90 Days)',
    description: 'Stripe card authorizations and payment intents expire or face friction past 90 days. Any installment scheduled beyond 90 days is automatically routed to Airwallex for long-term direct debit or payment links.',
    conditionType: 'duration_days',
    operator: 'greater_than',
    value: 90,
    targetGateway: 'airwallex',
    priority: 1,
    isActive: true
  },
  {
    id: 'rule-02',
    name: 'Short-Term Milestones (<=90 Days)',
    description: 'Milestones due within 90 days are routed to Stripe for instant card processing, Apple Pay, and fast payout.',
    conditionType: 'duration_days',
    operator: 'less_than_equal',
    value: 90,
    targetGateway: 'stripe',
    priority: 2,
    isActive: true
  },
  {
    id: 'rule-03',
    name: 'High-Value Milestones (>$50,000)',
    description: 'Large commercial amounts benefit from Airwallex lower capped fees and direct bank transfer rails.',
    conditionType: 'amount_threshold',
    operator: 'greater_than',
    value: 50000,
    targetGateway: 'airwallex',
    priority: 3,
    isActive: true
  },
  {
    id: 'rule-04',
    name: 'International Multi-Currency Collection',
    description: 'Collect non-domestic payments via Airwallex global virtual bank accounts to save up to 80% on FX conversion fees.',
    conditionType: 'currency_type',
    operator: 'in_list',
    value: 'EUR,GBP,AUD,CAD,SGD,HKD',
    targetGateway: 'airwallex',
    priority: 4,
    isActive: true
  }
];

export const defaultGatewayConfig: GatewayConfig = {
  stripe: {
    enabled: true,
    publishableKey: 'pk_test_51NxTR24...StripeDemoKey',
    secretKeySet: true,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    fees: {
      cardFeePercent: 2.9,
      cardFixedFee: 0.30,
      directDebitFeePercent: 0.8,
      directDebitFixedFee: 5.00,
      fxFeePercent: 2.0,
      maxAuthPeriodDays: 90
    }
  },
  airwallex: {
    enabled: true,
    clientId: 'awx_client_live_8932719823',
    apiKeySet: true,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD', 'JPY', 'NZD'],
    fees: {
      cardFeePercent: 1.8,
      cardFixedFee: 0.20,
      directDebitFeePercent: 0.3,
      directDebitFixedFee: 0.50,
      fxFeePercent: 0.4,
      maxAuthPeriodDays: 1095 // 3 years
    }
  },
  mcpMode: 'auto_route',
  mcpDefaultGateway: 'airwallex'
};

export const initialTransactions: PaymentTransaction[] = [
  {
    id: 'tx-001',
    projectId: 'proj-001',
    projectTitle: 'Heritage Villa Full Restoration & Extension',
    milestoneId: 'ms-101',
    milestoneTitle: 'Initial Architectural Deposit & Permits',
    clientName: 'Arthur & Eleanor Vance',
    amount: 12000,
    currency: 'USD',
    gateway: 'stripe',
    paymentMethodUsed: 'Visa ending in 4242',
    status: 'succeeded',
    gatewayRef: 'pi_3MtwB2LkdIwRJK23001',
    feeAmount: 348.30,
    timestamp: '2026-06-01T10:15:00Z'
  },
  {
    id: 'tx-002',
    projectId: 'proj-001',
    projectTitle: 'Heritage Villa Full Restoration & Extension',
    milestoneId: 'ms-102',
    milestoneTitle: 'Foundation & Structural Framing',
    clientName: 'Arthur & Eleanor Vance',
    amount: 30000,
    currency: 'USD',
    gateway: 'stripe',
    paymentMethodUsed: 'Mastercard ending in 8819',
    status: 'succeeded',
    gatewayRef: 'pi_3MtwX1LkdIwRJK23002',
    feeAmount: 870.30,
    timestamp: '2026-08-14T14:20:00Z'
  },
  {
    id: 'tx-003',
    projectId: 'proj-002',
    projectTitle: 'Modern Kitchen & Living Room Remodel',
    milestoneId: 'ms-201',
    milestoneTitle: 'Demolition & Materials Order Deposit',
    clientName: 'Dr. Sophia Martinez',
    amount: 11400,
    currency: 'USD',
    gateway: 'stripe',
    paymentMethodUsed: 'Apple Pay (Visa 1092)',
    status: 'succeeded',
    gatewayRef: 'pi_3MtwZ9LkdIwRJK23003',
    feeAmount: 330.90,
    timestamp: '2026-07-01T09:00:00Z'
  },
  {
    id: 'tx-004',
    projectId: 'proj-003',
    projectTitle: 'Commercial Office Fit-Out & Tech Hub',
    milestoneId: 'ms-301',
    milestoneTitle: 'Project Commitment & Initial Procurement',
    clientName: 'Apex Innovations Ltd',
    amount: 50000,
    currency: 'GBP',
    gateway: 'airwallex',
    paymentMethodUsed: 'BACS Direct Bank Transfer',
    status: 'succeeded',
    gatewayRef: 'awx_pay_908234190823',
    feeAmount: 150.50, // Airwallex lower direct transfer rate
    timestamp: '2026-05-02T11:30:00Z'
  }
];
