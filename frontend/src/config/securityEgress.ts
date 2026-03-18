function parseCsv(value: string | undefined, fallback: string[]) {
  if (value === undefined) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

export const SECURITY_EGRESS_ALLOWED_EMAILS = parseCsv(
  import.meta.env.VITE_SECURITY_EGRESS_ALLOWED_EMAILS,
  ["admin1@campus.local", "student1@campus.local"],
);

export function isSecurityEgressAllowed(email: string | null | undefined) {
  if (!email) {
    return false;
  }
  return SECURITY_EGRESS_ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}
