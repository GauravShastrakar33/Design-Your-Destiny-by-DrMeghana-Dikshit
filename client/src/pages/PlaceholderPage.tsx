import { ArrowLeft, LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <Header
          title={title}
          hasBackButton={true}
          onBack={() => setLocation("/")}
        />

        <div className="px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 text-center max-w-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Coming Soon
              </h2>
              <p className="text-muted-foreground">{description}</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
