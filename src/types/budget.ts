export interface BudgetSnapshot {
  monthlyTarget: number;
  totalCommitments: number;
  spentThisMonth: number;
  daysRemaining: number;
  dailyBudget: number;
  rollingOffset: number;
  bigEventAmortization: number;
  wishlistFund: number;
  surplus: number;
}

export interface BigEvent {
  id: string;
  name: string;
  amount: number;
  date: string;
  amortizedDaily: number;
}
