import { useState, useEffect } from "react";
import { Search, Bell, Play, Calendar, Clock, X } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import rightDecisionThumbnail from "@assets/right-decision-thumbnail.png";

type Tab = "upcoming" | "latest" | "dyd" | "usm" | "usc" | "usb" | "more";

interface UpcomingMasterclass {
  id: string;
  title: string;
  date: string;
  time: string;
  startTime: Date;
  zoomLink: string;
  thumbnail: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  uploadDate: string;
  isCollection: boolean;
  url?: string;
  author?: string;
  description?: string;
  videoId?: string;
}

interface Course {
  id: string;
  title: string;
  thumbnail: string;
  year: string;
  type: "dyd" | "usm" | "usc" | "usb" | "more";
  isCollection: boolean;
}

interface LastWatchedData {
  videoId: string;
  title: string;
  thumbnail: string;
  author?: string;
  progressInSeconds: number;
}

const upcomingMasterclasses: UpcomingMasterclass[] = [
  {
    id: "1",
    title: "Inner Circle",
    date: "25 Oct",
    time: "7 PM",
    startTime: new Date("2025-10-25T19:00:00"),
    zoomLink: "https://zoom.us/j/example1",
    thumbnail: "bg-gradient-to-br from-purple-400 to-pink-500",
  },
  {
    id: "2",
    title: "DYD Session",
    date: "28 Oct",
    time: "6 PM",
    startTime: new Date("2025-10-28T18:00:00"),
    zoomLink: "https://zoom.us/j/example2",
    thumbnail: "bg-gradient-to-br from-blue-400 to-indigo-500",
  },
  {
    id: "3",
    title: "Manifestation Mastery",
    date: "8 Nov",
    time: "6 PM",
    startTime: new Date("2025-11-08T18:00:00"),
    zoomLink: "https://zoom.us/j/example3",
    thumbnail: "bg-gradient-to-br from-green-400 to-emerald-500",
  },
];

const latestVideos: Video[] = [
  {
    id: "demo-1",
    title: "How to make Right Decisions",
    thumbnail: rightDecisionThumbnail,
    uploadDate: "27 Oct 2025",
    isCollection: false,
    url: "/RightDecisions.mp4",
    author: "Dr. Meghana Dikshit",
    description:
      "Learn the art of making decisions that align with your highest self and life purpose.",
    videoId: "demo-right-decisions",
  },
  {
    id: "1",
    title: "Lions Gate Portal",
    thumbnail: "bg-gradient-to-br from-yellow-400 to-orange-500",
    uploadDate: "20 Oct 2025",
    isCollection: false,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: "Dr. Meghana Dikshit",
    description:
      "Unlock the powerful energies of the Lions Gate Portal for manifestation and transformation.",
    videoId: "lions-gate-portal",
  },
  {
    id: "2",
    title: "Inner Circle Call — Turning Setbacks into Success",
    thumbnail: "bg-gradient-to-br from-purple-400 to-pink-500",
    uploadDate: "18 Oct 2025",
    isCollection: false,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: "Dr. Meghana Dikshit",
    description:
      "Transform setbacks into stepping stones for success with powerful mindset shifts.",
    videoId: "inner-circle-setbacks",
  },
  {
    id: "3",
    title: "Self Sabotage Downloads",
    thumbnail: "bg-gradient-to-br from-blue-400 to-cyan-500",
    uploadDate: "15 Oct 2025",
    isCollection: false,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: "Dr. Meghana Dikshit",
    description:
      "Identify and release self-sabotage patterns holding you back from your dreams.",
    videoId: "self-sabotage",
  },
  {
    id: "4",
    title: "Money Mastery",
    thumbnail: "bg-gradient-to-br from-green-400 to-teal-500",
    uploadDate: "12 Oct 2025",
    isCollection: false,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: "Dr. Meghana Dikshit",
    description:
      "Master your money mindset and attract abundance into your life.",
    videoId: "money-mastery",
  },
];

const dydCourses: Course[] = [
  {
    id: "dyd-14",
    title: "DYD 14",
    thumbnail: "bg-gradient-to-br from-purple-500 to-pink-500",
    year: "July 2025",
    type: "dyd",
    isCollection: true,
  },
  {
    id: "dyd-13",
    title: "DYD 13",
    thumbnail: "bg-gradient-to-br from-blue-500 to-indigo-500",
    year: "April 2025",
    type: "dyd",
    isCollection: true,
  },
  {
    id: "dyd-12",
    title: "DYD 12",
    thumbnail: "bg-gradient-to-br from-green-500 to-emerald-500",
    year: "January 2025",
    type: "dyd",
    isCollection: true,
  },
];

