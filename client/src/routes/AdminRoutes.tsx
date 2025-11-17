import { Switch, Route } from "wouter";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminSessionsPage from "@/pages/AdminSessionsPage";
import NotFound from "@/pages/not-found";

export default function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/sessions" component={AdminSessionsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
