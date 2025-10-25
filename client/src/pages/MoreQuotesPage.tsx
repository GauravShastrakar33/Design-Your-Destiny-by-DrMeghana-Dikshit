import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

const quotes = [
  {
    text: "How you do anything is how you do everything",
    author: "Dr.M"
  },
  {
    text: "The secret of success is learning how to use pain and pleasure instead of having pain and pleasure use you.",
    author: "Tony Robbins"
  },
  {
    text: "Don't let yesterday take up too much of today.",
    author: "Will Rogers"
  }
];

export default function MoreQuotesPage() {
  const [, setLocation] = useLocation();

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
            <h1 className="text-2xl font-bold text-foreground">Daily Quotes</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {quotes.map((quote, index) => (
            <Card
              key={index}
              className="p-6 bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500 border-0"
              data-testid={`quote-card-${index}`}
            >
              <p className="text-white text-lg font-semibold mb-4 leading-relaxed">
                "{quote.text}"
              </p>
              <p className="text-white/80 text-sm">— {quote.author}</p>
            </Card>
          ))}

          <Card className="p-8 text-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-0">
            <p className="text-lg font-medium text-foreground mb-2">
              That's it for today ✨
            </p>
            <p className="text-muted-foreground text-sm">
              New Quotes and Affirmations on a new day.
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              See you tomorrow!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
