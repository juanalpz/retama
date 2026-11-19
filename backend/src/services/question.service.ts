/**
 * reglas de negocio de las consultas (preguntas) sobre una propiedad.
 */

import { questionRepository } from "../repositories/question.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { PropertyQuestion } from "../entities/property-question.entity";
import { QuestionDTO } from "../schemas/question.schema";
import { activityService } from "./activity.service";
import { ServiceResult, fail } from "../utils/result.utils";

class QuestionService {
  /**
   * consultas recibidas por el vendedor, de todas sus propiedades o de una sola.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de una propiedad para filtrar (opcional)
   * @param sinResponder true para traer solo las que no tienen respuesta (opcional)
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado de consultas, la mas reciente primero
   */
  async getQuestionsBySeller(sellerId: number, propertyId?: number, sinResponder?: boolean, page: number = 1, limit: number = 10): Promise<PaginatedResult<PropertyQuestion>> {
    return questionRepository.findPaginatedBySeller(sellerId, propertyId, sinResponder, page, limit);
  }

  /**
   * guarda la respuesta del vendedor a una consulta.
   * solo puede responder el dueño de la propiedad y cada consulta admite una unica respuesta.
   *
   * @param questionId id de la consulta
   * @param sellerId id del vendedor autenticado
   * @param respuesta texto de la respuesta
   * @returns { success: true, question }, o un error 404 si no existe, 403 si es de otro vendedor, o 409 si ya estaba respondida
   */
  async replyToQuestion(questionId: number, sellerId: number, respuesta: string): Promise<ServiceResult<{ question: PropertyQuestion }>> {
    const question = await questionRepository.findByIdWithRelations(questionId);

    if (!question) return fail(404, 'Consulta no encontrada');

    if (question.property.agency.seller.id !== sellerId) {
      return fail(403, 'La consulta no pertenece a una propiedad de tu inmobiliaria');
    }

    if (question.respuestaVendedor !== null) {
      return fail(409, 'La consulta ya fue respondida y no admite una segunda respuesta');
    }

    await questionRepository.updateRespuesta(questionId, respuesta);

    const updated = await questionRepository.findByIdWithRelations(questionId);
    return { success: true, question: this.toPublic(updated!) };
  }

  /**
   * crea una consulta sobre una propiedad y le avisa al vendedor en su feed de actividad.
   * no se puede consultar sobre un borrador porque todavia no es publico.
   *
   * @param propertyId id de la propiedad
   * @param data datos ya validados: nombreSolicitante, pregunta
   * @returns la consulta creada, o null si la propiedad no existe o es un borrador
   */
  async create(propertyId: number, data: QuestionDTO): Promise<PropertyQuestion | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property || property.estado === 'BORRADOR') {
      return null;
    }

    const question = await questionRepository.create({ ...data, property });

    if (property.agency && property.agency.seller) {
      await activityService.notify(
        property.agency.seller.id,
        "COMENTARIO",
        question.id,
        "pregunta",
        `Nueva consulta de ${data.nombreSolicitante} en la propiedad: ${property.titulo}`
      );
    }

    return this.toPublic(question);
  }

  /**
   * consultas publicas de una propiedad, con su respuesta si la tienen.
   *
   * @param propertyId id de la propiedad
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado de consultas, o null si la propiedad no existe o es un borrador
   */
  async getByPropertyId(propertyId: number, page: number, limit: number): Promise<PaginatedResult<PropertyQuestion> | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property || property.estado === 'BORRADOR') {
      return null;
    }
    return questionRepository.findPaginatedByPropertyId(propertyId, page, limit);
  }

  /**
   * recorta la propiedad anidada en una consulta para la respuesta: deja solo su
   * id y su titulo, sin arrastrar la inmobiliaria ni el vendedor.
   *
   * @param question consulta con su propiedad cargada
   * @returns la misma consulta con property reducida a { id, titulo }
   */
  private toPublic(question: PropertyQuestion): PropertyQuestion {
    const { property, ...rest } = question as any;
    return {
      ...rest,
      property: property ? { id: property.id, titulo: property.titulo } : undefined,
    } as PropertyQuestion;
  }
}

export const questionService = new QuestionService();
