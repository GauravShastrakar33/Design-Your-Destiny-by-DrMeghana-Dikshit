import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function ProcessesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen pb-20 bg-page-bg">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="py-4 relative flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="absolute left-4 hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase whitespace-nowrap">
              PROCESSES
            </h1>
          </div>
        </div>

        <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-brand" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600 max-w-xs">
            The Processes feature is being rebuilt with enhanced capabilities. Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}
