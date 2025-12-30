import React, { useState } from 'react';
import { User, Order, CheckInRecord, CartItem, MenuItem, OrderSource, Notification, Shift } from '../types';
import OrderInterface from './OrderInterface';
import RevenueStats from './RevenueStats';
import StaffProfile from './StaffProfile';
import { LogOut, LayoutGrid, BarChart3, UserCircle, Bell, CheckCheck } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  orders: Order[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  menuItems: MenuItem[];
  onPlaceOrder: (items: CartItem[], total: number, source: OrderSource, name: string, phone: string) => void;
  onCheckIn: (lat: number, lng: number, type: 'in' | 'out', imageFile?: File) => void;
  checkInHistory: CheckInRecord[];
  notifications: Notification[];
  shifts: Shift[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  user, 
  onLogout, 
  orders, 
  cart,
  setCart,
  menuItems,
  onPlaceOrder,
  onCheckIn,
  checkInHistory,
  notifications,
  shifts
}) => {
  const [activeTab, setActiveTab] = useState<'order' | 'revenue' | 'profile'>('order');
  const [showNotif, setShowNotif] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
      try {
          await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
      } catch (e) {}
  };

  const markAllRead = async () => {
      const batch = writeBatch(db);
      notifications.filter(n => !n.isRead).forEach(n => {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { isRead: true });
      });
      try {
          await batch.commit();
      } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm z-20 px-6 py-3 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            BM
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">Bánh Mì Hội An</h1>
            <p className="text-xs text-gray-500">POS System</p>
          </div>
        </div>

        {/* Tab Navigation (Center) */}
        <nav className="hidden md:flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('order')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'order' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2">
              <LayoutGrid size={18} /> Gọi món
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'revenue' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={18} /> Doanh thu
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
             <div className="flex items-center gap-2">
              <UserCircle size={18} /> Cá nhân
            </div>
          </button>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4 relative">
          
          {/* Notification Bell */}
          <div className="relative">
             <button 
                onClick={() => setShowNotif(!showNotif)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
             >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
             </button>
             
             {showNotif && (
                 <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center px-2 py-1 mb-1 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                                <CheckCheck size={12} /> Đọc tất cả
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-center text-gray-400 py-4 text-xs">Không có thông báo mới</p>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => markAsRead(n.id)}
                                    className={`p-3 rounded-lg text-sm mb-1 cursor-pointer transition-colors ${n.isRead ? 'bg-white text-gray-400 opacity-60 hover:bg-gray-50' : 'bg-orange-50 text-gray-800 hover:bg-orange-100 border-l-2 border-orange-500'}`}
                                >
                                    <p className="font-medium leading-snug">{n.message}</p>
                                    <span className="text-[10px] opacity-70 mt-1 block">{new Date(n.timestamp).toLocaleString('vi-VN')}</span>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
             )}
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800">{user.name}</p>
            <p className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      {/* Mobile Navigation (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around p-2 pb-safe">
         <button 
            onClick={() => setActiveTab('order')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'order' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <LayoutGrid size={24} className="mb-1" /> Gọi món
          </button>
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'revenue' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <BarChart3 size={24} className="mb-1" /> Doanh thu
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'profile' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <UserCircle size={24} className="mb-1" /> Cá nhân
          </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'order' && (
          <OrderInterface 
            cart={cart} 
            setCart={setCart} 
            menuItems={menuItems}
            onPlaceOrder={onPlaceOrder} 
          />
        )}
        {activeTab === 'revenue' && (
          <RevenueStats orders={orders} />
        )}
        {activeTab === 'profile' && (
          <StaffProfile 
            user={user} 
            onCheckIn={onCheckIn} 
            checkInHistory={checkInHistory}
            shifts={shifts}
          />
        )}
      </main>
    </div>
  );
};

export default MainLayout;