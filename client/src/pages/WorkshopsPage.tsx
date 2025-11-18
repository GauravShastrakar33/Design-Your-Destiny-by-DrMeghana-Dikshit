import { useState, useEffect } from "react";
import { Search, Bell, Play, Calendar, Clock, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Course as DBCourse, Masterclass as DBMasterclass, WorkshopVideo as DBWorkshopVideo } from "@shared/schema";
import rightDecisionThumbnail from "@assets/right-decision-thumbnail.png";

type Tab = "upcoming" | "latest" | "dyd" | "usm" | "usc" | "usb";

interface UpcomingMasterclass {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  startTime: Date;
  endTime: Date;
  zoomLink: string;
  thumbnail: string;
  isLive: boolean;
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
  type: "dyd" | "usm" | "usc" | "usb";
  isCollection: boolean;
}

interface LastWatchedData {
  videoId: string;
  title: string;
  thumbnail: string;
  author?: string;
  progressInSeconds: number;
  url?: string; // ✅ Add this
}

// Helper function to convert DB masterclass to UI format
function convertMasterclass(mc: DBMasterclass): UpcomingMasterclass {
  return {
    id: mc.id.toString(),
    title: mc.title,
    subtitle: mc.subtitle,
    date: mc.date,
    time: mc.time,
    startTime: new Date(mc.scheduledStart),
    endTime: new Date(mc.scheduledEnd),
    zoomLink: mc.zoomLink,
    thumbnail: mc.thumbnail,
    isLive: mc.isLive,
  };
}

// Helper function to convert DB workshop video to UI format
function convertWorkshopVideo(video: DBWorkshopVideo): Video {
  return {
    id: video.id.toString(),
    title: video.title,
    thumbnail: video.thumbnail,
    uploadDate: video.uploadDate,
    isCollection: false,
    url: video.videoUrl,
    author: video.author,
    description: video.description,
    videoId: `video-${video.id}`,
  };
}

