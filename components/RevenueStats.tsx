import React, { useState } from 'react';
import { Order } from '../types';
import { TrendingUp, Calendar, DollarSign, List, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface RevenueStatsProps {
  orders: Order[];
}

const RevenueStats: React.FC<RevenueStatsProps> = ({ orders }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');

  // Helpers
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const isSameMonth = (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  // Filter Orders based on view
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const filteredOrders = completedOrders.filter(o => {
    const orderDate = new Date(o.timestamp);
    if (viewMode === 'day') return isSameDay(orderDate, selectedDate);
    return isSameMonth(orderDate, selectedDate);
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  // Generate Chart Data (Days in Month)
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(selectedDate);
  
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayRevenue = completedOrders
        .filter(o => {
            const d = new Date(o.timestamp);
            return d.getDate() === day && isSameMonth(d, selectedDate);
        })
        .reduce((sum, o) => sum + o.total, 0);
    return { day, revenue: dayRevenue };
  });

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1); // Avoid div by 0

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-in fade-in duration-500 h-[calc(100vh-80px)] overflow-y-auto pb-24">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-orange-500" /> Tình hình thu chi
        </h2>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex items-center">
            <button 
                onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                className="p-2 hover:bg-gray-100 rounded-md"
            >
                <ChevronLeft size={20} />
            </button>
            <div className="px-4 font-bold text-gray-700 w-32 text-center">
                {selectedDate.toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })}
            </div>
            <button 
                onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                className="p-2 hover:bg-gray-100 rounded-md"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium uppercase">Tổng thu tháng {selectedDate.getMonth() + 1}</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
                {completedOrders.filter(o => isSameMonth(new Date(o.timestamp), selectedDate)).reduce((s,o) => s + o.total, 0).toLocaleString('vi-VN')} đ
            </p>
        </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium uppercase">Tổng đơn hàng</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
                {completedOrders.filter(o => isSameMonth(new Date(o.timestamp), selectedDate)).length} đơn
            </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-800 mb-6 text-sm uppercase">Biểu đồ doanh thu theo ngày</h3>
        <div className="flex items-end gap-1 h-48 md:h-64 w-full overflow-x-auto pb-2">
            {chartData.map((d) => (
                <div key={d.day} className="flex-1 min-w-[12px] flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded z-10 whitespace-nowrap">
                        Ngày {d.day}: {d.revenue.toLocaleString('vi-VN')} đ
                    </div>
                    {/* Bar */}
                    <div 
                        className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${d.revenue > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-100 h-[2px]'}`}
                        style={{ height: d.revenue > 0 ? `${(d.revenue / maxRevenue) * 100}%` : '4px' }}
                    ></div>
                    {/* Label */}
                    <span className="text-[10px] text-gray-400 mt-2">{d.day}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <List size={20} className="text-gray-400" />
            Chi tiết đơn hàng tháng {selectedDate.getMonth() + 1}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Thời gian</th>
                <th className="px-4 py-3 whitespace-nowrap">Chi tiết món</th>
                <th className="px-4 py-3 whitespace-nowrap">Nguồn</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                [...filteredOrders].reverse().map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 align-top">
                        <div className="font-bold text-gray-800">{new Date(order.timestamp).toLocaleDateString('vi-VN')}</div>
                        <div className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleTimeString('vi-VN')}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">#{order.id}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                        <ul className="space-y-1">
                            {order.items.map((item, idx) => (
                                <li key={idx} className="text-gray-700 text-sm">
                                    <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                                </li>
                            ))}
                        </ul>
                        {order.customerName && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-1 rounded inline-block">
                                Khách: {order.customerName} - {order.customerPhone}
                            </div>
                        )}
                    </td>
                    <td className="px-4 py-3 align-top">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                             order.source === 'app' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                             order.source === 'grab' ? 'bg-green-50 text-green-700 border-green-200' :
                             order.source === 'shopee' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                             'bg-blue-50 text-blue-700 border-blue-200'
                         }`}>
                             {order.source === 'app' ? 'Tại quán' : order.source.toUpperCase()}
                         </span>
                         <div className="mt-1 text-xs text-gray-400">
                             {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'CK NH'}
                         </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right font-bold text-gray-900 text-base">
                      {order.total.toLocaleString('vi-VN')} đ
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