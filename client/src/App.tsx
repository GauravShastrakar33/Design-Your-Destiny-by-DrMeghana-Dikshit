import { Router, useLocation, Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import NetworkStatus from "@/components/NetworkStatus";
import UserLoginPage from "@/pages/UserLoginPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import { useEffect, useRef, useState, useCallback } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// --- PAGES ---
import HomePage from "@/pages/HomePage";
import ProcessesPage from "@/pages/ProcessesPage";
import DesignYourPracticePage from "@/pages/DesignYourPracticePage";
import CommunityPracticesPage from "@/pages/CommunityPracticesPage";
import SpiritualBreathsPage from "@/pages/SpiritualBreathsPage";
import EventCalendarPage from "@/pages/EventCalendarPage";
import MyPracticePlaylistPage from "@/pages/MyPracticePlaylistPage";
import ProjectOfHeartPage from "@/pages/ProjectOfHeartPage";
import ProjectOfHeartHistoryPage from "@/pages/ProjectOfHeartHistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import DrMPage from "@/pages/DrMPage";
import MoneyMasteryPage from "@/pages/MoneyMasteryPage";
import ProcessChecklistPage from "@/pages/ProcessChecklistPage";
import MoreQuotesPage from "@/pages/MoreQuotesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ProgressInsightsPage from "@/pages/ProgressInsightsPage";
import GoldMinePage from "@/pages/GoldMinePage";
import GoldMinePlayerPage from "@/pages/GoldMinePlayerPage";
import CourseOverviewPage from "@/pages/CourseOverviewPage";
import RewiringScreen from "@/pages/RewiringScreen";
import VideoPlayerPage from "@/pages/VideoPlayerPage";
import SearchPage from "@/pages/SearchPage";
import ProcessLessonPage from "@/pages/ProcessLessonPage";
import SpiritualBreathLessonPage from "@/pages/SpiritualBreathLessonPage";
import AbundanceCoursePage from "@/pages/AbundanceCoursePage";
import ModuleLessonsPage from "@/pages/ModuleLessonsPage";
import VideoFirstChallengePage from "@/pages/VideoFirstChallengePage";
import MasterclassesPage from "@/pages/MasterclassesPage";
import MasterclassCourseOverviewPage from "@/pages/MasterclassCourseOverviewPage";
import BadgesPage from "@/pages/BadgesPage";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import NotFound from "@/pages/not-found";

// --- ADMIN PAGES ---
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminSessionsPage from "@/pages/AdminSessionsPage";
import AdminInterventionsPage from "@/pages/AdminInterventionsPage";
import AdminArticlesPage from "@/pages/AdminArticlesPage";
import AdminMusicJournalingPage from "@/pages/AdminMusicJournalingPage";
import AdminProjectHeartPage from "@/pages/AdminProjectHeartPage";
import AdminStudentsPage from "@/pages/AdminStudentsPage";
import UserDetailsPage from "@/pages/UserDetailsPage";
import AdminsPage from "@/pages/AdminsPage";
import AdminCoursesPage from "@/pages/AdminCoursesPage";
import AdminProgramsPage from "@/pages/AdminProgramsPage";
import AdminProcessesPage from "@/pages/AdminProcessesPage";
import AdminAbundanceMasteryPage from "@/pages/AdminAbundanceMasteryPage";
import AdminMasterclassesPage from "@/pages/AdminMasterclassesPage";
import AdminPlaylistMappingPage from "@/pages/AdminPlaylistMappingPage";
import AdminSessionBannersPage from "@/pages/AdminSessionBannersPage";
import AdminSessionBannerFormPage from "@/pages/AdminSessionBannerFormPage";
import AdminQuotesPage from "@/pages/AdminQuotesPage";
import AdminEventsPage from "@/pages/AdminEventsPage";
import AdminEventFormPage from "@/pages/AdminEventFormPage";
import AdminNotificationsPage from "@/pages/AdminNotificationsPage";
import AdminDrmQuestionsPage from "@/pages/AdminDrmQuestionsPage";
import AdminGoldminePage from "@/pages/AdminGoldMinePage";
import AdminCourseFormPage from "@/pages/AdminCourseFormPage";
import LessonDetailPage from "@/pages/LessonDetailPage";

// Robust Hash Location hook that separates Path from Query Params
const useHashLocation = () => {
  const [loc, setLoc] = useState(() => {
    const hash = window.location.hash.replace(/^#/, "") || "/";
    return hash.split("?")[0]; // Only Return Pathname
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace(/^#/, "") || "/";
      setLoc(hash.split("?")[0]);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = useCallback((to: string, { replace = false } = {}) => {
    const hash = "#" + (to.startsWith("/") ? to : "/" + to);
    if (replace) {
      window.location.replace(hash);
    } else {
      window.location.hash = hash;
    }
  }, []);

  return [loc, navigate] as [
    string,
    (to: string, options?: { replace?: boolean }) => void
  ];
};

function AppContent() {
  const [location, setLocation] = useLocation();
  const locationRef = useRef(location);
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  // Notification logic
  useEffect(() => {
    const checkUnreadOnLaunch = async () => {
      const token = localStorage.getItem("@app:user_token");
      if (!token) return;
      try {
        await fetch("/api/v1/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("❌ Failed to check notifications", err);
      }
    };
    checkUnreadOnLaunch();
  }, []);

  // 🔄 Refresh notifications when app comes to foreground
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener("appStateChange", async (state) => {
      if (state.isActive) {
        console.log("📱 App became active, refreshing notifications...");
        try {
          // Refresh notification list and unread count
          await queryClient.invalidateQueries({ queryKey: ["/api/v1/notifications"] });
          await queryClient.invalidateQueries({ queryKey: ["/api/v1/notifications/unread-count"] });
        } catch (e) {
          console.error("❌ Failed to refresh notifications on resume", e);
        }
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  // Android Back Button with Double-Tap to Exit
  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android"
    ) {
      return;
    }

    const listener = CapacitorApp.addListener("backButton", async (event) => {
      // PRIORITY 0: If we're in fullscreen, don't navigate!
      // The VideoPlayer component will handle exiting fullscreen.
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (isFullscreen) {
        console.log("📺 Fullscreen detected, skipping global back navigation");
        return;
      }

      const currentPath = locationRef.current;
      console.log("🔙 Back button pressed", {
        canGoBack: event.canGoBack,
        currentPath,
      });

      // PRIORITY 1: Check if we're on a root page (home/login)
      // These pages should use double-tap to exit logic
      if (currentPath === "/home" || currentPath === "/login") {
        const currentTime = Date.now();
        const timeSinceLastPress = currentTime - lastBackPressTime.current;

        console.log(
          "⏱️ On root page. Time since last press:",
          timeSinceLastPress
        );

        if (timeSinceLastPress < 2000) {
          // Second press within 2 seconds - exit app
          console.log("✅ Exiting app");
          CapacitorApp.exitApp();
        } else {
          // First press - update time and show toast
          lastBackPressTime.current = currentTime;
          console.log("⚠️ Showing toast - press again to exit");

          // Dynamically import Toast to avoid loading it on web
          import("@capacitor/toast")
            .then(({ Toast }) => {
              Toast.show({
                text: "Press back again to exit",
                duration: "short",
                position: "bottom",
              }).catch((err) => {
                console.error("Toast error:", err);
                console.log("📢 Press back again to exit");
              });
            })
            .catch((err) => {
              console.error("Failed to import Toast:", err);
            });
        }
        return; // Important: Don't proceed to history.back()
      }

      // PRIORITY 2: We're on a sub-page, navigate back or to home
      if (event.canGoBack) {
        console.log("📜 Going back in history");
        window.history.back();
      } else {
        console.log("🏠 No history, navigating to home");
        setLocation("/home");
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [setLocation]);

  return (
    <NetworkStatus>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <Switch>
                {/* --- ROOT & AUTH --- */}
                <Route path="/">
                  <Redirect to="/home" />
                </Route>
                <Route path="/index.html">
                  <Redirect to="/home" />
                </Route>

                <Route path="/admin/login">
                  <AdminLayout>
                    <AdminLoginPage />
                  </AdminLayout>
                </Route>

                <Route path="/login">
                  <AppLayout>
                    <UserLoginPage />
                  </AppLayout>
                </Route>

                {/* --- ADMIN PROTECTED ROUTES --- */}
                <Route path="/admin">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminDashboardPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/interventions">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminInterventionsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/sessions">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminSessionsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/articles">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminArticlesPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/music-journaling">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminMusicJournalingPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/project-heart">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminProjectHeartPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/users/students">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminStudentsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/students/:userId">
                  <AdminRoute>
                    <AdminLayout>
                      <UserDetailsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/users/admins">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/courses">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminCoursesPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/programs">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminProgramsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/courses/create">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminCourseFormPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/courses/:id/edit">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminCourseFormPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/courses/:courseId/lessons/:lessonId">
                  <AdminRoute>
                    <AdminLayout>
                      <LessonDetailPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/processes">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminProcessesPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/abundance-mastery">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminAbundanceMasteryPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/masterclasses">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminMasterclassesPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/my-processes">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminPlaylistMappingPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/session-banner/banners">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminSessionBannersPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/session-banner/banners/new">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminSessionBannerFormPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/session-banner/banners/:id/edit">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminSessionBannerFormPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/quotes">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminQuotesPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/events">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminEventsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/events/new">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminEventFormPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/events/:id/edit">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminEventFormPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/notifications">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminNotificationsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/drm-questions">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminDrmQuestionsPage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>
                <Route path="/admin/goldmine">
                  <AdminRoute>
                    <AdminLayout>
                      <AdminGoldminePage />
                    </AdminLayout>
                  </AdminRoute>
                </Route>

                {/* --- APP PROTECTED ROUTES --- */}
                <Route path="/home">
                  <ProtectedRoute>
                    <AppLayout>
                      <HomePage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/processes">
                  <Redirect to="/processes/dyd" />
                </Route>
                <Route path="/processes/:type">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProcessesPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/design-practice">
                  <ProtectedRoute>
                    <AppLayout>
                      <DesignYourPracticePage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/community-practices">
                  <ProtectedRoute>
                    <AppLayout>
                      <CommunityPracticesPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/spiritual-breaths">
                  <ProtectedRoute>
                    <AppLayout>
                      <SpiritualBreathsPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/workshops">
                  <ProtectedRoute>
                    <AppLayout>
                      <EventCalendarPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/events">
                  <ProtectedRoute>
                    <AppLayout>
                      <EventCalendarPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/events/:id">
                  <ProtectedRoute>
                    <AppLayout>
                      <EventCalendarPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/playlist">
                  <ProtectedRoute>
                    <AppLayout>
                      <MyPracticePlaylistPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/heart">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectOfHeartPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/project-of-heart">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectOfHeartPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/project-of-heart/history">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectOfHeartHistoryPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/profile">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProfilePage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/drm">
                  <ProtectedRoute>
                    <AppLayout>
                      <DrMPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/dr-m/questions/:id">
                  <ProtectedRoute>
                    <AppLayout>
                      <DrMPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/money-mastery">
                  <ProtectedRoute>
                    <AppLayout>
                      <MoneyMasteryPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/process-checklist">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProcessChecklistPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/more-quotes">
                  <ProtectedRoute>
                    <AppLayout>
                      <MoreQuotesPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/notifications">
                  <ProtectedRoute>
                    <AppLayout>
                      <NotificationsPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/progress-insights">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProgressInsightsPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/goldmine">
                  <ProtectedRoute>
                    <AppLayout>
                      <GoldMinePage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/goldmine/:id">
                  <ProtectedRoute>
                    <AppLayout>
                      <GoldMinePlayerPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/workshops/course/:courseId">
                  <ProtectedRoute>
                    <AppLayout>
                      <CourseOverviewPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/video-player">
                  <ProtectedRoute>
                    <AppLayout>
                      <VideoPlayerPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/rewiring-belief">
                  <ProtectedRoute>
                    <AppLayout>
                      <RewiringScreen />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/search">
                  <ProtectedRoute>
                    <AppLayout>
                      <SearchPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/processes/:type/lesson/:lessonId">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProcessLessonPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/processes/lesson/:lessonId">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProcessLessonPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/spiritual-breaths/lesson/:lessonId">
                  <ProtectedRoute>
                    <AppLayout>
                      <SpiritualBreathLessonPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/abundance-mastery/course/:courseId">
                  <ProtectedRoute>
                    <AppLayout>
                      <AbundanceCoursePage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/challenge/:courseId">
                  <ProtectedRoute>
                    <AppLayout>
                      <VideoFirstChallengePage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/course/:courseId/module/:moduleId">
                  <ProtectedRoute>
                    <AppLayout>
                      <ModuleLessonsPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/masterclasses">
                  <ProtectedRoute>
                    <AppLayout>
                      <MasterclassesPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/masterclasses/course/:courseId">
                  <ProtectedRoute>
                    <AppLayout>
                      <MasterclassCourseOverviewPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/masterclasses/lesson/:lessonId">
                  <ProtectedRoute>
                    <AppLayout>
                      <ProcessLessonPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/badges">
                  <ProtectedRoute>
                    <AppLayout>
                      <BadgesPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                <Route path="/account-settings">
                  <ProtectedRoute>
                    <AppLayout>
                      <AccountSettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>

                <Route component={NotFound} />
              </Switch>
            </AdminAuthProvider>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </NetworkStatus>
  );
}

function App() {
  const isNative = Capacitor.isNativePlatform();
  return (
    <Router hook={isNative ? useHashLocation : undefined}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
