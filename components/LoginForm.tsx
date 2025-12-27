import React, { useState } from 'react';
import { LoginFormData } from '../types';
import { User, Lock, ChefHat } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ phone, password });
  };

  return (
    <div className="relative w-full max-w-sm">
      {/* Card Container with subtle depth */}
      <div className="bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] px-8 pb-10 pt-16 relative mt-12">
        
        {/* Logo Section - Positioned absolutely at the top center */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-100">
             {/* Default Logo Icon */}
             <ChefHat className="text-white w-12 h-12" strokeWidth={1.5} />
          </div>
        </div>

        {/* App Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Order bánh mì hội an
          </h1>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block transition-colors outline-none"
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
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block transition-colors outline-none"
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 font-bold rounded-lg text-lg px-5 py-3.5 mr-2 mb-2 focus:outline-none transition-all duration-200 transform active:scale-[0.98] shadow-md mt-4"
          >
            Đăng nhập
          </button>
        </form>
      </div>

      {/* Decorative shadow element to match the style of "floating" card better if needed, 
          though the shadow-xl class above handles it well natively in CSS */}
    </div>
  );
};

export default LoginForm;