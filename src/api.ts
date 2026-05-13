import type {
  PickupBagResult,
  PickupContainmentResult,
  PickupHandoffResult,
  PickupPhotoResult,
  PickupRequestDetail,
  PickupRequestsResponse,
  PickupRun,
  StaffSession,
} from './types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  token?: string;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const api = {
  staffDevLogin(staffId: string) {
    return request<StaffSession>('/auth/staff/pickup/dev-login', {
      body: { staffId },
    });
  },

  getPickupRequests(token: string, page = 1, pageSize = 20) {
    return request<PickupRequestsResponse>(
      `/pickup/requests?page=${page}&pageSize=${pageSize}`,
      { token },
    );
  },

  getPickupRequestDetail(token: string, orderId: string) {
    return request<PickupRequestDetail>(`/pickup/requests/${orderId}`, { token });
  },

  createRun(token: string, vehicleCode: string) {
    return request<PickupRun>('/pickup/runs', {
      token,
      body: { vehicleCode },
    });
  },

  registerBag(token: string, runId: string, bagBarcode: string) {
    return request<PickupBagResult>(`/pickup/runs/${runId}/bags`, {
      token,
      body: { bagBarcode },
    });
  },

  recordPhoto(token: string, orderId: string, runId: string, photoUrl: string) {
    return request<PickupPhotoResult>(`/pickup/requests/${orderId}/photos`, {
      token,
      body: { runId, photoUrl },
    });
  },

  putItemsIntoBag(
    token: string,
    bagBarcode: string,
    runId: string,
    orderId: string,
    itemIds: string[],
  ) {
    return request<PickupContainmentResult>(`/pickup/bags/${encodeURIComponent(bagBarcode)}/items`, {
      token,
      body: { runId, orderId, itemIds },
    });
  },

  handoffBag(token: string, bagBarcode: string, runId: string) {
    return request<PickupHandoffResult>(`/pickup/bags/${encodeURIComponent(bagBarcode)}/handoff`, {
      token,
      body: { runId },
    });
  },
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const payload = text ? parseJson(text) : null;

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `요청에 실패했어요. (${response.status})`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
