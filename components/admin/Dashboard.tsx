
import React, { useState, useMemo } from 'react';
import { User, Order, Shift } from '../../types';
import { TrendingUp, Clock, Trash2, Loader2, CheckSquare, Square, X, Wallet, CreditCard, ShoppingBag, Award, ListOrdered } from 'lucide-react';
import { db } from '../../firebase';

interface DashboardProps {
  adminUser: User;
  users: User[];
  orders: Order[];
  shifts: Shift[]; 
}

const Dashboard: React.FC<DashboardProps> = ({ adminUser, users, orders, shifts }) => {
  const [startDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'revenue' | 'orders' | 'bestseller' | null>(null);

  const ordersInDate = useMemo(() => orders.filter(o => {
    const orderDate = o.customDate || new Date(o.timestamp).toLocaleDateString('en-CA');
    return orderDate >= startDate && orderDate <= endDate && o.status === 'completed';
  }), [orders, startDate, endDate]);

  const recentOrders = useMemo(() => orders.slice(0, 15), [orders]);

  const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === recentOrders.length) setSelectedIds([]);
      else setSelectedIds(recentOrders.map(o => o.id));
  };

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
                      originalId: order.id,
                      items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
                      total: order.total,
                      deletedAt: Date.now(),
                      deletedBy: adminUser.name,
                      deletedByRole: adminUser.role
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

  const handleDeleteAll = async () => {
      const allIds = recentOrders.map(o => o.id);
      handleDeleteMany(allIds);
  };

  // Calculations for Modals
  const revenueStats = useMemo(() => {
      const total = ordersInDate.reduce((sum, o) => sum + o.total, 0);
      const cash = ordersInDate.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
      const transfer = ordersInDate.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);
      return { total, cash, transfer };
  }, [ordersInDate]);

  const itemRanking = useMemo(() => {
      const stats: Record<string, { name: string; quantity: number; total: number }> = {};
      ordersInDate.forEach(order => {
          order.items.forEach(item => {
              if (!stats[item.id]) stats[item.id] = { name: item.name, quantity: 0, total: 0 };
              stats[item.id].quantity += item.quantity;
              stats[item.id].total += (item.price * item.quantity);
          });
      });
      return Object.values(stats).sort((a, b) => b.quantity - a.quantity);
  }, [ordersInDate]);

  const bestSeller = itemRanking[0];

  const Modal = ({ title, children, onClose, icon: Icon }: any) => (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl text-orange-600"><Icon size={20}/></div>
                    <h3 className="font-black text-gray-800 uppercase tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-800">
                    <X size={24} />
                </button>
            </div>
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 pb-24 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
              <TrendingUp className="text-orange-500" /> Tổng quan chi tiết
          </h2>
      </div>

      {/* Interactive Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Doanh thu card */}
        <button 
            onClick={() => setActiveModal('revenue')}
            className="text-left bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Wallet size={64} className="text-orange-500" />
          </div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest relative">Doanh thu hôm nay</p>
          <p className="text-3xl font-black text-gray-800 mt-1 relative">{revenueStats.total.toLocaleString('vi-VN')} đ</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase tracking-widest group-hover:gap-3 transition-all">
              Xem chi tiết dòng tiền <TrendingUp size={12} />
          </div>
        </button>

        {/* Lượng đơn card */}
        <button 
            onClick={() => setActiveModal('orders')}
            className="text-left bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <ShoppingBag size={64} className="text-blue-500" />
          </div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest relative">Lượng đơn hàng</p>
          <p className="text-3xl font-black text-gray-800 mt-1 relative">{ordersInDate.length} đơn</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest group-hover:gap-3 transition-all">
              Xem danh sách đơn hôm nay <ListOrdered size={12} />
          </div>
        </button>

        {/* Món bán tốt card */}
        <button 
            onClick={() => setActiveModal('bestseller')}
            className="text-left bg-orange-500 p-6 rounded-[32px] shadow-lg text-white transition-all hover:shadow-orange-200 hover:-translate-y-1 active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
              <Award size={64} className="text-white" />
          </div>
          <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest relative">Món bán tốt nhất</p>
          <p className="text-2xl font-black mt-1 truncate relative">{bestSeller?.name || '---'}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest group-hover:gap-3 transition-all">
              Xem bảng xếp hạng món <Award size={12} />
          </div>
        </button>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest"><Clock size={18} /> Đơn hàng gần đây</h3>
            
            <div className="flex gap-2">
                {selectedIds.length > 0 && (
                    <button 
                        onClick={() => handleDeleteMany(selectedIds)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-100 transition-all"
                    >
                        <Trash2 size={12} /> Xóa {selectedIds.length} mục
                    </button>
                )}
                <button 
                    onClick={handleDeleteAll}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200 transition-all"
                >
                    Xóa tất cả đơn
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 w-10">
                            <button onClick={toggleSelectAll} className="text-gray-300 hover:text-orange-500">
                                {selectedIds.length === recentOrders.length && recentOrders.length > 0 ? <CheckSquare size={20} className="text-orange-500" /> : <Square size={20} />}
                            </button>
                        </th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Thời gian</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Nội dung đơn</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Thành tiền</th>
                        <th className="px-6 py-4 text-right">Xóa đơn</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                    {recentOrders.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-gray-300 italic font-bold">Chưa có dữ liệu giao dịch</td></tr>
                    ) : (
                        recentOrders.map(order => (
                            <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(order.id) ? 'bg-orange-50/50' : ''}`} onClick={() => toggleSelect(order.id)}>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => toggleSelect(order.id)} className="text-gray-300 hover:text-orange-500">
                                        {selectedIds.includes(order.id) ? <CheckSquare size={20} className="text-orange-500" /> : <Square size={20} />}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-black text-gray-800">{new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">ID: {order.id.slice(-4)}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs italic max-w-[250px] truncate">
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </td>
                                <td className="px-6 py-4 font-black text-orange-600">{order.total.toLocaleString('vi-VN')} đ</td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleDeleteMany([order.id])}
                                        disabled={isDeleting !== null}
                                        className={`p-3 rounded-2xl transition-all ${isDeleting === 'bulk' ? 'opacity-30' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
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

      {/* MODALS */}
      
      {/* Revenue Detail Modal */}
      {activeModal === 'revenue' && (
          <Modal title="Chi tiết doanh thu hôm nay" onClose={() => setActiveModal(null)} icon={Wallet}>
              <div className="space-y-6">
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Tổng cộng</p>
                      <p className="text-4xl font-black text-orange-600">{revenueStats.total.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                              <Wallet size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Tiền mặt</span>
                          </div>
                          <p className="text-lg font-black text-gray-800">{revenueStats.cash.toLocaleString('vi-VN')} đ</p>
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${(revenueStats.cash / (revenueStats.total || 1)) * 100}%` }}></div>
                          </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                              <CreditCard size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Chuyển khoản</span>
                          </div>
                          <p className="text-lg font-black text-gray-800">{revenueStats.transfer.toLocaleString('vi-VN')} đ</p>
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${(revenueStats.transfer / (revenueStats.total || 1)) * 100}%` }}></div>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                      <p className="text-xs text-gray-500 font-bold italic">"Phát sinh {ordersInDate.length} giao dịch thành công trong ngày"</p>
                  </div>
              </div>
          </Modal>
      )}

      {/* Today Orders Modal */}
      {activeModal === 'orders' && (
          <Modal title="Đơn hàng hôm nay" onClose={() => setActiveModal(null)} icon={ShoppingBag}>
              <div className="space-y-3 max-h-[400px]">
                  {ordersInDate.length === 0 ? (
                      <p className="text-center py-10 text-gray-400 italic">Chưa có đơn hàng nào</p>
                  ) : (
                      ordersInDate.map(o => (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <div>
                                  <p className="font-black text-gray-800 text-xs">{new Date(o.timestamp).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">{o.items.length} món • {o.paymentMethod === 'cash' ? 'Tiền mặt' : 'Ck'}</p>
                              </div>
                              <p className="font-black text-orange-600 text-sm">{(o.total).toLocaleString('vi-VN')} đ</p>
                          </div>
                      ))
                  )}
              </div>
          </Modal>
      )}

      {/* Best Seller / Ranking Modal */}
      {activeModal === 'bestseller' && (
          <Modal title="Bảng xếp hạng món ăn" onClose={() => setActiveModal(null)} icon={Award}>
              <div className="space-y-4">
                  {itemRanking.length === 0 ? (
                      <p className="text-center py-10 text-gray-400 italic">Chưa có dữ liệu bán lẻ</p>
                  ) : (
                      itemRanking.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm relative">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  idx === 1 ? 'bg-gray-100 text-gray-700' :
                                  idx === 2 ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-400'
                              }`}>
                                  #{idx + 1}
                              </div>
                              <div className="flex-1">
                                  <p className="font-black text-gray-800 text-xs">{item.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Tổng doanh thu: {item.total.toLocaleString('vi-VN')} đ</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-lg font-black text-gray-900">{item.quantity}</p>
                                  <p className="text-[9px] text-gray-400 font-black uppercase">Đã bán</p>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </Modal>
      )}
    </div>
  );
};

export default Dashboard;
