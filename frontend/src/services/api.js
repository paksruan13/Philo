// API Configuration and Route Organization

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4243/api';

// API Endpoints organized by domain
export const API_ROUTES = {
  // Authentication endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    registerTeam: `${API_BASE_URL}/auth/register-team`,
    joinTeam: `${API_BASE_URL}/auth/join-team`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  },

  // Team endpoints  
  teams: {
    myTeam: `${API_BASE_URL}/teams/my-team`,
    leaderboard: `${API_BASE_URL}/teams/leaderboard`,
    activities: (teamId) => `${API_BASE_URL}/teams/${teamId || 'my-team'}/activities`,
    create: `${API_BASE_URL}/admin/teams`,
    update: (teamId) => `${API_BASE_URL}/admin/teams/${teamId}`,
    delete: (teamId) => `${API_BASE_URL}/teams/${teamId}`,
    members: (teamId) => `${API_BASE_URL}/teams/${teamId}/members`,
    admin: `${API_BASE_URL}/admin/teams`,
    adminDetail: (teamId) => `${API_BASE_URL}/teams/admin/${teamId}`,
    assignCoach: (teamId) => `${API_BASE_URL}/teams/${teamId}/coach`,
    resetPoints: (teamId) => `${API_BASE_URL}/admin/teams/${teamId}/reset-points`,
  },

  // User endpoints
  users: {
    list: `${API_BASE_URL}/users`,
    profile: (userId) => `${API_BASE_URL}/users/${userId}`,
    update: (userId) => `${API_BASE_URL}/users/${userId}`,
    delete: (userId) => `${API_BASE_URL}/users/${userId}`,
    assign: (userId) => `${API_BASE_URL}/users/${userId}/assign`,
    coaches: `${API_BASE_URL}/users/coaches`,
  },

  // Activity endpoints
  activities: {
    list: `${API_BASE_URL}/activities`,
    detail: (activityId) => `${API_BASE_URL}/activities/${activityId}`,
    submit: (activityId) => `${API_BASE_URL}/activities/${activityId}/submit`,
    updateSubmission: (submissionId) => `${API_BASE_URL}/activities/submission/${submissionId}`,
    create: `${API_BASE_URL}/activities`,
    update: (activityId) => `${API_BASE_URL}/activities/${activityId}`,
    delete: (activityId) => `${API_BASE_URL}/activities/${activityId}`,
  },

  // Product endpoints
  products: {
    list: `${API_BASE_URL}/products`,
    public: `${API_BASE_URL}/products/public`,
    detail: (productId) => `${API_BASE_URL}/products/${productId}`,
    create: `${API_BASE_URL}/products`,
    update: (productId) => `${API_BASE_URL}/products/${productId}`,
    delete: (productId) => `${API_BASE_URL}/products/${productId}`,
    inventory: `${API_BASE_URL}/products/inventory`,
    sales: `${API_BASE_URL}/products/sales`,
  },

  // Product Sales endpoints
  productSales: {
    sell: `${API_BASE_URL}/products/sell`,
    mySales: `${API_BASE_URL}/product-sales/my-sales`,
    purchaseTicket: `${API_BASE_URL}/products/purchase-ticket`,
    delete: (saleId) => `${API_BASE_URL}/products/sales/${saleId}`,
    coachSales: `${API_BASE_URL}/products/sales/coach`,
  },

  // Sales endpoints
  sales: {
    recent: `${API_BASE_URL}/sales/recent`,
  },

  // Donation endpoints
  donations: {
    create: `${API_BASE_URL}/donations`,
    list: `${API_BASE_URL}/donations`,
    webhook: `${API_BASE_URL}/donations/webhook`,
  },

  // Photos endpoints
  photos: {
    upload: `${API_BASE_URL}/photos/`,
  },

  // Admin endpoints
  admin: {
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    users: `${API_BASE_URL}/admin/users`,
    updateUser: (userId) => `${API_BASE_URL}/admin/users/${userId}`,
    teams: `${API_BASE_URL}/admin/teams`,
    activities: `${API_BASE_URL}/admin/activities`,
    activityDetail: (activityId) => `${API_BASE_URL}/admin/activities/${activityId}`,
    sales: `${API_BASE_URL}/admin/sales`,
    stats: `${API_BASE_URL}/admin/stats`,
    config: `${API_BASE_URL}/admin/config`,
  },

  // Coach endpoints
  coach: {
    dashboard: `${API_BASE_URL}/coach/dashboard`,
    teams: `${API_BASE_URL}/coach/teams`,
    sales: `${API_BASE_URL}/coach/sales`,
    products: `${API_BASE_URL}/coach/products`,
    pointsHistory: `${API_BASE_URL}/coach/manual-points-history`,
    students: `${API_BASE_URL}/coach/students`,
    awardPoints: `${API_BASE_URL}/coach/award-points`,
    deletePoints: (pointsId) => `${API_BASE_URL}/coach/manual-points/${pointsId}`,
    pendingSubmissions: `${API_BASE_URL}/coach/pending-submissions`,
    approvedSubmissions: `${API_BASE_URL}/coach/approved-submissions`,
    approveSubmission: (submissionId) => `${API_BASE_URL}/coach/submissions/${submissionId}/approve`,
    rejectSubmission: (submissionId) => `${API_BASE_URL}/coach/submissions/${submissionId}/reject`,
    unapproveSubmission: (submissionId) => `${API_BASE_URL}/coach/submissions/${submissionId}/unapprove`,
    deleteSubmission: (submissionId) => `${API_BASE_URL}/coach/submissions/${submissionId}`,
  },

  // Staff endpoints
  staff: {
    dashboard: `${API_BASE_URL}/staff/dashboard`,
    awardPoints: `${API_BASE_URL}/staff/award-points`,
    sellProduct: `${API_BASE_URL}/staff/sell-product`,
    pointsHistory: `${API_BASE_URL}/staff/manual-points-history`,
    sales: `${API_BASE_URL}/staff/sales`,
  },

  // Leaderboard endpoints
  leaderboard: {
    teams: `${API_BASE_URL}/leaderboard/teams`,
    students: `${API_BASE_URL}/leaderboard/students`,
    list: `${API_BASE_URL}/leaderboard`,
    statistics: `${API_BASE_URL}/leaderboard/statistics`,
  },

  // Announcements endpoints
  announcements: {
    global: `${API_BASE_URL}/announcements/global`,
    createGlobal: `${API_BASE_URL}/announcements/global`,
    forTeam: (teamId) => `${API_BASE_URL}/announcements/teams/${teamId}`,
    create: (teamId) => `${API_BASE_URL}/announcements/teams/${teamId}`,
    delete: (teamId, announcementId) => `${API_BASE_URL}/announcements/teams/${teamId}/${announcementId}`,
    deleteGlobal: (announcementId) => `${API_BASE_URL}/announcements/global/${announcementId}`,
  },
};

