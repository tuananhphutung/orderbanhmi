
import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarClock, Package, LogOut, BarChart2, Trash2 } from 'lucide-react';
import Dashboard from './Dashboard';
import StaffManager from './StaffManager';
import ShiftManager from './ShiftManager';
import InventoryManager from './InventoryManager';
import RevenueReport from './RevenueReport';
import DeletedHistory from './DeletedHistory';
import { User, Order, MenuItem, CheckInRecord, Shift } from '../../types';

interface AdminLayoutProps {
  user: User;
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
    user, onLogout, users, setUsers, orders, 
    menuItems, setMenuItems, shifts, setShifts, 
    checkIns, onNotify 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'revenue' | 'deleted' | 'staff' | 'shifts' | 'inventory'>('dashboard');

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center justify-center w-full py-1.5 transition-all duration-200 ${
            activeTab === id 
            ? 'text-orange-600' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
    >
        <div className={`p-1 rounded-xl transition-all ${activeTab === id ? 'bg-orange-50' : ''}`}>
            <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
        </div>
        <span className={`text-[8px] font-black mt-0.5 uppercase tracking-tighter ${activeTab === id ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 relative overflow-hidden flex-col md:flex-row">
      
      {/* Mobile Top Header (Clean) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-orange-200">BM</div>
              <span className="font-bold text-gray-800 tracking-tight text-sm uppercase">Quản trị viên</span>
          </div>
      </div>

      <div className="hidden md:flex z-50 w-64 h-full bg-gray-900 text-white flex-col shadow-2xl">
        <div className="p-8 border-b border-gray-800/50">
          <h1 className="text-xl font-black text-orange-500 tracking-tighter uppercase">BM Hội An</h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Hệ thống Admin</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}><LayoutDashboard size={20} /> Tổng quan</button>
          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'revenue' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}><BarChart2 size={20} /> Doanh thu</button>
          <button onClick={() => setActiveTab('deleted')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'deleted' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}><Trash2 size={20} /> Lịch sử xóa</button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'inventory' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}><Package size={20} /> Kho hàng</button>
          <button onClick={() => setActiveTab('staff')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'staff' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}><Users size={20} /> Nhân viên</button>
          <button onClick={() => setActiveTab('shifts')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'shifts' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}><CalendarClock size={20} /> Ca trực</button>
        </nav>

        <div className="p-4 border-t border-gray-800/50">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-4 text-red-400 font-bold text-sm hover:bg-red-500/10 rounded-2xl transition-all">
            <LogOut size={20} /> Thoát hệ thống
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 pt-14 pb-20 md:pt-0 md:pb-0 h-full">
        {activeTab === 'dashboard' && <Dashboard adminUser={user} users={users} orders={orders} shifts={shifts} />}
        {activeTab === 'revenue' && <RevenueReport adminUser={user} orders={orders} />}
        {activeTab === 'deleted' && <DeletedHistory />}
        {activeTab === 'staff' && <StaffManager users={users} setUsers={setUsers} />}
        {activeTab === 'shifts' && <ShiftManager users={users} shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={onNotify} />}
        {activeTab === 'inventory' && <InventoryManager menuItems={menuItems} setMenuItems={setMenuItems} />}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 flex flex-col pt-1 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex justify-between px-0.5">
              <NavItem id="dashboard" icon={LayoutDashboard} label="T.Quan" />
              <NavItem id="revenue" icon={BarChart2} label="D.Thu" />
              <NavItem id="deleted" icon={Trash2} label="Xóa" />
              <NavItem id="inventory" icon={Package} label="Kho" />
              <NavItem id="staff" icon={Users} label="N.Viên" />
              <NavItem id="shifts" icon={CalendarClock} label="Ca trực" />
              {/* Nút đăng xuất tích hợp vào Bottom Nav */}
              <button onClick={onLogout} className="flex flex-col items-center justify-center w-full py-1.5 text-red-400">
                  <div className="p-1"><LogOut size={20} /></div>
                  <span className="text-[8px] font-black mt-0.5 uppercase tracking-tighter">Thoát</span>
              </button>
          </div>
          <div className="h-safe-bottom bg-white"></div>
      </div>

    </div>
  );
};

export default AdminLayout;
