/**
 * agrupa una lista de consultas o visitas por la propiedad a la que pertenecen.
 * conserva el orden en que llegan, asi la propiedad con el movimiento mas
 * reciente queda primera.
 *
 * @param items consultas o visitas, cada una con su propiedad
 * @returns una lista de grupos { id, titulo, items }
 */
export const groupByProperty = <T extends { property?: { id: number; titulo: string } }>(items: T[]): { id: number; titulo: string; items: T[] }[] => {
  const groups = new Map<number, { id: number; titulo: string; items: T[] }>();

  for (const item of items) {
    const id = item.property?.id ?? 0;
    const group = groups.get(id) ?? { id, titulo: item.property?.titulo ?? "Propiedad", items: [] };
    group.items.push(item);
    groups.set(id, group);
  }

  return [...groups.values()];
};
