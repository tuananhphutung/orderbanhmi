
import React, { useState, useEffect } from 'react';
import { Download, Share, X, PlusSquare, ArrowDown, Smartphone } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Check blocked status from LocalStorage
    const dismissed = localStorage.getItem('pwa_install_dismissed_v3'); // Bump version to reset for user
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
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: If iOS or no event, show instruction after delay
    const timer = setTimeout(() => {
        if (!isInStandaloneMode && !dismissed) {
            setShowPrompt(true);
        }
    }, 4000);

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
        alert("Vui lòng mở menu trình duyệt và chọn 'Thêm vào màn hình chính'");
    }
  };

  const handleDismiss = () => {
      setShowPrompt(false);
      setIsDismissed(true);
      localStorage.setItem('pwa_install_dismissed_v3', 'true');
  };

  if (!showPrompt || isDismissed) return null;

  // --- GIAO DIỆN RIÊNG CHO IOS ---
  if (isIOS) {
      return (
        <div className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-8 pointer-events-none flex justify-center">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-5 max-w-sm w-full pointer-events-auto relative animate-in slide-in-from-bottom-10 duration-700">
                
                {/* Nút đóng */}
                <button 
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full"
                >
                    <X size={16} />
                </button>

                {/* Mũi tên chỉ xuống nút Share của Safari */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-white drop-shadow-sm animate-bounce">
                    <ArrowDown size={32} fill="white" className="text-gray-200" />
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        BM
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">Cài đặt Ứng dụng</h3>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            Cài đặt để sử dụng toàn màn hình và ổn định hơn.
                        </p>
                        
                        <div className="space-y-2 text-sm font-medium text-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-blue-500">
                                    <Share size={16} />
                                </span>
                                <span>1. Nhấn nút <b>Chia sẻ</b> bên dưới</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-gray-600">
                                    <PlusSquare size={16} />
                                </span>
                                <span>2. Chọn <b>Thêm vào MH chính</b></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- GIAO DIỆN CHO ANDROID / DESKTOP ---
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 blur-xl"></div>

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
                    Cài đặt để sử dụng mượt mà, không cần đăng nhập lại.
                </p>

                <button
                    onClick={handleInstallClick}
                    className="w-full bg-black hover:bg-gray-800 text-white text-sm font-bold py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    <Download size={16} /> Cài đặt ngay
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
