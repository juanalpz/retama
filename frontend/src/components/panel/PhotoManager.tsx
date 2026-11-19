import { useState, type FormEvent } from "react";
import { useApi } from "../../hooks/useApi";
import { addPhoto, deletePhoto, listPhotos, updatePhoto } from "../../services/panel";
import type { ApiError, Photo } from "../../types/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { Alert } from "../ui/Misc";
import { ConfirmDialog } from "../ui/Modal";

/**
 * galeria de fotos de una propiedad en el formulario de edicion: permite
 * agregar fotos por url, ordenarlas, elegir la portada y eliminarlas.
 * cada cambio se guarda en el momento.
 *
 * @param props propertyId, id de la propiedad que se esta editando
 * @returns la seccion de fotos
 */
export const PhotoManager = ({ propertyId }: { propertyId: number }) => {
  const { data: photos, error, reload } = useApi((signal) => listPhotos(propertyId, signal), [propertyId]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Photo | null>(null);

  // ejecuta un cambio sobre las fotos y vuelve a pedir la lista
  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      reload();
      return true;
    } catch (err) {
      setActionError((err as ApiError).fields.url ?? (err as ApiError).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) {
      setActionError("Pegá la dirección (URL) de la imagen");
      return;
    }
    // la foto nueva va al final de la galeria
    const orden = photos && photos.length > 0 ? Math.max(...photos.map((photo) => photo.orden)) + 1 : 0;
    if (await run(() => addPhoto(propertyId, { url: url.trim(), orden }))) setUrl("");
  };

  // intercambia la posicion de una foto con la de su vecina
  const move = (index: number, direction: -1 | 1) => {
    if (!photos) return;
    const actual = photos[index];
    const vecina = photos[index + direction];
    if (!vecina) return;
    run(async () => {
      await updatePhoto(propertyId, actual.id, { orden: vecina.orden });
      await updatePhoto(propertyId, vecina.id, { orden: actual.orden });
    });
  };

  return (
    <section aria-labelledby="fotos-titulo" className="rounded-2xl border border-stone-200 bg-white shadow-card p-4 sm:p-5">
      <h2 id="fotos-titulo" className="text-base font-semibold text-ink">
        Fotos
      </h2>
      <p className="mt-1 text-sm text-stone-600">Hace falta al menos una foto para publicar. La portada es la que se ve en los listados.</p>

      <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." aria-label="URL de la imagen" />
        <Button type="submit" variant="secondary" loading={busy} className="shrink-0">
          Agregar foto
        </Button>
      </form>

      {(actionError || error) && !toDelete && (
        <div className="mt-3">
          <Alert kind="error">{actionError ?? error!.message}</Alert>
        </div>
      )}

      {photos && photos.length === 0 && <p className="mt-4 text-sm text-stone-500">Todavía no hay fotos.</p>}

      {photos && photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="overflow-hidden rounded-lg border border-stone-200">
              <div className="relative aspect-[4/3] bg-stone-100">
                <img src={photo.url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                {photo.esPortada && <span className="absolute left-2 top-2 rounded-md bg-brand-700 px-2 py-0.5 text-xs font-medium text-white">Portada</span>}
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                <Button variant="ghost" size="sm" className="px-2" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label="Mover antes">
                  ←
                </Button>
                <Button variant="ghost" size="sm" className="px-2" disabled={busy || index === photos.length - 1} onClick={() => move(index, 1)} aria-label="Mover después">
                  →
                </Button>
                {!photo.esPortada && (
                  <Button variant="ghost" size="sm" className="px-2" disabled={busy} onClick={() => run(() => updatePhoto(propertyId, photo.id, { esPortada: true }))}>
                    Portada
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="px-2 text-red-700 hover:bg-red-50" disabled={busy} onClick={() => setToDelete(photo)}>
                  Quitar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Quitar la foto?"
          description="La foto se elimina de la galería de la propiedad."
          confirmLabel="Quitar foto"
          danger
          loading={busy}
          error={actionError}
          onConfirm={async () => {
            if (await run(() => deletePhoto(propertyId, toDelete.id))) setToDelete(null);
          }}
          onCancel={() => {
            setToDelete(null);
            setActionError(null);
          }}
        />
      )}
    </section>
  );
};
