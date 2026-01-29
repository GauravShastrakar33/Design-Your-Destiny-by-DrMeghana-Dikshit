import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Check, Quote, Loader2 } from "lucide-react";
import HeartChakraIcon from "@/components/icons/HeartChakraIcon";

interface HistoryPOH {
  id: string;
  title: string;
  category: string;
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

  const formatPeriod = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt && !endedAt) return null;

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    };

    if (startedAt && endedAt) {
      return `${formatDate(startedAt)} - ${formatDate(endedAt)}`;
    }
    if (endedAt) {
      return formatDate(endedAt);
    }
    return null;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F8F9FA" }}>
      <Header
        title="POH History"
        hasBackButton={true}
        onBack={() => setLocation("/project-of-heart")}
      />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-4"
        >
          <div className="flex justify-center mb-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle, rgba(95, 183, 125, 0.2) 0%, transparent 70%)",
              }}
            >
              <HeartChakraIcon className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Project of Heart History
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            You don't restart your life.
            <br />
            You build it in phases.
          </p>
        </motion.div>

        {/* Past Projects */}
        {historyProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
          >
            <Card
              className="p-5 border-0 shadow-sm overflow-hidden"
              data-testid={`card-past-poh-${project.id}`}
            >
              {/* Status Badge & Period */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    project.status === "completed"
                      ? "bg-green-50 text-green-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {project.status === "completed"
                    ? "Completed"
                    : "Closed Early"}
                </span>
                {formatPeriod(project.started_at, project.ended_at) && (
                  <span className="text-xs text-gray-400">
                    {formatPeriod(project.started_at, project.ended_at)}
                  </span>
                )}
              </div>

              {/* Category */}
              <span
                className="text-xs px-2 py-0.5 rounded-full mb-2 inline-block capitalize"
                style={{
                  backgroundColor: "rgba(112, 61, 250, 0.1)",
                  color: "#703DFA",
                }}
              >
                {project.category}
              </span>

              {/* Title */}
              <h3
                className="text-base font-semibold text-gray-800 mb-4"
                data-testid={`text-past-poh-title-${project.id}`}
              >
                {project.title}
              </h3>

              {/* Achieved Milestones */}
              {project.milestones.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check
                      className="w-3.5 h-3.5"
                      style={{ color: "#5FB77D" }}
                    />
                    <span className="text-xs font-medium text-gray-500">
                      Milestones achieved ({project.milestones.length})
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-5">
                    {project.milestones.map((milestone, mIndex) => (
                      <div key={mIndex} className="flex items-start gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: "#5FB77D" }}
                        />
                        <span className="text-sm text-gray-600">
                          {milestone}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reflection */}
              {project.closing_reflection && (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(229, 172, 25, 0.06)" }}
                >
                  <div className="flex items-start gap-2">
                    <Quote
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: "#E5AC19" }}
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Reflection
                      </p>
                      <p
                        className="text-sm text-gray-600 italic leading-relaxed"
                        data-testid={`text-past-poh-reflection-${project.id}`}
                      >
                        "{project.closing_reflection}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {/* Empty State */}
        {historyProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center py-12"
          >
            <p className="text-gray-400">
              No past projects yet.
              <br />
              Your journey is just beginning.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
