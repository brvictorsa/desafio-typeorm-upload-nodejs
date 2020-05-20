// import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';

import Category from '../models/Category';
import CategoriesRepository from '../repositories/CategoriesRepository';

interface Request {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoriesRepository = getCustomRepository(CategoriesRepository);

    let category = await categoriesRepository.findOne({ where: { title } });

    if (!category) {
      category = categoriesRepository.create({
        title,
      });

      await categoriesRepository.save(category);
    }

    return category;
  }
}

export default CreateCategoryService;
