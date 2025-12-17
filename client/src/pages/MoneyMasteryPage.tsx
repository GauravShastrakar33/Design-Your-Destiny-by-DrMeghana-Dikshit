import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Brain, CheckCircle, ChevronLeft, ChevronRight, X, BookOpen, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MoneyEarnings {
  [date: string]: number; // "2025-10-01": 400
}

interface AbundanceCourse {
  id: number;
  title: string;
  description: string | null;
  thumbnailKey: string | null;
  position: number;
  isBuiltIn: boolean;
}

interface AbundanceFeatureResponse {
  feature: {
    id: number;
    code: string;
    displayMode: string;
  };
  builtIns: Array<{ id: string; title: string; isBuiltIn: boolean }>;
  courses: AbundanceCourse[];
}

export default function MoneyMasteryPage() {
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [hasBeliefs, setHasBeliefs] = useState(false);
  const [lastUpdatedToday, setLastUpdatedToday] = useState(false);
  const [earnings, setEarnings] = useState<MoneyEarnings>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [earningAmount, setEarningAmount] = useState("");

  // Fetch courses mapped to ABUNDANCE feature
  const { data: abundanceData, isLoading: isLoadingCourses } = useQuery<AbundanceFeatureResponse>({
    queryKey: ["/api/public/v1/features", "ABUNDANCE"],
    queryFn: async () => {
      const response = await fetch("/api/public/v1/features/ABUNDANCE");
      if (!response.ok) throw new Error("Failed to fetch abundance courses");
      return response.json();
    },
  });

  const mappedCourses = (abundanceData?.courses || []).sort((a, b) => a.position - b.position);

  useEffect(() => {
    // Check if beliefs are saved
    const saved = localStorage.getItem("@app:rewiring_beliefs");
    const lastUpdate = localStorage.getItem("@app:rewiring_last_update");
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHasBeliefs(parsed.length > 0);
      } catch (error) {
        setHasBeliefs(false);
      }
    }

    if (lastUpdate) {
      const today = new Date().toDateString();
      const updateDate = new Date(parseInt(lastUpdate)).toDateString();
      setLastUpdatedToday(today === updateDate);
    }

    // Load earnings from localStorage
    const savedEarnings = localStorage.getItem("@app:money_earnings");
    if (savedEarnings) {
      try {
        setEarnings(JSON.parse(savedEarnings));
      } catch (error) {
        console.error("Error loading earnings:", error);
      }
    }
  }, []);

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

  const formatDate = (day: number): string => {
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const handleDayClick = (day: number) => {
    const dateKey = formatDate(day);
    setSelectedDate(dateKey);
    setEarningAmount(earnings[dateKey]?.toString() || "");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    
    const amount = parseFloat(earningAmount);
    if (isNaN(amount)) {
      alert("Please enter a valid number");
      return;
    }
    if (amount < 0) {
      alert("Amount cannot be negative");
      return;
    }

    const newEarnings = { ...earnings, [selectedDate]: amount };
    setEarnings(newEarnings);
    localStorage.setItem("@app:money_earnings", JSON.stringify(newEarnings));
    setModalOpen(false);
    setEarningAmount("");
  };

  const handleDelete = () => {
    if (!selectedDate) return;

    const newEarnings = { ...earnings };
    delete newEarnings[selectedDate];
    setEarnings(newEarnings);
    localStorage.setItem("@app:money_earnings", JSON.stringify(newEarnings));
    setModalOpen(false);
    setEarningAmount("");
  };

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const getEarningColor = (amount: number): string => {
    const maxEarning = Math.max(...Object.values(earnings), 1);
    const intensity = amount / maxEarning;
    
    if (intensity > 0.75) return "bg-green-600 text-white";
    if (intensity > 0.5) return "bg-green-500 text-white";
    if (intensity > 0.25) return "bg-green-400 text-green-900";
    return "bg-green-200 text-green-900";
  };

  const calculateMonthlySummary = () => {
    const currentMonthEarnings = Object.entries(earnings).filter(([date]) => {
      const [year, month] = date.split('-');
      return parseInt(year) === selectedMonth.getFullYear() && 
             parseInt(month) === selectedMonth.getMonth() + 1;
    });

    const total = currentMonthEarnings.reduce((sum, [, amount]) => sum + amount, 0);
    const highest = currentMonthEarnings.length > 0 
      ? Math.max(...currentMonthEarnings.map(([, amount]) => amount))
      : 0;
    const average = currentMonthEarnings.length > 0 
      ? total / currentMonthEarnings.length 
      : 0;
    const highestDay = currentMonthEarnings.find(([, amount]) => amount === highest)?.[0];

    return { total, highest, average, highestDay };
  };

  const summary = calculateMonthlySummary();
  const today = new Date();
  const isToday = (day: number) => {
    return selectedMonth.getFullYear() === today.getFullYear() &&
           selectedMonth.getMonth() === today.getMonth() &&
           day === today.getDate();
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-gray-600 tracking-widest" style={{ fontFamily: "Montserrat" }}>DAILY ABUNDANCE</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Money Calendar */}
          <Card className="p-4 bg-white" data-testid="card-money-calendar">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" style={{ color: "#703DFA" }} />
              <h2 className="text-lg font-semibold text-foreground">Money Calendar</h2>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-foreground">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dateKey = formatDate(day);
                const earning = earnings[dateKey];
                const hasEarning = earning !== undefined;
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-lg hover-elevate active-elevate-2 flex flex-col items-center justify-center p-1 ${
                      hasEarning 
                        ? getEarningColor(earning)
                        : isToday(day)
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted'
                    }`}
                    data-testid={`day-${day}`}
                  >
                    <span className={`text-xs font-medium ${hasEarning ? '' : 'text-foreground'}`}>
                      {day}
                    </span>
                    {hasEarning && (
                      <span className="text-[10px] font-semibold">
                        ₹{earning}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Monthly Summary */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <h3 className="text-sm font-semibold text-foreground mb-2">Monthly Summary</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Earnings:</span>
                <span className="text-lg font-bold text-green-600">₹{summary.total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Highest Day:</span>
                <span className="text-sm font-semibold text-foreground">
                  {summary.highest > 0 ? `₹${summary.highest.toFixed(0)}` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average/Day:</span>
                <span className="text-sm font-semibold text-foreground">
                  {summary.average > 0 ? `₹${summary.average.toFixed(0)}` : '-'}
                </span>
              </div>
            </div>
          </Card>

          {/* Earning Modal */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent data-testid="dialog-earning">
              <DialogHeader>
                <DialogTitle>
                  {selectedDate && earnings[selectedDate] ? 'Edit Earning' : 'Add Earning'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={earningAmount}
                    onChange={(e) => setEarningAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full h-10 px-3 rounded-lg bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    data-testid="input-earning-amount"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                    data-testid="button-save-earning"
                  >
                    Save
                  </Button>
                  {selectedDate && earnings[selectedDate] && (
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      data-testid="button-delete-earning"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Rewiring Belief */}
          <Card 
            className="p-5 bg-white cursor-pointer hover-elevate active-elevate-2 shadow-md h-[140px]"
            onClick={() => setLocation("/rewiring-belief")}
            data-testid="card-rewiring-belief"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-3 mb-1 flex-1">
                <Brain className="w-7 h-7 flex-shrink-0" style={{ color: "#703DFA" }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-foreground text-lg font-bold">Rewiring Belief</h2>
                    {hasBeliefs && (
                      <CheckCircle className="w-5 h-5" style={{ color: "#703DFA" }} data-testid="check-icon" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Transform limiting beliefs into empowering ones
                  </p>
                  {lastUpdatedToday && (
                    <p className="text-muted-foreground text-xs italic mt-1" data-testid="text-updated-today">
                      Beliefs updated today
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-black border-border"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("/rewiring-belief");
                  }}
                >
                  <span className="mr-1 text-sm">Start Rewiring</span>
                  <span style={{ color: "#703DFA" }}>→</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Mapped CMS Courses */}
          {isLoadingCourses && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#703DFA" }} />
            </div>
          )}

          {!isLoadingCourses && mappedCourses.length > 0 && (
            <div className="space-y-4">
              {mappedCourses.map((course) => (
                <Card 
                  key={course.id}
                  className="p-5 bg-white cursor-pointer hover-elevate active-elevate-2 shadow-md"
                  onClick={() => setLocation(`/abundance-mastery/course/${course.id}`)}
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-7 h-7 flex-shrink-0" style={{ color: "#703DFA" }} />
                    <div className="flex-1">
                      <h2 className="text-foreground text-lg font-bold mb-1">{course.title}</h2>
                      {course.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
