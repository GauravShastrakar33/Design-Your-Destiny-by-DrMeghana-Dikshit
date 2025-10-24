import { User, Settings, Bell, HelpCircle, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";

const menuItems = [
  { icon: Settings, label: "Settings", testId: "menu-settings" },
  { icon: Bell, label: "Notifications", testId: "menu-notifications" },
  { icon: HelpCircle, label: "Help & Support", testId: "menu-help" },
  { icon: LogOut, label: "Sign Out", testId: "menu-signout" },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Welcome User
                </h2>
                <p className="text-sm text-muted-foreground">
                  Member since 2025
                </p>
              </div>
            </div>
          </Card>

          <Card className="divide-y divide-border">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="w-full p-4 flex items-center gap-3 hover-elevate active-elevate-2"
                  onClick={() => console.log(`Clicked ${item.label}`)}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-left font-medium text-foreground">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
