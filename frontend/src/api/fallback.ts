import axios from "axios";

export function shouldUseMockFallback(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  return status === 404 || status === 405 || status === 501 || status >= 500;
}
