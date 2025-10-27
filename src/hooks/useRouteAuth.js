import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isRouteAccessible } from '@/config/routes';

/**
 * Hook to check route accessibility based on authentication state
 */
export default function useRouteAuth() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  // Get REQUIRE_AUTH from environment variable
  const requireAuth =
    process.env.EXPO_PUBLIC_REQUIRE_AUTH === undefined ||
    process.env.EXPO_PUBLIC_REQUIRE_AUTH === 'true';

  /**
   * Check if a specific route path is accessible
   * @param {string} path - Route path to check
   * @returns {boolean} - Whether the route is accessible
   */
  const canAccessRoute = useMemo(
    () => (path) => {
      if (loading) return false;
      return isRouteAccessible(path, isAuthenticated, requireAuth);
    },
    [isAuthenticated, loading, requireAuth],
  );

  return {
    isAuthenticated,
    loading,
    requireAuth,
    canAccessRoute,
  };
}
