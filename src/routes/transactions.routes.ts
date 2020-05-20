import path from 'path';
import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import multer from 'multer';
import multerConfig from '../config/upload';
import ParseCsvFile from '../utils/parseCsvFile';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';

import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import CategoriesRepository from '../repositories/CategoriesRepository';
import CreateCategoryService from '../services/CreateCategoryService';
import Transaction from '../models/Transaction';

const transactionsRouter = Router();
const upload = multer(multerConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find({
    select: ['id', 'title', 'value', 'type', 'category'],
    relations: ['category'],
  });

  const balance = await transactionsRepository.getBalance();

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const categoriesRepository = getCustomRepository(CategoriesRepository);
  let categoryFound = await categoriesRepository.findByTitle(category);

  if (!categoryFound) {
    const createCategoryService = new CreateCategoryService();
    categoryFound = await createCategoryService.execute({ title: category });
  }

  const createTransactionService = new CreateTransactionService();

  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category_id: categoryFound.id,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute({ id });

  return response.status(204).json();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    // salva o arquivo na pasta com multer
    const { filename } = request.file;
    const { directory } = multerConfig;

    // read csv file: https://www.notion.so/Importando-arquivos-CSV-com-Node-js-2172338480cb47e28a5d3ed9981c38a0
    const csvParse = new ParseCsvFile();
    const parsedTransactions = await csvParse.parse({
      filePath: path.join(directory, filename),
    });

    const transactionList: Transaction[] = [];
    const categoriesRepository = getCustomRepository(CategoriesRepository);

    for (let index = 0; index < parsedTransactions.length; index++) {
      const { title, type, value, category } = parsedTransactions[index];

      let categoryFound = await categoriesRepository.findByTitle(category);

      if (!categoryFound) {
        const createCategoryService = new CreateCategoryService();
        categoryFound = await createCategoryService.execute({
          title: category,
        });
      }

      const newTransaction = {
        title,
        value,
        type,
        category_id: categoryFound.id,
        category: categoryFound,
      };

      transactionList.push(newTransaction as Transaction);
    }

    // chama o ImportTransactionsService para salvar
    const importTransactionService = new ImportTransactionsService();
    const registeredTransactions = await importTransactionService.execute({
      transactions: transactionList,
    });

    return response.json({
      directory,
      file: filename,
      transactions: registeredTransactions,
    });
  },
);

export default transactionsRouter;
