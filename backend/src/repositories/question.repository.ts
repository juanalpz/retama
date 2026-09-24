import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { PropertyQuestion } from "../entities/property-question.entity";
import { QuestionDTO } from "../schemas/question.schema";
import { Property } from "../entities/property.entity";
import { PaginatedResult } from "./property.repository";

class QuestionRepository {
  private get repository(): Repository<PropertyQuestion> {
    return AppDataSource.getRepository(PropertyQuestion);
  }

  create(data: QuestionDTO & { property: Property }): Promise<PropertyQuestion> {
    const question = this.repository.create(data);
    return this.repository.save(question);
  }

  findByPropertyId(propertyId: number): Promise<PropertyQuestion[]> {
    return this.repository.find({ where: { property: { id: propertyId } } });
  }

  async findPaginatedByPropertyId(propertyId: number, page: number = 1, limit: number = 10): Promise<PaginatedResult<PropertyQuestion>> {
    const [data, total] = await this.repository.findAndCount({
      where: { property: { id: propertyId } },
      order: { fechaCreacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const questionRepository = new QuestionRepository();
