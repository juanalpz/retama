import { questionRepository } from "../repositories/question.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { PropertyQuestion } from "../entities/property-question.entity";
import { QuestionDTO } from "../schemas/question.schema";
import { activityService } from "./activity.service";

class QuestionService {
  async getQuestionsBySeller(sellerId: number, propertyId?: number, sinResponder?: boolean, page: number = 1, limit: number = 10): Promise<PaginatedResult<PropertyQuestion>> {
    return questionRepository.findPaginatedBySeller(sellerId, propertyId, sinResponder, page, limit);
  }

  async replyToQuestion(questionId: number, sellerId: number, respuesta: string): Promise<PropertyQuestion | null | false> {
    const question = await questionRepository.findByIdWithRelations(questionId);
    
    if (!question) return null; // No existe
    if (question.property.agency.seller.id !== sellerId) return false; // Pertenece a otra agencia

    await questionRepository.updateRespuesta(questionId, respuesta);
    return questionRepository.findByIdWithRelations(questionId);
  }

  async create(propertyId: number, data: QuestionDTO): Promise<PropertyQuestion | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      return null;
    }
    const question = await questionRepository.create({ ...data, property });
    
    // Generar notificación
    if (property.agency && property.agency.seller) {
      await activityService.notify(
        property.agency.seller.id,
        "COMENTARIO",
        question.id,
        "pregunta",
        `Nueva consulta de ${data.nombreSolicitante} en la propiedad: ${property.titulo}`
      );
    }

    return question;
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
