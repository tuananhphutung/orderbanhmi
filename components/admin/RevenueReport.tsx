import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { Calendar, DollarSign, CreditCard, Wallet, TrendingUp, Clock, FileText } from 'lucide-react';

interface RevenueReportProps {
  orders: Order[];
}

const RevenueReport: React.FC<RevenueReportProps> = ({ orders }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  // 1. Filter Orders
  const dailyOrders = useMemo(() => {
    return orders.filter(o => 
      new Date(o.timestamp).toLocaleDateString('en-CA') === selectedDate && 
      o.status === 'completed'
    );
  }, [orders, selectedDate]);

  // 2. Calculate Stats
  const totalRevenue = dailyOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = dailyOrders.length;
  const cashRevenue = dailyOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
  const transferRevenue = dailyOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);

  // 3. Prepare Chart Data (Hourly Revenue)
  const hourlyData = useMemo(() => {
    // Initialize 24 hours
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // From 6h to 21h (Operating hours)
    
    const data = hours.map(hour => {
        const revenueAtHour = dailyOrders
            .filter(o => {
                const h = new Date(o.timestamp).getHours();
                return h === hour;
            })
            .reduce((sum, o) => sum + o.total, 0);
        return { hour, revenue: revenueAtHour };
    });
    return data;
  }, [dailyOrders]);

  const maxHourlyRevenue = Math.max(...hourlyData.map(d => d.revenue), 1);

  return (
    <div className="p-4 md:p-8 pb-24 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-orange-500" /> Báo cáo doanh thu
      </h2>

      {/* Date Picker & Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-6">
             <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                     <Calendar size={20} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Chọn ngày xem</p>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mt-1 font-bold text-gray-800 bg-transparent outline-none border-b border-gray-300 focus:border-orange-500 transition-colors"
                    />
                </div>
            </div>
            <div className="text-right hidden md:block">
                <p className="text-sm text-gray-500">Tổng doanh thu ngày</p>
                <p className="text-3xl font-bold text-orange-600">{totalRevenue.toLocaleString('vi-VN')} đ</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-600"><Wallet size={24}/></div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Tiền mặt</p>
                    <p className="text-xl font-bold text-gray-800">{cashRevenue.toLocaleString('vi-VN')} đ</p>
                </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600"><CreditCard size={24}/></div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Chuyển khoản</p>
                    <p className="text-xl font-bold text-gray-800">{transferRevenue.toLocaleString('vi-VN')} đ</p>
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-4">
                <div className="bg-gray-200 p-3 rounded-full text-gray-600"><FileText size={24}/></div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Tổng đơn</p>
                    <p className="text-xl font-bold text-gray-800">{totalOrders} đơn</p>
                </div>
            </div>
        </div>
      </div>

      {/* CHART SECTION (Biểu đồ cây) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-orange-500" /> Biểu đồ doanh thu theo giờ
        </h3>
        
        <div className="h-64 flex items-end justify-between gap-2 overflow-x-auto pb-4">
            {hourlyData.map((data, index) => {
                const heightPercent = (data.revenue / maxHourlyRevenue) * 100;
                const isZero = data.revenue === 0;

                return (
                    <div key={index} className="flex-1 min-w-[30px] flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs p-2 rounded pointer-events-none whitespace-nowrap z-10">
                            {data.hour}h: {data.revenue.toLocaleString('vi-VN')} đ
                        </div>
                        
                        {/* Revenue Text on Top (Optional, for high values) */}
                        {!isZero && heightPercent > 20 && (
                             <span className="text-[10px] font-bold text-gray-500 mb-1 -rotate-90 absolute bottom-10 origin-bottom-left ml-3">
                                 {(data.revenue / 1000).toFixed(0)}k
                             </span>
                        )}

                        {/* BAR (Cây) */}
                        <div 
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-700 ease-out relative overflow-hidden ${isZero ? 'bg-gray-100 h-1' : 'bg-gradient-to-t from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-sm'}`}
                            style={{ height: isZero ? '4px' : `${heightPercent}%` }}
                        >
                            {/* Glass effect shine */}
                            {!isZero && <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/20 skew-y-12 transform origin-top-left"></div>}
                        </div>

                        {/* Label */}
                        <span className={`text-xs font-bold mt-3 ${isZero ? 'text-gray-300' : 'text-gray-700'}`}>
                            {data.hour}h
                        </span>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Chi tiết đơn hàng trong ngày</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Thời gian</th>
                        <th className="px-6 py-4">Khách hàng</th>
                        <th className="px-6 py-4">Món</th>
                        <th className="px-6 py-4">Thanh toán</th>
                        <th className="px-6 py-4 text-right">Tổng tiền</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {dailyOrders.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Không có đơn hàng nào trong ngày này.</td>
                        </tr>
                    ) : (
                        [...dailyOrders].reverse().map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-bold text-gray-800">{new Date(order.timestamp).toLocaleTimeString('vi-VN')}</span>
                                    <p className="text-xs text-gray-400">ID: #{order.id.slice(-4).toUpperCase()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {order.customerName ? (
                                        <>
                                            <p className="font-medium text-gray-800">{order.customerName}</p>
                                            <p className="text-xs text-gray-500">{order.customerPhone}</p>
                                        </>
                                    ) : (
                                        <span className="text-gray-400 italic">Khách lẻ</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </td>
                                <td className="px-6 py-4">
                                     {order.paymentMethod === 'cash' ? (
                                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                             Tiền mặt
                                         </span>
                                     ) : (
                                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                             Chuyển khoản
                                         </span>
                                     )}
                                     <span className="ml-2 text-xs text-gray-400 uppercase border border-gray-200 px-1 rounded">{order.source}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">
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

export default RevenueReport;