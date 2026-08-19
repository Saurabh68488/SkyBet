// ============================================
// API Client
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/api`;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        const retryRes = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
        if (!retryRes.ok) throw new Error(await retryRes.text());
        return retryRes.json();
      }
      // Refresh failed — let the caller handle it
      throw new Error('Authentication expired');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errData.message || 'Request failed');
    }

    return res.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Users
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Wallet
  async getBalance() {
    return this.request<{ balance: number }>('/wallet/balance');
  }

  async getTransactions(page = 1, limit = 20, type?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.append('type', type);
    return this.request<any>(`/wallet/transactions?${params}`);
  }

  // Bets
  async getBetHistory(page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    return this.request<any>(`/bets/history?${params}`);
  }

  async getRoundHistory(page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.request<any>(`/bets/rounds?${params}`);
  }

  // Games
  async getEnabledGames() {
    return this.request<any[]>('/settings/games');
  }

  // ─── Admin APIs ──────────────────────────────

  async getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  async getAdminUsers(page = 1, limit = 20, search?: string, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return this.request<any>(`/admin/users?${params}`);
  }

  async createUser(data: any) {
    return this.request('/admin/users', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async toggleUserStatus(id: string) {
    return this.request(`/admin/users/${id}/status`, { method: 'PUT' });
  }

  async getPlayerPassword(id: string) {
    return this.request<any>(`/admin/users/${id}/password`);
  }

  async changePlayerPassword(id: string, password: string) {
    return this.request(`/admin/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  async adjustBalance(userId: string, amount: number, type: 'add' | 'remove', note?: string) {
    return this.request<any>(`/admin/wallet/${userId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ amount, type, note }),
    });
  }

  async getUserTransactions(userId: string, page = 1) {
    return this.request<any>(`/admin/wallet/${userId}/history?page=${page}`);
  }

  async forceRound(roundNumber: number, crashPoint: number) {
    return this.request('/admin/games/force-round', {
      method: 'POST',
      body: JSON.stringify({ roundNumber, crashPoint }),
    });
  }

  async getForcedRounds() {
    return this.request<any[]>('/admin/games/forced-rounds');
  }

  async deleteForcedRound(id: string) {
    return this.request(`/admin/games/forced-rounds/${id}`, { method: 'DELETE' });
  }

  // ─── JETX ADMIN ───────────────────────────────

  async jetxForceRound(roundNumber: number, crashPoint: number) {
    return this.request('/admin/jetx/force-round', {
      method: 'POST',
      body: JSON.stringify({ roundNumber, crashPoint }),
    });
  }

  async jetxGetForcedRounds() {
    return this.request<any[]>('/admin/jetx/forced-rounds');
  }

  async jetxDeleteForcedRound(id: string) {
    return this.request(`/admin/jetx/forced-rounds/${id}`, { method: 'DELETE' });
  }

  async getRecentTransactions(limit = 10) {
    return this.request<any[]>(`/admin/transactions/recent?limit=${limit}`);
  }

  async getAdminLogs(page = 1, limit = 20, category?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category) params.append('category', category);
    return this.request<any>(`/admin/logs?${params}`);
  }

  async getSettings() {
    return this.request<any>('/settings');
  }

  async updateSettings(data: any) {
    return this.request('/settings', { method: 'PUT', body: JSON.stringify(data) });
  }

  async getAllGameConfigs() {
    return this.request<any[]>('/settings/games/all');
  }

  async updateGameConfig(gameType: string, data: any) {
    return this.request(`/settings/games/${gameType}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // ─── COMMISSION WALLET ──────────────────────────

  async getCommissionSummary() {
    return this.request<any>('/admin/commission/summary');
  }

  async getCommissionHistory(page: number = 1, limit: number = 20) {
    return this.request<any>(`/admin/commission/history?page=${page}&limit=${limit}`);
  }

  // ─── PAYMENTS ───────────────────────────────────

  async createDeposit(amount: number, playerTxnId: string) {
    return this.request<any>('/payments/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, playerTxnId }),
    });
  }

  async createWithdraw(amount: number, upiId: string) {
    return this.request<any>('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, upiId }),
    });
  }

  async getMyPayments(page: number = 1, type?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.append('type', type);
    return this.request<any>(`/payments/my-requests?${params}`);
  }

  // Admin payment endpoints
  async getAdminPayments(page: number = 1, status?: string, type?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    return this.request<any>(`/admin/payments?${params}`);
  }

  async getPaymentStats() {
    return this.request<any>('/admin/payments/stats');
  }

  async approvePayment(id: string, adminTxnId?: string) {
    return this.request(`/admin/payments/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminTxnId }),
    });
  }

  async rejectPayment(id: string, reason: string) {
    return this.request(`/admin/payments/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // ─── QR CODE ───────────────────────────────────

  async getQrCode() {
    return this.request<{ qrCodeData: string | null }>('/settings/qr-code');
  }

  async updateQrCode(qrCodeData: string) {
    return this.request<any>('/settings/qr-code', {
      method: 'PUT',
      body: JSON.stringify({ qrCodeData }),
    });
  }

  // ─── GAME CONFIG ──────────────────────────────

  async getGameConfigs() {
    return this.request<any[]>('/admin/game-configs');
  }

  async setMultiplierRange(gameType: string, minMultiplier: number, maxMultiplier: number) {
    return this.request<any>(`/admin/game-config/${gameType}/multiplier-range`, {
      method: 'PUT',
      body: JSON.stringify({ minMultiplier, maxMultiplier }),
    });
  }

  async toggleGame(gameType: string, enabled: boolean) {
    return this.request<any>(`/admin/game-config/${gameType}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async getEnabledGames() {
    return this.request<any[]>('/settings/games');
  }
}

export const api = new ApiClient();
