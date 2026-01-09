import React, { useState, useEffect } from 'react';
import { Download, Share, X, ShieldCheck, Smartphone, PlusSquare } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Check blocked status from LocalStorage
    const dismissed = localStorage.getItem('pwa_install_dismissed_v2');
    if (dismissed === 'true') {
        setIsDismissed(true);
        return;
    }

    // 2. Check Standalone Mode (Already installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
    
    if (isInStandaloneMode) {
      setShowPrompt(false);
      return;
    }

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture Android/Desktop install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a bit before showing to not annoy user immediately on load
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: If no event fires (e.g., iOS or event missed), show anyway after 3s for instruction
    const timer = setTimeout(() => {
        if (!isInStandaloneMode && !dismissed) {
            setShowPrompt(true);
        }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false); 
      }
    } else {
        // Should not happen often on Android if logic is right, but safe fallback
        alert("Vui lòng sử dụng menu trình duyệt -> Thêm vào màn hình chính");
    }
  };

  const handleDismiss = () => {
      setShowPrompt(false);
      setIsDismissed(true);
      // Permanently dismiss to avoid annoying the user
      localStorage.setItem('pwa_install_dismissed_v2', 'true');
  };

  if (!showPrompt || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 blur-xl"></div>

        {/* Close Button */}
        <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors z-10"
        >
            <X size={16} />
        </button>

        <div className="flex gap-4">
            <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-lg">
                    BM
                </div>
            </div>
            
            <div className="flex-1">
                <h3 className="font-bold text-gray-900 leading-tight mb-1">Cài App Order</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    Cài đặt để sử dụng mượt mà, full màn hình và không cần đăng nhập lại.
                </p>

                {isIOS ? (
                    <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-700 border border-gray-100 space-y-2">
                        <div className="flex items-center gap-2">
                            <Share size={14} className="text-blue-500" />
                            <span>Bấm <b>Chia sẻ</b> (Share)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <PlusSquare size={14} className="text-gray-600" />
                            <span>Chọn <b>Thêm vào MH chính</b></span>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-black hover:bg-gray-800 text-white text-sm font-bold py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Download size={16} /> Cài đặt ngay
                    </button>
                )}
            </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                 <ShieldCheck size={10} /> Verified Application
             </div>
             {isIOS && <span className="text-[10px] text-gray-400">iOS Safari</span>}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;