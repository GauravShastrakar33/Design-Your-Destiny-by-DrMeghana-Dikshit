import { useState } from "react";
import { ArrowLeft, Calendar, Brain, Video, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MoneyMasteryPage() {
  const [, setLocation] = useLocation();
  const [selectedMonth] = useState(new Date());

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDay };
  };

  const { daysInMonth, firstDay } = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Money Mastery Hub</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Money Calendar */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Money Calendar</h2>
            </div>
            
            <div className="mb-3 text-center">
              <h3 className="font-semibold text-foreground">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map((day) => (
                <button
                  key={day}
                  className="aspect-square rounded-lg bg-muted hover-elevate active-elevate-2 flex items-center justify-center"
                  data-testid={`day-${day}`}
                >
                  <span className="text-sm font-medium text-foreground">{day}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Total:</span>
                <span className="text-lg font-bold text-primary">$0</span>
              </div>
            </div>
          </Card>

          {/* Rewiring Belief */}
          <Card 
            className="p-6 bg-gradient-to-br from-cyan-400 to-teal-600 border-0 cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setLocation("/rewiring-belief")}
            data-testid="card-rewiring-belief"
          >
            <div className="flex items-start gap-3">
              <Brain className="w-8 h-8 text-white flex-shrink-0" />
              <div>
                <h2 className="text-white text-xl font-bold mb-2">Rewiring Belief</h2>
                <p className="text-white/90 text-sm mb-3">
                  Transform limiting beliefs into empowering ones
                </p>
                <Button variant="secondary" size="sm">
                  Start Rewiring →
                </Button>
              </div>
            </div>
          </Card>

          {/* Money Manifestation Challenge */}
          <Card 
            className="p-6 bg-gradient-to-br from-teal-400 to-cyan-600 border-0 cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setLocation("/money-manifestation")}
            data-testid="card-money-manifestation"
          >
            <div className="flex items-start gap-3">
              <Video className="w-8 h-8 text-white flex-shrink-0" />
              <div>
                <h2 className="text-white text-xl font-bold mb-2">Money Manifestation Challenge</h2>
                <p className="text-white/90 text-sm mb-3">
                  30-day video series to manifest abundance
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm">Day 1 of 30</span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full">
                    <div className="w-[3%] h-full bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Raining Abundance */}
          <Card 
            className="p-6 bg-gradient-to-br from-blue-400 to-cyan-500 border-0 cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setLocation("/raining-abundance")}
            data-testid="card-raining-abundance"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-8 h-8 text-white flex-shrink-0" />
              <div>
                <h2 className="text-white text-xl font-bold mb-2">Raining Abundance</h2>
                <p className="text-white/90 text-sm mb-3">
                  21-day journey to attract prosperity
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm">Day 1 of 21</span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full">
                    <div className="w-[5%] h-full bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
