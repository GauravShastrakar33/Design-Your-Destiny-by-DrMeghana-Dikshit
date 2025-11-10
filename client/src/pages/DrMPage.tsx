import drMAvatar from "@assets/DrM_1761365497901.webp";

export default function DrMPage() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 p-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                <img
                  src={drMAvatar}
                  alt="Dr.M"
                  className="w-full h-full object-cover object-top"
                  data-testid="img-drm-avatar"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border border-white rounded-full" />
            </div>
            <div className="text-white">
              <h1 className="text-base font-bold">Dr.M</h1>
              <p className="text-xs opacity-90">Your AI Wellness Companion</p>
            </div>
          </div>
        </div>

        {/* Gradio App Iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src="https://dr-meghana-video.wowlabz.com/"
            className="w-full h-full border-0"
            title="Dr.M AI Assistant"
            allow="camera; microphone"
            data-testid="iframe-gradio-app"
          />
        </div>
      </div>
    </div>
  );
}
