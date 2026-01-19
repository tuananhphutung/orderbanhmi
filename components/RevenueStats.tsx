
import React, { useState, useMemo } from 'react';
import { Order, User } from '../types';
import { TrendingUp, List, ChevronLeft, ChevronRight, Trash2, AlertCircle, Loader2, Square, CheckSquare } from 'lucide-react';
import { db } from '../firebase';

interface RevenueStatsProps {
  orders: Order[];
  user: User;
}

const RevenueStats: React.FC<RevenueStatsProps> = ({ orders, user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSameMonth = (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const filteredOrders = useMemo(() => orders
    .filter(o => o.status === 'completed')
    .filter(o => isSameMonth(new Date(o.timestamp), selectedDate)), [orders, selectedDate]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  const handleDeleteMany = async (ids: string[]) => {
      if (isDeleting) return;
      const count = ids.length;
      if (!confirm(`Xác nhận xóa ${count} đơn hàng đã chọn?`)) return;

      setIsDeleting('bulk');
      try {
          const batch = db.batch();
          for (const id of ids) {
              const order = orders.find(o => o.id === id);
              if (order) {
                  const logRef = db.collection('deleted_orders').doc();
                  batch.set(logRef, {
                      originalOrderId: order.id,
                      total: Number(order.total),
                      items: order.items.map(item => ({ name: item.name, quantity: item.quantity })),
                      paymentMethod: order.paymentMethod,
                      deletedAt: Date.now(),
                      deletedBy: user.name || 'Staff User',
                      deletedByRole: user.role || 'staff'
                  });
                  batch.delete(db.collection('orders').doc(id));
              }
          }
          await batch.commit();
          setSelectedIds([]);
          alert(`Đã xóa thành công ${count} đơn!`);
      } catch (e: any) {
          alert(`Lỗi: ${e.message}`);
      } finally {
          setIsDeleting(null);
      }
  };

  const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === filteredOrders.length) setSelectedIds([]);
      else setSelectedIds(filteredOrders.map(o => o.id));
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(selectedDate);
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayRevenue = filteredOrders
        .filter(o => new Date(o.timestamp).getDate() === day)
        .reduce((sum, o) => sum + o.total, 0);
    return { day, revenue: dayRevenue };
  });
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-in fade-in duration-500 h-[calc(100vh-80px)] overflow-y-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-orange-500" /> Doanh thu cá nhân
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex items-center">
            <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft size={20} /></button>
            <div className="px-4 font-bold text-gray-700 min-w-[120px] text-center">Tháng {selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</div>
            <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Tổng tiền tháng</p>
                <p className="text-3xl font-black text-green-600 mt-1">{totalRevenue.toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500"><TrendingUp size={24}/></div>
        </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Lượng đơn tháng</p>
                <p className="text-3xl font-black text-blue-600 mt-1">{filteredOrders.length} đơn</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><List size={24}/></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-wrap gap-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><List size={18} className="text-orange-500" /> Lịch sử đơn hàng</h3>
          <div className="flex gap-2">
              {selectedIds.length > 0 && (
                  <button onClick={() => handleDeleteMany(selectedIds)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                      <Trash2 size={14} /> Xóa {selectedIds.length} mục
                  </button>
              )}
              <button onClick={toggleSelectAll} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">
                  {selectedIds.length === filteredOrders.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
              </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 w-10">#</th>
                <th className="px-4 py-4 uppercase text-[10px] tracking-wider">Thời gian</th>
                <th className="px-4 py-4 uppercase text-[10px] tracking-wider">Nội dung</th>
                <th className="px-4 py-4 uppercase text-[10px] tracking-wider text-right">Tổng tiền</th>
                <th className="px-4 py-4 text-center w-20">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-300 italic">Không có dữ liệu đơn hàng.</td></tr>
              ) : (
                [...filteredOrders].sort((a,b) => b.timestamp - a.timestamp).map((order) => (
                  <tr key={order.id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.includes(order.id) ? 'bg-orange-50/50' : ''}`} onClick={() => toggleSelect(order.id)}>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelect(order.id)} className="text-gray-300 hover:text-orange-500">
                            {selectedIds.includes(order.id) ? <CheckSquare size={20} className="text-orange-500" /> : <Square size={20} />}
                        </button>
                    </td>
                    <td className="px-4 py-4 align-top">
                        <div className="font-bold text-gray-800">{new Date(order.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="text-[10px] text-gray-400">{new Date(order.timestamp).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                        <div className="space-y-1">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="text-gray-700 text-xs flex items-center gap-1">
                                    <span className="font-black text-gray-900">{item.quantity}x</span> {item.name}
                                </div>
                            ))}
                        </div>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                        <div className="font-black text-gray-800">{order.total.toLocaleString('vi-VN')} đ</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase">{order.paymentMethod === 'cash' ? 'TM' : 'CK'}</div>
                    </td>
                    <td className="px-4 py-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleDeleteMany([order.id])} 
                          disabled={isDeleting === order.id}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDeleting === order.id ? 'bg-gray-100 text-gray-400' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                        >
                          {isDeleting === order.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={20} />}
                        </button>
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
