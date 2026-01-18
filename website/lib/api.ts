// CARMA Vehicle Comparison API Service
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://carma-ml-api.greenwater-7817a41f.northeurope.azurecontainerapps.io';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const mileageFormatter = new Intl.NumberFormat('de-DE');

// Utility function for retrying API calls
async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      // Don't retry on client errors (4xx) - these are user errors, not server errors
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw error;
      }
      
      // Don't retry on "not found" or "Vehicle not found" errors
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Not found'))) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError as Error;
}

export interface RankingDetails {
  filter_level?: number | null;
  score_components?: {
    similarity?: Record<string, number>;
    deal?: Record<string, number>;
    preference?: Record<string, number>;
    weights?: Record<string, number>;
  };
}

export interface Vehicle {
  id: string;
  url: string;
  price_eur: number;
  price_hat: number;
  deal_score: number;
  mileage_km: number;
  year: number;
  make: string;
  model: string;
  fuel_group: string;
  transmission_group: string;
  body_group: string;
  description: string;
  data_source: string;
  power_kw?: number;
  images?: string[];
  exterior_color?: string;
  interior_color?: string;
  upholstery_color?: string;
  drive_train?: string;
  postal_code?: string;
  country_code?: string;
  city?: string;
  savings?: number;
  savings_percent?: number;
  similarity_score?: number;
  preference_score?: number;
  final_score?: number;
  score?: number;
  ranking_details?: RankingDetails;
}

export interface ApiStats {
  total_vehicles: number;
  unique_makes: number;
  data_sources: number;
  status?: string;
}

export interface ApiHealth {
  status?: string;
  database_connected: boolean;
  timestamp: string;
}

const toNumber = (value: unknown, fallback: number | null = null): number | null => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toYear = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  const match = String(value).match(/(\d{4})/);
  return match ? Number(match[1]) : null;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string') as string[];
  }
  return undefined;
};

const normalizeVehicle = (raw: any): Vehicle => {
  const price = toNumber(raw?.price_eur ?? raw?.price, 0) ?? 0;
  const fairPrice =
    toNumber(raw?.price_hat ?? raw?.fair_price ?? raw?.median_price, null) ?? price;
  const dealScore =
    typeof raw?.deal_score === 'number' && !Number.isNaN(raw.deal_score)
      ? raw.deal_score
      : 0.5;
  const mileage = toNumber(raw?.mileage_km, 0) ?? 0;
  const year =
    toYear(raw?.year) ??
    toYear(raw?.first_registration_raw) ??
    toYear(raw?.first_registration_year) ??
    0;

  const images = toStringArray(raw?.images) ?? [];

  const savings = toNumber(raw?.savings ?? raw?.savings_amount);
  const savingsPercent = toNumber(raw?.savings_percent ?? raw?.savings_percentage);

  const similarityScore =
    typeof raw?.similarity_score === 'number' ? raw.similarity_score : undefined;
  const preferenceScore =
    typeof raw?.preference_score === 'number' ? raw.preference_score : undefined;
  const finalScore =
    typeof raw?.final_score === 'number'
      ? raw.final_score
      : typeof raw?.score === 'number'
      ? raw.score
      : undefined;

  return {
    id: raw?.id ?? '',
    url: raw?.url ?? '',
    price_eur: price,
    price_hat: fairPrice,
    deal_score: dealScore,
    mileage_km: mileage,
    year,
    make: raw?.make ?? '',
    model: raw?.model ?? '',
    fuel_group: raw?.fuel_group ?? raw?.fuel_type ?? '',
    transmission_group: raw?.transmission_group ?? raw?.transmission ?? '',
    body_group: raw?.body_group ?? raw?.body_type ?? '',
    description: raw?.description ?? '',
    data_source: raw?.data_source ?? '',
    power_kw: toNumber(raw?.power_kw) ?? undefined,
    images,
    exterior_color: raw?.exterior_color ?? raw?.color ?? undefined,
    interior_color: raw?.interior_color ?? raw?.interior ?? undefined,
    upholstery_color: raw?.upholstery_color ?? raw?.upholstery ?? undefined,
    drive_train: raw?.drive_train ?? undefined,
    postal_code: raw?.postal_code ?? undefined,
    country_code: raw?.country_code ?? undefined,
    city: raw?.city ?? undefined,
    savings: savings ?? undefined,
    savings_percent: savingsPercent ?? undefined,
    similarity_score: similarityScore,
    preference_score: preferenceScore,
    final_score: finalScore,
    score: similarityScore ?? finalScore ?? undefined,
    ranking_details: raw?.ranking_details,
  };
};

// Extract vehicle ID from AutoScout24 URL
export function extractVehicleId(input: string): string {
  if (input.includes('autoscout24.de')) {
    const parts = input.split('/');
    const lastPart = parts[parts.length - 1].split('?')[0]; // Remove query params if present
    
    // Extract UUID from the last part of the URL
    // AutoScout24 URLs have format: ...-uuid or ...-uuid?query=params
    // Try to match UUID at the end of the string
    const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:\?|$)/;
    const uuidMatch = lastPart.match(uuidPattern);
    if (uuidMatch) {
      return uuidMatch[1];
    }
    
    // Fallback: try to find UUID anywhere in the string (for robustness)
    const uuidPatternAnywhere = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/;
    const uuidMatchAnywhere = lastPart.match(uuidPatternAnywhere);
    if (uuidMatchAnywhere) {
      return uuidMatchAnywhere[1];
    }
    
    // Last fallback: return the last part if no UUID pattern found
    return lastPart;
  }
  return input.trim();
}

