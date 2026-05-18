import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type LiveGame = {
  id: string;
  confirmedCount: number;
  waitingCount: number;
  availableSpots: number;
  status: string;
};

/**
 * Custom hook that polls live game spot counts every 20 seconds.
 * Use this in any component that needs real-time game availability.
 */
export function useLiveGameData() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["games-live"],
    queryFn: async () => {
      const res = await fetch("/api/games/live");
      if (!res.ok) return { games: [] };
      return res.json() as Promise<{ games: LiveGame[] }>;
    },
    refetchInterval: 20000,           // Poll every 20 seconds
    refetchIntervalInBackground: true, // Continue even if tab not focused
    refetchOnWindowFocus: true,        // Refresh when user returns to tab
    staleTime: 15000,
  });

  // When live data updates, also update the main games list cache
  useEffect(() => {
    if (data?.games) {
      queryClient.setQueryData(
        ["games"],
        (old: { games: Record<string, unknown>[] } | undefined) => {
          if (!old?.games) return old;
          return {
            ...old,
            games: old.games.map((game) => {
              const live = data.games.find((g) => g.id === game.id);
              if (!live) return game;
              return {
                ...game,
                confirmedCount: live.confirmedCount,
                waitingCount: live.waitingCount,
                availableSpots: live.availableSpots,
                status: live.status,
              };
            }),
          };
        }
      );
    }
  }, [data, queryClient]);

  return {
    liveGames: data?.games ?? [],
    getLiveData: (gameId: string) =>
      data?.games.find((g) => g.id === gameId) ?? null,
  };
}