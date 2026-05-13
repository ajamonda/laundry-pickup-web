export type AppStep =
  | 'login'
  | 'requests'
  | 'request-detail'
  | 'run-setup'
  | 'pickup-work'
  | 'handoff';

export type StaffSession = {
  accessToken: string;
  staff: {
    staffId: string;
    role: string;
    displayName: string | null;
    phoneNumber: string | null;
  };
};

// GET /pickup/requests — list item (no items[])
export type PickupRequestSummary = {
  orderId: string;
  customerId: string;
  status: string;
  pickupSchedule: string | null;
  address: string | null;
  phoneNumber: string | null;
  pickupDeliveryPlaceCode: string | null;
  pickupDeliveryPlaceText: string | null;
  secondHandPickupRequested: boolean;
  itemCount: number;
  createdAt: string;
};

export type PickupRequestsResponse = {
  items: PickupRequestSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

// GET /pickup/requests/:orderId — detail with items[]
export type PickupRequestItem = {
  itemId: string;
  catalogItemCode: string;
  displayNameSnapshot: string;
  status: string;
  location: string;
  options: {
    groupCodeSnapshot: string;
    optionCodeSnapshot: string;
    displayNameSnapshot: string;
  }[];
  inputs: { inputCode: string; inputValue: string }[];
  photoUrls: string[];
};

export type PickupRequestDetail = {
  orderId: string;
  customerId: string;
  status: string;
  pickupSchedule: string | null;
  address: string | null;
  phoneNumber: string | null;
  fulfillmentType: string | null;
  fulfillmentOptionCode: string | null;
  pickupDeliveryPlaceCode: string | null;
  pickupDeliveryPlaceText: string | null;
  secondHandPickupRequested: boolean;
  items: PickupRequestItem[];
};

// POST /pickup/runs
export type PickupRun = {
  runId: string;
  vehicle: { code: string; displayName: string };
  staffId: string;
  status: string;
  startedAt: string;
};

// POST /pickup/runs/:runId/bags
export type PickupBagResult = {
  bagId: string;
  barcode: string;
  status: 'READY' | 'TAKE_OUT' | 'CONTAIN' | 'TAKE_BACK';
  runId: string | null;
};

export type RegisteredBag = {
  bagBarcode: string;
  status: 'TAKE_OUT' | 'CONTAIN' | 'TAKE_BACK';
};

// POST /pickup/bags/:bagBarcode/items
export type PickupContainmentResult = {
  runId: string;
  bag: PickupBagResult;
  order: { orderId: string; status: string };
  items: { itemId: string; status: string; location: string }[];
};

// POST /pickup/bags/:bagBarcode/handoff
export type PickupHandoffResult = {
  runId: string;
  runStatus: string;
  bag: PickupBagResult;
  orders: { orderId: string; status: string }[];
  items: { itemId: string; status: string; location: string }[];
};

export type PickupPhotoResult = {
  photoId: string;
  orderId: string;
  runId: string;
  staffId: string;
  photoUrl: string;
  createdAt: string;
};

export const VEHICLE_OPTIONS = [
  { code: 'PICKUP-VAN-01', label: '수거 밴 1호' },
  { code: 'PICKUP-VAN-02', label: '수거 밴 2호' },
  { code: 'PICKUP-VAN-03', label: '수거 밴 3호' },
] as const;