// Validate vehicle ID format (UUID format)
export function validateVehicleId(vehicleId: string): boolean {
  const pattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  return pattern.test(vehicleId);
}

// Check API health
export async function checkApiHealth(): Promise<ApiHealth> {
  return retryApiCall(async () => {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  });
}

// Get database statistics
export async function getDatabaseStats(): Promise<ApiStats> {
  return retryApiCall(async () => {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  });
}

// Get vehicle details
export async function getVehicleDetails(vehicleId: string, signal?: AbortSignal): Promise<Vehicle> {
  return retryApiCall(async () => {
    const response = await fetch(`${API_BASE}/listings/${vehicleId}`, { signal });
    
    // Don't retry on 404 - vehicle simply doesn't exist
    if (response.status === 404) {
      let errorMessage = 'Vehicle not found. Please check the URL and try again.';
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors, use default message
      }
      throw new Error(errorMessage);
    }
    
    if (!response.ok) {
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    const payload = await response.json();
    return normalizeVehicle(payload);
  });
}

// Get comparable vehicles
export interface ComparablesResponse {
  vehicle: Vehicle;
  comparables: Vehicle[];
  metadata: {
    requested_top: number;
    returned: number;
    total_candidates: number;
  };
}

export async function getComparableVehicles(
  vehicleId: string,
  top: number = 10,
  signal?: AbortSignal,
): Promise<ComparablesResponse> {
  return retryApiCall(async () => {
    const response = await fetch(`${API_BASE}/listings/${vehicleId}/comparables?top=${top}`, { signal });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No comparable vehicles found for this vehicle.');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    const payload = await response.json();

    const comparables = Array.isArray(payload?.comparables)
      ? payload.comparables.map((item: any) => normalizeVehicle(item))
      : [];

    const vehicle = payload?.vehicle ? normalizeVehicle(payload.vehicle) : await getVehicleDetails(vehicleId, signal);

    return {
      vehicle,
      comparables,
      metadata: {
        requested_top: payload?.metadata?.requested_top ?? top,
        returned: payload?.metadata?.returned ?? comparables.length,
        total_candidates: payload?.metadata?.total_candidates ?? comparables.length,
      },
    };
  });
}

// API health monitoring
export class ApiHealthMonitor {
  private static instance: ApiHealthMonitor;
  private healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  private lastCheck: Date | null = null;
  private consecutiveFailures = 0;

  static getInstance(): ApiHealthMonitor {
    if (!ApiHealthMonitor.instance) {
      ApiHealthMonitor.instance = new ApiHealthMonitor();
    }
    return ApiHealthMonitor.instance;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const health = await checkApiHealth();
      this.healthStatus = health.database_connected ? 'healthy' : 'degraded';
      this.consecutiveFailures = 0;
      this.lastCheck = new Date();
      return true;
    } catch (error) {
      this.consecutiveFailures++;
      this.lastCheck = new Date();
      
      if (this.consecutiveFailures >= 3) {
        this.healthStatus = 'unhealthy';
      } else {
        this.healthStatus = 'degraded';
      }
      
      return false;
    }
  }

  getStatus(): { status?: string; lastCheck: Date | null; consecutiveFailures: number } {
    return {
      status: this.healthStatus,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  isHealthy(): boolean {
    return this.healthStatus === 'healthy';
  }
}

// Main comparison function
interface CompareOptions {
  top?: number;
  signal?: AbortSignal;
}

export async function compareVehicle(input: string, options?: CompareOptions): Promise<ComparablesResponse> {
  const vehicleId = extractVehicleId(input);

  if (!validateVehicleId(vehicleId)) {
    throw new Error('Invalid vehicle URL or ID format. Please use a valid AutoScout24 URL.');
  }

  const top = options?.top ?? 12;
  const signal = options?.signal;

  try {
    const response = await getComparableVehicles(vehicleId, top, signal);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Vehicle comparison failed: ${error}`);
  }
}

// Format deal score for display
export function formatDealScore(rawScore?: number | null): { text: string; class: string; isGood: boolean } {
  if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) {
    return { text: 'Fair Price', class: 'text-gray-600', isGood: true };
  }

  let normalized = rawScore;

  if (normalized >= 0 && normalized <= 1) {
    normalized = (normalized - 0.5) * 2;
  }

  normalized = Math.max(-1, Math.min(1, normalized));

  if (Math.abs(normalized) < 0.01) {
    return { text: 'Fair Price', class: 'text-gray-600', isGood: true };
  }

  const percentage = Math.abs(normalized * 100).toFixed(1);

  if (normalized > 0) {
    return {
      text: `Good Deal (+${percentage}%)`,
      class: 'text-green-600',
      isGood: true,
    };
  }

  return {
    text: `Overpriced (${percentage}%)`,
    class: 'text-red-600',
    isGood: false,
  };
}

// Format price for display
export function formatPrice(price?: number | null): string {
  if (price === null || price === undefined || Number.isNaN(price)) {
    return 'N/A';
  }

  return currencyFormatter.format(price);
}

// Format mileage for display
export function formatMileage(mileage: number): string {
  if (mileage === null || mileage === undefined || Number.isNaN(mileage)) {
    return 'N/A';
  }
  return `${mileageFormatter.format(mileage)} km`;
}
