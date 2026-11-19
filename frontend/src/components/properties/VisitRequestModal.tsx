import { useState, type FormEvent } from "react";
import { createVisit } from "../../services/agencies";
import type { ApiError } from "../../types/api";
import { formatDateTime, nowForInput } from "../../utils/dates";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { Alert, Textarea } from "../ui/Misc";
import { Modal } from "../ui/Modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";

interface VisitRequestModalProps {
  propertyId: number;
  propertyTitle: string;
  onClose: () => void;
}

/**
 * formulario para pedir una visita a una propiedad: nombre, telefono, fecha y
 * hora propuesta y un mensaje opcional. al enviarse muestra la confirmacion.
 *
 * @param props propertyId, propertyTitle y onClose
 * @returns la ventana modal con el formulario
 */
export const VisitRequestModal = ({ propertyId, propertyTitle, onClose }: VisitRequestModalProps) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, runLocked] = useSubmitLock();
  // fecha de la visita ya pedida; mientras es null se muestra el formulario
  const [sentFor, setSentFor] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const errores: Record<string, string> = {};
    if (!nombre.trim()) errores.nombreVisitante = "Decinos tu nombre";
    if (telefono.trim().length < 6) errores.telefonoVisitante = "Ingresá un teléfono para que te contacten";
    if (!fecha) errores.fechaPropuesta = "Elegí día y hora";
    else if (new Date(fecha) <= new Date()) errores.fechaPropuesta = "La fecha tiene que ser futura";
    setFields(errores);
    setFormError(null);
    if (Object.keys(errores).length > 0) return;

    await runLocked(async () => {
      try {
        const visita = await createVisit(propertyId, {
          nombreVisitante: nombre.trim(),
          telefonoVisitante: telefono.trim(),
          // el input da la hora local; a la api se le envia en formato iso
          fechaPropuesta: new Date(fecha).toISOString(),
          mensajeAsociado: mensaje.trim() || undefined,
        });
        setSentFor(visita.fechaPropuesta);
      } catch (err) {
        // si el back rechaza la fecha u otro dato, el error se muestra igual
        const apiError = err as ApiError;
        setFields(apiError.fields);
        setFormError(apiError.message);
      }
    });
  };

  if (sentFor) {
    return (
      <Modal title="Visita solicitada" onClose={onClose}>
        <p className="text-sm text-stone-600">
          Le avisamos a la inmobiliaria que querés visitar <span className="font-medium text-ink">{propertyTitle}</span> el {formatDateTime(sentFor)}. Te van a contactar al teléfono que dejaste para confirmar.
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Listo</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Pedir una visita" onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <Field label="Nombre" error={fields.nombreVisitante}>
          <Input value={nombre} onChange={(event) => setNombre(event.target.value)} invalid={Boolean(fields.nombreVisitante)} maxLength={100} autoComplete="name" />
        </Field>
        <Field label="Teléfono" error={fields.telefonoVisitante}>
          <Input type="tel" value={telefono} onChange={(event) => setTelefono(event.target.value)} invalid={Boolean(fields.telefonoVisitante)} maxLength={50} autoComplete="tel" />
        </Field>
        <Field label="Día y hora" error={fields.fechaPropuesta}>
          {/* min impide elegir una fecha pasada desde el selector */}
          <Input type="datetime-local" min={nowForInput()} value={fecha} onChange={(event) => setFecha(event.target.value)} invalid={Boolean(fields.fechaPropuesta)} />
        </Field>
        <Field label="Mensaje (opcional)" error={fields.mensajeAsociado}>
          <Textarea rows={2} value={mensaje} onChange={(event) => setMensaje(event.target.value)} maxLength={2000} placeholder="Disponibilidad, motivo de la visita..." />
        </Field>

        {formError && <Alert kind="error">{formError}</Alert>}

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          {/* deshabilitado mientras se envia, para no generar solicitudes duplicadas */}
          <Button type="submit" loading={sending}>
            {sending ? "Enviando..." : "Pedir visita"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
