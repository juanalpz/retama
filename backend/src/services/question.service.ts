import { questionRepository } from "../repositories/question.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { PropertyQuestion } from "../entities/property-question.entity";
import { QuestionDTO } from "../schemas/question.schema";

class QuestionService {
  async create(propertyId: number, data: QuestionDTO): Promise<PropertyQuestion | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      return null;
    }
    return questionRepository.create({ ...data, property });
  }

  async getByPropertyId(propertyId: number, page: number, limit: number): Promise<PaginatedResult<PropertyQuestion> | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      return null;
    }
    return questionRepository.findPaginatedByPropertyId(propertyId, page, limit);
  }
}

export const questionService = new QuestionService();
