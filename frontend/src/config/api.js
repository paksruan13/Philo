// API configuration and routes
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ROUTES = {
  // Authentication routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    JOIN_TEAM: '/auth/join-team'
  },
  
  // User routes
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update'
  },
  
  // Team routes
  TEAMS: {
    LIST: '/teams',
    CREATE: '/teams/create',
    JOIN: '/teams/join',
    DETAILS: (id) => `/teams/${id}`
  },
  
  // Activity routes
  ACTIVITIES: {
    LIST: '/activities',
    SUBMIT: '/activities/submit',
    DETAILS: (id) => `/activities/${id}`
  },
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    TEAMS: '/admin/teams'
  },
  
  // Coach routes
  COACH: {
    DASHBOARD: '/coach/dashboard',
    TEAMS: '/coach/teams'
  },
  
  // Leaderboard routes
  LEADERBOARD: {
    LIST: '/leaderboard'
  },
  
  // Donation routes
  DONATIONS: {
    LIST: '/donations',
    CREATE: '/donations/create'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (route) => {
  return `${API_BASE_URL}${route}`;
};

export default API_ROUTES;
