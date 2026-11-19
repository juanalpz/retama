/**
 * helpers para mostrar fechas.
 */

/**
 * fecha corta para listados.
 *
 * @param iso fecha en formato iso
 * @returns la fecha como "18/11/2026"
 */
export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString("es-AR");

/**
 * fecha con dia de la semana y hora, para las visitas.
 *
 * @param iso fecha en formato iso
 * @returns la fecha como "sáb 21/11, 15:00 hs"
 */
export const formatDateTime = (iso: string): string => {
  const fecha = new Date(iso);
  const dia = fecha.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "");
  const hora = `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
  return `${dia} ${fecha.getDate()}/${fecha.getMonth() + 1}, ${hora} hs`;
};

/**
 * tiempo transcurrido en palabras, para el feed de actividad y las consultas.
 *
 * @param iso fecha en formato iso
 * @returns un texto como "hace 10 min", "hace 2 h", "ayer" o la fecha si paso mas de una semana
 */
export const timeAgo = (iso: string): string => {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return formatDate(iso);
};

/**
 * valor minimo para un input datetime-local: el momento actual, en hora local.
 *
 * @returns la fecha y hora actual como "2026-11-18T20:30"
 */
export const nowForInput = (): string => {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 16);
};
