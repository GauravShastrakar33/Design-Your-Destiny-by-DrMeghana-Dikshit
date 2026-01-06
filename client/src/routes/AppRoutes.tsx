import { Switch, Route } from "wouter";
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
import CourseOverviewPage from "@/pages/CourseOverviewPage";
import RewiringScreen from "@/pages/RewiringScreen";
import VideoPlayerPage from "@/pages/VideoPlayerPage";
import UserLoginPage from "@/pages/UserLoginPage";
import SearchPage from "@/pages/SearchPage";
import ProcessModulePage from "@/pages/ProcessModulePage";
import ProcessLessonPage from "@/pages/ProcessLessonPage";
import SpiritualBreathLessonPage from "@/pages/SpiritualBreathLessonPage";
import AbundanceCoursePage from "@/pages/AbundanceCoursePage";
import MasterclassesPage from "@/pages/MasterclassesPage";
import BadgesPage from "@/pages/BadgesPage";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import NotFound from "@/pages/not-found";

export default function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/processes" component={ProcessesPage} />
      <Route path="/design-practice" component={DesignYourPracticePage} />
      <Route path="/community-practices" component={CommunityPracticesPage} />
      <Route path="/spiritual-breaths" component={SpiritualBreathsPage} />
      <Route path="/workshops" component={EventCalendarPage} />
      <Route path="/events" component={EventCalendarPage} />
      <Route path="/playlist" component={MyPracticePlaylistPage} />
      <Route path="/heart" component={ProjectOfHeartPage} />
      <Route path="/project-of-heart" component={ProjectOfHeartPage} />
      <Route path="/project-of-heart/history" component={ProjectOfHeartHistoryPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/drm" component={DrMPage} />
      <Route path="/dr-m/questions/:id" component={DrMPage} />
      <Route path="/money-mastery" component={MoneyMasteryPage} />
      <Route path="/process-checklist" component={ProcessChecklistPage} />
      <Route path="/more-quotes" component={MoreQuotesPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/progress-insights" component={ProgressInsightsPage} />
      <Route
        path="/workshops/course/:courseId"
        component={CourseOverviewPage}
      />
      <Route path="/video-player" component={VideoPlayerPage} />
      <Route path="/rewiring-belief" component={RewiringScreen} />
      <Route path="/login" component={UserLoginPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/processes/module/:moduleId" component={ProcessModulePage} />
      <Route path="/processes/lesson/:lessonId" component={ProcessLessonPage} />
      <Route path="/spiritual-breaths/lesson/:lessonId" component={SpiritualBreathLessonPage} />
      <Route path="/abundance-mastery/course/:courseId" component={AbundanceCoursePage} />
      <Route path="/masterclasses" component={MasterclassesPage} />
      <Route path="/masterclasses/course/:courseId" component={AbundanceCoursePage} />
      <Route path="/badges" component={BadgesPage} />
      <Route path="/account-settings" component={AccountSettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
