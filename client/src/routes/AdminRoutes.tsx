import { Switch, Route } from "wouter";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminSessionsPage from "@/pages/AdminSessionsPage";
import AdminInterventionsPage from "@/pages/AdminInterventionsPage";
import AdminProcessLibraryPage from "@/pages/AdminProcessLibraryPage";
import AdminArticlesPage from "@/pages/AdminArticlesPage";
import AdminMusicJournalingPage from "@/pages/AdminMusicJournalingPage";
import AdminWorkshopsPage from "@/pages/AdminWorkshopsPage";
import AdminProjectHeartPage from "@/pages/AdminProjectHeartPage";
import AdminStudentsPage from "@/pages/AdminStudentsPage";
import NotFound from "@/pages/not-found";

export default function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/interventions" component={AdminInterventionsPage} />
      <Route path="/admin/process-library" component={AdminProcessLibraryPage} />
      <Route path="/admin/sessions" component={AdminSessionsPage} />
      <Route path="/admin/articles" component={AdminArticlesPage} />
      <Route path="/admin/music-journaling" component={AdminMusicJournalingPage} />
      <Route path="/admin/workshops" component={AdminWorkshopsPage} />
      <Route path="/admin/project-heart" component={AdminProjectHeartPage} />
      <Route path="/admin/users/students" component={AdminStudentsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
