// KRISHVYA Frontend API Client Layer
// Bridges React state with Express API + Prisma SQLite Database, with resilient offline fallback

const API_BASE_URL = 'http://localhost:5001/api';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  farm?: any;
  error?: string;
}

class ApiService {
  private tokenKey = 'krishvya_jwt_token';

  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  setToken(token: string) {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (e) {
      console.error('Failed to store token:', e);
    }
  }

  removeToken() {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (e) {
      console.error('Failed to remove token:', e);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: json.message || `HTTP error ${response.status}`,
          error: json.message || response.statusText,
        };
      }

      return json;
    } catch (err) {
      console.warn(`[KRISHVYA API Offline Mode] Failed to reach ${endpoint}:`, err);
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  }

  // Health check
  async getHealth() {
    return this.request<{ status: string; platform: string; database?: string }>('/health');
  }

  // Authentication
  async login(identifier: string, password?: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: identifier, password }),
    });

    if (res.success && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async signup(payload: {
    name: string;
    phone: string;
    password?: string;
    email?: string;
    role?: string;
    village?: string;
    district?: string;
    state?: string;
    totalLandAcres?: number;
  }) {
    const res = await this.request<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async verifyOtp(phone: string, otp: string) {
    const res = await this.request<any>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    if (res.success && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Farm
  async getFarm() {
    return this.request<any>('/farm');
  }

  async updateFarm(updates: unknown) {
    return this.request<any>('/farm', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Problem Triage
  async getProblems() {
    return this.request<any[]>('/problems');
  }

  async submitProblem(category: string, description: string) {
    return this.request<any>('/problems', {
      method: 'POST',
      body: JSON.stringify({ category, description }),
    });
  }

  // Expert Review
  async getExpertCases() {
    return this.request<any[]>('/expert/cases');
  }

  async resolveExpertCase(caseId: string, expertNotes: string, expertName?: string) {
    return this.request<any>(`/expert/cases/${caseId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ expertNotes, expertName }),
    });
  }

  // Alerts
  async getAlerts() {
    return this.request<any[]>('/alerts');
  }

  // Admin Broadcast
  async sendBroadcast(district: string, message: string) {
    return this.request<any>('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ district, message }),
    });
  }

  // AI Plant Doctor & Farm Advisor
  async diagnoseDisease(imageBase64: string, cropName?: string, notes?: string, mimeType?: string) {
    return this.request<any>('/ai/diagnose', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, cropName, notes, mimeType }),
    });
  }

  async askAdvisor(
    message: string,
    history?: Array<{ role: 'user' | 'model'; content: string }>,
    language?: string,
    farmContext?: any
  ) {
    return this.request<any>('/ai/advisor', {
      method: 'POST',
      body: JSON.stringify({ message, history, language, farmContext }),
    });
  }

  // Live Weather & Satellite Services (Open-Meteo & Sentinel-2)
  async getLiveWeather(lat: number = 21.3855, lon: number = 78.9189, farmId?: string) {
    const query = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      ...(farmId ? { farmId } : {}),
    });
    return this.request<any>(`/weather/live?${query.toString()}`);
  }

  async getLiveSatellite(lat: number = 21.3855, lon: number = 78.9189, farmId?: string) {
    const query = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      ...(farmId ? { farmId } : {}),
    });
    return this.request<any>(`/satellite/live?${query.toString()}`);
  }

  // Spray Tank & Chemical Dosing Services
  async getAgrochemicals() {
    return this.request<any[]>('/tank/chemicals');
  }

  async calculateTankDose(payload: {
    chemicalId: string;
    secondaryChemicalId?: string;
    tankCapacityLiters?: number;
    farmAcres?: number;
  }) {
    return this.request<any>('/tank/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
