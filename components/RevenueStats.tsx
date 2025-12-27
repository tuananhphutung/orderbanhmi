import React from 'react';
import { Order } from '../types';
import { TrendingUp, Calendar, DollarSign, List } from 'lucide-react';

interface RevenueStatsProps {
  orders: Order[];
}

const RevenueStats: React.FC<RevenueStatsProps> = ({ orders }) => {
  const now = new Date();
  
  // Helper to check if two dates are same day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Helper to check if date is in current week (Monday start)
  const isSameWeek = (d: Date) => {
    const today = new Date(now);
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0,0,0,0);
    return d >= monday;
  };

  // Helper to check same month
  const isSameMonth = (d: Date) => {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const completedOrders = orders.filter(o => o.status === 'completed');

  // Calculate stats
  const todayRevenue = completedOrders
    .filter(o => isSameDay(new Date(o.timestamp), now))
    .reduce((sum, o) => sum + o.total, 0);

  const weekRevenue = completedOrders
    .filter(o => isSameWeek(new Date(o.timestamp)))
    .reduce((sum, o) => sum + o.total, 0);

  const monthRevenue = completedOrders
    .filter(o => isSameMonth(new Date(o.timestamp)))
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-500 h-[calc(100vh-80px)] overflow-y-auto pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-orange-500" />
        Thống kê doanh thu thực
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Hôm nay</h3>
            <div className="p-2 bg-green-100 text-green-600 rounded-full">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{todayRevenue.toLocaleString('vi-VN')} đ</p>
        </div>

        {/* This Week */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Tuần này</h3>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{weekRevenue.toLocaleString('vi-VN')} đ</p>
        </div>

        {/* This Month */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Tháng này</h3>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{monthRevenue.toLocaleString('vi-VN')} đ</p>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <List size={20} className="text-gray-400" />
            Lịch sử đơn hàng
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Phương thức</th>
                <th className="px-6 py-4 text-right">Tổng tiền</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                [...completedOrders].reverse().map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4">{new Date(order.timestamp).toLocaleTimeString('vi-VN')} - {new Date(order.timestamp).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4">
                      {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {order.total.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Thành công
                      </span>
                    </td>
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

export default RevenueStats;