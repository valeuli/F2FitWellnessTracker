import type { WellnessEntry } from "../types/wellness";

export type WellnessSyncState =
  | "en_reposo"
  | "guardando"
  | "pendiente"
  | "sincronizado"
  | "error";

export function getStatusCopy(
  syncState: WellnessSyncState,
  currentEntry: WellnessEntry | null,
): { title: string; message: string } {
  if (syncState === "guardando") {
    return {
      title: "Guardando...",
      message: "Estamos guardando tus cambios.",
    };
  }

  if (syncState === "pendiente") {
    return {
      title: "Pendiente de sincronización ⏳",
      message: "Se guardó localmente y se enviará cuando vuelva la conexión.",
    };
  }

  if (syncState === "sincronizado") {
    return {
      title: "Sincronizado ✨",
      message: currentEntry
        ? "Tu bienestar de hoy ya está guardado."
        : "Tus cambios ya están al día.",
    };
  }

  if (syncState === "error") {
    return {
      title: "Revisa los datos ⚠️",
      message: "Hay un error con los datos. Corrige los datos y vuelve a guardar.",
    };
  }

  if (currentEntry) {
    return {
      title: "Bienestar registrado hoy",
      message: "Tu bienestar de hoy ya está guardado.",
    };
  }

  return {
    title: "¿Cómo te sientes hoy? 🌸",
    message: "Aún no has registrado tu bienestar de hoy. Tómate un minuto para conectar contigo misma.",
  };
}

export function getActionLabel(currentEntry: WellnessEntry | null): string {
  return currentEntry ? "Actualizar bienestar" : "Registrar bienestar";
}
