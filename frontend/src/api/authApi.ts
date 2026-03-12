import { api } from "./client";
import { shouldUseMockFallback } from "./fallback";
import {
  mockLogin,
  mockLogout,
  mockMe,
  mockRefresh,
  mockRegister,
} from "./mockBackend";
import type { Role, User } from "../types";

interface LoginResponse {
  accessToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: Role;
}

export async function login(email: string, password: string) {
  try {
    const { data } = await api.post<LoginResponse>("/api/auth/login", { email, password });
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockLogin(email, password);
    }
    throw error;
  }
}

export async function register(payload: RegisterPayload) {
  try {
    const { data } = await api.post<User>("/api/auth/register", payload);
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockRegister(payload);
    }
    throw error;
  }
}

export async function refresh() {
  try {
    const { data } = await api.post<LoginResponse>("/api/auth/refresh");
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockRefresh();
    }
    throw error;
  }
}

export async function logout() {
  try {
    await api.post("/api/auth/logout");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      await mockLogout();
      return;
    }
    throw error;
  }
}

export async function me() {
  try {
    const { data } = await api.get<User>("/api/auth/me");
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockMe();
    }
    throw error;
  }
}
