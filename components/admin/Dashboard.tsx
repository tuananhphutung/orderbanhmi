
import React, { useState } from 'react';
import { User, Order, Shift } from '../../types';
import { DollarSign, ShoppingBag, Calendar, Trophy, Utensils, UserCheck, TrendingUp, ArrowRight, Sparkles, Send, Loader2, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  users: User[];
  orders: Order[];
  shifts: Shift[]; 
}

const Dashboard: React.FC<DashboardProps> = ({ users, orders, shifts }) => {
  // State cho khoảng thời gian, mặc định là ngày hiện tại
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));

  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- LOGIC AI ANALYSIS ---
  const handleAIAnalyze = async () => {
    if (!aiQuery.trim()) return;
    setIsAnalyzing(true);
    setAiResponse('');

    try {
        // 1. Chuẩn bị dữ liệu tinh gọn để gửi cho AI (Tránh quá tải token)
        const simplifiedOrders = orders.map(o => ({
            id: o.id.slice(-4), // Chỉ lấy 4 số cuối
            date: new Date(o.timestamp).toLocaleDateString('vi-VN'),
            time: new Date(o.timestamp).toLocaleTimeString('vi-VN'),
            total: o.total,
            method: o.paymentMethod,
            source: o.source,
            staff: users.find(u => u.id === o.staffId)?.name || 'Unknown',
            items: o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
        }));

        const simplifiedStaff = users.filter(u => u.role === 'staff').map(u => ({
            name: u.name,
            status: u.status
        }));

        const contextData = {
            summary: "Đây là dữ liệu bán hàng của tiệm Bánh Mì Hội An.",
            staff_list: simplifiedStaff,
            orders_data: simplifiedOrders,
            shifts_data: shifts.map(s => ({ date: s.date, shift: `${s.startTime}-${s.endTime}`, staff_count: s.staffIds.length }))
        };

        // 2. Gọi Google Gemini API
        // Lưu ý: Trong thực tế nên để API Key trong biến môi trường server-side để bảo mật.
        const ai = new GoogleGenAI({ apiKey: "AIzaSyAwBwbyD7-0bVa2c8FHveDk_6FgdxLxpGk" });
        
        const prompt = `
            Bạn là một chuyên gia phân tích dữ liệu POS cho cửa hàng Bánh Mì Hội An.
            
            Dữ liệu hiện tại (JSON):
            ${JSON.stringify(contextData)}

            Câu hỏi của Admin: "${aiQuery}"

            Yêu cầu:
            1. Trả lời ngắn gọn, súc tích bằng tiếng Việt.
            2. Nếu câu hỏi về doanh thu, hãy tính toán chính xác từ dữ liệu JSON cung cấp.
            3. Có thể dùng định dạng Markdown (in đậm, gạch đầu dòng) để trình bày đẹp.
            4. Đưa ra nhận xét hoặc gợi ý nếu thấy xu hướng bất thường (nếu có dữ liệu).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setAiResponse(response.text || "Không thể phân tích dữ liệu lúc này.");

    } catch (error: any) {
        console.error("AI Error:", error);
        setAiResponse(`Lỗi khi phân tích: ${error.message}`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- EXISTING DASHBOARD LOGIC ---

  // 1. Filter orders for selected date range
  const ordersInDate = orders.filter(o => {
    const orderDate = new Date(o.timestamp).toLocaleDateString('en-CA');
    return orderDate >= startDate && orderDate <= endDate && o.status === 'completed';
  });

  const totalRevenue = ordersInDate.reduce((sum, o) => sum + o.total, 0);

  // 2. Aggregate Item Stats (Product Breakdown)
  const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  ordersInDate.forEach(order => {
      order.items.forEach(item => {
          const key = item.id; 
          if (!itemStats[key]) {
              itemStats[key] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemStats[key].quantity += item.quantity;
          itemStats[key].revenue += item.quantity * item.price;
      });
  });

  const sortedItems = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity);
  const bestSeller = sortedItems.length > 0 ? sortedItems[0] : null;

  // 3. Aggregate Staff Performance
  const shiftsInPeriod = shifts.filter(s => s.date >= startDate && s.date <= endDate);
  const scheduledStaffIds = new Set<string>();
  shiftsInPeriod.forEach(s => s.staffIds.forEach(id => scheduledStaffIds.add(id)));

  const staffPerformance = users
    .filter(u => u.role === 'staff')
    .map(user => {
        const userOrders = ordersInDate.filter(o => o.staffId === user.id);
        const revenue = userOrders.reduce((sum, o) => sum + o.total, 0);
        const orderCount = userOrders.length;
        const isScheduled = scheduledStaffIds.has(user.id);

        if (revenue === 0 && !isScheduled) return null;

        return {
            id: user.id,
            name: user.name,
            orderCount,
            revenue,
            isScheduled
        };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.revenue - a.revenue); 

  return (
    <div className="p-4 md:p-8 pb-20 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-orange-500" /> Tổng quan chi tiết
        </h2>
      </div>

      {/* --- AI ASSISTANT SECTION --- */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Sparkles className="text-yellow-300" /> Trợ lý AI Báo Cáo
            </h3>
            <p className="text-indigo-100 text-sm mb-4">
                Hỏi bất kỳ điều gì về doanh thu, hiệu suất nhân viên hoặc xu hướng bán hàng. AI sẽ phân tích toàn bộ dữ liệu lịch sử.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex items-center border border-white/20">
                <div className="pl-3">
                    <MessageSquare size={20} className="text-indigo-200" />
                </div>
                <input 
                    type="text" 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIAnalyze()}
                    placeholder="Ví dụ: Doanh thu tháng này so với tháng trước? Món nào bán chạy nhất vào buổi sáng?"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-indigo-300 px-3 py-2"
                />
                <button 
                    onClick={handleAIAnalyze}
                    disabled={isAnalyzing || !aiQuery.trim()}
                    className={`p-2 rounded-lg transition-all ${isAnalyzing ? 'bg-indigo-500 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                >
                    {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </div>

            {aiResponse && (
                <div className="mt-4 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 animate-in fade-in slide-in-from-top-2">
                    <div className="prose prose-invert prose-sm max-w-none text-indigo-50 whitespace-pre-line">
                        {aiResponse}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
             <Calendar size={20} />
             <span className="font-bold whitespace-nowrap">Bộ lọc báo cáo:</span>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1">
                <span className="text-xs text-gray-500 font-semibold block mb-1 ml-1">Từ ngày</span>
                <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-800"
                />
            </div>
            
            <div className="pt-5 text-gray-400">
                <ArrowRight size={20} />
            </div>

            <div className="flex-1">
                <span className="text-xs text-gray-500 font-semibold block mb-1 ml-1">Đến ngày</span>
                <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-800"
                />
            </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <p className="text-gray-500 text-sm font-medium uppercase relative z-10">Doanh thu</p>
          <div className="flex items-center gap-3 mt-2 relative z-10">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <DollarSign size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <p className="text-gray-500 text-sm font-medium uppercase relative z-10">Tổng đơn hàng</p>
          <div className="flex items-center gap-3 mt-2 relative z-10">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ShoppingBag size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{ordersInDate.length} đơn</p>
          </div>
        </div>

        {/* Best Seller Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-5 rounded-2xl shadow-md text-white relative overflow-hidden">
           <div className="absolute -right-6 -bottom-6 text-white/10 rotate-12">
               <Trophy size={120} />
           </div>
           <p className="text-orange-100 text-sm font-bold uppercase mb-1">Món bán chạy nhất</p>
           {bestSeller ? (
               <div className="relative z-10">
                   <h3 className="text-2xl font-bold truncate pr-8">{bestSeller.name}</h3>
                   <div className="flex items-center gap-4 mt-2">
                       <span className="bg-white/20 px-2 py-1 rounded text-sm backdrop-blur-sm">
                           Đã bán: <strong>{bestSeller.quantity}</strong>
                       </span>
                       <span className="text-sm opacity-90">
                           Thu: {(bestSeller.revenue).toLocaleString('vi-VN')} đ
                       </span>
                   </div>
               </div>
           ) : (
               <p className="text-xl font-medium opacity-80 mt-2">Chưa có dữ liệu</p>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section: Menu Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Utensils size={20} className="text-orange-500" /> Chi tiết món bán ra
                </h3>
                <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    {sortedItems.length} món
                </span>
             </div>
             
             <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 sticky top-0">
                        <tr>
                            <th className="px-5 py-3">Tên món</th>
                            <th className="px-5 py-3 text-center">Số lượng</th>
                            <th className="px-5 py-3 text-right">Tổng thu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedItems.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">Chưa bán được món nào</td>
                            </tr>
                        ) : (
                            sortedItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            {idx === 0 && <Trophy size={14} className="text-yellow-500" />}
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold">
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-medium text-green-600">
                                        {item.revenue.toLocaleString('vi-VN')} đ
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
          </div>

          {/* Section: Staff Performance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <UserCheck size={20} className="text-blue-500" /> Nhân viên trực & Doanh số
                </h3>
             </div>
             
             <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 sticky top-0">
                        <tr>
                            <th className="px-5 py-3">Nhân viên</th>
                            <th className="px-5 py-3 text-center">Trạng thái</th>
                            <th className="px-5 py-3 text-right">Doanh số</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staffPerformance.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">Không có nhân viên trực hoặc bán hàng</td>
                            </tr>
                        ) : (
                            staffPerformance.map((stat) => (
                                <tr key={stat.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3">
                                        <p className="font-bold text-gray-800">{stat.name}</p>
                                        <p className="text-xs text-gray-400">{stat.orderCount} đơn hàng</p>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        {stat.isScheduled ? (
                                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                                                Có lịch trực
                                            </span>
                                        ) : (
                                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                                                Ngoài ca
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-green-600 text-base">
                                        {stat.revenue.toLocaleString('vi-VN')} đ
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;
