
import React, { useState, useMemo } from 'react';
import { Order, User, OrderSource } from '../../types';
import { 
    Calendar, CreditCard, Wallet, TrendingUp, Search, 
    Filter, X, ShoppingBag, User as UserIcon, 
    ArrowRight, LayoutList, ChevronDown, CheckCircle2,
    Trash2 
} from 'lucide-react';
import { db } from '../../firebase';

interface RevenueReportProps {
  orders: Order[];
  adminUser: User;
}

const RevenueReport: React.FC<RevenueReportProps> = ({ orders, adminUser }) => {
  // Filter States
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [activePaymentTab, setActivePaymentTab] = useState<'all' | 'cash' | 'transfer'>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | OrderSource>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);

  // Quick Date Select
  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toLocaleDateString('en-CA'));
    setEndDate(end.toLocaleDateString('en-CA'));
  };

  // Intelligent Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = o.customDate || new Date(o.timestamp).toLocaleDateString('en-CA');
      const matchesDate = orderDate >= startDate && orderDate <= endDate;
      const matchesPayment = activePaymentTab === 'all' || o.paymentMethod === activePaymentTab;
      const matchesSource = selectedSource === 'all' || o.source === selectedSource;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        o.customerName?.toLowerCase().includes(searchLower) ||
        o.customerPhone?.includes(searchQuery) ||
        o.items.some(item => item.name.toLowerCase().includes(searchLower)) ||
        o.id.toLowerCase().includes(searchLower);

      return matchesDate && matchesPayment && matchesSource && matchesSearch && o.status === 'completed';
    });
  }, [orders, startDate, endDate, activePaymentTab, selectedSource, searchQuery]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const count = filteredOrders.length;
    const avg = count > 0 ? Math.round(total / count) : 0;
    const cash = filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const transfer = filteredOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);

    return { total, count, avg, cash, transfer };
  }, [filteredOrders]);

  const handleDeleteOrder = async (order: Order) => {
      if (confirm(`Xác nhận xóa đơn #${order.id.slice(-4)}? Hành động này sẽ được lưu vết.`)) {
          try {
              await db.collection('deleted_orders').add({ 
                  ...order, 
                  deletedAt: Date.now(), 
                  deletedBy: adminUser.name, 
                  deletedByRole: adminUser.role, 
                  originalId: order.id 
              });
              await db.collection('orders').doc(order.id).delete();
          } catch (e) { alert('Lỗi khi xóa đơn'); }
      }
  };

  return (
    <div className="p-4 md:p-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl"><TrendingUp className="text-orange-600" /></div>
            Báo cáo Thông minh
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button onClick={() => setQuickDate(0)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-500 whitespace-nowrap transition-all">Hôm nay</button>
            <button onClick={() => setQuickDate(1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-500 whitespace-nowrap transition-all">7 ngày</button>
            <button onClick={() => setQuickDate(30)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-500 whitespace-nowrap transition-all">Tháng này</button>
        </div>
      </div>

      {/* Main Filter Panel */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              
              {/* Search Bar */}
              <div className="md:col-span-5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Tìm kiếm thông minh</label>
                  <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        placeholder="Tên khách, SĐT, món ăn, mã đơn..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-medium"
                      />
                      {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500">
                              <X size={16} />
                          </button>
                      )}
                  </div>
              </div>

              {/* Date Range */}
              <div className="md:col-span-5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Khoảng thời gian</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 flex-1 px-3">
                          <Calendar size={14} className="text-gray-400" />
                          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
                      </div>
                      <ArrowRight size={14} className="text-gray-300" />
                      <div className="flex items-center gap-2 flex-1 px-3">
                          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
                      </div>
                  </div>
              </div>

              {/* Advance Toggle */}
              <div className="md:col-span-2">
                  <button 
                    onClick={() => setShowAdvanceFilters(!showAdvanceFilters)}
                    className={`w-full py-3 rounded-2xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${showAdvanceFilters ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                  >
                      <Filter size={16} />
                      Lọc thêm
                      <ChevronDown size={14} className={`transition-transform ${showAdvanceFilters ? 'rotate-180' : ''}`} />
                  </button>
              </div>
          </div>

          {/* Advance Filters Section */}
          {showAdvanceFilters && (
              <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                  <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block">Phương thức thanh toán</label>
                      <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100">
                          <button onClick={() => setActivePaymentTab('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activePaymentTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Tất cả</button>
                          <button onClick={() => setActivePaymentTab('cash')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activePaymentTab === 'cash' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>Tiền mặt</button>
                          <button onClick={() => setActivePaymentTab('transfer')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activePaymentTab === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>Chuyển khoản</button>
                      </div>
                  </div>

                  <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block">Nguồn đơn hàng</label>
                      <div className="flex flex-wrap gap-2">
                          {['all', 'app', 'grab', 'shopee', 'xanhsm'].map(src => (
                              <button 
                                key={src} 
                                onClick={() => setSelectedSource(src as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedSource === src ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                              >
                                  {src === 'all' ? 'Tất cả nguồn' : src === 'app' ? 'Tại quán' : src === 'xanhsm' ? 'Xanh SM' : src.toUpperCase()}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng doanh thu lọc</p>
                  <TrendingUp size={16} className="text-orange-500" />
              </div>
              <p className="text-2xl font-black text-gray-800">{stats.total.toLocaleString('vi-VN')} đ</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold">
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Tiền mặt: {stats.cash.toLocaleString()} đ</span>
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lượng đơn hàng</p>
                  <ShoppingBag size={16} className="text-blue-500" />
              </div>
              <p className="text-2xl font-black text-gray-800">{stats.count} đơn</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                  Ck: {stats.transfer.toLocaleString()} đ
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn trung bình (AOV)</p>
                  <LayoutList size={16} className="text-purple-500" />
              </div>
              <p className="text-2xl font-black text-gray-800">{stats.avg.toLocaleString('vi-VN')} đ</p>
              <p className="mt-3 text-[10px] text-gray-400 font-medium">Hiệu suất trên mỗi khách hàng</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-3xl text-white shadow-lg shadow-orange-200">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Gợi ý AI</p>
                  <CheckCircle2 size={16} className="text-white/50" />
              </div>
              <p className="text-sm font-bold leading-snug">
                  {stats.count > 10 ? 'Lượng đơn ổn định. Hãy tăng giá trị đơn bằng Topping!' : 'Lượng đơn thấp. Cần chạy thêm khuyến mãi Grab/Shopee.'}
              </p>
          </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest">Dữ liệu chi tiết ({filteredOrders.length})</h3>
            <button className="text-[10px] font-bold text-blue-600 hover:underline">Xuất file Excel</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Khách hàng & Thời gian</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Nguồn & Thanh toán</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Nội dung đơn</th>
                        <th className="px-6 py-4 text-right uppercase text-[10px] tracking-widest">Thành tiền</th>
                        <th className="px-6 py-4 text-center">Xóa</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredOrders.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-32 text-center text-gray-300 italic">
                            <div className="flex flex-col items-center gap-2">
                                <Search size={40} className="opacity-20" />
                                <span>Không tìm thấy đơn hàng nào khớp với bộ lọc.</span>
                            </div>
                        </td></tr>
                    ) : (
                        filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800 text-sm">{order.customerName || 'Khách lẻ'}</span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                                            <Calendar size={10} /> 
                                            {order.customDate || new Date(order.timestamp).toLocaleDateString('vi-VN')} - {new Date(order.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {order.customerPhone && <span className="text-[10px] font-bold text-blue-500 mt-1">{order.customerPhone}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                order.source === 'app' ? 'bg-orange-100 text-orange-700' : 
                                                order.source === 'grab' ? 'bg-green-100 text-green-700' :
                                                order.source === 'shopee' ? 'bg-orange-50 text-orange-600' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {order.source === 'app' ? 'Tại quán' : order.source}
                                            </span>
                                        </div>
                                        <span className={`flex items-center gap-1 text-[10px] font-bold ${order.paymentMethod === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                                            {order.paymentMethod === 'cash' ? <Wallet size={10}/> : <CreditCard size={10}/>}
                                            {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-[250px] space-y-0.5">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                                <span className="font-black text-gray-900">{item.quantity}x</span>
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="font-black text-gray-900 text-base">{order.total.toLocaleString('vi-VN')} đ</p>
                                    <span className="text-[9px] text-gray-400 font-medium">Mã: #{order.id.slice(-4).toUpperCase()}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleDeleteOrder(order)} 
                                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
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
