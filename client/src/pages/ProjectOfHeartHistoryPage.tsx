import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Check,
  Quote,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  Trophy,
  History,
  Briefcase,
  Activity,
  Users,
  CircleDollarSign,
  Tag,
} from "lucide-react";
import HeartChakraIcon from "@/components/icons/HeartChakraIcon";

type Category = "career" | "health" | "relationships" | "wealth" | "other";

const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    style: { backgroundColor: string; color: string; border: string };
    icon: React.ReactNode;
  }
> = {
  career: {
    label: "Career",
    style: {
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      color: "#1d4ed8",
      border: "1px solid rgba(59, 130, 246, 0.2)",
    },
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  health: {
    label: "Health",
    style: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      color: "#15803d",
      border: "1px solid rgba(34, 197, 94, 0.2)",
    },
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  relationships: {
    label: "Relationships",
    style: {
      backgroundColor: "rgba(244, 63, 94, 0.1)",
      color: "#be123c",
      border: "1px solid rgba(244, 63, 94, 0.2)",
    },
    icon: <Users className="w-3.5 h-3.5" />,
  },
  wealth: {
    label: "Wealth",
    style: {
      backgroundColor: "rgba(234, 179, 8, 0.15)",
      color: "#a16207",
      border: "1px solid rgba(234, 179, 8, 0.3)",
    },
    icon: <CircleDollarSign className="w-3.5 h-3.5" />,
  },
  other: {
    label: "Self Exploration",
    style: {
      backgroundColor: "rgba(112, 61, 250, 0.1)",
      color: "#703DFA",
      border: "1px solid rgba(112, 61, 250, 0.2)",
    },
    icon: <Tag className="w-3.5 h-3.5" />,
  },
};

interface HistoryPOH {
  id: string;
  title: string;
  category: Category;
  status: "completed" | "closed_early";
  started_at: string | null;
  ended_at: string | null;
  closing_reflection: string | null;
  milestones: string[];
}

export default function ProjectOfHeartHistoryPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [historyProjects, setHistoryProjects] = useState<HistoryPOH[]>([]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("@app:user_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/poh/history", {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setHistoryProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch POH history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPeriod = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt && !endedAt) return null;

    if (startedAt && endedAt) {
      return `${formatDateLabel(startedAt)} - ${formatDateLabel(endedAt)}`;
    }
    if (endedAt) {
      return formatDateLabel(endedAt);
    }
    return null;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-white"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand" />
          <p className="text-gray-400 font-medium animate-pulse">
            Retrieving your journey...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-[#F9FAFB]">
      <Header
        title="Journey History"
        hasBackButton={true}
        onBack={() => setLocation("/project-of-heart")}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Message */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-brand/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center border border-indigo-50">
                <HeartChakraIcon className="w-16 h-16" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Project of Heart Archive
            </h1>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto italic leading-relaxed">
              "You don't restart your life. You build it in phases, each layer
              telling a story of who you became."
            </p>
          </div>
        </motion.div>

        {/* Project Statistics (Optional addition for flair) */}
        {historyProjects.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Completed
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {
                    historyProjects.filter((p) => p.status === "completed")
                      .length
                  }
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <History className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Total Phases
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {historyProjects.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Past Projects List */}
        <div className="space-y-6">
          <AnimatePresence>
            {historyProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card
                  className="relative overflow-hidden border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl bg-white group"
                  data-testid={`card-past-poh-${project.id}`}
                >
                  <div className="p-6">
                    {/* Top Row: Meta & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-50 pb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                          style={
                            CATEGORY_CONFIG[project.category as Category]
                              ?.style || CATEGORY_CONFIG.other.style
                          }
                        >
                          {CATEGORY_CONFIG[project.category as Category]
                            ?.icon || CATEGORY_CONFIG.other.icon}
                          {CATEGORY_CONFIG[project.category as Category]
                            ?.label || CATEGORY_CONFIG.other.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatPeriod(project.started_at, project.ended_at)}
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${
                          project.status === "completed"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {project.status === "completed" ? (
                          <Trophy className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Layers className="w-3.5 h-3.5" />
                        )}
                        {project.status === "completed"
                          ? "Completed"
                          : "Closed Early"}
                      </span>
                    </div>

                    {/* Content Area */}
                    <div className="space-y-5">
                      <h3
                        className="text-lg sm:text-xl font-bold text-gray-900 leading-tight"
                        data-testid={`text-past-poh-title-${project.id}`}
                      >
                        {project.title}
                      </h3>

                      {/* Milestones achieved */}
                      {project.milestones && project.milestones.length > 0 && (
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5 text-brand" />
                            Milestones Achieved
                          </div>
                          <div className="space-y-2">
                            {project.milestones.map((milestone, mIndex) => (
                              <div
                                key={mIndex}
                                className="flex items-start gap-2 text-gray-600"
                              >
                                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                </div>
                                <span className="text-sm font-medium leading-relaxed">
                                  {milestone}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Final Reflection */}
                      {project.closing_reflection && (
                        <div className="relative pt-6 border-t border-gray-50">
                          <Quote className="absolute -top-3 left-4 w-6 h-6 text-brand/30 rotate-180" />
                          <div className="pl-4 border-l-2 border-brand/20">
                            <p className="text-xs font-bold text-gray-500 mb-2">
                              Closing reflection
                            </p>
                            <p
                              className="text-sm text-gray-700 italic leading-relaxed"
                              data-testid={`text-past-poh-reflection-${project.id}`}
                            >
                              "{project.closing_reflection}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {historyProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 px-6 rounded-3xl border-2 border-dashed border-gray-100 bg-white/50"
            >
              <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No past projects found
              </h3>
              <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                Your archive is currently empty. Every masterpiece starts with
                the first stroke—get started on your current Project of Heart!
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
