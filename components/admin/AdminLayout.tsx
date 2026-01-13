
import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarClock, Package, LogOut, BarChart2, Menu } from 'lucide-react';
import Dashboard from './Dashboard';
import StaffManager from './StaffManager';
import ShiftManager from './ShiftManager';
import InventoryManager from './InventoryManager';
import RevenueReport from './RevenueReport';
import { User, Order, MenuItem, CheckInRecord, Shift } from '../../types';

interface AdminLayoutProps {
  onLogout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  orders: Order[];
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  checkIns: CheckInRecord[];
  onNotify: (userId: string, message: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
    onLogout, users, setUsers, orders, 
    menuItems, setMenuItems, shifts, setShifts, 
    checkIns, onNotify 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'revenue' | 'staff' | 'shifts' | 'inventory'>('dashboard');

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-200 ${
            activeTab === id 
            ? 'text-orange-600' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
    >
        <div className={`p-1 rounded-xl transition-all ${activeTab === id ? 'bg-orange-50 transform -translate-y-1' : ''}`}>
            <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-bold mt-1 ${activeTab === id ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 relative overflow-hidden flex-col md:flex-row">
      
      {/* --- MOBILE HEADER (Top Bar) --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-xs">BM</div>
              <span className="font-bold text-gray-800">Quản Trị Viên</span>
          </div>
          <button onClick={onLogout} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-red-50 hover:text-red-500">
              <LogOut size={18} />
          </button>
      </div>

      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <div className="hidden md:flex z-50 w-64 h-full bg-gray-900 text-white flex-col shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-orange-500">Bánh Mì Hội An</h1>
          <p className="text-gray-400 text-xs mt-1">Administrator Control</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} /> Tổng quan
          </button>
           <button 
            onClick={() => setActiveTab('revenue')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'revenue' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <BarChart2 size={20} /> Báo cáo doanh thu
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'staff' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Users size={20} /> Nhân viên
          </button>
           <button 
            onClick={() => setActiveTab('shifts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'shifts' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <CalendarClock size={20} /> Ca trực & Chấm công
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'inventory' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Package size={20} /> Quản lý kho
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 overflow-auto bg-gray-100 pt-14 pb-20 md:pt-0 md:pb-0 h-full">
        {activeTab === 'dashboard' && <Dashboard users={users} orders={orders} shifts={shifts} />}
        {activeTab === 'revenue' && <RevenueReport orders={orders} />}
        {activeTab === 'staff' && <StaffManager users={users} setUsers={setUsers} />}
        {activeTab === 'shifts' && <ShiftManager users={users} shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={onNotify} />}
        {activeTab === 'inventory' && <InventoryManager menuItems={menuItems} setMenuItems={setMenuItems} />}
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION (App Style) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-between px-1 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Tổng quan" />
          <NavItem id="revenue" icon={BarChart2} label="Doanh thu" />
          <NavItem id="inventory" icon={Package} label="Kho" />
          <NavItem id="shifts" icon={CalendarClock} label="Ca trực" />
          <NavItem id="staff" icon={Users} label="Nhân viên" />
      </div>

    </div>
  );
};

export default AdminLayout;
