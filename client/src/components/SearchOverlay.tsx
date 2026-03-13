import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  X,
  Loader2,
  BookOpen,
  FileText,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { apiRequest } from "@/lib/queryClient";

interface SearchResult {
  type: "module" | "lesson" | "course";
  feature: string;
  id: number;
  title: string;
  module_id?: number;
  navigate_to: string;
}

interface SearchResponse {
  results: SearchResult[];
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle body scroll lock & styling
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overlay-open");
    } else {
      document.body.classList.remove("overlay-open");
    }

    return () => {
      document.body.classList.remove("overlay-open");
    };
  }, [isOpen]);

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Search Effect with Debounce & AbortController
  useEffect(() => {
    // 1. If query is empty, reset immediately
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    // 2. Debounce the search call
    const timer = setTimeout(() => {
      performSearch(query);
    }, 500); // 500ms debounce

    // Cleanup: clear timer and abort pending request if user keeps typing
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await apiRequest(
        "GET",
        `/api/public/v1/search?q=${encodeURIComponent(searchQuery)}`,
        undefined,
        { signal: controller.signal }
      );

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Request was aborted, do nothing
        return;
      }
      console.error("Search error:", error);
      setResults([]);
    } finally {
      // Only turn off loading if this is the active request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onClose();
    setLocation(result.navigate_to);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false); // Reverts to "What can you search?"
  };

  const modules = results.filter((r) => r.type === "module");
  const lessons = results.filter((r) => r.type === "lesson");
  const courses = results.filter((r) => r.type === "course");

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case "DYD":
        return "DYD Process";
      case "USM":
        return "USM Process";
      case "ABUNDANCE":
        return "Abundance Mastery";
      default:
        return feature;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "module":
        return <BookOpen className="w-5 h-5 text-brand" />;
      case "lesson":
        return <FileText className="w-5 h-5 text-purple-500" />;
      case "course":
        return <GraduationCap className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[100] bg-[#F8F9FB] flex flex-col h-[100dvh]"
        >
          <Header
            title="Search"
            hasBackButton={true}
            onBack={onClose}
            className="bg-white/95 backdrop-blur-md shrink-0"
          />

          <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 b-20 overflow-y-auto custom-scrollbar">
            {/* Search Input */}
            <div className="relative mb-8 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-brand" />
              </div>
              <Input
                type="text"
                placeholder="What are you looking for?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-12 bg-white rounded-lg border-0 shadow-lg shadow-brand/5 ring-1 ring-black/5 focus-visible:ring-2 focus-visible:ring-brand/20 transition-all text-lg"
                autoFocus
                data-testid="input-search-overlay"
              />
              {!query && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="text-sm font-medium animate-pulse">
                    Searching...
                  </p>
                </div>
              ) : hasSearched && results.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-20 text-center"
                  data-testid="text-no-results"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    No results found
                  </h3>
                  <p className="text-slate-500">
                    Try adjusting your search terms
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {modules.length > 0 && (
                    <div className="overflow-hidden hidden">
                      <h2
                        className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2"
                        data-testid="text-section-modules"
                      >
                        Modules ({modules.length})
                      </h2>
                      <div className="grid gap-3">
                        {modules.map((result) => (
                          <button
                            key={`module-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full group flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-transparent shadow-sm hover:shadow-lg hover:shadow-brand/5 transition-all duration-300 text-left overflow-hidden"
                            data-testid={`result-module-${result.id}`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center shrink-0 group-hover:bg-brand/10 transition-colors">
                              {getTypeIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 truncate group-hover:text-brand transition-colors text-sm sm:text-base">
                                {result.title}
                              </h3>
                              <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                                {getFeatureLabel(result.feature)}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {lessons.length > 0 && (
                    <div className="overflow-hidden">
                      <h2
                        className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2"
                        data-testid="text-section-lessons"
                      >
                        Lessons ({lessons.length})
                      </h2>
                      <div className="grid gap-3">
                        {lessons.map((result) => (
                          <button
                            key={`lesson-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full group flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-transparent shadow-sm hover:shadow-lg hover:shadow-brand/5 transition-all duration-300 text-left overflow-hidden"
                            data-testid={`result-lesson-${result.id}`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                              {getTypeIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 truncate group-hover:text-purple-600 transition-colors text-sm sm:text-base">
                                {result.title}
                              </h3>
                              <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                                {getFeatureLabel(result.feature)}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {courses.length > 0 && (
                    <div className="overflow-hidden">
                      <h2
                        className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2"
                        data-testid="text-section-courses"
                      >
                        Courses ({courses.length})
                      </h2>
                      <div className="grid gap-3">
                        {courses.map((result) => (
                          <button
                            key={`course-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full group flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-transparent shadow-sm hover:shadow-lg hover:shadow-brand/5 transition-all duration-300 text-left overflow-hidden"
                            data-testid={`result-course-${result.id}`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                              {getTypeIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors text-sm sm:text-base">
                                {result.title}
                              </h3>
                              <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                                {getFeatureLabel(result.feature)}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Empty State / Suggestions
                <div className="animate-in fade-in zoom-in-50 duration-500">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2 mb-4">
                    What can you search?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Courses</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Explore courses
                        </p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Lessons</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Find specific lessons & topics
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
