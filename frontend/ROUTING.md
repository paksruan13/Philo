# Frontend Routing Structure

## Overview
The frontend now uses React Router for proper client-side routing, replacing the previous state-based navigation system. This provides better SEO, bookmarkable URLs, browser history support, and improved user experience.

## Route Structure

### Public Routes (No Authentication Required)
- `/` - Redirects to `/leaderboard`
- `/leaderboard` - Team leaderboard and competition overview
- `/store` - Product store (former donations page) - accessible to all users

### Authentication Routes (Standalone Pages)
- `/login` - Standalone login page
- `/register` - Standalone registration page

### Protected Routes (Authentication Required)
All protected routes are under `/dashboard/` and require user authentication:

#### Admin Routes (ADMIN role only)
- `/dashboard/admin` - Admin dashboard for user and team management

#### Coach Routes (COACH role only)  
- `/dashboard/coach` - Coach dashboard for team management and product sales

#### Student Routes (STUDENT role only)
- `/dashboard/student` - Student dashboard for activities and submissions
- `/dashboard/student/activity/:activityId` - Activity submission form

#### Automatic Dashboard Redirect
- `/dashboard/` - Automatically redirects based on user role:
  - ADMIN → `/dashboard/admin`
  - COACH → `/dashboard/coach`  
  - STUDENT → `/dashboard/student`

### Error Handling
- `*` (404) - Custom 404 page with navigation options

## Route Protection

### Authentication Protection
- `ProtectedRoute` - Ensures user is logged in before accessing dashboard routes
- Redirects to `/login` if not authenticated

### Role-Based Protection
- `RoleRoute` - Ensures user has appropriate role for specific dashboard sections
- Shows access denied message for insufficient permissions

### Auth Redirect Protection
- `AuthRedirect` - Prevents logged-in users from accessing login/register pages
- Redirects authenticated users to `/dashboard`

## Navigation Components

### Layout Component
- Provides consistent header navigation across all main routes
- Handles authentication modals for quick login/register
- Shows role-specific navigation items based on user permissions
- Includes role-specific notification banners

### Modal vs Page Authentication
- **Modal Authentication**: Available from any page via header buttons
- **Page Authentication**: Standalone login/register pages with better UX for dedicated auth flows

## URL Examples

### Public Access
- `https://yourapp.com/` → Leaderboard
- `https://yourapp.com/leaderboard` → Team rankings
- `https://yourapp.com/store` → Product store

### Student Flow
- `https://yourapp.com/login` → Login page
- `https://yourapp.com/dashboard` → Auto-redirect to student dashboard
- `https://yourapp.com/dashboard/student` → Student main dashboard
- `https://yourapp.com/dashboard/student/activity/123` → Submit activity 123

### Coach Flow
- `https://yourapp.com/dashboard/coach` → Coach product sales and team management

### Admin Flow
- `https://yourapp.com/dashboard/admin` → Admin user and team management

## Technical Implementation

### Router Configuration
- Uses `BrowserRouter` for clean URLs (no hash routing)
- Organized with nested routes for logical grouping
- Proper error boundaries and 404 handling

### Component Structure
```
src/
├── router/
│   ├── AppRouter.jsx          # Main router configuration
│   ├── ProtectedRoute.jsx     # Authentication protection
│   ├── RoleRoute.jsx          # Role-based protection
│   └── index.js               # Route exports
├── pages/
│   ├── AuthPages.jsx          # Standalone login/register pages
│   ├── NotFoundPage.jsx       # 404 error page
│   └── index.js               # Page exports
└── components/
    └── Layout.jsx             # Main app layout with navigation
```

### Benefits of New Structure

1. **SEO Friendly**: Proper URLs that can be indexed and shared
2. **Bookmarkable**: Users can bookmark specific pages and return directly
3. **Browser History**: Proper back/forward button support
4. **Direct Access**: Users can navigate directly to specific sections via URL
5. **Security**: Route-level protection prevents unauthorized access
6. **Performance**: Code splitting potential for lazy loading
7. **Maintenance**: Cleaner separation of concerns and easier debugging

### Migration Notes

- Replaced all `currentView` state management with router navigation
- Updated all navigation buttons to use `Link` or `navigate()` 
- Converted activity submission callback props to URL parameters
- Added proper authentication guards and role checking
- Maintained existing component functionality while improving navigation
