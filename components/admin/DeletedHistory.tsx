
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { Trash2, Calendar, User, ShoppingBag } from 'lucide-react';

const DeletedHistory: React.FC = () => {
  const [deletedOrders, setDeletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using v8 onSnapshot syntax with query methods
    const unsub = db.collection('deleted_orders').orderBy('deletedAt', 'desc').onSnapshot((snapshot) => {
      setDeletedOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang tải dữ liệu...</div>;

  return (
    <div className="p-4 md:p-8 animate-in fade-in pb-24">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Trash2 className="text-red-500" /> Nhật ký xóa đơn hàng
      </h2>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-red-50/30">
            <p className="text-sm text-red-700 font-bold flex items-center gap-2">
                ⚠️ Dữ liệu dưới đây được lưu vết tự động khi có bất kỳ thao tác xóa đơn nào trên hệ thống.
            </p>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Thời gian xóa</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Người thực hiện</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Đơn hàng gốc</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest text-right">Tổng tiền</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {deletedOrders.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-300 italic">Không có lịch sử xóa đơn hàng.</td></tr>
                    ) : (
                        deletedOrders.map(order => (
                            <tr key={order.id} className="hover:bg-red-50/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        <div className="font-bold text-gray-800">{new Date(order.deletedAt).toLocaleString('vi-VN')}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-blue-500" />
                                        <div>
                                            <p className="font-bold text-blue-900">{order.deletedBy}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">{order.deletedByRole}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-2 max-w-[300px]">
                                        <ShoppingBag size={14} className="text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-700 mb-1">ID Đơn: #{order.originalId?.slice(-4)}</p>
                                            <p className="text-[10px] text-gray-500 italic">
                                                {order.items?.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="font-black text-red-600 text-base">{order.total?.toLocaleString('vi-VN')} đ</p>
                                    <p className="text-[10px] text-gray-400">{order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
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

export default DeletedHistory;
