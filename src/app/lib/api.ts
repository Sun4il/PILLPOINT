export type UserRole = 'user' | 'shopkeeper' | 'admin';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  shopId: string | null;
  shopName: string;
  shopAddress: string;
  license: string;
  openTime: string;
  closeTime: string;
}

export interface ShopProfile {
  id: string;
  shopId: string;
  name: string;
  ownerName: string;
  owner?: string;
  address: string;
  area: string;
  phone: string;
  email: string;
  license: string;
  openTime: string;
  closeTime: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  latitude?: number;
  longitude?: number;
}

export interface MedicineRecord {
  id: string;
  shopId: string;
  name: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  imageUrl?: string;
  distanceKm?: number;
}

export interface SearchResult {
  id: string;
  shopId: string;
  name: string;
  medicineName: string;
  address: string;
  area: string;
  distance: number;
  price: number;
  inStock: boolean;
  rating: number;
  reviews: number;
  phone: string;
  openTime: string;
  closeTime: string;
  lat: number;
  lng: number;
  shopImage?: string;
  medicineImage?: string;
  stock: number;
  category: string;
}

export interface SearchAlternativeMedicine {
  id: string;
  name: string;
  activeIngredient: string;
  category: string;
  price: number;
  stock: number;
  inStock: boolean;
  distance: number;
  shopId: string;
  shopName: string;
  shopAddress: string;
  reason: string;
}

export interface SearchAssistant {
  mode: 'medicine' | 'symptom' | 'mixed' | 'unknown';
  normalizedQuery: string;
  symptom: string;
  activeIngredient: string;
  summary: string;
  explanation: string;
  caution: string;
  suggestedMedicines: string[];
  sameSaltAlternatives: SearchAlternativeMedicine[];
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
  assistant?: SearchAssistant;
}

export interface PrescriptionMedicine {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface PrescriptionExtractionResponse {
  message: string;
  searchQuery: string;
  medicines: PrescriptionMedicine[];
  confidence: number | null;
  doctor: unknown;
  patient: unknown;
  date: string | null;
  raw: unknown;
  assistant?: SearchAssistant;
}

export interface InventoryResponse {
  shop: ShopProfile;
  medicines: MedicineRecord[];
}

export interface AuthPayload {
  mobile: string;
  role: UserRole;
  mode: 'login' | 'signup';
  otp?: string;
  name?: string;
  email?: string;
  shopName?: string;
  shopAddress?: string;
  license?: string;
  openTime?: string;
  closeTime?: string;
  latitude?: number;
  longitude?: number;
}

export interface MedicinePayload {
  name: string;
  price: number;
  stock: number;
  lowStockThreshold?: number;
  category?: string;
  imageUrl?: string;
  distanceKm?: number;
}

export interface ShopProfilePayload {
  name: string;
  ownerName: string;
  address: string;
  area: string;
  phone: string;
  email: string;
  license: string;
  openTime: string;
  closeTime: string;
  imageUrl: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const parseJson = async <T>(response: Response): Promise<T> => {
  const responseText = await response.text();
  return (responseText ? JSON.parse(responseText) : null) as T;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const hasJsonBody =
    options.body !== undefined && options.body !== null && method !== 'GET' && method !== 'HEAD';
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (hasJsonBody && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await parseJson<any>(response).catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.');
  }

  return data as T;
}

export const requestOtp = (payload: Pick<AuthPayload, 'mobile' | 'role'>) =>
  request<{ message: string; requestId: string }>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyOtp = (payload: AuthPayload) =>
  request<{ message: string; user: UserResponse }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchSearchResults = (params: { query: string; description?: string; lat?: number; lng?: number; stock: 'all' | 'instock'; sort: 'distance' | 'price' }) => {
  const queryParams = new URLSearchParams();
  if (params.query.trim()) {
    queryParams.set('q', params.query.trim());
  }
  if (params.description?.trim()) {
    queryParams.set('desc', params.description.trim());
  }
  if (Number.isFinite(params.lat ?? Number.NaN) && Number.isFinite(params.lng ?? Number.NaN)) {
    queryParams.set('lat', String(params.lat));
    queryParams.set('lng', String(params.lng));
  }
  queryParams.set('stock', params.stock);
  queryParams.set('sort', params.sort);

  const queryString = queryParams.toString();
  return request<SearchResponse>(`/medicines/search${queryString ? `?${queryString}` : ''}`);
};

export const extractPrescription = async (file: File): Promise<PrescriptionExtractionResponse> => {
  const formData = new FormData();
  formData.append('image', file, file.name);

  const response = await fetch(`${API_BASE_URL}/prescription/extract`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await parseJson<any>(response).catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to extract prescription.');
  }

  return data as PrescriptionExtractionResponse;
};

export const fetchShopkeeperInventory = (shopId: string) =>
  request<InventoryResponse>(`/shopkeepers/${shopId}/medicines`);

export const createShopkeeperMedicine = (shopId: string, payload: MedicinePayload) =>
  request<{ shop: ShopProfile; medicine: MedicineRecord }>(`/shopkeepers/${shopId}/medicines`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateShopkeeperMedicine = (shopId: string, medicineId: string, payload: MedicinePayload) =>
  request<{ shop: ShopProfile | null; medicine: MedicineRecord }>(`/shopkeepers/${shopId}/medicines/${medicineId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteShopkeeperMedicine = (shopId: string, medicineId: string) =>
  request<{ message: string; deletedId: string }>(`/shopkeepers/${shopId}/medicines/${medicineId}`, {
    method: 'DELETE',
  });

export const updateShopProfile = (shopId: string, payload: ShopProfilePayload) =>
  request<{ shop: ShopProfile; message: string }>(`/shopkeepers/${shopId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });