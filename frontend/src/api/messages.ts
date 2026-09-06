import { apiClient } from "./client";
import type { Message, Page } from "../types";

export interface BulkMessagePayload {
  candidate_ids: string[];
  subject: string;
  body: string;
}

export const sendBulkMessage = (payload: BulkMessagePayload) =>
  apiClient.post<{ sent_count: number }>("/messages/bulk", payload).then((res) => res.data);

export const getMyMessages = (page = 1, pageSize = 10) =>
  apiClient
    .get<Page<Message>>("/messages/me", { params: { page, page_size: pageSize } })
    .then((res) => res.data);

export const getUnreadMessageCount = () =>
  apiClient.get<{ unread_count: number }>("/messages/me/unread-count").then((res) => res.data.unread_count);

export const markMessageRead = (messageId: string) =>
  apiClient.patch<Message>(`/messages/${messageId}/read`).then((res) => res.data);
