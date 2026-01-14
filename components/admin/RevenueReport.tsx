
import React, { useState, useMemo } from 'react';
import { Order, User } from '../../types';
import { Calendar, CreditCard, Wallet, TrendingUp, FileText, Trash2, ChevronRight, ArrowRight } from 'lucide-react';
import { db } from '../../firebase';

interface RevenueReportProps {
  orders: Order[];
  adminUser: User;
}

const RevenueReport: React.FC<RevenueReportProps> = ({ orders, adminUser }) => {
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.timestamp).toLocaleDateString('en-CA');
      return orderDate >= startDate && orderDate <= endDate && o.status === 'completed';
    });
  }, [orders, startDate, endDate]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCount = filteredOrders.length;
  const cashRevenue = filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
  const transferRevenue = filteredOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);

  const handleDeleteOrder = async (order: Order) => {
      if (confirm('Xác nhận xóa đơn hàng? Nhật ký xóa sẽ được lưu lại để đối soát tài chính.')) {
          try {
              // Using v8 add and delete syntax
              await db.collection('deleted_orders').add({
                  ...order,
                  deletedAt: Date.now(),
                  deletedBy: adminUser.name,
                  deletedByRole: adminUser.role,
                  originalId: order.id
              });
              await db.collection('orders').doc(order.id).delete();
          } catch (e) {
              alert('Lỗi khi xóa đơn hàng');
          }
      }
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-orange-500" /> Báo cáo doanh thu
      </h2>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-6">
          <div className="mb-8">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CHỌN KHOẢNG NGÀY XEM</span>
              <div className="flex flex-col md:flex-row items-center gap-4 mt-3">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl w-full">
                      <Calendar size={20} className="text-orange-500" />
                      <div className="flex-1">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">TỪ NGÀY</p>
                          <input 
                              type="date" 
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full text-base font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                          />
                      </div>
                  </div>

                  <ArrowRight size={24} className="text-gray-300 hidden md:block" />

                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl w-full">
                      <Calendar size={20} className="text-orange-500" />
                      <div className="flex-1">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">ĐẾN NGÀY</p>
                          <input 
                              type="date" 
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full text-base font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                          />
                      </div>
                  </div>
              </div>
          </div>

          <div className="space-y-4">
              <div className="bg-[#f0f9f4] p-6 rounded-[28px] border border-green-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                      <div className="p-4 bg-white rounded-2xl text-green-600 shadow-sm border border-green-50">
                          <Wallet size={32} />
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">TIỀN MẶT</p>
                          <p className="text-3xl font-black text-gray-800">{cashRevenue.toLocaleString('vi-VN')} đ</p>
                      </div>
                  </div>
                  <ChevronRight className="text-green-200" />
              </div>

              <div className="bg-[#f0f4f9] p-6 rounded-[28px] border border-blue-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                      <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm border border-blue-50">
                          <CreditCard size={32} />
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">CHUYỂN KHOẢN</p>
                          <p className="text-3xl font-black text-gray-800">{transferRevenue.toLocaleString('vi-VN')} đ</p>
                      </div>
                  </div>
                  <ChevronRight className="text-blue-200" />
              </div>

              <div className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                      <div className="p-4 bg-white rounded-2xl text-gray-400 shadow-sm border border-gray-50">
                          <FileText size={32} />
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">TỔNG ĐƠN</p>
                          <p className="text-3xl font-black text-gray-800">{totalCount} đơn</p>
                      </div>
                  </div>
                  <ChevronRight className="text-gray-200" />
              </div>
          </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h3 className="font-bold text-gray-800">Chi tiết đơn hàng trong giai đoạn này</h3>
            <p className="text-xs text-gray-400 mt-1">Từ {new Date(startDate).toLocaleDateString('vi-VN')} đến {new Date(endDate).toLocaleDateString('vi-VN')}</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Thời gian</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Chi tiết</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Tổng tiền</th>
                        <th className="px-6 py-4 text-right">Xóa</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredOrders.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-300 italic">Không tìm thấy đơn hàng trong khoảng thời gian này.</td></tr>
                    ) : (
                        filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-800">{new Date(order.timestamp).toLocaleDateString('vi-VN')}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(order.timestamp).toLocaleTimeString('vi-VN')}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs italic truncate max-w-[200px]">
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </td>
                                <td className="px-6 py-4 font-black text-orange-600">
                                    {order.total.toLocaleString('vi-VN')} đ
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDeleteOrder(order)} 
                                        className="p-2.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
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
    </div>
  );
};

export default RevenueReport;
