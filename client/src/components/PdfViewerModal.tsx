import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  FileText,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export function PdfViewerModal({
  isOpen,
  onClose,
  url,
  title = "Lesson Notes",
}: PdfViewerModalProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [baseBlobUrl, setBaseBlobUrl] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(100);
  const [page, setPage] = React.useState(1);
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number | null>(
    null
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Simple resize handler to keep the PDF responsive
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Subtract padding (16px * 2 for p-4) to get actual content width
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    };

    if (isOpen) {
      // Small timeout to ensure the modal animation has finished and container has final size
      const timer = setTimeout(updateWidth, 100);
      window.addEventListener("resize", updateWidth);
      return () => {
        window.removeEventListener("resize", updateWidth);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF Load Error:", error);
    setHasError(true);
    setIsLoading(false);
  };

  // Fetch and create blob URL for robust cross-platform viewing
  React.useEffect(() => {
    let currentBlobUrl: string | null = null;

    if (isOpen && url) {
      setIsLoading(true);
      setHasError(false);
      setBaseBlobUrl(null);
      setPage(1);
      setZoom(100);

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch document");
          return res.blob();
        })
        .then((blob) => {
          currentBlobUrl = URL.createObjectURL(blob);
          setBaseBlobUrl(currentBlobUrl);
          setIsLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("PDF Fetch Error:", err);
            setHasError(true);
            setIsLoading(false);
          }
        });
    }

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, url]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));

  const handlePageChange = (newPage: number) => {
    const targetPage = document.querySelector(
      `[data-page-number="${newPage}"]`
    );
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setPage(newPage);
  };

  const handlePageNext = () => {
    if (numPages && page < numPages) {
      handlePageChange(page + 1);
    }
  };

  const handlePagePrev = () => {
    if (page > 1) {
      handlePageChange(page - 1);
    }
  };

  const zoomRef = React.useRef(zoom);
  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Interaction handlers for pinch-to-zoom and wheel zoom
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialPinchDistance = 0;
    let pinchStartZoom = 0;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Stop browser from handling the pinch natively
        e.preventDefault();
        initialPinchDistance = getDistance(e.touches);
        pinchStartZoom = zoomRef.current;

        // Temporarily disable all browser touch actions to ensure our JS handles the zoom
        if (container) {
          container.style.touchAction = "none";
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance > 0) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const ratio = currentDistance / initialPinchDistance;
        const newZoom = pinchStartZoom * ratio;
        setZoom(Math.max(25, Math.min(800, newZoom)));
      }
    };

    const handleTouchEnd = () => {
      initialPinchDistance = 0;
      // Restore vertical/horizontal panning after pinch ends
      if (container) {
        container.style.touchAction = "pan-x pan-y";
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -15 : 15;
        setZoom((prev) => Math.max(25, Math.min(800, prev + delta)));
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen]); // Only depend on isOpen, not zoom. This prevents jitter.

  // Intersection Observer to track which page is in view
  React.useEffect(() => {
    if (!numPages || !containerRef.current) return;

    const observerOptions = {
      root: containerRef.current,
      threshold: 0.5, // Page is "active" if 50% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(
            entry.target.getAttribute("data-page-number") || "1"
          );
          setPage(pageNum);
        }
      });
    }, observerOptions);

    // Give a small delay for pages to mount
    const timer = setTimeout(() => {
      const pageElements = document.querySelectorAll("[data-page-number]");
      pageElements.forEach((el) => observer.observe(el));
    }, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [numPages, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Scrollbar visibility styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
          display: block !important;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5) !important;
          border-radius: 10px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7) !important;
        }
      `,
        }}
      />
      <DialogContent
        hideClose
        className="max-w-[92vw] w-full md:max-w-5xl h-[92vh] md:h-[85vh] p-0 overflow-hidden flex flex-col rounded-2xl border-0 shadow-2xl bg-white"
      >
        <DialogHeader className="p-3 md:p-4 flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 bg-white space-y-3 sm:space-y-0 text-left shrink-0">
          <div className="flex flex-row items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <DialogTitle className="text-sm md:text-base font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[250px]">
                {title}
              </DialogTitle>
            </div>

            {/* Mobile Close Button inside the header row */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all sm:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {!hasError && !isLoading && (
            <div className="flex items-center gap-1 md:gap-3 bg-slate-50 p-1 md:p-1.5 rounded-lg border border-slate-100 w-full sm:w-auto justify-between sm:justify-start overflow-hidden">
              {/* Page Controls */}
              <div className="flex items-center gap-0.5 md:gap-1 border-r border-slate-200 pr-1 md:pr-2 mr-0.5 md:mr-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePagePrev}
                  disabled={page <= 1}
                  className="h-7 w-7 md:h-8 md:w-8 rounded-lg text-slate-600 hover:bg-white hover:text-brand"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 md:gap-1.5 px-0.5 md:px-2">
                  <span className="text-[9px] md:text-[10px] uppercase font-black tracking-tight text-slate-400 hidden xs:inline">
                    Page
                  </span>
                  <input
                    type="number"
                    value={page}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        const target = Math.max(
                          1,
                          numPages ? Math.min(val, numPages) : val
                        );
                        handlePageChange(target);
                      }
                    }}
                    className="w-8 h-6 md:w-10 md:h-6 text-center bg-white border border-slate-200 rounded text-[11px] md:text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand/50"
                  />
                  {numPages && (
                    <span className="text-[10px] font-bold text-slate-400">
                      / {numPages}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePageNext}
                  disabled={!!numPages && page >= numPages}
                  className="h-7 w-7 md:h-8 md:w-8 rounded-lg text-slate-600 hover:bg-white hover:text-brand"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                  className="h-7 w-7 md:h-8 md:w-8 rounded-lg text-slate-600 hover:bg-white hover:text-brand"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[40px] md:min-w-[50px] text-center text-[10px] md:text-[11px] font-bold text-slate-700">
                  {Math.round(zoom)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= 400}
                  className="h-7 w-7 md:h-8 md:w-8 rounded-lg text-slate-600 hover:bg-white hover:text-brand"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(100)}
                  className="h-7 w-7 md:h-8 md:w-8 rounded-lg text-slate-400 hover:bg-white hover:text-brand ml-0.5 md:ml-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Desktop Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all hidden sm:flex"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 relative bg-slate-50 flex flex-col min-h-0">
          {isLoading && !hasError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white">
              <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
              <p className="text-slate-500 font-bold text-sm tracking-wide">
                Gearing up your document...
              </p>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Unable to Load document
              </h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                There was a problem loading this file. Please try again later.
              </p>
              <Button
                onClick={onClose}
                className="rounded-lg font-bold px-8 bg-brand hover:bg-brand/90 text-white"
              >
                Close Viewer
              </Button>
            </div>
          )}

          <div
            ref={containerRef}
            className="flex-1 w-full h-full overflow-auto bg-slate-200/30 select-none scroll-smooth custom-scrollbar"
            style={{
              touchAction: "pan-x pan-y", // Do NOT include pinch-zoom here, we handle it in JS
              WebkitOverflowScrolling: "touch",
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {baseBlobUrl && containerWidth && (
              <div className="flex flex-col p-4 md:p-8 min-h-0 min-w-full w-max">
                <Document
                  file={baseBlobUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className="mx-auto flex flex-col items-center gap-6"
                >
                  {Array.from(new Array(numPages || 0), (_, index) => (
                    <div
                      key={`page_${index + 1}`}
                      data-page-number={index + 1}
                      className="shadow-2xl bg-white"
                    >
                      <Page
                        pageNumber={index + 1}
                        width={containerWidth * (zoom / 100)}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                          <div
                            style={{
                              width: containerWidth * (zoom / 100),
                              height: containerWidth * (zoom / 100) * 1.4,
                            }}
                            className="bg-white flex items-center justify-center"
                          >
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                          </div>
                        }
                      />
                    </div>
                  ))}
                </Document>
              </div>
            )}
          </div>
        </div>

        {/* Footer info - Light themed */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Design Your Destiny
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
