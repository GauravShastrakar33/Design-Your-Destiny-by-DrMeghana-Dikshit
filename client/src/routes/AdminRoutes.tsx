import { Switch, Route } from "wouter";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminSessionsPage from "@/pages/AdminSessionsPage";
import AdminInterventionsPage from "@/pages/AdminInterventionsPage";
import AdminArticlesPage from "@/pages/AdminArticlesPage";
import AdminMusicJournalingPage from "@/pages/AdminMusicJournalingPage";
import AdminProjectHeartPage from "@/pages/AdminProjectHeartPage";
import AdminStudentsPage from "@/pages/AdminStudentsPage";
import AdminsPage from "@/pages/AdminsPage";
import AdminCoursesPage from "@/pages/AdminCoursesPage";
import AdminProgramsPage from "@/pages/AdminProgramsPage";
import AdminProcessesPage from "@/pages/AdminProcessesPage";
import AdminSpiritualBreathsPage from "@/pages/AdminSpiritualBreathsPage";
import AdminAbundanceMasteryPage from "@/pages/AdminAbundanceMasteryPage";
import AdminPlaylistMappingPage from "@/pages/AdminPlaylistMappingPage";
import CourseCreateStep1 from "@/pages/CourseCreateStep1";
import CourseCreateStep2 from "@/pages/CourseCreateStep2";
import CourseCreateStep3 from "@/pages/CourseCreateStep3";
import CourseBuilderPage from "@/pages/CourseBuilderPage";
import LessonDetailPage from "@/pages/LessonDetailPage";
import NotFound from "@/pages/not-found";

export default function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/interventions" component={AdminInterventionsPage} />
      <Route path="/admin/sessions" component={AdminSessionsPage} />
      <Route path="/admin/articles" component={AdminArticlesPage} />
      <Route path="/admin/music-journaling" component={AdminMusicJournalingPage} />
      <Route path="/admin/project-heart" component={AdminProjectHeartPage} />
      <Route path="/admin/users/students" component={AdminStudentsPage} />
      <Route path="/admin/users/admins" component={AdminsPage} />
      <Route path="/admin/courses" component={AdminCoursesPage} />
      <Route path="/admin/programs" component={AdminProgramsPage} />
      <Route path="/admin/courses/create/step1" component={CourseCreateStep1} />
      <Route path="/admin/courses/create/step2/:id" component={CourseCreateStep2} />
      <Route path="/admin/courses/create/step3/:id" component={CourseCreateStep3} />
      <Route path="/admin/courses/:id" component={CourseBuilderPage} />
      <Route path="/admin/courses/:courseId/lessons/:lessonId" component={LessonDetailPage} />
      <Route path="/admin/processes" component={AdminProcessesPage} />
      <Route path="/admin/spiritual-breaths" component={AdminSpiritualBreathsPage} />
      <Route path="/admin/abundance-mastery" component={AdminAbundanceMasteryPage} />
      <Route path="/admin/my-processes" component={AdminPlaylistMappingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
