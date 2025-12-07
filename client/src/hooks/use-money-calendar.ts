import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";

interface MoneyCalendarData {
  days: Record<string, number>;
  summary: {
    total: number;
    highest: number;
    average: number;
  };
}

interface MoneyEntry {
  id: number;
  date: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface SaveMoneyEntryParams {
  date: string;
  amount: number;
}

export function useMoneyCalendar(month: string) {
  return useQuery<MoneyCalendarData>({
    queryKey: ["/api/v1/money-calendar", `?month=${month}`],
    queryFn: getQueryFn<MoneyCalendarData>({ on401: "throw" }),
    enabled: !!month,
  });
}

export function useSaveMoneyEntry() {
  return useMutation<MoneyEntry, Error, SaveMoneyEntryParams>({
    mutationFn: async (params: SaveMoneyEntryParams) => {
      const res = await apiRequest("POST", "/api/v1/money-calendar/entry", params);
      return res.json();
    },
    onSuccess: (data) => {
      const dateParts = data.date.split("-");
      const month = `${dateParts[0]}-${dateParts[1]}`;
      queryClient.invalidateQueries({ queryKey: ["/api/v1/money-calendar", `?month=${month}`] });
    },
    onError: (error) => {
      console.error("Failed to save money entry:", error);
    },
  });
}
