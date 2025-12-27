import React, { useState } from 'react';
import { X, CheckCircle, QrCode, Banknote } from 'lucide-react';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'transfer') => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onClose, onConfirm }) => {
  const [method, setMethod] = useState<'cash' | 'transfer' | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleConfirm = () => {
    if (method) {
      if (method === 'transfer' && !showQR) {
        setShowQR(true);
      } else {
        onConfirm(method);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-orange-500 p-4 flex justify-between items-center">
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
                  onClick={() => setMethod('cash')}
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
                  onClick={() => setMethod('transfer')}
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
              <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm mb-4">
                {/* Simulated QR Code */}
                <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white rounded-md">
                  <QrCode size={64} />
                  <span className="ml-2 font-mono text-xs">MÃ QR NGÂN HÀNG</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mb-4">
                Vui lòng yêu cầu khách hàng quét mã.<br/>
                Sau khi nhận được tiền, nhân viên bấm xác nhận.
              </p>
              <div className="w-full bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-center justify-center gap-2 mb-2">
                 <CheckCircle size={16} /> Đang chờ xác nhận thanh toán...
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!method}
            className={`w-full mt-8 py-3.5 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${
              !method
                ? 'bg-gray-300 cursor-not-allowed'
                : method === 'cash'
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {showQR ? 'Xác nhận đã nhận tiền' : 'Tiếp tục'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;