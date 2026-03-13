import { Express } from "express";
import authRoutes from "./auth.routes";
import trackingRoutes from "./tracking.routes";
import userRoutes from "./user.routes";
import beliefRoutes from "./belief.routes";
import badgeRoutes from "./badge.routes";
import eventRoutes from "./event.routes";
import courseRoutes from "./course.routes";
import sessionRoutes from "./session.routes";
import adminRoutes from "./admin.routes";
import articleRoutes from "./article.routes";
import moneyCalendarRoutes from "./moneyCalendar.routes";
import pohRoutes from "./poh.routes";
import dashboardRoutes from "./dashboard.routes";
import bannerRoutes from "./banner.routes";
import quoteRoutes from "./quote.routes";
import notificationRoutes from "./notification.routes";
import drmRoutes from "./drm.routes";
import goldmineRoutes from "./goldmine.routes";

export function registerDomainRoutes(app: Express) {
  app.use(authRoutes);
  app.use(trackingRoutes);
  app.use(userRoutes);
  app.use(beliefRoutes);
  app.use(badgeRoutes);
  app.use(eventRoutes);
  app.use(courseRoutes);
  app.use(sessionRoutes);
  app.use(adminRoutes);
  app.use(articleRoutes);
  app.use(moneyCalendarRoutes);
  app.use(pohRoutes);
  app.use(dashboardRoutes);
  app.use(bannerRoutes);
  app.use(quoteRoutes);
  app.use(notificationRoutes);
  app.use(drmRoutes);
  app.use(goldmineRoutes);
}


