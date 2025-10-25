import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import ProcessesPage from "@/pages/ProcessesPage";
import DesignYourPracticePage from "@/pages/DesignYourPracticePage";
import CommunityPracticesPage from "@/pages/CommunityPracticesPage";
import SpiritualBreathsPage from "@/pages/SpiritualBreathsPage";
import ArticlesPage from "@/pages/ArticlesPage";
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
import MoreQuotesPage from "@/pages/MoreQuotesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AIInsightsPage from "@/pages/AIInsightsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/processes" component={ProcessesPage} />
      <Route path="/design-practice" component={DesignYourPracticePage} />
      <Route path="/community-practices" component={CommunityPracticesPage} />
      <Route path="/spiritual-breaths" component={SpiritualBreathsPage} />
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
      <Route path="/more-quotes" component={MoreQuotesPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/ai-insights" component={AIInsightsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative min-h-screen">
          <Router />
          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
