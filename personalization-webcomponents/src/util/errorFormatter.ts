export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Ein unbekannter Fehler ist aufgetreten.";
}


export const SolidErrorMessages = {
  LOGIN_FAILED: "Fehler bei der Solid-Anmeldung",
  LOGOUT_FAILED: "Fehler beim Abmelden",
  SAVE_FAILED: "Fehler beim Speichern im Pod",
  LOAD_FAILED: "Fehler beim Laden aus dem Pod (Existiert die Datei?)",
  REDIRECT_FAILED: "Fehler bei der Session-Wiederherstellung",
} as const;

export function createErrorMessage(context: string, error: unknown): string {
  const errorDetail = formatErrorMessage(error);
  return `${context}: ${errorDetail}`;
}
