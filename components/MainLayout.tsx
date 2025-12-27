import React, { useState } from 'react';
import { User, Order, CheckInRecord, CartItem } from '../types';
import OrderInterface from './OrderInterface';
import RevenueStats from './RevenueStats';
import StaffProfile from './StaffProfile';
import { LogOut, LayoutGrid, BarChart3, UserCircle } from 'lucide-react';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  orders: Order[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onPlaceOrder: (items: CartItem[], total: number) => void;
  onCheckIn: (lat: number, lng: number) => void;
  checkInHistory: CheckInRecord[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  user, 
  onLogout, 
  orders, 
  cart,
  setCart,
  onPlaceOrder,
  onCheckIn,
  checkInHistory
}) => {
  const [activeTab, setActiveTab] = useState<'order' | 'revenue' | 'profile'>('order');

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
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800">{user.name}</p>
            <p className="text-xs text-green-600 font-medium">Đang trực</p>
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
          />
        )}
      </main>
    </div>
  );
};

export default MainLayout;