
import React, { useState } from 'react';
import { Order, User } from '../types';
import { TrendingUp, List, ChevronLeft, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';

interface RevenueStatsProps {
  orders: Order[];
  user: User;
}

const RevenueStats: React.FC<RevenueStatsProps> = ({ orders, user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isSameMonth = (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const filteredOrders = orders
    .filter(o => o.status === 'completed')
    .filter(o => isSameMonth(new Date(o.timestamp), selectedDate));

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

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

  const handleDeleteOrder = async (order: Order) => {
    if (!order || !order.id) {
        alert("Lỗi: Không tìm thấy ID đơn hàng.");
        return;
    }

    const confirmMsg = `XÁC NHẬN XÓA ĐƠN HÀNG #${order.id.slice(-4)}?\n\nSố tiền: ${order.total.toLocaleString()}đ\nNhân viên: ${user.name}\n\nLưu ý: Hành động này sẽ được ghi lại trong nhật ký Admin.`;
    
    if (window.confirm(confirmMsg)) {
      try {
        // Tạo bản sao sạch của đơn hàng (loại bỏ mọi thuộc tính undefined/custom class)
        const cleanItems = order.items.map(item => ({
            name: item.name || 'N/A',
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0
        }));

        const logEntry = {
            originalOrderId: order.id,
            total: Number(order.total),
            items: cleanItems,
            orderTimestamp: order.timestamp,
            paymentMethod: order.paymentMethod || 'unknown',
            source: order.source || 'app',
            customerName: order.customerName || '',
            deletedAt: Date.now(),
            deletedBy: user.name || 'Anonymous',
            deletedByRole: user.role || 'staff',
            reason: "Nhân viên yêu cầu xóa"
        };

        // 1. Lưu nhật ký trước
        console.log("Saving delete log...", logEntry);
        await addDoc(collection(db, 'deleted_orders'), logEntry);

        // 2. Xóa đơn chính
        console.log("Deleting order doc...", order.id);
        await deleteDoc(doc(db, 'orders', order.id));
        
        alert("Đã xóa đơn hàng thành công và đồng bộ dữ liệu!");
      } catch (error: any) {
        console.error("FIREBASE DELETE ERROR:", error);
        let errorMsg = "Không thể xóa đơn hàng.";
        if (error.code === 'permission-denied') {
            errorMsg = "LỖI QUYỀN HẠN: Tài khoản của bạn không có quyền xóa dữ liệu trên Firebase. Vui lòng liên hệ Admin để mở Rules.";
        } else {
            errorMsg += `\nMã lỗi: ${error.code || 'unknown'}\nChi tiết: ${error.message}`;
        }
        alert(errorMsg);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-in fade-in duration-500 h-[calc(100vh-80px)] overflow-y-auto pb-32">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-orange-500" /> Tình hình thu chi
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex items-center">
            <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
            <div className="px-4 font-bold text-gray-700 min-w-[120px] text-center">Tháng {selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</div>
            <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 active:scale-90 transition-transform"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Tổng doanh thu</p>
                <p className="text-3xl font-black text-green-600 mt-1">{totalRevenue.toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500"><TrendingUp size={24}/></div>
        </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Số lượng đơn</p>
                <p className="text-3xl font-black text-blue-600 mt-1">{filteredOrders.length} đơn</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><List size={24}/></div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <h3 className="font-bold text-gray-400 mb-6 text-[10px] uppercase tracking-widest">Biểu đồ doanh thu ngày</h3>
        <div className="flex items-end gap-1 h-40 md:h-48 w-full overflow-x-auto pb-4 scrollbar-hide">
            {chartData.map((d) => (
                <div key={d.day} className="flex-1 min-w-[15px] flex flex-col items-center group relative h-full justify-end">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[8px] p-1 rounded z-20 whitespace-nowrap">
                        {d.revenue.toLocaleString()}đ
                    </div>
                    <div 
                        className={`w-full max-w-[12px] rounded-t-full transition-all duration-700 ease-out ${d.revenue > 0 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-100 h-1'}`}
                        style={{ height: d.revenue > 0 ? `${(d.revenue / maxRevenue) * 100}%` : '4px' }}
                    ></div>
                    <span className="text-[9px] font-bold text-gray-400 mt-2">{d.day}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <List size={18} className="text-orange-500" /> Chi tiết giao dịch
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 uppercase text-[10px] tracking-wider">Thời gian</th>
                <th className="px-4 py-4 uppercase text-[10px] tracking-wider">Nội dung đơn</th>
                <th className="px-4 py-4 uppercase text-[10px] tracking-wider text-right">Thành tiền</th>
                <th className="px-4 py-4 text-center w-20">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-300 italic">Không có dữ liệu đơn hàng trong tháng này.</td></tr>
              ) : (
                [...filteredOrders].sort((a,b) => b.timestamp - a.timestamp).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-4 align-top">
                        <div className="font-bold text-gray-800">{new Date(order.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{new Date(order.timestamp).toLocaleDateString('vi-VN')}</div>
                        <div className="mt-1 inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-mono">#{order.id.slice(-4).toUpperCase()}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                        <div className="space-y-1">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="text-gray-700 text-xs flex items-center gap-1">
                                    <span className="font-black text-gray-900 min-w-[18px]">{item.quantity}x</span> 
                                    <span className="truncate">{item.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex gap-1 items-center">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 uppercase">{order.source === 'app' ? 'Tại quán' : order.source}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 uppercase">{order.paymentMethod === 'cash' ? 'Tiền mặt' : 'CK'}</span>
                        </div>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                        <div className="font-black text-gray-800 text-base">{order.total.toLocaleString('vi-VN')} đ</div>
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteOrder(order); }} 
                          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 mx-auto"
                          title="Xóa đơn hàng"
                        >
                          <Trash2 size={20} />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-orange-700 leading-relaxed">
              <b>Quy trình xóa đơn:</b> Khi nhấn xóa, hệ thống sẽ lưu thông tin đơn bị xóa vào mục "Lịch sử xóa" của Admin để đối soát cuối ngày. Thao tác này sẽ cập nhật lại báo cáo doanh thu ngay lập tức.
          </div>
      </div>
    </div>
  );
};

export default RevenueStats;
