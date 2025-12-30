import React, { useState } from 'react';
import { User, Order } from '../../types';
import { DollarSign, ShoppingBag, Calendar } from 'lucide-react';

interface DashboardProps {
  users: User[];
  orders: Order[];
}

const Dashboard: React.FC<DashboardProps> = ({ users, orders }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter orders for selected date
  const ordersInDate = orders.filter(o => 
    new Date(o.timestamp).toLocaleDateString('en-CA') === selectedDate && o.status === 'completed'
  );

  const totalRevenue = ordersInDate.reduce((sum, o) => sum + o.total, 0);

  // Group by staff
  const staffPerformance = users.filter(u => u.role === 'staff').map(user => {
    const userOrders = ordersInDate.filter(o => o.staffId === user.id);
    return {
      name: user.name,
      orderCount: userOrders.length,
      revenue: userOrders.reduce((sum, o) => sum + o.total, 0)
    };
  }).filter(s => s.revenue > 0);

  return (
    <div className="p-4 md:p-8 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan doanh thu</h2>

      <div className="flex items-center gap-4 mb-8 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 w-full md:w-fit">
        <Calendar className="text-gray-500" />
        <span className="text-gray-600 font-medium whitespace-nowrap">Ngày:</span>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1 outline-none focus:border-orange-500 w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Doanh thu ngày</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <DollarSign size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Tổng đơn hàng</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ShoppingBag size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{ordersInDate.length}</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">Hiệu suất nhân viên</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Số đơn bán được</th>
                <th className="px-6 py-4">Doanh thu mang về</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffPerformance.length === 0 ? (
                  <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Không có dữ liệu trong ngày này</td>
                  </tr>
              ) : (
                  staffPerformance.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{stat.name}</td>
                      <td className="px-6 py-4">{stat.orderCount} đơn</td>
                      <td className="px-6 py-4 font-bold text-green-600">{stat.revenue.toLocaleString('vi-VN')} đ</td>
                  </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;