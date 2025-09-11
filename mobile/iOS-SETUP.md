# iOS Native Development Setup

## Option 1: Expo Development Build (Recommended)

### Step 1: Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Step 2: Configure iOS Development Build
```bash
cd /Users/pacoruan/Desktop/Project-Phi/mobile
eas build:configure
```

### Step 3: Create iOS Development Build
```bash
eas build --platform ios --profile development
```

## Option 2: Eject to Bare React Native (Advanced)

### Step 1: Eject from Expo
```bash
cd /Users/pacoruan/Desktop/Project-Phi/mobile
npx expo eject
```

### Step 2: Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### Step 3: Open in Xcode
```bash
open ios/YourProjectName.xcworkspace
```

## Quick Start (Current Approach)

For now, the easiest approach is:
1. Press `i` in the Expo terminal to open iOS Simulator
2. Your app will run in the simulator
3. Test the login/register functionality

## Backend Connection Fix

Make sure your backend is accessible. In the mobile app's api.js:
- iOS Simulator: `localhost:4243` should work
- Physical device: Use your computer's IP address like `192.168.1.132:4243`

## Testing Steps

1. Start backend: `docker compose up` (in Project-Phi root)
2. Start mobile: `npx expo start` (in mobile folder)
3. Press `i` to open iOS Simulator
4. Test login with existing user credentials
