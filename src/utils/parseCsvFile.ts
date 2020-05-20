import fs from 'fs';
import csvParse from 'csv-parse';

interface Request {
  filePath: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ParseCsvFile {
  public async parse({ filePath }: Request): Promise<TransactionDTO[]> {
    const parsers = csvParse({ ltrim: true, rtrim: true, from_line: 2 });

    const csvReadStream = fs.createReadStream(filePath);

    const parseCSV = csvReadStream.pipe(parsers);

    const transactions: TransactionDTO[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value) return;

      transactions.push({ title, type, value, category });
    });

    await new Promise((resolve, reject) => {
      parseCSV.on('error', err => reject(err));
      parseCSV.on('end', resolve);
    });

    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ParseCsvFile;
