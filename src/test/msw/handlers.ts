import { http, HttpResponse } from 'msw';
import {
  containmentResultFixture,
  handoffResultFixture,
  requestDetailFixture,
} from '../fixtures';

const BASE = '*/api';

export const handlers = [
  http.get(`${BASE}/pickup/requests/:orderId`, () =>
    HttpResponse.json(requestDetailFixture),
  ),
  http.post(`${BASE}/pickup/requests/:orderId/photos`, () =>
    HttpResponse.json({
      photoId: 'photo-1',
      orderId: 'order-1',
      runId: 'run-1',
      staffId: 'pickup-staff-1',
      photoUrl: 'https://example.com/photo.jpg',
      createdAt: '2026-05-13T01:00:00.000Z',
    }),
  ),
  http.post(`${BASE}/pickup/bags/:bagBarcode/items`, () =>
    HttpResponse.json(containmentResultFixture),
  ),
  http.post(`${BASE}/pickup/bags/:bagBarcode/handoff`, () =>
    HttpResponse.json(handoffResultFixture),
  ),
];
