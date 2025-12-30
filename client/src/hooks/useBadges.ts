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
  const userToken = localStorage.getItem("@app:user_token");

  const { data, isLoading, refetch } = useQuery<BadgesResponse>({
    queryKey: ["/api/v1/badges"],
    queryFn: async () => {
      const response = await fetch("/api/v1/badges", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch badges");
      }
      return response.json();
    },
    enabled: !!userToken,
  });

  const evaluateMutation = useMutation<EvaluateBadgesResponse>({
    mutationFn: async () => {
      const response = await fetch("/api/v1/badges/evaluate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to evaluate badges");
      }
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
  const userToken = localStorage.getItem("@app:user_token");
  
  const opts: EvaluateBadgesOptions = typeof options === "function" 
    ? { onNewBadges: options } 
    : (options ?? {});

  const { mutate: evaluate, data, reset } = useMutation<EvaluateBadgesResponse>({
    mutationFn: async () => {
      const token = localStorage.getItem("@app:user_token");
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch("/api/v1/badges/evaluate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired");
        }
        throw new Error("Failed to evaluate badges");
      }
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
