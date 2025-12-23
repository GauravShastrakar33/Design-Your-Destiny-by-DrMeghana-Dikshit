import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Check, Quote } from "lucide-react";
import HeartChakraIcon from "@/components/icons/HeartChakraIcon";

interface PastPOH {
  id: number;
  title: string;
  status: "completed" | "closed_early";
  milestones: { text: string; achieved: boolean }[];
  reflection: string;
  period?: string;
}

const pastProjects: PastPOH[] = [
  {
    id: 1,
    title: "Learn to trust my creative instincts",
    status: "completed",
    milestones: [
      { text: "I can share ideas without fear of judgment", achieved: true },
      { text: "I listen to my inner voice first", achieved: true },
      { text: "I celebrate small creative wins", achieved: true },
      { text: "I don't seek validation before starting", achieved: true },
      { text: "I trust my unique perspective", achieved: false },
    ],
    reflection: "This project taught me that creativity isn't about perfection—it's about showing up. I learned to value my ideas before anyone else validated them.",
    period: "Jan - Mar 2024"
  },
  {
    id: 2,
    title: "Build a consistent morning practice",
    status: "completed",
    milestones: [
      { text: "I wake up before my alarm", achieved: true },
      { text: "I meditate before checking my phone", achieved: true },
      { text: "I journal without forcing insights", achieved: true },
      { text: "I move my body gently each morning", achieved: false },
      { text: "I protect my morning from others' demands", achieved: true },
    ],
    reflection: "Mornings became sacred. Not every practice stuck, but the intention to start each day mindfully became part of who I am.",
    period: "Oct - Dec 2023"
  },
  {
    id: 3,
    title: "Heal my relationship with money",
    status: "closed_early",
    milestones: [
      { text: "I look at my bank account without anxiety", achieved: true },
      { text: "I see money as energy, not security", achieved: false },
      { text: "I give generously without attachment", achieved: false },
      { text: "I receive money with gratitude", achieved: true },
      { text: "I trust that I will always have enough", achieved: false },
    ],
    reflection: "I closed this project early because I realized I needed to work on self-worth first. Money was just a mirror reflecting deeper beliefs.",
    period: "Jun - Aug 2023"
  }
];

export default function ProjectOfHeartHistoryPage() {
  const [, setLocation] = useLocation();

  const achievedCount = (milestones: PastPOH["milestones"]) =>
    milestones.filter((m) => m.achieved).length;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <div className="bg-white border-b py-4 px-4 sticky top-0 z-50">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setLocation("/project-of-heart")}
            className="p-2 rounded-lg hover:bg-gray-100"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xs font-semibold tracking-widest text-gray-400">
              POH HISTORY
            </h1>
          </div>
          <div className="w-9" />
        </div>
      </div>

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
                background: "radial-gradient(circle, rgba(95, 183, 125, 0.2) 0%, transparent 70%)",
              }}
            >
              <HeartChakraIcon className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Project of Heart History
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            You don't restart your life.<br />
            You build it in phases.
          </p>
        </motion.div>

        {/* Past Projects */}
        {pastProjects.map((project, index) => (
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
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    project.status === "completed"
                      ? "bg-green-50 text-green-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {project.status === "completed" ? "Completed" : "Closed Early"}
                </span>
                {project.period && (
                  <span className="text-xs text-gray-400">{project.period}</span>
                )}
              </div>

              {/* Title */}
              <h3 
                className="text-base font-semibold text-gray-800 mb-4"
                data-testid={`text-past-poh-title-${project.id}`}
              >
                {project.title}
              </h3>

              {/* Achieved Milestones */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-3.5 h-3.5" style={{ color: "#5FB77D" }} />
                  <span className="text-xs font-medium text-gray-500">
                    Milestones achieved ({achievedCount(project.milestones)}/{project.milestones.length})
                  </span>
                </div>
                <div className="space-y-1.5 pl-5">
                  {project.milestones
                    .filter((m) => m.achieved)
                    .map((milestone, mIndex) => (
                      <div
                        key={mIndex}
                        className="flex items-start gap-2"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: "#5FB77D" }}
                        />
                        <span className="text-sm text-gray-600">
                          {milestone.text}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Reflection */}
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
                      "{project.reflection}"
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Empty State (if needed in future) */}
        {pastProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No past projects yet.<br />
              Your journey is just beginning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
