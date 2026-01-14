
import React, { useState, useEffect } from 'react';
import { User, Order, Shift } from '../../types';
import { TrendingUp, Clock, Sparkles, Send, Loader2, Trash2, LogOut, Key, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Kiểm tra xem đã có API Key chưa
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleAIAnalyze = async () => {
    const apiKey = (window as any).process?.env?.API_KEY;

    if (!apiKey) {
      setAiResponse("Lỗi: Chưa cấu hình API Key. Vui lòng nhấn nút 'Cấu hình AI' phía trên.");
      return;
    }

    if (!aiQuery.trim()) return;

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
        
        // Khởi tạo instance mới với Key từ môi trường
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `Bạn là trợ lý phân tích dữ liệu POS cho cửa hàng Bánh Mì Hội An. Dữ liệu: ${JSON.stringify(contextData)} Câu hỏi: "${aiQuery}" Yêu cầu: Trả lời ngắn gọn bằng tiếng Việt. Dùng dấu gạch đầu dòng để liệt kê.`;
        
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        setAiResponse(response.text || "AI không trả về kết quả.");
    } catch (error: any) {
        console.error("AI Error:", error);
        // Nếu lỗi do Key không tồn tại, yêu cầu chọn lại
        if (error.message?.includes("Requested entity was not found")) {
            setHasApiKey(false);
            setAiResponse("Lỗi: API Key không hợp lệ hoặc đã hết hạn. Vui lòng cấu hình lại.");
        } else {
            setAiResponse(`Lỗi: ${error.message || 'Không thể kết nối AI'}`);
        }
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
            const batch = db.batch();
            const logRef = db.collection('deleted_orders').doc();
            batch.set(logRef, {
                originalId: order.id,
                items: order.items.map(i => ({ name: i.name, quantity: i.quantity })),
                total: order.total,
                deletedAt: Date.now(),
                deletedBy: adminUser.name,
                deletedByRole: adminUser.role
            });
            batch.delete(db.collection('orders').doc(order.id));
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
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-orange-500" /> Tổng quan chi tiết
          </h2>
          <div className="flex gap-2">
            {!hasApiKey && (
              <button 
                onClick={handleSelectKey}
                className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                  <Key size={12} /> Cấu hình AI
              </button>
            )}
            <button 
                onClick={() => window.location.reload()} 
                className="md:hidden flex items-center gap-1 text-[10px] font-black text-red-500 uppercase bg-red-50 px-3 py-1.5 rounded-full border border-red-100"
            >
                <LogOut size={12} /> Thoát Admin
            </button>
          </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="text-yellow-300" /> Trợ lý AI (Gemini 3 Flash)
                </h3>
                {!hasApiKey && (
                    <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-indigo-200 flex items-center gap-1 hover:text-white"
                    >
                        Hướng dẫn Billing <ExternalLink size={10} />
                    </a>
                )}
            </div>

            {hasApiKey ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 flex items-center border border-white/20">
                    <input 
                        type="text" 
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAIAnalyze()}
                        placeholder="Hỏi AI: 'Hôm nay món nào bán chạy nhất?'"
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
            ) : (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-dashed border-white/30 text-center">
                    <p className="text-indigo-100 text-sm mb-4">Bạn cần chọn API Key từ dự án có bật thanh toán (Paid Project) để sử dụng AI.</p>
                    <button 
                        onClick={handleSelectKey}
                        className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 mx-auto"
                    >
                        <Key size={18} /> Chọn API Key để bắt đầu
                    </button>
                </div>
            )}

            {aiResponse && (
                <div className="mt-4 bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in slide-in-from-top-2 text-sm max-h-60 overflow-y-auto">
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
