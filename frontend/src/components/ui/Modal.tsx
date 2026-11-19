import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * ventana modal simple: fondo oscurecido y un panel centrado.
 * se cierra con la tecla escape, con el boton de cerrar o haciendo click afuera.
 *
 * @param props title, onClose y el contenido como children
 * @returns la ventana modal
 */
export const Modal = ({ title, onClose, children }: ModalProps) => {
  // escape cierra la ventana; al desmontar se deja de escuchar el teclado
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift sm:max-w-md sm:rounded-3xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl text-ink">{title}</h2>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="-mr-1 -mt-1 rounded-lg p-1 text-stone-500 transition-colors duration-200 hover:bg-stone-100 hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  // las acciones destructivas usan el boton rojo
  danger?: boolean;
  loading?: boolean;
  // mensaje de error de la api, si la accion fallo
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * dialogo de confirmacion reutilizable. ninguna accion destructiva se ejecuta
 * con un solo click: siempre pasa por aca.
 *
 * @param props title, description, confirmLabel, danger, loading, error, onConfirm y onCancel
 * @returns el dialogo
 */
export const ConfirmDialog = ({ title, description, confirmLabel, danger = false, loading = false, error, onConfirm, onCancel }: ConfirmDialogProps) => (
  <Modal title={title} onClose={onCancel}>
    <p className="text-sm text-stone-600">{description}</p>
    {error && (
      <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    )}
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onCancel} disabled={loading}>
        Volver
      </Button>
      <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
        {loading ? "Un momento..." : confirmLabel}
      </Button>
    </div>
  </Modal>
);
