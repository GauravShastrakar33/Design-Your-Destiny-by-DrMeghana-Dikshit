import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2, BookOpen, FileText, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/public/v1/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    onClose();
    setLocation(result.navigate_to);
  };

  const modules = results.filter(r => r.type === "module");
  const lessons = results.filter(r => r.type === "lesson");
  const courses = results.filter(r => r.type === "course");

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case "DYD": return "DYD Process";
      case "USM": return "USM Process";
      case "BREATH": return "Spiritual Breaths";
      case "ABUNDANCE": return "Abundance Mastery";
      default: return feature;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "module": return <BookOpen className="w-5 h-5 text-[#703DFA]" />;
      case "lesson": return <FileText className="w-5 h-5 text-green-600" />;
      case "course": return <GraduationCap className="w-5 h-5 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-white"
        >
          <div className="max-w-md mx-auto h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search content..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 bg-gray-100 border-0"
                  autoFocus
                  data-testid="input-search-overlay"
                />
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-close-search"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#703DFA]" />
                </div>
              ) : hasSearched && results.length === 0 ? (
                <div className="text-center py-12 text-gray-500" data-testid="text-no-results">
                  No matching content found
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-5">
                  {modules.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" data-testid="text-section-modules">
                        Modules ({modules.length})
                      </h2>
                      <div className="space-y-2">
                        {modules.map((result) => (
                          <button
                            key={`module-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover-elevate active-elevate-2 text-left"
                            data-testid={`result-module-${result.id}`}
                          >
                            {getTypeIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium truncate">{result.title}</p>
                              <p className="text-xs text-gray-500">{getFeatureLabel(result.feature)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {lessons.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" data-testid="text-section-lessons">
                        Lessons ({lessons.length})
                      </h2>
                      <div className="space-y-2">
                        {lessons.map((result) => (
                          <button
                            key={`lesson-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover-elevate active-elevate-2 text-left"
                            data-testid={`result-lesson-${result.id}`}
                          >
                            {getTypeIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium truncate">{result.title}</p>
                              <p className="text-xs text-gray-500">{getFeatureLabel(result.feature)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {courses.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" data-testid="text-section-courses">
                        Courses ({courses.length})
                      </h2>
                      <div className="space-y-2">
                        {courses.map((result) => (
                          <button
                            key={`course-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover-elevate active-elevate-2 text-left"
                            data-testid={`result-course-${result.id}`}
                          >
                            {getTypeIcon(result.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium truncate">{result.title}</p>
                              <p className="text-xs text-gray-500">{getFeatureLabel(result.feature)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : !hasSearched ? (
                <div className="text-center py-12 text-gray-500" data-testid="text-search-prompt">
                  Start typing to search...
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
