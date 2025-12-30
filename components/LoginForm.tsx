import React, { useState } from 'react';
import { LoginFormData } from '../types';
import { User, Lock, ChefHat, Phone, UserPlus, ShieldCheck } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  onRegister: (data: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      // Auto trim whitespace
      onSubmit({ username: username.trim(), password: password.trim() });
    } else {
      onRegister({ name: regName.trim(), phone: regPhone.trim(), password: regPass.trim() });
      alert('Đăng ký thành công! Vui lòng chờ Admin duyệt.');
      setMode('login');
      setRegName(''); setRegPhone(''); setRegPass('');
    }
  };

  const switchToAdmin = () => {
      setMode('login');
      setUsername('admin');
      // Focus logic is implicit
  };

  return (
    <div className="relative w-full max-w-sm px-4">
      <div className="bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] px-6 md:px-8 pb-8 pt-16 relative mt-12">
        
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-100">
             <ChefHat className="text-white w-12 h-12" strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Order Bánh Mì Hội An
          </h1>
          <div className="flex justify-center gap-4 mt-4">
            <button 
                onClick={() => setMode('login')}
                className={`pb-1 text-sm font-semibold transition-colors border-b-2 ${mode === 'login' ? 'text-orange-600 border-orange-600' : 'text-gray-400 border-transparent'}`}
            >
                Nhân viên
            </button>
            <button 
                onClick={() => setMode('register')}
                className={`pb-1 text-sm font-semibold transition-colors border-b-2 ${mode === 'register' ? 'text-orange-600 border-orange-600' : 'text-gray-400 border-transparent'}`}
            >
                Đăng ký mới
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
            <>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="SĐT hoặc 'admin'"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block outline-none"
                  required
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block outline-none"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Họ và tên"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block outline-none"
                  required
                />
              </div>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Số điện thoại (Login ID)"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block outline-none"
                  required
                />
              </div>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block outline-none"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 font-bold rounded-lg text-lg px-5 py-3 mr-2 mb-2 focus:outline-none transition-all duration-200 transform active:scale-[0.98] shadow-md mt-4 flex items-center justify-center gap-2"
          >
            {mode === 'login' ? 'Đăng nhập' : <><UserPlus size={20}/> Đăng ký</>}
          </button>
        </form>

        {/* Admin Quick Link */}
        <div className="mt-6 text-center border-t border-gray-100 pt-4">
             <button 
                onClick={switchToAdmin}
                className="text-xs text-gray-400 hover:text-orange-500 flex items-center justify-center gap-1 mx-auto transition-colors"
             >
                 <ShieldCheck size={14} /> Bạn là Quản trị viên?
             </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;