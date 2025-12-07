import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, Loader2, BookOpen, FileText, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";

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

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
      case "module": return <BookOpen className="w-5 h-5 text-brand" />;
      case "lesson": return <FileText className="w-5 h-5 text-green-600" />;
      case "course": return <GraduationCap className="w-5 h-5 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search modules, lessons, courses..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
                data-testid="input-search"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-results">
              No matching content found
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              {modules.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-modules">
                    Modules ({modules.length})
                  </h2>
                  <div className="space-y-2">
                    {modules.map((result) => (
                      <button
                        key={`module-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 p-3 bg-card rounded-lg hover-elevate active-elevate-2 text-left"
                        data-testid={`result-module-${result.id}`}
                      >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground">{getFeatureLabel(result.feature)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {lessons.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-lessons">
                    Lessons ({lessons.length})
                  </h2>
                  <div className="space-y-2">
                    {lessons.map((result) => (
                      <button
                        key={`lesson-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 p-3 bg-card rounded-lg hover-elevate active-elevate-2 text-left"
                        data-testid={`result-lesson-${result.id}`}
                      >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground">{getFeatureLabel(result.feature)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {courses.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-courses">
                    Courses ({courses.length})
                  </h2>
                  <div className="space-y-2">
                    {courses.map((result) => (
                      <button
                        key={`course-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 p-3 bg-card rounded-lg hover-elevate active-elevate-2 text-left"
                        data-testid={`result-course-${result.id}`}
                      >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground">{getFeatureLabel(result.feature)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-search-prompt">
              Start typing to search...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
