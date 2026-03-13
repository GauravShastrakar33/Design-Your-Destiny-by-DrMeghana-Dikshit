import { dashboardRepository } from "../repositories/dashboard.repository";

function getEventStatus(event: { startDatetime: Date; endDatetime: Date }) {
  const now = new Date();
  if (now < event.startDatetime) return "upcoming";
  if (now >= event.startDatetime && now <= event.endDatetime) return "live";
  return "completed";
}

export const dashboardService = {
  async getDashboardData() {
    const data = await dashboardRepository.getDashboardData();

    return {
      kpis: data.kpis,
      events: {
        today: data._rawEventsToday.map((e) => ({
          id: e.id,
          title: e.title,
          startDatetime: e.startDatetime,
          endDatetime: e.endDatetime,
          status: getEventStatus(e),
        })),
        upcoming: data._rawUpcomingEvents.map((e) => ({
          id: e.id,
          title: e.title,
          startDatetime: e.startDatetime,
          endDatetime: e.endDatetime,
          status: getEventStatus(e),
        })),
      },
      notifications: data.notifications,
      communityPractices: data.communityPractices,
      cmsHealth: data.cmsHealth,
    };
  },
};
