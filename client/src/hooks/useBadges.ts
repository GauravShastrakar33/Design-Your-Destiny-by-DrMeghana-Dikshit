import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserBadge } from "@shared/schema";

interface BadgesResponse {
  badges: UserBadge[];
}

export function useBadges() {
  const { data, isLoading, refetch } = useQuery<BadgesResponse>({
    queryKey: ["/api/v1/badges"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/v1/badges");
      return response.json(); // apiRequest throws if not ok
    },
    // We rely on apiRequest to handle auth. If 401, it throws.
    retry: false,
  });

  return {
    badges: data?.badges ?? [],
    badgeKeys: data?.badges.map(b => b.badgeKey) ?? [],
    isLoading,
    refetch,
  };
}
