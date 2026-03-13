import { moneyCalendarRepository } from "../repositories/moneyCalendar.repository";

export const moneyCalendarService = {
  async upsertEntry(userId: number, date: string, amount: number) {
    const entry = await moneyCalendarRepository.upsert(userId, date, amount.toString());
    return {
      id: entry.id,
      date: entry.entryDate,
      amount: parseFloat(entry.amount),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  },

  async getMonthlyData(userId: number, year: number, month: number) {
    const entries = await moneyCalendarRepository.findForMonth(userId, year, month);
    
    const days: Record<string, number> = {};
    let total = 0;
    let highest = 0;

    entries.forEach((e) => {
      const amount = parseFloat(e.amount);
      // Ensure dateKey is strictly YYYY-MM-DD. 
      // Sometimes DB drivers return full strings or Date objects.
      const dateKey = typeof e.entryDate === 'string' ? e.entryDate.split('T')[0] : new Date(e.entryDate).toISOString().split('T')[0];
      
      days[dateKey] = amount;
      total += amount;
      if (amount > highest) {
        highest = amount;
      }
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();

    let daysToAverage: number;
    if (year === currentYear && month === currentMonth) {
      daysToAverage = now.getDate();
    } else {
      daysToAverage = lastDay;
    }

    const average = daysToAverage > 0 ? Math.round(total / daysToAverage) : 0;

    return {
      days,
      summary: {
        total: Math.round(total * 100) / 100,
        highest: Math.round(highest * 100) / 100,
        average,
      },
    };
  },
};
