# Project Phi Mobile App

React Native mobile application for the Project Phi sports team management system.

## 📱 Features

- **Authentication**: Login/Register functionality
- **Team Dashboard**: View team stats, members, and progress
- **Activity Submission**: Submit activities with photo/receipt capture
- **Leaderboard**: Real-time team rankings
- **Push Notifications**: Activity updates and announcements
- **Camera Integration**: Photo capture for activities and receipts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run ios     # For iOS simulator
npm run android # For Android emulator
npm run web     # For web browser
```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── navigation/     # Navigation configuration
│   ├── contexts/       # React Context providers
│   ├── services/       # API services
│   └── utils/          # Utility functions
├── App.js              # Main app component
└── package.json
```

## 🔗 Backend Integration

The mobile app connects to the same Node.js backend as the web application:
- **Local Development**: `http://localhost:4243`
- **Production**: TBD (AWS deployment)

## 📋 TODO

- [ ] Set up authentication screens
- [ ] Create dashboard components
- [ ] Implement camera functionality
- [ ] Add push notifications
- [ ] Set up navigation structure
- [ ] Create team management screens
- [ ] Implement activity submission flow
