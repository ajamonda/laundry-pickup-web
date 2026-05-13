import type {
  PickupContainmentResult,
  PickupHandoffResult,
  PickupRequestDetail,
  StaffSession,
} from '../types';

export const staffSessionFixture: StaffSession = {
  accessToken: 'test-access-token',
  staff: {
    staffId: 'pickup-staff-1',
    role: 'PICKUP',
    displayName: null,
    phoneNumber: null,
  },
};

export const requestDetailFixture: PickupRequestDetail = {
  orderId: 'order-1',
  customerId: 'customer-1',
  status: 'REQUEST',
  pickupSchedule: '2026-05-13T01:00:00.000Z',
  address: '서울시 강남구 테스트로 1',
  phoneNumber: '010-0000-0000',
  fulfillmentType: null,
  fulfillmentOptionCode: null,
  pickupDeliveryPlaceCode: 'front_door',
  pickupDeliveryPlaceText: null,
  secondHandPickupRequested: false,
  items: [
    {
      itemId: 'item-1',
      catalogItemCode: 'shirt',
      displayNameSnapshot: '셔츠',
      status: 'INIT',
      location: 'CUSTOMER_PICK_UP',
      options: [],
      inputs: [],
      photoUrls: [],
    },
    {
      itemId: 'item-2',
      catalogItemCode: 'pants',
      displayNameSnapshot: '바지',
      status: 'INIT',
      location: 'CUSTOMER_PICK_UP',
      options: [],
      inputs: [],
      photoUrls: [],
    },
  ],
};

export const containmentResultFixture: PickupContainmentResult = {
  runId: 'run-1',
  bag: {
    bagId: 'bag-1',
    barcode: 'PICKUP-BAG-001',
    status: 'CONTAIN',
    runId: 'run-1',
  },
  order: { orderId: 'order-1', status: 'PICK_UP' },
  items: [
    { itemId: 'item-1', status: 'PICK_UP', location: 'PICK_UP_TRUCK' },
    { itemId: 'item-2', status: 'PICK_UP', location: 'PICK_UP_TRUCK' },
  ],
};

export const handoffResultFixture: PickupHandoffResult = {
  runId: 'run-1',
  runStatus: 'COMPLETED',
  bag: {
    bagId: 'bag-1',
    barcode: 'PICKUP-BAG-001',
    status: 'TAKE_BACK',
    runId: 'run-1',
  },
  orders: [{ orderId: 'order-1', status: 'PROCESSING' }],
  items: [
    { itemId: 'item-1', status: 'PICK_UP', location: 'IN_HOUSE' },
    { itemId: 'item-2', status: 'PICK_UP', location: 'IN_HOUSE' },
  ],
};
