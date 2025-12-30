import React, { useState } from 'react';
import { User, Order, Shift } from '../../types';
import { DollarSign, ShoppingBag, Calendar, Trophy, Utensils, UserCheck, Search, TrendingUp } from 'lucide-react';

interface DashboardProps {
  users: User[];
  orders: Order[];
  shifts: Shift[]; // Added shifts to know who was scheduled
}

const Dashboard: React.FC<DashboardProps> = ({ users, orders, shifts }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  // 1. Filter orders for selected date
  const ordersInDate = orders.filter(o => 
    new Date(o.timestamp).toLocaleDateString('en-CA') === selectedDate && o.status === 'completed'
  );

  const totalRevenue = ordersInDate.reduce((sum, o) => sum + o.total, 0);

  // 2. Aggregate Item Stats (Product Breakdown)
  const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  ordersInDate.forEach(order => {
      order.items.forEach(item => {
          // Use item Name as key to group same items (or ID if preferred)
          const key = item.id; 
          if (!itemStats[key]) {
              itemStats[key] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemStats[key].quantity += item.quantity;
          itemStats[key].revenue += item.quantity * item.price;
      });
  });

  // Convert to array and sort by Quantity
  const sortedItems = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity);
  const bestSeller = sortedItems.length > 0 ? sortedItems[0] : null;

  // 3. Aggregate Staff Performance
  // Find shifts for this day
  const shiftsToday = shifts.filter(s => s.date === selectedDate);
  const scheduledStaffIds = new Set<string>();
  shiftsToday.forEach(s => s.staffIds.forEach(id => scheduledStaffIds.add(id)));

  // Combine Schedule info with Sales info
  const staffPerformance = users
    .filter(u => u.role === 'staff')
    .map(user => {
        const userOrders = ordersInDate.filter(o => o.staffId === user.id);
        const revenue = userOrders.reduce((sum, o) => sum + o.total, 0);
        const orderCount = userOrders.length;
        const isScheduled = scheduledStaffIds.has(user.id);

        // Only include if they sold something OR were scheduled
        if (revenue === 0 && !isScheduled) return null;

        return {
            id: user.id,
            name: user.name,
            orderCount,
            revenue,
            isScheduled
        };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.revenue - a.revenue); // Sort by revenue

  return (
    <div className="p-4 md:p-8 pb-20 animate-in fade-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-orange-500" /> Tổng quan chi tiết
      </h2>

      {/* Date Picker */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                 <Calendar size={20} />
            </div>
            <span className="text-gray-700 font-bold whitespace-nowrap">Chọn ngày xem báo cáo:</span>
        </div>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 w-full md:w-auto font-medium text-gray-800"
        />
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <p className="text-gray-500 text-sm font-medium uppercase relative z-10">Doanh thu ngày</p>
          <div className="flex items-center gap-3 mt-2 relative z-10">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <DollarSign size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <p className="text-gray-500 text-sm font-medium uppercase relative z-10">Tổng đơn hàng</p>
          <div className="flex items-center gap-3 mt-2 relative z-10">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ShoppingBag size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{ordersInDate.length} đơn</p>
          </div>
        </div>

        {/* Best Seller Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-5 rounded-2xl shadow-md text-white relative overflow-hidden">
           <div className="absolute -right-6 -bottom-6 text-white/10 rotate-12">
               <Trophy size={120} />
           </div>
           <p className="text-orange-100 text-sm font-bold uppercase mb-1">Món bán chạy nhất</p>
           {bestSeller ? (
               <div className="relative z-10">
                   <h3 className="text-2xl font-bold truncate pr-8">{bestSeller.name}</h3>
                   <div className="flex items-center gap-4 mt-2">
                       <span className="bg-white/20 px-2 py-1 rounded text-sm backdrop-blur-sm">
                           Đã bán: <strong>{bestSeller.quantity}</strong>
                       </span>
                       <span className="text-sm opacity-90">
                           Thu: {(bestSeller.revenue).toLocaleString('vi-VN')} đ
                       </span>
                   </div>
               </div>
           ) : (
               <p className="text-xl font-medium opacity-80 mt-2">Chưa có dữ liệu</p>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section: Menu Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Utensils size={20} className="text-orange-500" /> Chi tiết món bán ra
                </h3>
                <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    {sortedItems.length} món
                </span>
             </div>
             
             <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 sticky top-0">
                        <tr>
                            <th className="px-5 py-3">Tên món</th>
                            <th className="px-5 py-3 text-center">Số lượng</th>
                            <th className="px-5 py-3 text-right">Tổng thu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedItems.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">Chưa bán được món nào</td>
                            </tr>
                        ) : (
                            sortedItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            {idx === 0 && <Trophy size={14} className="text-yellow-500" />}
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold">
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-medium text-green-600">
                                        {item.revenue.toLocaleString('vi-VN')} đ
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
          </div>

          {/* Section: Staff Performance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <UserCheck size={20} className="text-blue-500" /> Nhân viên trực & Doanh số
                </h3>
             </div>
             
             <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 sticky top-0">
                        <tr>
                            <th className="px-5 py-3">Nhân viên</th>
                            <th className="px-5 py-3 text-center">Trạng thái</th>
                            <th className="px-5 py-3 text-right">Doanh số</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staffPerformance.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">Không có nhân viên trực hoặc bán hàng</td>
                            </tr>
                        ) : (
                            staffPerformance.map((stat) => (
                                <tr key={stat.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3">
                                        <p className="font-bold text-gray-800">{stat.name}</p>
                                        <p className="text-xs text-gray-400">{stat.orderCount} đơn hàng</p>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        {stat.isScheduled ? (
                                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                                                Có lịch trực
                                            </span>
                                        ) : (
                                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                                                Ngoài ca
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-green-600 text-base">
                                        {stat.revenue.toLocaleString('vi-VN')} đ
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;