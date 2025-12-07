import { Switch, Route } from "wouter";
import HomePage from "@/pages/HomePage";
import ProcessesPage from "@/pages/ProcessesPage";
import DesignYourPracticePage from "@/pages/DesignYourPracticePage";
import CommunityPracticesPage from "@/pages/CommunityPracticesPage";
import SpiritualBreathsPage from "@/pages/SpiritualBreathsPage";
import ArticlesPage from "@/pages/ArticlesPage";
import ArticleDetailPage from "@/pages/ArticleDetailPage";
import WorkshopsPage from "@/pages/WorkshopsPage";
import MyPracticePlaylistPage from "@/pages/MyPracticePlaylistPage";
import ProjectOfHeartPage from "@/pages/ProjectOfHeartPage";
import ProfilePage from "@/pages/ProfilePage";
import DrMPage from "@/pages/DrMPage";
import EmotionMasteryPage from "@/pages/EmotionMasteryPage";
import MoneyMasteryPage from "@/pages/MoneyMasteryPage";
import MusicJournalingPage from "@/pages/MusicJournalingPage";
import ProcessChecklistPage from "@/pages/ProcessChecklistPage";
import LevelUpPage from "@/pages/LevelUpPage";
import ChallengeDashboardScreen from "@/pages/ChallengeDashboardScreen";
import ChallengeHistoryScreen from "@/pages/ChallengeHistoryScreen";
import MoreQuotesPage from "@/pages/MoreQuotesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AIInsightsPage from "@/pages/AIInsightsPage";
import CourseOverviewPage from "@/pages/CourseOverviewPage";
import RewiringScreen from "@/pages/RewiringScreen";
import VideoPlayerPage from "@/pages/VideoPlayerPage";
import UserLoginPage from "@/pages/UserLoginPage";
import SearchPage from "@/pages/SearchPage";
import ProcessModulePage from "@/pages/ProcessModulePage";
import ProcessLessonPage from "@/pages/ProcessLessonPage";
import SpiritualBreathLessonPage from "@/pages/SpiritualBreathLessonPage";
import AbundanceCoursePage from "@/pages/AbundanceCoursePage";
import NotFound from "@/pages/not-found";

export default function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/processes" component={ProcessesPage} />
      <Route path="/design-practice" component={DesignYourPracticePage} />
      <Route path="/community-practices" component={CommunityPracticesPage} />
      <Route path="/spiritual-breaths" component={SpiritualBreathsPage} />
      <Route path="/articles/:id" component={ArticleDetailPage} />
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/workshops" component={WorkshopsPage} />
      <Route path="/playlist" component={MyPracticePlaylistPage} />
      <Route path="/heart" component={ProjectOfHeartPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/drm" component={DrMPage} />
      <Route path="/emotion-mastery" component={EmotionMasteryPage} />
      <Route path="/money-mastery" component={MoneyMasteryPage} />
      <Route path="/music-journaling" component={MusicJournalingPage} />
      <Route path="/process-checklist" component={ProcessChecklistPage} />
      <Route path="/level-up" component={LevelUpPage} />
      <Route path="/level-up/history" component={ChallengeHistoryScreen} />
      <Route
        path="/level-up/:challengeId"
        component={ChallengeDashboardScreen}
      />
      <Route path="/more-quotes" component={MoreQuotesPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/ai-insights" component={AIInsightsPage} />
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
      <Route component={NotFound} />
    </Switch>
  );
}