// Helper function to convert DB course to UI format
function convertCourse(course: DBCourse): Course {
  return {
    id: course.id.toString(),
    title: course.title,
    thumbnail: course.thumbnail,
    year: course.year,
    type: course.type.toLowerCase() as "dyd" | "usm" | "usc" | "usb",
    isCollection: true,
  };
}

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

  // Fetch data from database
  const { data: dbMasterclasses = [] } = useQuery<DBMasterclass[]>({ queryKey: ["/api/masterclasses"] });
  const { data: dbWorkshopVideos = [] } = useQuery<DBWorkshopVideo[]>({ queryKey: ["/api/workshop-videos"] });
  const { data: dbCourses = [] } = useQuery<DBCourse[]>({ queryKey: ["/api/courses"] });

  // Convert and filter data
  const upcomingMasterclasses = dbMasterclasses.map(convertMasterclass);
  const latestVideos = dbWorkshopVideos.map(convertWorkshopVideo);
  const dydCourses = dbCourses.filter(c => c.type.toLowerCase() === "dyd").map(convertCourse);
  const usmCourses = dbCourses.filter(c => c.type.toLowerCase() === "usm").map(convertCourse);
  const uscCourses = dbCourses.filter(c => c.type.toLowerCase() === "usc").map(convertCourse);
  const usbCourses = dbCourses.filter(c => c.type.toLowerCase() === "usb").map(convertCourse);

  const tabs = [
    { id: "upcoming" as Tab, label: "Upcoming" },
    { id: "latest" as Tab, label: "Latest" },
    { id: "dyd" as Tab, label: "DYD" },
    { id: "usm" as Tab, label: "USM" },
    { id: "usc" as Tab, label: "USC" },
    { id: "usb" as Tab, label: "USB" },
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
      setLocation(`/workshops/course/${video.id}`);
    } else {
      const params = new URLSearchParams({
        videoId: video.videoId || video.id,
        title: video.title,
        thumbnail: video.thumbnail || "",
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
      url: lastWatched.url || "", // ✅ send video file
      progress: lastWatched.progressInSeconds.toString(), // ✅ send time
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
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1
              className="text-xl font-bold text-gray-500 tracking-wider"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              MASTERCLASSES
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation("/search")}
                className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-search"
              >
                <Search className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
              </button>
              <button
                onClick={() => setLocation("/notifications")}
                className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Horizontal Line */}
          <div className="border-t border-gray-200" />

          {/* Horizontal Tab Selector */}
          <div className="overflow-x-auto scrollbar-hide bg-white">
            <div className="flex gap-2 px-4 pb-3 pt-3 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-[#703DFA] text-white"
                      : "bg-[#F3F0FF] text-gray-600 hover-elevate"
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
            <div className="space-y-5">
              {upcomingMasterclasses.map((masterclass) => (
                <div
                  key={masterclass.id}
                  className="bg-white border border-[#232A34]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                  data-testid={`upcoming-${masterclass.id}`}
                >
                  {/* Thumbnail - Reduced Height */}
                  <div className="relative h-48">
                    {masterclass.thumbnail?.startsWith("bg-") ? (
                      // ✅ Case 1: Tailwind gradient background
                      <div
                        className={`${masterclass.thumbnail} w-full h-full`}
                      />
                    ) : (
                      // ✅ Case 2: Image thumbnail
                      <img
                        src={masterclass.thumbnail || "/images/placeholder.jpg"} // fallback image
                        alt={masterclass.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* LIVE Badge */}
                    {masterclass.isLive && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                        LIVE
                      </div>
                    )}
                  </div>

                  {/* Info Section - Compact */}
                  <div className="p-3 space-y-1.5">
                    {/* Calendar + Date and Timing on Same Line */}
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar
                          className="w-4 h-4 text-[#703DFA]"
                          strokeWidth={2}
                        />
                        <span className="text-sm font-medium">
                          {masterclass.date}
                        </span>
                      </div>
                      <span className="text-xs">{masterclass.time}</span>
                    </div>

                    {/* Title/Subtitle and JOIN Button Row */}
                    <div className="flex items-start justify-between gap-2 pt-0.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-[#232A34] leading-tight">
                          {masterclass.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {masterclass.subtitle}
                        </p>
                      </div>

                      {/* JOIN Button (only for live sessions) */}
                      {masterclass.isLive && (
                        <button
                          onClick={() => handleJoin(masterclass.zoomLink)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm whitespace-nowrap hover:opacity-90 transition shrink-0"
                          data-testid={`button-join-${masterclass.id}`}
                        >
                          JOIN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
                      className={`${video.thumbnail} h-48 flex items-center justify-center`}
                    >
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-7 h-7 text-white" fill="white" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-48 bg-black">
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
                  <div className="p-3 bg-white">
                    <h3 className="font-semibold text-foreground mb-">
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
                  <div className="relative h-48 flex items-end p-4 overflow-hidden rounded-2xl">
                    {course.thumbnail.startsWith("bg-") ? (
                      // ✅ Case 1: Tailwind gradient thumbnail
                      <div className={`${course.thumbnail} absolute inset-0`} />
                    ) : (
                      // ✅ Case 2: Image thumbnail
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.src = "/images/placeholder.jpg")
                        } // fallback
                      />
                    )}

                    {/* Overlay text */}
                    <div className="relative z-10 text-white drop-shadow">
                      <h3 className="text-2xl font-bold">{course.title}</h3>
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
                  <div className="relative h-48 flex items-end p-4 overflow-hidden">
                    {course.thumbnail.startsWith("bg-") ? (
                      // ✅ Case 1: Tailwind gradient background
                      <div className={`${course.thumbnail} absolute inset-0`} />
                    ) : (
                      // ✅ Case 2: Image background
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.src = "/images/placeholder.jpg")
                        }
                      />
                    )}

                    {/* Text overlay */}
                    <div className="relative z-10 text-white">
                      <h3 className="text-2xl font-bold">{course.title}</h3>
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
                  <div className="relative h-48 flex items-end p-4 overflow-hidden">
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

                    {/* Text content */}
                    <div className="relative z-10 text-white">
                      <h3 className="text-2xl font-bold">{course.title}</h3>
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
                  <div className="relative h-48 flex items-end p-4 overflow-hidden">
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

                    {/* Text content */}
                    <div className="relative z-10 text-white">
                      <h3 className="text-2xl font-bold">{course.title}</h3>
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
          className="fixed bottom-16 left-0 right-0 bg-white border-t border-[#E5E7EB] shadow-lg z-20"
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
                  className="text-sm font-medium text-gray-900 truncate"
                  data-testid="last-watched-title"
                >
                  {lastWatched.title}
                </p>
                <p
                  className="text-xs text-gray-500"
                  data-testid="last-watched-time"
                >
                  Watched: {formatTime(lastWatched.progressInSeconds)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* ✅ Always purple with white text */}
                <Button
                  size="sm"
                  onClick={handleResumeLastWatched}
                  className="bg-[#703DFA] border border-[#703DFA] text-white hover:opacity-90 transition"
                >
                  <Play className="w-4 h-4 mr-1" fill="white" />
                  Resume
                </Button>

                {/* Close Button — purple X */}
                <button
                  onClick={handleCloseLastWatched}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#703DFA]/10 transition-colors"
                  data-testid="button-close-last-watched"
                >
                  <X className="w-4 h-4 text-[#703DFA]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
