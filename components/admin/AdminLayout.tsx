import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarClock, Package, LogOut, Menu, X } from 'lucide-react';
import Dashboard from './Dashboard';
import StaffManager from './StaffManager';
import ShiftManager from './ShiftManager';
import InventoryManager from './InventoryManager';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'shifts' | 'inventory'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-100 relative overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 text-white z-40 flex items-center justify-between px-4 shadow-md">
          <div className="flex items-center gap-2">
              <button onClick={toggleSidebar} className="p-2 -ml-2">
                  <Menu size={24} />
              </button>
              <span className="font-bold text-lg">BM Hội An Admin</span>
          </div>
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-xs">
              AD
          </div>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeSidebar}
          ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative z-50 w-64 h-full bg-gray-900 text-white flex flex-col shadow-xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
              <h1 className="text-xl font-bold text-orange-500">Bánh Mì Hội An</h1>
              <p className="text-gray-400 text-xs mt-1">Administrator Control</p>
          </div>
          <button onClick={closeSidebar} className="md:hidden text-gray-400">
              <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('dashboard'); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} /> Tổng quan
          </button>
          <button 
            onClick={() => { setActiveTab('staff'); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'staff' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Users size={20} /> Nhân viên
          </button>
           <button 
            onClick={() => { setActiveTab('shifts'); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'shifts' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <CalendarClock size={20} /> Phân ca & Check-in
          </button>
          <button 
            onClick={() => { setActiveTab('inventory'); closeSidebar(); }}
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

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-100 pt-16 md:pt-0">
        {activeTab === 'dashboard' && <Dashboard users={users} orders={orders} shifts={shifts} />}
        {activeTab === 'staff' && <StaffManager users={users} setUsers={setUsers} />}
        {activeTab === 'shifts' && <ShiftManager users={users} shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={onNotify} />}
        {activeTab === 'inventory' && <InventoryManager menuItems={menuItems} setMenuItems={setMenuItems} />}
      </div>
    </div>
  );
};

export default AdminLayout;