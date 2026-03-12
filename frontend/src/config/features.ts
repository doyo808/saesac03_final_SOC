function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export const ADMIN_PAGE_ENABLED = parseBooleanFlag(import.meta.env.VITE_ADMIN_PAGE_ENABLED, true);
