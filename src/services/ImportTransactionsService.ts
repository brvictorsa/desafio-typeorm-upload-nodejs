import { getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  transactions: Transaction[];
}

class ImportTransactionsService {
  public async execute({ transactions }: Request): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const registeredTransactions = await transactionRepository.create(
      transactions,
    );

    await transactionRepository.save(registeredTransactions);

    return registeredTransactions;
  }
}

export default ImportTransactionsService;
