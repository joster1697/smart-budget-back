export interface AmortizationPeriod {
  term: number;
  principal_paid: number;
  interest_paid: number;
  insurance_cost: number;
  other_fees: number;
  total_payment: number;
  remaining_balance: number;
}

export interface OptimizedAmortizationPeriod extends AmortizationPeriod {
  extra_payment: number;
}

export interface SimulationResult {
  original_schedule: AmortizationPeriod[];
  optimized_schedule: OptimizedAmortizationPeriod[];
  summary: {
    original_total_interest: number;
    optimized_total_interest: number;
    interest_savings: number;
    original_term: number;
    optimized_term: number;
    months_saved: number;
    original_total_cost: number;
    optimized_total_cost: number;
    total_savings: number;
  };
}

export class DebtCalculatorService {
  /**
   * Generates a standard French Amortization schedule.
   * Annuity formula: A = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
   */
  static generateAmortizationSchedule(
    balance: number,
    annualRate: number,
    remainingTerms: number,
    insuranceCost: number,
    otherFees: number
  ): AmortizationPeriod[] {
    const schedule: AmortizationPeriod[] = [];
    const monthlyRate = annualRate / 12 / 100;
    let currentBalance = balance;

    // Calculate fixed monthly financial annuity A (principal + interest)
    let annuity = 0;
    if (monthlyRate === 0) {
      annuity = balance / remainingTerms;
    } else {
      annuity =
        balance *
        (monthlyRate * Math.pow(1 + monthlyRate, remainingTerms)) /
        (Math.pow(1 + monthlyRate, remainingTerms) - 1);
    }

    for (let t = 1; t <= remainingTerms; t++) {
      if (currentBalance <= 0) break;

      const interestPaid = currentBalance * monthlyRate;
      let principalPaid = annuity - interestPaid;

      // Adjust in the last payment or if principal exceeds remaining balance
      if (principalPaid >= currentBalance || t === remainingTerms) {
        principalPaid = currentBalance;
      }

      currentBalance = currentBalance - principalPaid;
      // Precision rounding
      if (currentBalance < 0.01) {
        currentBalance = 0;
      }

      const totalPayment = principalPaid + interestPaid + insuranceCost + otherFees;

      schedule.push({
        term: t,
        principal_paid: Number(principalPaid.toFixed(2)),
        interest_paid: Number(interestPaid.toFixed(2)),
        insurance_cost: Number(insuranceCost.toFixed(2)),
        other_fees: Number(otherFees.toFixed(2)),
        total_payment: Number(totalPayment.toFixed(2)),
        remaining_balance: Number(currentBalance.toFixed(2)),
      });
    }

    return schedule;
  }

  /**
   * Simulates extraordinary payments and compares schedules.
   */
  static simulateExtraPayments(
    balance: number,
    annualRate: number,
    remainingTerms: number,
    insuranceCost: number,
    otherFees: number,
    extraPaymentAmount: number,
    extraPaymentType: "one_time" | "monthly"
  ): SimulationResult {
    // 1. Generate original schedule
    const originalSchedule = this.generateAmortizationSchedule(
      balance,
      annualRate,
      remainingTerms,
      insuranceCost,
      otherFees
    );

    // 2. Generate optimized schedule
    const optimizedSchedule: OptimizedAmortizationPeriod[] = [];
    const monthlyRate = annualRate / 12 / 100;
    let currentBalance = balance;

    // Calculate the baseline monthly annuity A to keep the payment constant
    let annuity = 0;
    if (monthlyRate === 0) {
      annuity = balance / remainingTerms;
    } else {
      annuity =
        balance *
        (monthlyRate * Math.pow(1 + monthlyRate, remainingTerms)) /
        (Math.pow(1 + monthlyRate, remainingTerms) - 1);
    }

    // Maximum safe iterations (e.g. up to twice the original term) to prevent infinite loops
    const maxIterations = remainingTerms * 2;

    for (let t = 1; t <= maxIterations; t++) {
      if (currentBalance <= 0) break;

      const interestPaid = currentBalance * monthlyRate;
      let principalPaid = annuity - interestPaid;

      // Adjust standard payment principal
      if (principalPaid >= currentBalance) {
        principalPaid = currentBalance;
      }

      let extraPaid = 0;
      const canPayExtra = currentBalance - principalPaid > 0;

      if (canPayExtra && extraPaymentAmount > 0) {
        if (extraPaymentType === "monthly" || (extraPaymentType === "one_time" && t === 1)) {
          extraPaid = Math.min(extraPaymentAmount, currentBalance - principalPaid);
        }
      }

      currentBalance = currentBalance - principalPaid - extraPaid;

      if (currentBalance < 0.01) {
        currentBalance = 0;
      }

      const totalPayment =
        principalPaid + interestPaid + insuranceCost + otherFees + extraPaid;

      optimizedSchedule.push({
        term: t,
        principal_paid: Number(principalPaid.toFixed(2)),
        interest_paid: Number(interestPaid.toFixed(2)),
        insurance_cost: Number(insuranceCost.toFixed(2)),
        other_fees: Number(otherFees.toFixed(2)),
        extra_payment: Number(extraPaid.toFixed(2)),
        total_payment: Number(totalPayment.toFixed(2)),
        remaining_balance: Number(currentBalance.toFixed(2)),
      });
    }

    // 3. Compile calculations
    const originalTotalInterest = originalSchedule.reduce((sum, item) => sum + item.interest_paid, 0);
    const optimizedTotalInterest = optimizedSchedule.reduce((sum, item) => sum + item.interest_paid, 0);
    const interestSavings = originalTotalInterest - optimizedTotalInterest;

    const originalTotalCost = originalSchedule.reduce((sum, item) => sum + item.total_payment, 0);
    const optimizedTotalCost = optimizedSchedule.reduce((sum, item) => sum + item.total_payment, 0);
    const totalSavings = originalTotalCost - optimizedTotalCost;

    return {
      original_schedule: originalSchedule,
      optimized_schedule: optimizedSchedule,
      summary: {
        original_total_interest: Number(originalTotalInterest.toFixed(2)),
        optimized_total_interest: Number(optimizedTotalInterest.toFixed(2)),
        interest_savings: Number(interestSavings.toFixed(2)),
        original_term: originalSchedule.length,
        optimized_term: optimizedSchedule.length,
        months_saved: originalSchedule.length - optimizedSchedule.length,
        original_total_cost: Number(originalTotalCost.toFixed(2)),
        optimized_total_cost: Number(optimizedTotalCost.toFixed(2)),
        total_savings: Number(totalSavings.toFixed(2)),
      },
    };
  }
}
