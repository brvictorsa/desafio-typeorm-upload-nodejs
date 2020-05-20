import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const count = await this.count();
    const income = count > 0 ? await this.getSumBalanceOfType('income') : 0;
    const outcome = count > 0 ? await this.getSumBalanceOfType('outcome') : 0;

    const balance: Balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return balance;
  }

  private async getSumBalanceOfType(type: string): Promise<number> {
    const transactions = await this.find({ where: { type } });

    const balanceValue = transactions
      .map(t => t.value)
      .reduce(
        (incomeSum, incomeCurrentValue) => incomeSum + incomeCurrentValue,
        0,
      );

    return balanceValue;
  }
}

export default TransactionsRepository;
