import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


export const Colors = {
  
  background: '#FAF7F2', 
  foreground: '#1A1A1A', 
  
  
  primary: '#A855F7', 
  primaryForeground: '#FFFFFF',
  
  
  secondary: '#FFD700', 
  secondaryForeground: '#1A1A1A',
  
  
  accent: '#EF4444', 
  accentForeground: '#FFFFFF',
  
  
  success: '#059669', 
  successForeground: '#FFFFFF',
  warning: '#F59E0B', 
  warningForeground: '#1A1A1A',
  error: '#DC2626', 
  errorForeground: '#FFFFFF',
  
  
  gold: '#FFD700', 
  silver: '#A6A6A6', 
  bronze: '#CD853F', 
  
  
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  
  
  muted: '#F3F4F6', 
  mutedForeground: '#6B7280', 
  
  
  card: '#FFFFFF', 
  cardForeground: '#1A1A1A',
  popover: '#FFFFFF',
  popoverForeground: '#1A1A1A',
  
  border: '#E5E7EB', 
  input: '#F9FAFB', 
  ring: '#A855F7', 
  
  
  shadow: '#9333EA', 
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
  lg: 16,  
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
  thin: 0.5,  
  sm: 1,
  md: 2,
  lg: 3,
};

export const Shadows = {
  soft: {
    shadowColor: '#9333EA', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    shadowColor: '#9333EA', 
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


export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  headerHeight: 90,
  tabBarHeight: 80,
  contentHeight: SCREEN_HEIGHT - 90 - 80,
};


export const Styles = {
  
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  
  cardBase: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    margin: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryOpacity,
    ...Shadows.card,
  },
  
  
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
  
  
  gradientPrimary: ['#f1f5f9', '#e2e8f0', '#cbd5e1'], 
  gradientSecondary: ['#ffffff', '#94a3b8'], 
  gradientAccent: ['#64748b', '#94a3b8', '#cbd5e1'], 
  gradientRoyal: ['#f8fafc', '#e2e8f0', '#cbd5e1'], 
  gradientBackground: ['#f8fafc', '#f1f5f9', '#e2e8f0'], 
  gradientHero: ['#f1f5f9', '#e2e8f0', '#cbd5e1'], 
  gradientCard: ['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.9)'], 
  gradientTitleDark: ['#1e293b', '#475569', '#64748b'], 
};
