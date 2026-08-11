import { describe, it, expect } from 'vitest';
import { RenovationProject, Milestone, PaymentGateway } from '../src/types';

describe('Renovation Payment & Escrow Business Logic', () => {

  function calculateProjectTotals(milestones: Milestone[]) {
    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);
    return { totalAmount, totalPercentage };
  }

  function calculateMilestonePayout(amount: number) {
    const platformFeeGBP = Math.round(amount * 0.15 * 100) / 100; // 15% platform commission
    const contractorPayoutGBP = Math.round((amount - platformFeeGBP) * 100) / 100; // 85% net payout
    const contractorCommitmentStake = Math.round(amount * 0.10 * 100) / 100; // 10% commitment stake
    return { platformFeeGBP, contractorPayoutGBP, contractorCommitmentStake };
  }

  function evaluatePaymentGateway(amountGBP: number, durationDays: number): PaymentGateway {
    // Airwallex preferred for high value (> £10,000) or long duration (> 90 days) due to lower FX/card fees
    if (amountGBP > 10000 || durationDays > 90) {
      return 'airwallex';
    }
    return 'stripe';
  }

  describe('Milestone Calculation Engine', () => {
    it('should sum milestone amounts and verify 100% allocation', () => {
      const milestones: Milestone[] = [
        {
          id: 'm1',
          title: 'Deposit & Stripping',
          amount: 5000,
          percentage: 25,
          dueDate: '2026-09-01',
          durationDaysFromStart: 14,
          status: 'paid',
          assignedGateway: 'stripe',
          gatewayReason: 'Standard milestone'
        },
        {
          id: 'm2',
          title: 'First Fix Plumbing & Electrical',
          amount: 7500,
          percentage: 37.5,
          dueDate: '2026-10-01',
          durationDaysFromStart: 45,
          status: 'pending',
          assignedGateway: 'stripe',
          gatewayReason: 'Standard milestone'
        },
        {
          id: 'm3',
          title: 'Final Signoff',
          amount: 7500,
          percentage: 37.5,
          dueDate: '2026-11-01',
          durationDaysFromStart: 75,
          status: 'pending',
          assignedGateway: 'stripe',
          gatewayReason: 'Final signoff'
        }
      ];

      const { totalAmount, totalPercentage } = calculateProjectTotals(milestones);
      expect(totalAmount).toBe(20000);
      expect(totalPercentage).toBe(100);
    });

    it('should calculate 15% platform commission and 85% contractor payout accurately', () => {
      const amount = 10000;
      const { platformFeeGBP, contractorPayoutGBP, contractorCommitmentStake } = calculateMilestonePayout(amount);

      expect(platformFeeGBP).toBe(1500);
      expect(contractorPayoutGBP).toBe(8500);
      expect(contractorCommitmentStake).toBe(1000);
      expect(platformFeeGBP + contractorPayoutGBP).toBe(amount);
    });
  });

  describe('Smart MCP Gateway Router', () => {
    it('should route standard short-term payments <= £10k to Stripe', () => {
      const gateway = evaluatePaymentGateway(4500, 30);
      expect(gateway).toBe('stripe');
    });

    it('should route high-value payments > £10k to Airwallex for lower fees', () => {
      const gateway = evaluatePaymentGateway(15000, 30);
      expect(gateway).toBe('airwallex');
    });

    it('should route long-term milestones > 90 days to Airwallex to avoid card authorization expiry', () => {
      const gateway = evaluatePaymentGateway(5000, 120);
      expect(gateway).toBe('airwallex');
    });
  });
});
