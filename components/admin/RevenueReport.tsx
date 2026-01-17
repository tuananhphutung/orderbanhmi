
import React, { useState, useMemo } from 'react';
import { Order, User, OrderSource } from '../../types';
import { 
    Calendar, CreditCard, Wallet, TrendingUp, Search, 
    Filter, X, ShoppingBag, User as UserIcon, 
    ArrowRight, LayoutList, ChevronDown, CheckCircle2,
    Trash2, Tag, DollarSign
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
  
  // New Intelligent Filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedItemName, setSelectedItemName] = useState<string>('all');

  // Quick Date Select
  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toLocaleDateString('en-CA'));
    setEndDate(end.toLocaleDateString('en-CA'));
  };

  // Extract unique item names from all orders for the dropdown filter
  const allItemNames = useMemo(() => {
    const names = new Set<string>();
    orders.forEach(o => o.items.forEach(i => names.add(i.name)));
    return Array.from(names).sort();
  }, [orders]);

  // Intelligent Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = o.customDate || new Date(o.timestamp).toLocaleDateString('en-CA');
      const matchesDate = orderDate >= startDate && orderDate <= endDate;
      const matchesPayment = activePaymentTab === 'all' || o.paymentMethod === activePaymentTab;
      const matchesSource = selectedSource === 'all' || o.source === selectedSource;
      
      // Revenue Range Filter
      const matchesMinPrice = minPrice === '' || o.total >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || o.total <= Number(maxPrice);
      
      // Specific Item Filter
      const matchesItemSelect = selectedItemName === 'all' || o.items.some(i => i.name === selectedItemName);

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        o.customerName?.toLowerCase().includes(searchLower) ||
        o.customerPhone?.includes(searchQuery) ||
        o.items.some(item => item.name.toLowerCase().includes(searchLower)) ||
        o.id.toLowerCase().includes(searchLower);

      return matchesDate && matchesPayment && matchesSource && matchesSearch && 
             matchesMinPrice && matchesMaxPrice && matchesItemSelect && o.status === 'completed';
    });
  }, [orders, startDate, endDate, activePaymentTab, selectedSource, searchQuery, minPrice, maxPrice, selectedItemName]);

  // Dynamic Statistics based on filtered data
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

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedItemName('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSource('all');
    setActivePaymentTab('all');
  };

  return (
    <div className="p-4 md:p-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl"><TrendingUp className="text-orange-600" /></div>
            Báo cáo Doanh thu
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button onClick={() => setQuickDate(0)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-500 whitespace-nowrap transition-all shadow-sm">Hôm nay</button>
            <button onClick={() => setQuickDate(1)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-500 whitespace-nowrap transition-all shadow-sm">7 ngày qua</button>
            <button onClick={() => setQuickDate(30)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-500 whitespace-nowrap transition-all shadow-sm">Tháng này</button>
        </div>
      </div>

      {/* Intelligent Filter Panel */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              
              {/* Search Bar */}
              <div className="md:col-span-5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Tìm kiếm đa năng</label>
                  <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        placeholder="Khách hàng, SĐT, hoặc món ăn..." 
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Lọc theo ngày</label>
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
                      Bộ lọc nâng cao
                      <ChevronDown size={14} className={`transition-transform ${showAdvanceFilters ? 'rotate-180' : ''}`} />
                  </button>
              </div>
          </div>

          {/* Advance Filters Section */}
          {showAdvanceFilters && (
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4">
                  
                  {/* Item Filter */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Lọc theo món ăn cụ thể</label>
                      <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <select 
                            value={selectedItemName} 
                            onChange={(e) => setSelectedItemName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold text-gray-700 appearance-none cursor-pointer"
                          >
                              <option value="all">--- Tất cả món ---</option>
                              {allItemNames.map(name => (
                                  <option key={name} value={name}>{name}</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  {/* Revenue Range Filter */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Khoảng giá đơn hàng (đ)</label>
                      <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                              <input 
                                type="number" 
                                placeholder="Min" 
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full pl-8 pr-2 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold"
                              />
                          </div>
                          <span className="text-gray-300">-</span>
                          <div className="relative flex-1">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                              <input 
                                type="number" 
                                placeholder="Max" 
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full pl-8 pr-2 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold"
                              />
                          </div>
                      </div>
                  </div>

                  {/* Payment & Source Filters */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Hình thức & Nguồn đơn</label>
                      <div className="flex gap-2">
                          <select 
                            value={selectedSource} 
                            onChange={(e) => setSelectedSource(e.target.value as any)}
                            className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-[10px] font-black uppercase text-gray-500"
                          >
                              <option value="all">Tất cả nguồn</option>
                              <option value="app">Tại quán</option>
                              <option value="grab">Grab</option>
                              <option value="shopee">Shopee</option>
                              <option value="xanhsm">Xanh SM</option>
                          </select>
                          <button 
                            onClick={resetFilters}
                            className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-100 transition-colors"
                          >
                              Xóa lọc
                          </button>
                      </div>
                  </div>

                  {/* Payment Mode Tabs (Internal to Filter Panel) */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block">Phân loại thanh toán</label>
                    <div className="flex p-1 bg-gray-100 rounded-2xl">
                        <button onClick={() => setActivePaymentTab('all')} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${activePaymentTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Tất cả giao dịch</button>
                        <button onClick={() => setActivePaymentTab('cash')} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${activePaymentTab === 'cash' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>
                            <div className="flex items-center justify-center gap-2"><Wallet size={14}/> Chỉ Tiền mặt</div>
                        </button>
                        <button onClick={() => setActivePaymentTab('transfer')} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${activePaymentTab === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                            <div className="flex items-center justify-center gap-2"><CreditCard size={14}/> Chỉ Chuyển khoản</div>
                        </button>
                    </div>
                  </div>
              </div>
          )}
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
              <div className="relative">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Doanh thu kết quả lọc</p>
                  <p className="text-2xl font-black text-gray-800">{stats.total.toLocaleString('vi-VN')} đ</p>
                  <div className="mt-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-green-600">
                          <span>Tiền mặt:</span>
                          <span>{stats.cash.toLocaleString()} đ</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-blue-600">
                          <span>Chuyển khoản:</span>
                          <span>{stats.transfer.toLocaleString()} đ</span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng số đơn</p>
                  <ShoppingBag size={16} className="text-blue-500" />
              </div>
              <p className="text-2xl font-black text-gray-800">{stats.count} đơn</p>
              <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${(stats.cash / (stats.total || 1)) * 100}%` }}></div>
                  <div className="h-full bg-blue-500" style={{ width: `${(stats.transfer / (stats.total || 1)) * 100}%` }}></div>
              </div>
              <p className="mt-2 text-[9px] text-gray-400 font-bold">Tỷ lệ: {Math.round((stats.cash / (stats.total || 1)) * 100)}% mặt / {Math.round((stats.transfer / (stats.total || 1)) * 100)}% ck</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trung bình/Đơn</p>
                  <LayoutList size={16} className="text-purple-500" />
              </div>
              <p className="text-2xl font-black text-gray-800">{stats.avg.toLocaleString('vi-VN')} đ</p>
              <p className="mt-4 text-[10px] text-gray-400 font-medium italic">"Mỗi khách hàng mang về khoảng {(stats.avg/1000).toFixed(1)}k"</p>
          </div>

          <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-xl">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Hiệu suất lọc</p>
                  <CheckCircle2 size={16} className="text-green-500" />
              </div>
              <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span className="text-gray-400">Nguồn: {selectedSource === 'all' ? 'Tất cả' : selectedSource.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-gray-400">Món: {selectedItemName === 'all' ? 'Tất cả' : selectedItemName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-gray-400">Thanh toán: {activePaymentTab === 'all' ? 'Tất cả' : activePaymentTab === 'cash' ? 'Tiền mặt' : 'Ck'}</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest">Danh sách giao dịch chi tiết ({filteredOrders.length})</h3>
            <div className="flex gap-2">
                <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">Xuất Excel</button>
                <button className="text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">In báo cáo</button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Thời gian & Khách</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Nguồn & Thanh toán</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Chi tiết món ăn</th>
                        <th className="px-6 py-4 text-right uppercase text-[10px] tracking-widest">Tổng tiền</th>
                        <th className="px-6 py-4 text-center">Xóa</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredOrders.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-32 text-center text-gray-300 italic">
                            <div className="flex flex-col items-center gap-3">
                                <Search size={48} className="opacity-10" />
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-400">Không tìm thấy dữ liệu phù hợp</p>
                                    <button onClick={resetFilters} className="text-xs text-blue-500 hover:underline">Xóa tất cả bộ lọc và thử lại</button>
                                </div>
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
                                    <div className="max-w-[250px] space-y-1">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className={`text-xs flex items-center gap-2 ${selectedItemName !== 'all' && item.name === selectedItemName ? 'text-orange-600 font-bold' : 'text-gray-600'}`}>
                                                <span className="bg-gray-100 text-[10px] font-black px-1.5 py-0.5 rounded">x{item.quantity}</span>
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="font-black text-gray-900 text-base">{order.total.toLocaleString('vi-VN')} đ</p>
                                    <span className="text-[9px] text-gray-400 font-medium">Mã đơn: #{order.id.slice(-4).toUpperCase()}</span>
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
