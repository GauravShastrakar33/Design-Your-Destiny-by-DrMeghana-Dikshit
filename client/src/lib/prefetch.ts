/** 🚀 Pages map for lazy loading and prefetching. */
export const pages = {
  HomePage: () => import("@/pages/HomePage"),
  ProcessesPage: () => import("@/pages/ProcessesPage"),
  DesignYourPracticePage: () => import("@/pages/DesignYourPracticePage"),
  CommunityPracticesPage: () => import("@/pages/CommunityPracticesPage"),
  SpiritualBreathsPage: () => import("@/pages/SpiritualBreathsPage"),
  EventCalendarPage: () => import("@/pages/EventCalendarPage"),
  MyPracticePlaylistPage: () => import("@/pages/MyPracticePlaylistPage"),
  ProjectOfHeartPage: () => import("@/pages/ProjectOfHeartPage"),
  ProjectOfHeartHistoryPage: () => import("@/pages/ProjectOfHeartHistoryPage"),
  ProfilePage: () => import("@/pages/ProfilePage"),
  DrMPage: () => import("@/pages/DrMPage"),
  MoneyMasteryPage: () => import("@/pages/MoneyMasteryPage"),
  ProcessChecklistPage: () => import("@/pages/ProcessChecklistPage"),
  MoreQuotesPage: () => import("@/pages/MoreQuotesPage"),
  NotificationsPage: () => import("@/pages/NotificationsPage"),
  ProgressInsightsPage: () => import("@/pages/ProgressInsightsPage"),
  GoldMinePage: () => import("@/pages/GoldMinePage"),
  GoldMinePlayerPage: () => import("@/pages/GoldMinePlayerPage"),
  CourseOverviewPage: () => import("@/pages/CourseOverviewPage"),
  RewiringScreen: () => import("@/pages/RewiringScreen"),
  VideoPlayerPage: () => import("@/pages/VideoPlayerPage"),
  SearchPage: () => import("@/pages/SearchPage"),
  ProcessLessonPage: () => import("@/pages/ProcessLessonPage"),
  SpiritualBreathLessonPage: () => import("@/pages/SpiritualBreathLessonPage"),
  AbundanceCoursePage: () => import("@/pages/AbundanceCoursePage"),
  ModuleLessonsPage: () => import("@/pages/ModuleLessonsPage"),
  VideoFirstChallengePage: () => import("@/pages/VideoFirstChallengePage"),
  MasterclassesPage: () => import("@/pages/MasterclassesPage"),
  MasterclassCourseOverviewPage: () =>
    import("@/pages/MasterclassCourseOverviewPage"),
  BadgesPage: () => import("@/pages/BadgesPage"),
  AccountSettingsPage: () => import("@/pages/AccountSettingsPage"),
  UserLoginPage: () => import("@/pages/UserLoginPage"),
  NotFound: () => import("@/pages/not-found"),
};

export type PageName = keyof typeof pages;

/** 🚀 Prefetch a page chunk before the user actually navigates there. */
export const prefetchPage = (pageName: PageName) => {
  const loader = pages[pageName];
  if (loader) loader();
};

/** Map internal paths to PageName for prefetching. */
export const pathToPageMap: Record<string, PageName> = {
  "/home": "HomePage",
  "/processes": "ProcessesPage",
  "/heart": "ProjectOfHeartPage",
  "/profile": "ProfilePage",
  "/events": "EventCalendarPage",
  "/drm": "DrMPage",
  "/search": "SearchPage",
};
