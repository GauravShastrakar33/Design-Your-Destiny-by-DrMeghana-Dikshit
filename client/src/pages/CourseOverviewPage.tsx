import { ArrowLeft, Play } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";

interface Lesson {
  id: string;
  number: string;
  title: string;
  duration: string;
  url?: string;
  description?: string;
}

interface CourseData {
  id: string;
  title: string;
  fullTitle: string;
  thumbnail: string;
  year: string;
  lessons: Lesson[];
}

const coursesData: Record<string, CourseData> = {
  "dyd-14": {
    id: "dyd-14",
    title: "DYD 14",
    fullTitle: "Design Your Destiny",
    thumbnail: "/workshopsimg/DYD.jpg",
    year: "July 2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "19 July — Intervention",
        duration: "3hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "5 Aug — Root Chakra Process",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "12 Aug — Intervention",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "4",
        number: "04",
        title: "19 Aug — Sacral Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "5",
        number: "05",
        title: "21 Aug — Intervention",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "6",
        number: "06",
        title: "27 Aug — Solar Plexus Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "7",
        number: "07",
        title: "2 Sept — Intervention",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "8",
        number: "08",
        title: "4 Sept — Heart Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "9",
        number: "09",
        title: "9 Sept — Intervention",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "10",
        number: "10",
        title: "11 Sept — Throat Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "11",
        number: "11",
        title: "18 Sept — Intervention",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "12",
        number: "12",
        title: "23 Sept — Third Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "13",
        number: "13",
        title: "23 Sept — Intervention",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "14",
        number: "14",
        title: "25 Sept — Crown Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "15",
        number: "15",
        title: "30 Sept — Intervention",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "16",
        number: "16",
        title: "2 Oct — Crown Chakra Process",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  "dyd-13": {
    id: "dyd-13",
    title: "DYD 13",
    fullTitle: "Design Your Destiny",
    thumbnail: "bg-gradient-to-br from-blue-500 to-indigo-500",
    year: "April 2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Session 1 — Introduction",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Session 2 — Root Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Session 3 — Sacral Chakra",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "4",
        number: "04",
        title: "Session 4 — Solar Plexus",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  "dyd-12": {
    id: "dyd-12",
    title: "DYD 12",
    fullTitle: "Design Your Destiny",
    thumbnail: "bg-gradient-to-br from-green-500 to-emerald-500",
    year: "January 2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Introduction Session",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Energy Work Foundation",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Chakra Activation",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  "usm-march": {
    id: "usm-march",
    title: "USM",
    fullTitle: "Ultimate Success Mastery",
    thumbnail: "/workshopsimg/USM.jpg",
    year: "March 2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Vibration Mastery",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Influence Mastery",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Money Mastery",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  "usm-jan": {
    id: "usm-jan",
    title: "USM",
    fullTitle: "Universal Success Mastery",
    thumbnail: "bg-gradient-to-br from-cyan-400 to-blue-500",
    year: "January 2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Vibration Mastery",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Influence Mastery",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Money Mastery",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  "usc-march": {
    id: "usc-march",
    title: "USC",
    fullTitle: "Ultimate Success Champion",
    thumbnail: "/workshopsimg/USC.jpg",
    year: "March 2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Day 1 — Video",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Day 2 — Video",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Day 3 — Video",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  "usb-feb": {
    id: "usb-feb",
    title: "USB",
    fullTitle: "Ultimate Success Blueprint",
    thumbnail: "/workshopsimg/USB.jpg",
    year: "February 2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Recognise",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Release",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Rewire",
        duration: "2hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  sleep: {
    id: "sleep",
    title: "Sleep Subconscious",
    fullTitle: "Sleep Subconscious Reprogramming",
    thumbnail: "/workshopsimg/SSR.jpg",
    year: "2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Deep Sleep Techniques",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Subconscious Reprogramming",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Dream Work",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  visions: {
    id: "visions",
    title: "Build Your Visions",
    fullTitle: "Build Your Visions Workshop",
    thumbnail: "/workshopsimg/BYV.jpg",
    year: "2025",
    lessons: [
      {
        id: "1",
        number: "01",
        title: "Vision Clarity",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "2",
        number: "02",
        title: "Action Planning",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "3",
        number: "03",
        title: "Manifestation Strategies",
        duration: "1hr",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
};

export default function CourseOverviewPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/workshops/course/:courseId");

  const courseId = params?.courseId || "";
  const course = coursesData[courseId];

  if (!course) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Course not found</p>
          <button
            onClick={() => setLocation("/workshops")}
            className="mt-4 text-primary"
            data-testid="button-back-to-workshops"
          >
            Go back to Workshops
          </button>
        </div>
      </div>
    );
  }

  const handleLessonClick = (lesson: Lesson) => {
    const params = new URLSearchParams({
      videoId: `${courseId}-lesson-${lesson.id}`,
      title: `${course.title} - ${lesson.title}`,
      url: lesson.url || "",
      description:
        lesson.description || `${course.fullTitle} - ${lesson.title}`,
      thumbnail: "",
    });
    setLocation(`/video-player?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Top App Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/workshops")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">
              Course Overview
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Hero Banner Card */}
          <Card className="overflow-hidden border-0">
            <div className="relative h-48 flex items-end p-6 overflow-hidden">
              {course.thumbnail.startsWith("bg-") ? (
                // ✅ Case 1: Tailwind gradient background
                <div className={`${course.thumbnail} absolute inset-0`} />
              ) : (
                // ✅ Case 2: Image thumbnail
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) =>
                    (e.currentTarget.src = "/images/placeholder.jpg")
                  }
                />
              )}
            </div>
          </Card>

          {/* Course Info Block */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {course.fullTitle}
            </h3>
            <p className="text-muted-foreground">
              {course.lessons.length} lessons
            </p>
          </div>

          {/* Lesson List Section */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Lessons
            </h4>
            <div className="space-y-3">
              {course.lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className="p-4 cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleLessonClick(lesson)}
                  data-testid={`lesson-${lesson.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">
                        {lesson.number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-foreground truncate">
                        {lesson.title}
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        {lesson.duration}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Play
                        className="w-5 h-5 text-primary"
                        fill="currentColor"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
