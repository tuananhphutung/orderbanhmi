import React, { useState, useEffect } from 'react';
import { X, CheckCircle, QrCode, Banknote, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'transfer') => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onClose, onConfirm }) => {
  const [method, setMethod] = useState<'cash' | 'transfer' | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  // URL of the provided QR code image
  // In a real scenario, this could be a dynamic VietQR API link if account details were known.
  // Using a generic VietQR placeholder but designed to match the user's request visually.
  const qrImageSrc = "https://img.vietqr.io/image/SHB-0359140685-compact.png"; 

  const handleMethodSelect = (m: 'cash' | 'transfer') => {
    setMethod(m);
    if (m === 'transfer') {
        setShowQR(true);
        setIsWaiting(true);
    } else {
        setShowQR(false);
        setIsWaiting(false);
    }
  };

  const handleConfirm = () => {
    if (method) {
        onConfirm(method);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-orange-500 p-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-white font-bold text-lg">Thanh toán đơn hàng</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-500 mb-1">Tổng tiền cần thanh toán</p>
            <h2 className="text-4xl font-bold text-gray-800">
              {total.toLocaleString('vi-VN')} đ
            </h2>
          </div>

          {!showQR ? (
            <div className="space-y-4">
              <p className="font-medium text-gray-700">Chọn phương thức:</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleMethodSelect('cash')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    method === 'cash'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-200 text-gray-600'
                  }`}
                >
                  <Banknote size={32} className="mb-2" />
                  <span className="font-semibold">Tiền mặt</span>
                </button>

                <button
                  onClick={() => handleMethodSelect('transfer')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    method === 'transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 text-gray-600'
                  }`}
                >
                  <QrCode size={32} className="mb-2" />
                  <span className="font-semibold">Chuyển khoản</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
               <div className="relative group">
                 <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm mb-4 relative overflow-hidden">
                    {/* Simulated Dynamic QR with Amount */}
                    <img 
                        src={`${qrImageSrc}?amount=${total}&addInfo=Thanh toan don hang`} 
                        alt="QR Code" 
                        className="w-56 h-auto mix-blend-multiply"
                        onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/250x250?text=QR+Code+Error";
                        }}
                    />
                    <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">
                        SHB - Napas247
                    </div>
                  </div>
               </div>
              
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full mb-6 animate-pulse">
                 <Loader2 size={18} className="animate-spin" />
                 <span className="font-medium text-sm">Đang chờ khách thanh toán...</span>
              </div>
              
              <p className="text-sm text-gray-500 text-center mb-2">
                Sau khi nhận được thông báo biến động số dư, vui lòng nhấn xác nhận bên dưới.
              </p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!method}
            className={`w-full mt-4 py-3.5 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
              !method
                ? 'bg-gray-300 cursor-not-allowed'
                : method === 'cash'
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isWaiting ? <><CheckCircle size={20} /> Xác nhận đã nhận tiền</> : 'Hoàn thành đơn hàng'}
          </button>
          
          {showQR && (
            <button 
                onClick={() => { setShowQR(false); setMethod(null); }}
                className="w-full mt-3 py-2 text-gray-500 font-medium hover:text-gray-800"
            >
                Quay lại chọn phương thức
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;