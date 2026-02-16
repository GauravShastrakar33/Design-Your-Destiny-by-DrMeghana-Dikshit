import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserBadge } from "@shared/schema";

interface BadgesResponse {
  badges: UserBadge[];
}

interface EvaluateBadgesResponse {
  newBadges: string[];
  hasNewBadges: boolean;
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

  const evaluateMutation = useMutation<EvaluateBadgesResponse>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/v1/badges/evaluate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/badges"] });
    },
  });

  return {
    badges: data?.badges ?? [],
    badgeKeys: data?.badges.map(b => b.badgeKey) ?? [],
    isLoading,
    refetch,
    evaluateBadges: evaluateMutation.mutateAsync,
    isEvaluating: evaluateMutation.isPending,
  };
}

interface EvaluateBadgesOptions {
  onNewBadges?: (badgeKeys: string[]) => void;
  onError?: (error: Error) => void;
}

export function useEvaluateBadgesOnMount(options?: EvaluateBadgesOptions | ((badgeKeys: string[]) => void)) {
  const opts: EvaluateBadgesOptions = typeof options === "function"
    ? { onNewBadges: options }
    : (options ?? {});

  const { mutate: evaluate, data, reset } = useMutation<EvaluateBadgesResponse>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/v1/badges/evaluate");
      return response.json();
    },
    onSuccess: (result) => {
      if (result.hasNewBadges && opts.onNewBadges) {
        opts.onNewBadges(result.newBadges);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/v1/badges"] });
    },
    onError: (error: Error) => {
      console.error("Badge evaluation failed:", error.message);
      opts.onError?.(error);
    },
  });

  return { evaluate, newBadges: data?.newBadges ?? [], reset };
}
