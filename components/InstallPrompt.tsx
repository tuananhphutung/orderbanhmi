import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, Smartphone, X } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
    
    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) {
      setShowPrompt(false);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // On iOS, we can't detect "ready", so we show instructions immediately
      setShowPrompt(true);
    } else {
      // On Android/Desktop, we hide the prompt initially and ONLY show it when the browser event fires.
      // This prevents the "button doesn't work" issue.
      setShowPrompt(false);
    }

    // Capture the install prompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Now that we have the event, we can safely show the button
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger the native browser dialog immediately
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false); 
      }
    } else {
        // If we get here, it means the browser is not supported or event is missing.
        // We removed the alert() as requested. 
        // We can just keep the UI open or log to console.
        console.log("Install prompt not available");
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
        
        {/* Header */}
        <div className="bg-orange-500 p-6 text-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl font-bold text-orange-500">BM</span>
          </div>
          <h2 className="text-white text-xl font-bold">Cài đặt Ứng dụng</h2>
          <p className="text-orange-100 text-sm mt-1">Để sử dụng ổn định và tốt nhất</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6 text-sm">
            Ứng dụng POS Bánh Mì Hội An yêu cầu được cài đặt vào máy để truy cập đầy đủ tính năng và hoạt động mượt mà như app thật.
          </p>

          {isIOS ? (
            /* iOS Instructions - Apple forces manual steps */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                  <Share size={18} />
                </div>
                <p className="text-sm text-gray-700">1. Nhấn vào nút <span className="font-bold">Chia sẻ</span> ở thanh dưới cùng.</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full">
                  <PlusSquare size={18} />
                </div>
                <p className="text-sm text-gray-700">2. Chọn <span className="font-bold">Thêm vào MH chính</span> (Add to Home Screen).</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full">
                    <Smartphone size={18} />
                </div>
                <p className="text-sm text-gray-700">3. Mở app từ màn hình chính để bắt đầu.</p>
              </div>
            </div>
          ) : (
            /* Android/Chrome - Button triggers native prompt immediately */
            <div className="space-y-4">
               <div className="flex justify-center">
                    <Smartphone className="w-24 h-24 text-gray-200" />
               </div>
               <button
                onClick={handleInstallClick}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
              >
                <Download size={20} />
                Cài đặt ngay
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
            <button 
                onClick={() => setShowPrompt(false)} 
                className="text-gray-400 text-xs hover:text-gray-600 underline"
            >
                Tiếp tục sử dụng trên trình duyệt (Không khuyến khích)
            </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;