
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { Trash2, Calendar, User, ShoppingBag, CheckSquare, Square, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const DeletedHistory: React.FC = () => {
  const [deletedOrders, setDeletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // 'bulk', 'all', or specific id

  useEffect(() => {
    // Sử dụng onSnapshot để cập nhật dữ liệu thời gian thực
    const unsub = db.collection('deleted_orders').orderBy('deletedAt', 'desc').onSnapshot((snapshot) => {
      setDeletedOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Lỗi tải nhật ký:", error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === deletedOrders.length && deletedOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deletedOrders.map(o => o.id));
    }
  };

  const handleDeletePermanent = async (ids: string[], mode: 'single' | 'bulk' | 'all') => {
    const count = ids.length;
    if (count === 0) return;

    const confirmMsg = mode === 'all' 
      ? "CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN TOÀN BỘ nhật ký? Hành động này không thể hoàn tác!" 
      : `Xác nhận xóa vĩnh viễn ${count} bản ghi nhật ký đã chọn?`;

    if (!confirm(confirmMsg)) return;

    setIsDeleting(mode);
    try {
      const batch = db.batch();
      ids.forEach(id => {
        batch.delete(db.collection('deleted_orders').doc(id));
      });
      await batch.commit();
      
      if (mode !== 'single') setSelectedIds([]);
      alert(`Đã dọn dẹp thành công ${count} bản ghi nhật ký.`);
    } catch (error: any) {
      alert("Lỗi khi xóa dữ liệu: " + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8 text-gray-500">
        <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
        <p className="font-medium animate-pulse">Đang tải nhật ký xóa...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-in fade-in pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl"><Trash2 className="text-red-600" /></div>
            Nhật ký xóa đơn hàng
        </h2>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {selectedIds.length > 0 && (
                <button 
                  onClick={() => handleDeletePermanent(selectedIds, 'bulk')}
                  disabled={!!isDeleting}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isDeleting === 'bulk' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Xóa {selectedIds.length} mục đã chọn
                </button>
            )}
            <button 
                onClick={() => handleDeletePermanent(deletedOrders.map(o => o.id), 'all')}
                disabled={!!isDeleting || deletedOrders.length === 0}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-black uppercase hover:border-red-500 hover:text-red-500 transition-all disabled:opacity-50 whitespace-nowrap"
            >
                {isDeleting === 'all' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Dọn sạch tất cả
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-red-50/20 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                <p className="text-sm text-red-800 font-bold leading-tight">
                    Lưu ý: Dữ liệu xóa tại đây sẽ mất vĩnh viễn khỏi hệ thống. <br/>
                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-widest">Tính năng chỉ dành cho quản trị viên tối cao</span>
                </p>
            </div>
            {deletedOrders.length > 0 && (
                <button 
                    onClick={toggleSelectAll}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline px-2"
                >
                    {selectedIds.length === deletedOrders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả bản ghi'}
                </button>
            )}
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 w-12 text-center">
                            <button onClick={toggleSelectAll} className="text-gray-300 hover:text-orange-500 transition-colors">
                                {selectedIds.length === deletedOrders.length && deletedOrders.length > 0 ? <CheckSquare size={20} className="text-orange-500" /> : <Square size={20} />}
                            </button>
                        </th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Thời gian xóa</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Người thực hiện</th>
                        <th className="px-6 py-4 uppercase text-[10px] tracking-widest">Nội dung đã xóa</th>
                        <th className="px-6 py-4 text-right uppercase text-[10px] tracking-widest">Giá trị</th>
                        <th className="px-6 py-4 text-center">Xóa</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                    {deletedOrders.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-32 text-center text-gray-300 italic">
                             <div className="flex flex-col items-center gap-3">
                                <Trash2 size={48} className="opacity-10" />
                                <p className="font-bold">Nhật ký hiện đang trống.</p>
                             </div>
                        </td></tr>
                    ) : (
                        deletedOrders.map(order => (
                            <tr 
                                key={order.id} 
                                className={`hover:bg-red-50/10 transition-colors group ${selectedIds.includes(order.id) ? 'bg-red-50/20' : ''}`}
                                onClick={() => toggleSelect(order.id)}
                            >
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => toggleSelect(order.id)} className="text-gray-300 hover:text-orange-500 transition-colors">
                                        {selectedIds.includes(order.id) ? <CheckSquare size={20} className="text-orange-500" /> : <Square size={20} />}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-gray-800 text-sm">
                                            {new Date(order.deletedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold mt-1">
                                            {new Date(order.deletedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-800 text-xs">{order.deletedBy}</p>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">{order.deletedByRole}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 max-w-[280px]">
                                        <div className="flex items-center gap-1.5">
                                            <ShoppingBag size={12} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-500">Mã đơn: #{order.originalId?.slice(-4).toUpperCase()}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 italic leading-snug line-clamp-2">
                                            {order.items?.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="font-black text-gray-900 text-sm">{order.total?.toLocaleString('vi-VN')} đ</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                        {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => handleDeletePermanent([order.id], 'single')}
                                      disabled={isDeleting === 'all' || isDeleting === 'bulk' || isDeleting === 'single'}
                                      className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                      title="Xóa vĩnh viễn bản ghi"
                                    >
                                      {isDeleting === 'single' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={20} />}
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

export default DeletedHistory;
