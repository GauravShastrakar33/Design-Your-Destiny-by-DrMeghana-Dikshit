import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2, FileText } from "lucide-react";
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
  const [lessons, setLessons] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setLessons([]);
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
      setLessons([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/public/v1/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const data: SearchResponse = await response.json();
      // Filter to only include lessons
      const lessonsOnly = data.results.filter(r => r.type === "lesson");
      setLessons(lessonsOnly);
    } catch (error) {
      console.error("Search error:", error);
      setLessons([]);
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

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case "DYD": return "DYD Process";
      case "USM": return "USM Process";
      case "ABUNDANCE": return "Abundance Mastery";
      default: return feature;
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
                  placeholder="Search lessons..."
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
              ) : hasSearched && lessons.length === 0 ? (
                <div className="text-center py-12 text-gray-500" data-testid="text-no-results">
                  No lessons found
                </div>
              ) : lessons.length > 0 ? (
                <div className="space-y-2">
                  {lessons.map((result) => (
                    <button
                      key={`lesson-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover-elevate active-elevate-2 text-left"
                      data-testid={`result-lesson-${result.id}`}
                    >
                      <FileText className="w-5 h-5 text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">{result.title}</p>
                        <p className="text-xs text-gray-500">{getFeatureLabel(result.feature)}</p>
                      </div>
                    </button>
                  ))}
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
