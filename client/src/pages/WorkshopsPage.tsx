import { Calendar, Users, Clock } from "lucide-react";

export default function WorkshopsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Workshops</h1>
        <p className="text-muted-foreground mb-8">
          Join live sessions and group practices
        </p>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Coming Soon
            </h2>
            <p className="text-muted-foreground max-w-xs">
              Live workshops and group sessions will be available here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
