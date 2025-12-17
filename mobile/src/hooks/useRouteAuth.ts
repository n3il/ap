import { usePrivy } from "@privy-io/expo";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { isRouteAccessible, ROUTES } from "@/config/routes";

/**
 * Hook to check route accessibility based on authentication state
 */
export default function useRouteAuth({
  autoRedirect = false
}: {
  autoRedirect?: boolean
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = usePrivy();
  const isAuthenticated = !!user;
  const loading = !isReady;

  // Get REQUIRE_AUTH from environment variable
  const requireAuth =
    process.env.EXPO_PUBLIC_REQUIRE_AUTH === undefined ||
    process.env.EXPO_PUBLIC_REQUIRE_AUTH === "true";

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

  useEffect(() => {
    if (isReady && !user && autoRedirect) {
      router.push(ROUTES.AUTH_INDEX.path)
    }
  }, []);

  return {
    isAuthenticated,
    loading,
    requireAuth,
    canAccessRoute,
    canAccessCurrentRoute: canAccessRoute(pathname),
    authRoute: ROUTES.AUTH_INDEX.path,
  };
}
