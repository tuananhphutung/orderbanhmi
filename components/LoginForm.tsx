
import React, { useState, useEffect } from 'react';
import { LoginFormData } from '../types';
import { User, Lock, Phone, ShieldCheck, Download, Bug } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  onRegister: (data: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') setDeferredPrompt(null);
      } else {
          // Detect iOS
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          if (isIOS) {
              alert("Để cài đặt trên iPhone/iPad:\n1. Nhấn nút Chia sẻ (Share) ở giữa đáy màn hình\n2. Chọn 'Thêm vào màn hình chính' (Add to Home Screen)");
          } else {
              alert("Vui lòng sử dụng menu trình duyệt -> Thêm vào màn hình chính (Install App)");
          }
      }
  };

  const handleReportError = () => {
    const info = `UserAgent: ${navigator.userAgent}\nScreen: ${window.innerWidth}x${window.innerHeight}\nTime: ${new Date().toLocaleString()}`;
    alert(`Thông tin thiết bị:\n\n${info}\n\nVui lòng chụp màn hình này gửi cho kỹ thuật viên nếu gặp lỗi.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onSubmit({ username: username.trim(), password: password.trim() });
    } else {
      onRegister({ name: regName.trim(), phone: regPhone.trim(), password: regPass.trim() });
      setMode('login');
      setRegName(''); setRegPhone(''); setRegPass('');
    }
  };

  const switchToAdmin = () => {
      setMode('login');
      setUsername('admin');
      setPassword(''); // Clear password for security
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
       {/* Main Card */}
       <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl relative overflow-hidden border border-gray-100">
          
          {/* Top Buttons */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button 
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-white/90 hover:bg-orange-50 text-gray-600 hover:text-orange-600 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm border border-gray-200 backdrop-blur-sm active:scale-95"
            >
                <Download size={12} /> Cài App
            </button>
            <button 
                onClick={handleReportError}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm border border-red-100 backdrop-blur-sm active:scale-95"
            >
                <Bug size={12} /> Lỗi
            </button>
          </div>

          {/* Header Section */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-8 pt-12 pb-16 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
            
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform rotate-3">
               <span className="text-3xl font-black text-orange-600">BM</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Bánh Mì Hội An</h1>
            <p className="text-orange-100 text-sm opacity-90">Hệ thống quản lý bán hàng</p>
          </div>

          {/* Form Section - Overlapping Header */}
          <div className="-mt-8 bg-white rounded-t-3xl px-8 pt-8 pb-8 relative z-10">
             
             {/* Toggle Tabs */}
             <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button 
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                >
                    Đăng nhập
                </button>
                <button 
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                >
                    Đăng ký
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'login' ? (
                  <>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tài khoản</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                            <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Số điện thoại hoặc 'admin'"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-800"
                            required
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                            <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-800"
                            required
                            />
                        </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Họ và tên"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                        required
                        />
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Số điện thoại"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                        required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                        type="password"
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        placeholder="Mật khẩu"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                        required
                        />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {mode === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký nhân viên'}
                </button>
             </form>

             {/* Admin Link */}
             <div className="mt-8 text-center">
                 <button 
                    onClick={switchToAdmin}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-600 transition-colors px-3 py-1 rounded-full hover:bg-orange-50"
                 >
                     <ShieldCheck size={14} /> Dành cho Quản trị viên
                 </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default LoginForm;
