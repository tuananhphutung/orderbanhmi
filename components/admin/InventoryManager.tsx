import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';
import { Plus, Minus, Trash2, Utensils, Save, Image as ImageIcon, Loader2, XCircle, Video } from 'lucide-react';
import { uploadFileToFirebase, db } from '../../firebase';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ menuItems }) => {
  const [newItem, setNewItem] = useState<{name: string, price: string, stock: string, category: 'food' | 'drink', image: string}>({
    name: '', price: '', stock: '', category: 'food', image: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.stock) return alert("Vui lòng nhập tên, giá và số lượng");
    
    const itemData = {
        name: newItem.name,
        price: Number(newItem.price),
        stock: Number(newItem.stock),
        category: newItem.category,
        image: newItem.image
    };

    try {
        const docRef = await addDoc(collection(db, 'menu_items'), itemData);
        alert(`Thêm món thành công!\nID: ${docRef.id}\nKiểm tra Firestore Collection 'menu_items'`);
        setNewItem({ name: '', price: '', stock: '', category: 'food', image: '' });
    } catch (e: any) {
        console.error("Error adding document: ", e);
        alert(`Lỗi khi thêm món: ${e.message}`);
    }
  };

  const updateStock = async (id: string, newStock: number) => {
    const stock = Math.max(0, newStock);
    try {
        await updateDoc(doc(db, 'menu_items', id), { stock: stock });
    } catch (e) {
        console.error("Error updating stock", e);
    }
  };

  const deleteItem = async (id: string) => {
      if(confirm('Xóa món này khỏi thực đơn?')) {
          try {
              await deleteDoc(doc(db, 'menu_items', id));
          } catch (e) {
              console.error("Error deleting item", e);
          }
      }
  }

  // Xử lý khi chọn file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Kiểm tra định dạng
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Vui lòng chỉ chọn file ảnh hoặc video!');
        return;
    }

    // 2. Kiểm tra dung lượng (Client-side validation)
    const isVideoFile = file.type.startsWith('video/');
    const maxSize = isVideoFile ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB cho video, 5MB cho ảnh
    
    if (file.size > maxSize) {
        alert(`File quá nặng! Vui lòng chọn ${isVideoFile ? 'video dưới 50MB' : 'ảnh dưới 5MB'} để app chạy mượt.`);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        return;
    }

    setIsUploading(true);
    try {
        // Upload lên Cloudinary
        const url = await uploadFileToFirebase(file, 'banhmi_menu');
        setNewItem(prev => ({ ...prev, image: url }));
    } catch (error) {
        // Lỗi đã được alert bên trong hàm uploadFileToFirebase
        console.error(error);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input để cho phép chọn lại file cũ nếu cần
    }
  };

  const isVideo = (url: string) => {
      return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
  };

  return (
    <div className="p-8 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản lý kho & Thực đơn</h2>

      {/* Add Item Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="bg-green-500 text-white rounded-full p-1" size={20} /> Thêm món mới
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* Cột 1: Upload Ảnh/Video */}
            <div className="md:col-span-3 flex flex-col items-center">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*,video/*"
                />
                
                <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden bg-gray-50
                    ${newItem.image ? 'border-orange-500' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'}`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center text-orange-500 animate-pulse">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <span className="text-xs font-semibold">Đang tải lên...</span>
                        </div>
                    ) : newItem.image ? (
                        <>
                            {isVideo(newItem.image) ? (
                                <video src={newItem.image} className="w-full h-full object-cover" autoPlay muted loop />
                            ) : (
                                <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Đổi file</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setNewItem({...newItem, image: ''}) }}
                                className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 shadow-sm hover:bg-red-50 z-10"
                            >
                                <XCircle size={16} />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-gray-400 p-2 text-center">
                            <ImageIcon size={32} className="mb-2" />
                            <span className="text-xs font-medium">Chọn Ảnh (Max 5MB)<br/>hoặc Video (Max 50MB)</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Cột 2: Form nhập liệu */}
            <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Tên món</label>
                    <input 
                        type="text" 
                        className="w-full p-2.5 border border-gray-200 rounded-lg mt-1 focus:ring-2 focus:ring-orange-500 outline-none" 
                        value={newItem.name} 
                        onChange={e => setNewItem({...newItem, name: e.target.value})} 
                        placeholder="Ví dụ: Bánh mì đặc biệt"
                    />
                </div>
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Phân loại</label>
                     <select 
                        className="w-full p-2.5 border border-gray-200 rounded-lg mt-1 bg-white outline-none"
                        value={newItem.category}
                        onChange={e => setNewItem({...newItem, category: e.target.value as 'food' | 'drink'})}
                     >
                         <option value="food">Đồ ăn</option>
                         <option value="drink">Đồ uống</option>
                     </select>
                </div>
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Giá bán (VNĐ)</label>
                    <input 
                        type="number" 
                        className="w-full p-2.5 border border-gray-200 rounded-lg mt-1 focus:ring-2 focus:ring-orange-500 outline-none" 
                        value={newItem.price} 
                        onChange={e => setNewItem({...newItem, price: e.target.value})} 
                        placeholder="20000"
                    />
                </div>
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Kho đầu</label>
                    <input 
                        type="number" 
                        className="w-full p-2.5 border border-gray-200 rounded-lg mt-1 focus:ring-2 focus:ring-orange-500 outline-none" 
                        value={newItem.stock} 
                        onChange={e => setNewItem({...newItem, stock: e.target.value})} 
                        placeholder="50"
                    />
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={handleAddItem} 
                        disabled={isUploading}
                        className={`w-full text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}
                    >
                        <Save size={18} /> Lưu món
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative group flex gap-4">
                <button onClick={() => deleteItem(item.id)} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Trash2 size={18} />
                </button>
                
                {/* Ảnh/Video món ăn */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 relative">
                    {item.image ? (
                         isVideo(item.image) ? (
                            <>
                                <video src={item.image} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Video size={16} className="text-white" />
                                </div>
                            </>
                         ) : (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                         )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-300">
                            <Utensils size={24} />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h4 className="font-bold text-gray-800 line-clamp-1" title={item.name}>{item.name}</h4>
                    <p className="text-sm font-semibold text-orange-600">{item.price.toLocaleString('vi-VN')} đ</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Kho:</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateStock(item.id, item.stock - 1)} className="w-6 h-6 flex items-center justify-center bg-gray-50 border rounded hover:bg-gray-100"><Minus size={12}/></button>
                            <span className={`text-sm font-bold w-6 text-center ${item.stock < 5 ? 'text-red-500' : 'text-gray-800'}`}>{item.stock}</span>
                            <button onClick={() => updateStock(item.id, item.stock + 1)} className="w-6 h-6 flex items-center justify-center bg-gray-50 border rounded hover:bg-gray-100"><Plus size={12}/></button>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryManager;