import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X, Bell } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'order';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation out
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      case 'error': return <AlertCircle className="text-red-500" size={24} />;
      case 'order': return <Bell className="text-orange-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  const getBorderColor = () => {
     switch (type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'order': return 'border-orange-500';
      default: return 'border-blue-500';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-[200] max-w-sm w-full bg-white shadow-2xl rounded-lg border-l-4 ${getBorderColor()} p-4 flex items-start gap-3 transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 text-sm uppercase mb-1">
            {type === 'order' ? 'Đơn hàng mới' : type === 'success' ? 'Thành công' : 'Thông báo'}
        </h4>
        <p className="text-sm text-gray-600 leading-snug">{message}</p>
      </div>
      <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;