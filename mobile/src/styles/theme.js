import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design System - Light Red Purple Gold Theme (matching webapp)
export const Colors = {
  // Main theme colors - Light background like webapp
  background: '#FAF7F2', // warm cream background (hsl(45, 20%, 98%))
  foreground: '#1A1A1A', // very dark text
  
  // Primary colors - Rich purple
  primary: '#A855F7', // rich purple (hsl(270, 85%, 65%))
  primaryForeground: '#FFFFFF',
  
  // Secondary colors - Bright gold
  secondary: '#FFD700', // bright gold (hsl(45, 100%, 50%))
  secondaryForeground: '#1A1A1A',
  
  // Accent colors - Vibrant red
  accent: '#EF4444', // vibrant red (hsl(0, 85%, 60%))
  accentForeground: '#FFFFFF',
  
  // Status colors
  success: '#059669', // success green
  successForeground: '#FFFFFF',
  warning: '#F59E0B', // warning gold
  warningForeground: '#1A1A1A',
  error: '#DC2626', // error red
  errorForeground: '#FFFFFF',
  
  // Ranking colors - matching webapp
  gold: '#FFD700', // winner gold
  silver: '#A6A6A6', // second place silver
  bronze: '#CD853F', // third place bronze
  
  // Utility colors
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  
  // Light muted colors
  muted: '#F3F4F6', // light gray
  mutedForeground: '#6B7280', // medium gray text
  
  // Card and border colors - Light theme
  card: '#FFFFFF', // white cards with slight transparency
  cardForeground: '#1A1A1A',
  popover: '#FFFFFF',
  popoverForeground: '#1A1A1A',
  
  border: '#E5E7EB', // light border
  input: '#F9FAFB', // very light input background
  ring: '#A855F7', // purple focus ring
  
  // Light shadow color
  shadow: '#9333EA', // purple shadow for glow effects
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 16,  // Reduced from 18 to 16 for thinner headers
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const BorderWidths = {
  thin: 0.5,  // Very thin borders for headers
  sm: 1,
  md: 2,
  lg: 3,
};

export const Shadows = {
  soft: {
    shadowColor: '#9333EA', // purple shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    shadowColor: '#9333EA', // purple glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Screen Dimensions
export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  headerHeight: 90,
  tabBarHeight: 80,
  contentHeight: SCREEN_HEIGHT - 90 - 80,
};

// Common Style Objects
export const Styles = {
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Card Styles
  cardBase: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    margin: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryOpacity,
    ...Shadows.card,
  },
  
  // Button Styles
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  
  // Text Styles
  heading1: {
    fontSize: FontSizes['4xl'],
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  
  heading2: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold', 
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  
  heading3: {
    fontSize: FontSizes['2xl'],
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  
  bodyLarge: {
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    lineHeight: FontSizes.lg * 1.5,
  },
  
  body: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    lineHeight: FontSizes.base * 1.5,
  },
  
  caption: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    lineHeight: FontSizes.sm * 1.4,
  },
  
  // Input Styles
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.foreground,
    backgroundColor: Colors.card,
  },
  
  // Layout Helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  // Gradient Colors (for LinearGradient component) - Calm Blue-Gray Theme
  gradientPrimary: ['#f1f5f9', '#e2e8f0', '#cbd5e1'], // light blue-gray gradient
  gradientSecondary: ['#ffffff', '#94a3b8'], // white to gray gradient  
  gradientAccent: ['#64748b', '#94a3b8', '#cbd5e1'], // slate gray gradient
  gradientRoyal: ['#f8fafc', '#e2e8f0', '#cbd5e1'], // subtle light gradient
  gradientBackground: ['#f8fafc', '#f1f5f9', '#e2e8f0'], // light background gradient
  gradientHero: ['#f1f5f9', '#e2e8f0', '#cbd5e1'], // hero background gradient
  gradientCard: ['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.9)'], // card background
  gradientTitleDark: ['#1e293b', '#475569', '#64748b'], // dark slate for titles
};