const usmCourses: Course[] = [
  {
    id: "usm-march",
    title: "USM",
    thumbnail: "bg-gradient-to-br from-orange-400 to-red-500",
    year: "March 2025",
    type: "usm",
    isCollection: true,
  },
  {
    id: "usm-jan",
    title: "USM",
    thumbnail: "bg-gradient-to-br from-cyan-400 to-blue-500",
    year: "January 2025",
    type: "usm",
    isCollection: true,
  },
];

const uscCourses: Course[] = [
  {
    id: "usc-march",
    title: "USC",
    thumbnail: "bg-gradient-to-br from-pink-400 to-purple-500",
    year: "March 2025",
    type: "usc",
    isCollection: true,
  },
];

const usbCourses: Course[] = [
  {
    id: "usb-feb",
    title: "USB",
    thumbnail: "bg-gradient-to-br from-teal-400 to-cyan-500",
    year: "February 2025",
    type: "usb",
    isCollection: true,
  },
];

const moreCourses: Course[] = [
  {
    id: "sleep",
    title: "Sleep Subconscious",
    thumbnail: "bg-gradient-to-br from-indigo-400 to-purple-500",
    year: "2025",
    type: "more",
    isCollection: true,
  },
  {
    id: "visions",
    title: "Build Your Visions",
    thumbnail: "bg-gradient-to-br from-yellow-400 to-orange-500",
    year: "2025",
    type: "more",
    isCollection: true,
  },
];