// HTTP client with common configuration
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Helper method to get auth headers
  getAuthHeaders(token) {
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // GET request
  async get(url, token = null) {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // POST request
  async post(url, data, token = null) {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // PUT request
  async put(url, data, token = null) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // DELETE request
  async delete(url, token = null) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Form data POST (for file uploads)
  async postFormData(url, formData, token = null) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData, browser will set it
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  // Response handler with error management
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } else {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.text();
    }
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Convenience functions for common operations
export const api = {
  // Auth operations
  login: (email, password) => 
    apiClient.post(API_ROUTES.auth.login, { email, password }),
  
  register: (userData) => 
    apiClient.post(API_ROUTES.auth.register, userData),

  // Team operations
  getMyTeam: (token) => 
    apiClient.get(API_ROUTES.teams.myTeam, token),
  
  getLeaderboard: () => 
    apiClient.get(API_ROUTES.teams.leaderboard),

  // Product operations
  getPublicProducts: () => 
    apiClient.get(API_ROUTES.products.public),
  
  sellProduct: (saleData, token) => 
    apiClient.post(API_ROUTES.productSales.sell, saleData, token),

  purchaseTicket: (ticketData) => 
    apiClient.post(API_ROUTES.productSales.purchaseTicket, ticketData),

  // Activity operations
  getActivity: (activityId, token) => 
    apiClient.get(API_ROUTES.activities.detail(activityId), token),
  
  submitActivity: (activityId, submissionData, token) => 
    apiClient.post(API_ROUTES.activities.submit(activityId), submissionData, token),
};

export default { API_ROUTES, apiClient, api };
