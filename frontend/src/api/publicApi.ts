import { api } from "./client";
import { shouldUseMockFallback } from "./fallback";
import {
  mockCreateSupportRequest,
  mockFetchAcademicEvents,
  mockFetchAnnouncement,
  mockFetchAnnouncements,
} from "./mockBackend";
import type {
  AcademicEvent,
  AnnouncementDetail,
  AnnouncementPage,
  AnnouncementSearchParams,
  SupportRequestForm,
  SupportRequestReceipt,
} from "../types";

export async function fetchAnnouncements(searchParams: AnnouncementSearchParams = {}) {
  try {
    const { data } = await api.get<AnnouncementPage>("/api/public/announcements", {
      params: searchParams,
    });
    if (!Array.isArray(data.items)) {
      throw new Error("Invalid announcements payload");
    }
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockFetchAnnouncements(searchParams);
    }
    throw error;
  }
}

export async function fetchAnnouncement(id: string | number) {
  try {
    const { data } = await api.get<AnnouncementDetail>(`/api/public/announcements/${id}`);
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockFetchAnnouncement(id);
    }
    throw error;
  }
}

export async function fetchAcademicEvents() {
  try {
    const { data } = await api.get<AcademicEvent[]>("/api/public/academic-events");
    if (!Array.isArray(data)) {
      throw new Error("Invalid academic events payload");
    }
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockFetchAcademicEvents();
    }
    throw error;
  }
}

export async function createSupportRequest(payload: SupportRequestForm) {
  try {
    const { data } = await api.post<SupportRequestReceipt>("/api/public/support-requests", payload);
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockCreateSupportRequest(payload);
    }
    throw error;
  }
}