function CountdownTimer({ startTime }: { startTime: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Live Now!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span>{timeLeft}</span>;
}

export default function WorkshopsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [lastWatched, setLastWatched] = useState<LastWatchedData | null>(null);
  const [showLastWatched, setShowLastWatched] = useState(true);

  const tabs = [
    { id: "upcoming" as Tab, label: "Upcoming" },
    { id: "latest" as Tab, label: "Latest" },
    { id: "dyd" as Tab, label: "DYD" },
    { id: "usm" as Tab, label: "USM" },
    { id: "usc" as Tab, label: "USC" },
    { id: "usb" as Tab, label: "USB" },
    { id: "more" as Tab, label: "More" },
  ];

  // Load last watched data
  useEffect(() => {
    try {
      const saved = localStorage.getItem("last-watched");
      if (saved) {
        const data: LastWatchedData = JSON.parse(saved);
        setLastWatched(data);
      }
    } catch (error) {
      console.error("Error loading last watched:", error);
    }
  }, []);

  const handleJoin = (zoomLink: string) => {
    window.open(zoomLink, "_blank");
  };

  const handleVideoClick = (video: Video) => {
    if (video.isCollection) {
      // Navigate to course overview
      setLocation(`/workshops/course/${video.id}`);
    } else {
      // Navigate to video player
      const params = new URLSearchParams({
        videoId: video.videoId || video.id,
        title: video.title,
        thumbnail:
          typeof video.thumbnail === "string" &&
          video.thumbnail.startsWith("bg-")
            ? ""
            : video.thumbnail,
        url: video.url || "",
        author: video.author || "",
        description: video.description || "",
      });
      setLocation(`/video-player?${params.toString()}`);
    }
  };

  const handleCourseClick = (course: Course) => {
    if (course.isCollection) {
      setLocation(`/workshops/course/${course.id}`);
    }
  };

  const handleResumeLastWatched = () => {
    if (!lastWatched) return;

    const params = new URLSearchParams({
      videoId: lastWatched.videoId,
      title: lastWatched.title,
      thumbnail: lastWatched.thumbnail,
      author: lastWatched.author || "",
    });
    setLocation(`/video-player?${params.toString()}`);
  };

  const handleCloseLastWatched = () => {
    setShowLastWatched(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Top Navigation */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Masterclasses
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/search")}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-search"
              >
                <Search className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => setLocation("/notifications")}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Horizontal Tab Selector */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-4 pb-3 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-6">
          {/* Upcoming Tab */}
          {activeTab === "upcoming" && (
            <div className="space-y-4">
              {upcomingMasterclasses.map((masterclass) => (
                <Card
                  key={masterclass.id}
                  className="overflow-hidden"
                  data-testid={`upcoming-${masterclass.id}`}
                >
                  <div
                    className={`${masterclass.thumbnail} h-40 flex items-end p-4`}
                  >
                    <h3 className="text-white text-xl font-bold">
                      {masterclass.title}
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {masterclass.date}, {masterclass.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium text-primary">
                        Starts in:{" "}
                        <CountdownTimer startTime={masterclass.startTime} />
                      </span>
                    </div>
                    <Button
                      onClick={() => handleJoin(masterclass.zoomLink)}
                      className="w-full"
                      data-testid={`button-join-${masterclass.id}`}
                    >
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Latest Tab */}
          {activeTab === "latest" && (
            <div className="space-y-4">
              {latestVideos.map((video) => (
                <Card
                  key={video.id}
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleVideoClick(video)}
                  data-testid={`video-${video.id}`}
                >
                  {typeof video.thumbnail === "string" &&
                  video.thumbnail.startsWith("bg-") ? (
                    <div
                      className={`${video.thumbnail} h-40 flex items-center justify-center`}
                    >
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-7 h-7 text-white" fill="white" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-40 bg-black">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-7 h-7 text-white" fill="white" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">
                      {video.title}
                    </h3>
                    {video.author && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {video.author}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {video.uploadDate}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* DYD Tab */}
          {activeTab === "dyd" && (
            <div className="space-y-4">
              {dydCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleCourseClick(course)}
                  data-testid={`course-${course.id}`}
                >
                  <div
                    className={`${course.thumbnail} h-40 flex items-end p-4`}
                  >
                    <div>
                      <h3 className="text-white text-2xl font-bold">
                        {course.title}
                      </h3>
                      <p className="text-white/90 text-sm">{course.year}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* USM Tab */}
          {activeTab === "usm" && (
            <div className="space-y-4">
              {usmCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleCourseClick(course)}
                  data-testid={`course-${course.id}`}
                >
                  <div
                    className={`${course.thumbnail} h-40 flex items-end p-4`}
                  >
                    <div>
                      <h3 className="text-white text-2xl font-bold">
                        {course.title}
                      </h3>
                      <p className="text-white/90 text-sm">{course.year}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* USC Tab */}
          {activeTab === "usc" && (
            <div className="space-y-4">
              {uscCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleCourseClick(course)}
                  data-testid={`course-${course.id}`}
                >
                  <div
                    className={`${course.thumbnail} h-40 flex items-end p-4`}
                  >
                    <div>
                      <h3 className="text-white text-2xl font-bold">
                        {course.title}
                      </h3>
                      <p className="text-white/90 text-sm">{course.year}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* USB Tab */}
          {activeTab === "usb" && (
            <div className="space-y-4">
              {usbCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleCourseClick(course)}
                  data-testid={`course-${course.id}`}
                >
                  <div
                    className={`${course.thumbnail} h-40 flex items-end p-4`}
                  >
                    <div>
                      <h3 className="text-white text-2xl font-bold">
                        {course.title}
                      </h3>
                      <p className="text-white/90 text-sm">{course.year}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* More Tab */}
          {activeTab === "more" && (
            <div className="space-y-4">
              {moreCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleCourseClick(course)}
                  data-testid={`course-${course.id}`}
                >
                  <div
                    className={`${course.thumbnail} h-40 flex items-end p-4`}
                  >
                    <div>
                      <h3 className="text-white text-2xl font-bold">
                        {course.title}
                      </h3>
                      <p className="text-white/90 text-sm">{course.year}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Last Watched Reminder Bar */}
      {lastWatched && showLastWatched && (
        <div
          className="fixed bottom-16 left-0 right-0 bg-card border-t border-border shadow-lg z-20"
          data-testid="last-watched-bar"
        >
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              {lastWatched.thumbnail && (
                <img
                  src={lastWatched.thumbnail}
                  alt={lastWatched.title}
                  className="w-16 h-10 object-cover rounded flex-shrink-0"
                  data-testid="last-watched-thumbnail"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-foreground truncate"
                  data-testid="last-watched-title"
                >
                  {lastWatched.title}
                </p>
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="last-watched-time"
                >
                  Watched: {formatTime(lastWatched.progressInSeconds)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={handleResumeLastWatched}
                  data-testid="button-resume-video"
                >
                  <Play className="w-4 h-4 mr-1" fill="currentColor" />
                  Resume
                </Button>
                <button
                  onClick={handleCloseLastWatched}
                  className="w-8 h-8 rounded-full hover-elevate active-elevate-2 flex items-center justify-center"
                  data-testid="button-close-last-watched"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
