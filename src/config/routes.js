/**
 * Central route configuration with authentication requirements
 *
 * requiresAuthentication values:
 * - false: Always accessible to unauthenticated users
 * - 'optional': Accessible only if REQUIRE_AUTH=false
 * - true: Always requires authentication
 */

export const ROUTES = {
  // Getting Started
  INDEX: {
    path: '/index',
    requiresAuthentication: false,
  },

  // Auth Routes - Always allow unauthenticated
  AUTH_ONBOARDING: {
    path: '/(auth)/onboarding',
    requiresAuthentication: false,
  },
  AUTH_VERIFY_OTP: {
    path: '/(auth)/verify-otp',
    requiresAuthentication: false,
  },
  AUTH_FORGOT_PASSWORD: {
    path: '/(auth)/forgot-password',
    requiresAuthentication: false,
  },
  AUTH_LOGIN: {
    path: '/(auth)/auth',
    requiresAuthentication: false,
  },
  AUTH_INDEX: {
    path: '/(auth)/index',
    requiresAuthentication: false,
  },

  // Neuralink Routes - Allow if REQUIRE_AUTH=false
  NEURALINK_INDEX: {
    path: '/(neuralink)/index',
    requiresAuthentication: 'optional',
  },
  NEURALINK_PROBLEM: {
    path: '/(neuralink)/problem',
    requiresAuthentication: 'optional',
  },

  // Tabs Routes - Some optional, some always require auth
  TABS_AGENTS: {
    path: '/(tabs)/agents',
    requiresAuthentication: 'optional',
  },
  TABS_INDEX: {
    path: '/(tabs)/index',
    requiresAuthentication: 'optional',
  },

  // Explore Routes - Always require auth
  TABS_EXPLORE_INDEX: {
    path: '/(tabs)/(explore)/index',
    requiresAuthentication: true,
  },
  TABS_EXPLORE_MARKETS: {
    path: '/(tabs)/(explore)/Markets',
    requiresAuthentication: true,
  },
  TABS_EXPLORE_AGENT: {
    path: '/(tabs)/(explore)/agent',
    requiresAuthentication: true,
  },
  TABS_EXPLORE_AGENT_ID: {
    path: '/(tabs)/(explore)/agent/[id]',
    requiresAuthentication: true,
  },
  TABS_EXPLORE_AGENT_ID_INDEX: {
    path: '/(tabs)/(explore)/agent/[id]/index',
    requiresAuthentication: true,
  },
  TABS_EXPLORE_AGENT_ID_MANAGE: {
    path: '/(tabs)/(explore)/agent/[id]/manage',
    requiresAuthentication: true,
  },

  // Profile Routes - Always require auth
  TABS_PROFILE_INDEX: {
    path: '/(tabs)/(profile)/index',
    requiresAuthentication: true,
  },
  TABS_PROFILE_ACCOUNT_SETTINGS: {
    path: '/(tabs)/(profile)/account-settings',
    requiresAuthentication: true,
  },

  // Performance & Trades - Always require auth
  TABS_PERFORMANCE: {
    path: '/(tabs)/performance',
    requiresAuthentication: true,
  },
  TABS_TRADES: {
    path: '/(tabs)/trades',
    requiresAuthentication: true,
  },
};

/**
 * Check if a route requires authentication based on current auth state and config
 * @param {string} path - The route path
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {boolean} requireAuth - Value of REQUIRE_AUTH env var
 * @returns {boolean} - Whether the route is accessible
 */
export function isRouteAccessible(path, isAuthenticated, requireAuth = true) {
  // Find the route config
  const routeConfig = Object.values(ROUTES).find(route => route.path === path);

  if (!routeConfig) {
    // Unknown route, default to requiring auth
    return isAuthenticated;
  }

  const { requiresAuthentication } = routeConfig;

  // Always accessible
  if (requiresAuthentication === false) {
    return true;
  }

  // Always requires auth
  if (requiresAuthentication === true) {
    return isAuthenticated;
  }

  // Optional - depends on REQUIRE_AUTH setting
  if (requiresAuthentication === 'optional') {
    if (requireAuth) {
      // REQUIRE_AUTH=true, so this route requires auth
      return isAuthenticated;
    } else {
      // REQUIRE_AUTH=false, so this route is accessible
      return true;
    }
  }

  return isAuthenticated;
}

/**
 * Get the first accessible route for unauthenticated users
 * @param {boolean} requireAuth - Value of REQUIRE_AUTH env var
 * @returns {string} - The path to redirect to
 */
export function getDefaultUnauthenticatedRoute(requireAuth = true) {
  if (!requireAuth) {
    // REQUIRE_AUTH=false, send to explore
    return ROUTES.TABS_EXPLORE_INDEX.path;
  }
  // REQUIRE_AUTH=true, send to auth
  return ROUTES.AUTH_INDEX.path;
}
