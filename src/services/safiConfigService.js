import authService from './authService';

/**
 * SAFI Configuration & Governance Service
 * Interfaces with the backend at /api/v1/safi
 */
class SafiConfigService {
  /**
   * Fetch active SAFI configuration for an account number
   * Backend: GET /api/v1/safi/config/:accountNumber
   */
  async getConfig(accountNumber) {
    if (!accountNumber) return null;
    try {
      return await authService.request(`/safi/config/${encodeURIComponent(accountNumber)}`, {
        method: 'GET',
      });
    } catch (err) {
      if (err.statusCode === 404) {
        return null; // No config configured yet
      }
      throw err;
    }
  }

  /**
   * Create a new SAFI configuration
   * Backend: POST /api/v1/safi/config
   */
  async createConfig(payload) {
    return await authService.request('/safi/config', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update an existing SAFI configuration
   * Backend: PATCH /api/v1/safi/config/:accountNumber
   * Note: UpdateSafiConfigDto omits accountNumber from body as it is in the URL route param
   */
  async updateConfig(accountNumber, payload) {
    const { accountNumber: _unused, ...updateData } = payload;
    return await authService.request(`/safi/config/${encodeURIComponent(accountNumber)}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Smart Save (Creates if not existing, or Updates if already configured)
   */
  async saveConfig(accountNumber, payload) {
    try {
      return await this.createConfig(payload);
    } catch (err) {
      // If already exists (409 Conflict), update it
      if (err.statusCode === 409 || err.message?.includes('already exists')) {
        return await this.updateConfig(accountNumber, payload);
      }
      throw err;
    }
  }

  /**
   * Fetch SAFI dashboard metrics (cycle window, daily rate, rules maintained, etc.)
   * Backend: GET /api/v1/safi/config/:accountNumber/dashboard
   */
  async getDashboard(accountNumber) {
    if (!accountNumber) return null;
    try {
      return await authService.request(`/safi/config/${encodeURIComponent(accountNumber)}/dashboard`, {
        method: 'GET',
      });
    } catch (err) {
      if (err.statusCode === 404) return null;
      throw err;
    }
  }

  /**
   * Fetch SAFI history (past completed cycles, outcomes, compliance scores)
   * Backend: GET /api/v1/safi/config/:accountNumber/history
   */
  async getHistory(accountNumber) {
    if (!accountNumber) return null;
    try {
      return await authService.request(`/safi/config/${encodeURIComponent(accountNumber)}/history`, {
        method: 'GET',
      });
    } catch (err) {
      if (err.statusCode === 404) return null;
      throw err;
    }
  }

  /**
   * Fetch institutional governance controls (allowed modes, card behaviours)
   * Backend: GET /api/v1/safi/controls
   */
  async getControls() {
    try {
      return await authService.request('/safi/controls', {
        method: 'GET',
      });
    } catch (err) {
      console.warn('Could not fetch SAFI controls:', err);
      return null;
    }
  }

  /**
   * Pause SAFI rule enforcement
   * Backend: POST /api/v1/safi/config/:accountNumber/pause
   */
  async pauseConfig(accountNumber) {
    return await authService.request(`/safi/config/${encodeURIComponent(accountNumber)}/pause`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Resume SAFI rule enforcement
   * Backend: POST /api/v1/safi/config/:accountNumber/resume
   */
  async resumeConfig(accountNumber) {
    return await authService.request(`/safi/config/${encodeURIComponent(accountNumber)}/resume`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Deactivate SAFI configuration
   * Backend: DELETE /api/v1/safi/config/:accountNumber
   */
  async deactivateConfig(accountNumber) {
    return await authService.request(`/safi/config/${encodeURIComponent(accountNumber)}`, {
      method: 'DELETE',
    });
  }
}

export const safiConfigService = new SafiConfigService();
export default safiConfigService;
