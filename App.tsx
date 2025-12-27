import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PaymentModal from './components/PaymentModal';
import { LoginFormData, User, Order, CartItem, CheckInRecord } from './types';
import { ShieldCheck } from 'lucide-react';

// Hardcoded Staff User for testing
const STAFF_USER: User = {
  id: 'staff_01',
  name: 'Nhân viên 1',
  role: 'staff',
  shiftStart: '07:00',
  shiftEnd: '15:00',
  shiftDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  
  // Cart State (Lifted up)
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Payment Flow State
  const [pendingOrderItems, setPendingOrderItems] = useState<CartItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleLogin = (data: LoginFormData) => {
    if (data.phone === 'nhanvien' && data.password === '123456') {
      setCurrentUser(STAFF_USER);
    } else {
      alert('Tài khoản hoặc mật khẩu không đúng! (Gợi ý: nhanvien / 123456)');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setPendingOrderItems([]);
    setShowPaymentModal(false);
  };

  const handleAdminClick = () => {
    if (!currentUser) {
      alert("Tính năng đăng nhập Admin chưa được cấu hình. Vui lòng đăng nhập nhân viên.");
    }
  };

  // Step 1: User clicks "Thanh toán" in Order Interface
  const initiateOrder = (items: CartItem[], total: number) => {
    setPendingOrderItems(items);
    setPendingTotal(total);
    setShowPaymentModal(true);
  };

  // Step 2: User confirms payment in Modal
  const confirmOrder = (method: 'cash' | 'transfer') => {
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      items: pendingOrderItems,
      total: pendingTotal,
      paymentMethod: method,
      status: 'completed',
      timestamp: Date.now(),
      staffId: currentUser?.id || 'unknown'
    };

    setOrders(prev => [...prev, newOrder]);
    setShowPaymentModal(false);
    
    // Clear cart and pending state
    setCart([]); 
    setPendingOrderItems([]);
    setPendingTotal(0);
    
    // Simulate printing/success
    alert(`Thanh toán thành công! Mã đơn: ${newOrder.id}`);
  };

  const handleCheckIn = (lat: number, lng: number) => {
    const newCheckIn: CheckInRecord = {
      id: `CKI-${Date.now()}`,
      staffId: currentUser?.id || '',
      timestamp: Date.now(),
      latitude: lat,
      longitude: lng,
      address: 'Đang lấy địa chỉ...'
    };
    setCheckIns(prev => [...prev, newCheckIn]);
    alert(`Check-in thành công tại: ${lat}, ${lng}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative font-sans">
        <button 
          onClick={handleAdminClick}
          className="absolute top-4 right-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600"
        >
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          Admin
        </button>
        <LoginForm onSubmit={handleLogin} />
      </div>
    );
  }

  return (
    <>
      <MainLayout 
        user={currentUser} 
        onLogout={handleLogout}
        orders={orders}
        cart={cart}
        setCart={setCart}
        onPlaceOrder={initiateOrder}
        onCheckIn={handleCheckIn}
        checkInHistory={checkIns}
      />
      
      {showPaymentModal && (
        <PaymentModal 
          total={pendingTotal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={confirmOrder}
        />
      )}
    </>
  );
};

export default App;