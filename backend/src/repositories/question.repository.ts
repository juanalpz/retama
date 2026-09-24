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

  findByIdWithRelations(id: number): Promise<PropertyQuestion | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['property', 'property.agency', 'property.agency.seller']
    });
  }

  async updateRespuesta(id: number, respuesta: string): Promise<void> {
    await this.repository.update(id, { respuestaVendedor: respuesta });
  }

  async findPaginatedBySeller(sellerId: number, propertyId?: number, sinResponder?: boolean, page: number = 1, limit: number = 10): Promise<PaginatedResult<PropertyQuestion>> {
    const qb = this.repository.createQueryBuilder('question')
      .leftJoinAndSelect('question.property', 'property')
      .leftJoin('property.agency', 'agency')
      .leftJoin('agency.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId });

    if (propertyId) {
      qb.andWhere('property.id = :propertyId', { propertyId });
    }

    if (sinResponder) {
      qb.andWhere('question.respuestaVendedor IS NULL');
    }

    const [data, total] = await qb
      .orderBy('question.fechaCreacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
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
