import { SECURITY_EGRESS_ALLOWED_EMAILS } from "./securityEgress";

function parseCsv(value: string | undefined, fallback: string[]) {
  if (value === undefined) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

export const REQUEST_SCENARIO_ALLOWED_EMAILS = parseCsv(
  import.meta.env.VITE_REQUEST_SCENARIO_ALLOWED_EMAILS,
  SECURITY_EGRESS_ALLOWED_EMAILS,
);

export function isRequestScenarioAllowed(email: string | null | undefined) {
  if (!email) {
    return false;
  }
  return REQUEST_SCENARIO_ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}
