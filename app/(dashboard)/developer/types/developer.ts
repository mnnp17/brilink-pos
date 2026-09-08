export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'INFO';
export type ApiCategory = 'INTERNAL_APP' | 'GEMINI_AI';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface SystemHealth {
  databaseLatencyMs: number;
  memoryUsageMb: number;
  uptimeSeconds: number;
  activeShiftsCount: number;
  isMaintenanceMode: boolean;
}

export interface GeminiUsageMetrics {
  promptTokensToday: number;
  candidatesTokensToday: number;
  estimatedCostUsd: number;
  rateLimitStatus: 'HEALTHY' | 'WARNING_80' | 'RATE_LIMITED';
  averageLatencyMs: number;
}

export interface ApiTelemetryLog {
  id: string;
  timestamp: string;
  category: ApiCategory;
  endpoint: string;
  method: HttpMethod;
  statusCode: number;
  durationMs: number;
  requestHeaders: Record<string, string>;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  tokenCount?: number;
}

export interface SystemErrorLog {
  id: string;
  timestamp: string;
  severity: SeverityLevel;
  errorName: string;
  errorMessage: string;
  stackTrace: string;
  cashierId?: string;
  shiftId?: string;
  route: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface ActiveUserSession {
  userId: string;
  fullName: string;
  username: string;
  role: 'OWNER' | 'SENIOR_CASHIER' | 'JUNIOR_CASHIER';
  shiftStatus?: 'ON_DUTY' | 'OFF_DUTY';
  ipAddress: string;
  deviceInfo: string;
  lastActiveAt: string;
}
