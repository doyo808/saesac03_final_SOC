import { api } from "./client";
import { shouldUseMockFallback } from "./fallback";
import {
  mockFetchAcademicEvents,
  mockFetchAnnouncement,
  mockFetchAnnouncements,
} from "./mockBackend";
import type {
  AcademicEvent,
  AnnouncementDetail,
  AnnouncementSummary,
} from "../types";

export async function fetchAnnouncements() {
  try {
    const { data } = await api.get<AnnouncementSummary[]>("/api/public/announcements");
    if (!Array.isArray(data)) {
      throw new Error("Invalid announcements payload");
    }
    return data;
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockFetchAnnouncements();
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
