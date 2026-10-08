/**
 * Centralized Authentication Service for Meridian Bank & SAFI Core
 * Interfaces with the backend at http://localhost:3000/api/v1
 */

const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL)

const TOKEN_KEY = 'safi_access_token';
const USER_KEY = 'safi_user';

class AuthService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Helper to perform HTTP requests with JSON and Authorization headers
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError) {
      throw new Error(
        'Unable to connect to the banking server. Please ensure the backend is running on ' +
        this.baseUrl
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred during authentication.';
      if (payload) {
        if (Array.isArray(payload.message)) {
          errorMessage = payload.message.join('. ');
        } else if (payload.message) {
          errorMessage = payload.message;
        } else if (payload.error) {
          errorMessage = payload.error;
        }
      }
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      error.data = payload;
      throw error;
    }

    // Unpack data if transformed by TransformInterceptor: { success, statusCode, data }
    return payload && payload.data !== undefined ? payload.data : payload;
  }

  /**
   * Register a new user account
   */
  async register({ name, email, password, phone }) {
    const data = await this.request('/core-banking/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email: email.trim().toLowerCase(),
        password,
        ...(phone ? { phone: phone.trim() } : {}),
      }),
    });

    if (data?.accessToken) {
      this.setToken(data.accessToken);
    }
    if (data?.user) {
      this.setUser(data.user);
    }

    return data;
  }

  /**
   * Log into an existing user account
   */
  async login({ email, password }) {
    const data = await this.request('/core-banking/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    if (data?.accessToken) {
      this.setToken(data.accessToken);
    }
    if (data?.user) {
      this.setUser(data.user);
    }

    return data;
  }

  /**
   * Request a password reset email
   */
  async forgotPassword({ email }) {
    const data = await this.request('/core-banking/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });
    return data;
  }

  /**
   * Reset password using token received via email
   */
  async resetPassword({ token, password }) {
    const data = await this.request('/core-banking/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: token.trim(),
        password,
      }),
    });
    return data;
  }

  /**
  /**
   * Fetch current authenticated user's profile and active session
   * Falls back gracefully to cached session without clearing authentication,
   * ensuring that network hiccups or unconfigured /me routes do not log the user out.
   */
  async getMe() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const data = await this.request('/core-banking/auth/me', {
        method: 'GET',
      });
      const user = data?.user || (data?.email ? data : null);
      if (user) {
        this.setUser(user);
        return user;
      }
    } catch (err) {
      console.warn('Session revalidation warning (maintaining active cached session):', err?.message || err);
      // Fallback to local stored user
      return this.getUser();
    }
    return this.getUser();
  }

  /**
   * Log out current user
   */
  async logout() {
    try {
      await this.request('/core-banking/auth/logout', {
        method: 'POST',
      });
    } catch {
      // ignore network errors on logout
    } finally {
      this.clearAuth();
    }
  }

  // Token & LocalStorage management
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // ignore
    }
  }

  getUser() {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  setUser(user) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // ignore
    }
  }

  clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
export default authService;
