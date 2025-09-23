import { API_BASE_URL } from '../config/apiEndpoints';


export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    }
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Please check if the backend is running and your network connection.');
    }
    throw error;
  }
};

export const testNetworkConnectivity = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const API_ROUTES = {
  base: API_BASE_URL,
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REGISTER_WITH_TEAM: `${API_BASE_URL}/auth/register-team`,
    JOIN_TEAM: `${API_BASE_URL}/auth/join-team`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
  },

  
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    registerTeam: `${API_BASE_URL}/auth/register-team`,
    joinTeam: `${API_BASE_URL}/auth/join-team`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  },

  
  teams: {
    list: `${API_BASE_URL}/teams`,
    myTeam: `${API_BASE_URL}/teams/my-team`,
    leaderboard: `${API_BASE_URL}/teams/leaderboard`,
    activities: (teamId) => `${API_BASE_URL}/teams/${teamId || 'my-team'}/activities`,
    create: `${API_BASE_URL}/teams`,
    update: (teamId) => `${API_BASE_URL}/teams/${teamId}`,
    delete: (teamId) => `${API_BASE_URL}/teams/${teamId}`,
    members: (teamId) => `${API_BASE_URL}/teams/${teamId}/members`,
    admin: `${API_BASE_URL}/teams/admin`,
    adminDetail: (teamId) => `${API_BASE_URL}/teams/admin/${teamId}`,
    assignCoach: (teamId) => `${API_BASE_URL}/teams/${teamId}/coach`,
    resetPoints: (teamId) => `${API_BASE_URL}/admin/teams/${teamId}/reset-points`,
  },

  
  users: {
    list: `${API_BASE_URL}/users`,
    profile: (userId) => `${API_BASE_URL}/users/${userId}`,
    update: (userId) => `${API_BASE_URL}/users/${userId}`,
    delete: (userId) => `${API_BASE_URL}/users/${userId}`,
    assign: (userId) => `${API_BASE_URL}/users/${userId}/assign`,
    coaches: `${API_BASE_URL}/users/coaches`,
  },

  
  activities: {
    list: `${API_BASE_URL}/activities`,
    detail: (activityId) => `${API_BASE_URL}/activities/${activityId}`,
    submit: (activityId) => `${API_BASE_URL}/activities/${activityId}/submit`,
    updateSubmission: (submissionId) => `${API_BASE_URL}/activities/submission/${submissionId}`,
    create: `${API_BASE_URL}/activities`,
    update: (activityId) => `${API_BASE_URL}/activities/${activityId}`,
    delete: (activityId) => `${API_BASE_URL}/activities/${activityId}`,
  },

  
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

  
  productSales: {
    sell: `${API_BASE_URL}/products/sell`,
    mySales: `${API_BASE_URL}/product-sales/my-sales`,
    purchaseTicket: `${API_BASE_URL}/products/purchase-ticket`,
    delete: (saleId) => `${API_BASE_URL}/products/sales/${saleId}`,
    coachSales: `${API_BASE_URL}/products/sales/coach`,
  },

  
  donations: {
    create: `${API_BASE_URL}/donations`,
    list: `${API_BASE_URL}/donations`,
    webhook: `${API_BASE_URL}/donations/webhook`,
  },

  
  photos: {
    upload: `${API_BASE_URL}/photos/`,
    productUpload: `${API_BASE_URL}/photos/product`,
  },

  
  LEADERBOARD: {
    GET: `${API_BASE_URL}/leaderboard`,
    LIST: `${API_BASE_URL}/leaderboard`, 
    TEAMS: `${API_BASE_URL}/leaderboard/teams`,
    STUDENTS: `${API_BASE_URL}/leaderboard/students`,
    STATISTICS: `${API_BASE_URL}/leaderboard/statistics`,
  },
  
  
  leaderboard: {
    teams: `${API_BASE_URL}/leaderboard/teams`,
    students: `${API_BASE_URL}/leaderboard/students`,
    list: `${API_BASE_URL}/leaderboard`,
    statistics: `${API_BASE_URL}/leaderboard/statistics`,
  },

  
  DASHBOARD: {
    STUDENT: `${API_BASE_URL}/auth/me`, 
    COACH: `${API_BASE_URL}/auth/me`, 
    ADMIN: `${API_BASE_URL}/auth/me`, 
    STAFF: `${API_BASE_URL}/auth/me`, 
  },

  
  STAFF: {
    REVIEW_SUBMISSION: `${API_BASE_URL}/staff/review-submission`,
  },

  
  announcements: {
    global: `${API_BASE_URL}/announcements/global`,
    createGlobal: `${API_BASE_URL}/announcements/global`,
    forTeam: (teamId) => `${API_BASE_URL}/announcements/teams/${teamId}`,
    create: (teamId) => `${API_BASE_URL}/announcements/teams/${teamId}`,
    delete: (teamId, announcementId) => `${API_BASE_URL}/announcements/teams/${teamId}/${announcementId}`,
    deleteGlobal: (announcementId) => `${API_BASE_URL}/announcements/global/${announcementId}`,
  },

  
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

  
  admin: {
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    users: `${API_BASE_URL}/admin/users`,
    updateUser: (userId) => `${API_BASE_URL}/admin/users/${userId}`,
    teams: `${API_BASE_URL}/admin/teams`,
    coaches: `${API_BASE_URL}/admin/coaches`,
    activities: `${API_BASE_URL}/admin/activities`,
    activityDetail: (activityId) => `${API_BASE_URL}/admin/activities/${activityId}`,
    sales: `${API_BASE_URL}/admin/sales`,
    config: `${API_BASE_URL}/admin/config`,
  },
};


export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};


export const createAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

export default API_ROUTES;
