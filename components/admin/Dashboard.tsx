
import React, { useState } from 'react';
import { User, Order, Shift } from '../../types';
import { TrendingUp, Clock, Sparkles, Send, Loader2, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db } from '../../firebase';
import { doc, writeBatch, collection } from 'firebase/firestore';

interface DashboardProps {
  adminUser: User;
  users: User[];
  orders: Order[];
  shifts: Shift[]; 
}

const Dashboard: React.FC<DashboardProps> = ({ adminUser, users, orders, shifts }) => {
  const [startDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate] = useState(new Date().toLocaleDateString('en-CA'));

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleAIAnalyze = async () => {
    if (!aiQuery.trim() || !process.env.API_KEY) return;
    setIsAnalyzing(true);
    setAiResponse('');
    try {
        const simplifiedOrders = orders.slice(0, 30).map(o => ({
            id: o.id.slice(-4),
            date: new Date(o.timestamp).toLocaleDateString('vi-VN'),
            total: o.total,
            items: o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
        }));
        const contextData = { shop: "Bánh Mì Hội An", recent_orders: simplifiedOrders };
        // Create a new instance right before making an API call to ensure it uses the latest key if applicable
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Bạn là trợ lý phân tích dữ liệu POS cho cửa hàng Bánh Mì Hội An. Dữ liệu: ${JSON.stringify(contextData)} Câu hỏi: "${aiQuery}" Yêu cầu: Trả lời ngắn gọn bằng tiếng Việt. Dùng dấu gạch đầu dòng để liệt kê.`;
        
        // Use gemini-3-pro-preview for complex reasoning tasks like POS data analysis
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-pro-preview', 
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 } // Optional: provide maximum budget for deep reasoning
            }
        });
        
        // Accessing .text property directly as per latest GenAI SDK guidelines
        setAiResponse(response.text || "AI không trả về kết quả.");
    } catch (error: any) {
        console.error("AI Error:", error);
        setAiResponse(`Lỗi: ${error.message || 'Không thể kết nối AI'}`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (isDeleting) return;
    const isConfirmed = window.confirm('Xác nhận xóa đơn hàng này? Thao tác này sẽ ghi nhật ký đối soát.');
    if (isConfirmed) {
        setIsDeleting(order.id);
        try {
            const batch = writeBatch(db);
            const logRef = doc(collection(db, 'deleted_orders'));
            batch.set(logRef, {
                originalId: order.id,
                items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
                total: order.total,
                deletedAt: Date.now(),
                deletedBy: adminUser.name,
                deletedByRole: adminUser.role
            });
            batch.delete(doc(db, 'orders', order.id));
            await batch.commit();
            alert("Đã xóa thành công!");
        } catch (e: any) {
            console.error("Delete error:", e);
            alert(`Lỗi: ${e.message}`);
        } finally {
            setIsDeleting(null);
        }
    }
  };

  const ordersInDate = orders.filter(o => {
    const orderDate = new Date(o.timestamp).toLocaleDateString('en-CA');
    return orderDate >= startDate && orderDate <= endDate && o.status === 'completed';
  });

  const totalRevenue = ordersInDate.reduce((sum, o) => sum + o.total, 0);

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

  return (
    <div className="p-4 md:p-8 pb-24 animate-in fade-in">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <TrendingUp className="text-orange-500" /> Tổng quan chi tiết
      </h2>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Sparkles className="text-yellow-300" /> Trợ lý AI Báo Cáo
            </h3>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 flex items-center border border-white/20">
                <input 
                    type="text" 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIAnalyze()}
                    placeholder="Hỏi AI về doanh thu..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-indigo-300 px-4 py-2"
                />
                <button 
                    onClick={handleAIAnalyze}
                    disabled={isAnalyzing || !aiQuery.trim()}
                    className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 shadow-lg"
                >
                    {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </div>
            {aiResponse && (
                <div className="mt-4 bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in slide-in-from-top-2 text-sm">
                    {aiResponse}
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Doanh thu</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{totalRevenue.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Đơn hàng</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{ordersInDate.length} đơn</p>
        </div>
        <div className="bg-orange-500 p-6 rounded-3xl shadow-lg text-white">
          <p className="text-orange-100 text-[10px] font-bold uppercase">Bán chạy nhất</p>
          <p className="text-2xl font-black mt-1 truncate">{bestSeller?.name || '---'}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={20} /> Đơn hàng gần đây</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Thời gian</th>
                        <th className="px-6 py-4">Chi tiết</th>
                        <th className="px-6 py-4">Tổng tiền</th>
                        <th className="px-6 py-4 text-right">Xóa</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {orders.slice(0, 10).map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <p className="font-bold text-gray-800">{new Date(order.timestamp).toLocaleTimeString('vi-VN')}</p>
                                <p className="text-[10px] text-gray-400">#{order.id.slice(-4)}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-500 italic max-w-[200px] truncate">
                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </td>
                            <td className="px-6 py-4 font-black text-orange-600">{order.total.toLocaleString('vi-VN')} đ</td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order); }}
                                    disabled={isDeleting === order.id}
                                    className={`p-3 rounded-2xl transition-all ${isDeleting === order.id ? 'bg-gray-50 text-gray-300' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                                >
                                    {isDeleting === order.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={20} />}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
