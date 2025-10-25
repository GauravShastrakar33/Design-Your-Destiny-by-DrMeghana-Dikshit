import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const practices = [
  "Recognition",
  "EET",
  "Visualisation",
  "Karmic Affirmation",
  "Story Burning",
  "Gratitude Journal",
  "Appreciation Journal",
  "Dump Journal",
  "Mirror Work",
  "Ho'oponopono",
  "Infinity Loop"
];

export default function ProcessChecklistPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkedPractices, setCheckedPractices] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`practice-log-${today}`);
    if (stored) {
      setCheckedPractices(JSON.parse(stored));
      setSaved(true);
    }
  }, []);

  const togglePractice = (practice: string) => {
    setCheckedPractices((prev) =>
      prev.includes(practice)
        ? prev.filter((p) => p !== practice)
        : [...prev, practice]
    );
    setSaved(false);
  };

  const handleSave = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`practice-log-${today}`, JSON.stringify(checkedPractices));
    setSaved(true);
    toast({
      title: "Well done, Champion",
      description: `You've completed ${checkedPractices.length} practices today!`,
    });
  };

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
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Practice Log</h1>
              <p className="text-sm text-muted-foreground">
                {checkedPractices.length} of {practices.length} completed
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-500 border-0">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-white text-lg font-bold">Today's Practices</h2>
                <p className="text-white/90 text-sm">Check off what you've completed</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              {practices.map((practice) => (
                <div
                  key={practice}
                  className="flex items-center gap-3 p-3 rounded-lg hover-elevate"
                  data-testid={`practice-${practice.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Checkbox
                    id={practice}
                    checked={checkedPractices.includes(practice)}
                    onCheckedChange={() => togglePractice(practice)}
                  />
                  <label
                    htmlFor={practice}
                    className="flex-1 font-medium text-foreground cursor-pointer"
                  >
                    {practice}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <Button
            onClick={handleSave}
            className="w-full h-12 text-base font-semibold"
            disabled={checkedPractices.length === 0}
            data-testid="button-save-reflection"
          >
            {saved ? "Saved ✓" : "Save Today's Reflection"}
          </Button>
        </div>
      </div>
    </div>
  );
}
