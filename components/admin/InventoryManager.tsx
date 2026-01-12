
import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';
import { Plus, Minus, Trash2, Utensils, Save, Image as ImageIcon, Loader2, XCircle, Video, Infinity, FolderPlus, CornerDownRight, Layers } from 'lucide-react';
import { uploadFileToFirebase, db } from '../../firebase';
import { addDoc, collection, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ menuItems }) => {
  const [newItem, setNewItem] = useState<{
      name: string, 
      price: string, 
      stock: string, 
      category: 'food' | 'topping', 
      image: string,
      isParent: boolean,
      parentId: string
  }>({
    name: '', price: '', stock: '', category: 'food', image: '', isParent: false, parentId: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy danh sách các món mẹ để hiển thị trong dropdown
  const parentItems = menuItems.filter(item => item.isParent);

  // Phân nhóm món ăn để hiển thị
  const groupedItems = () => {
      const parents = menuItems.filter(i => i.isParent);
      const orphans = menuItems.filter(i => !i.isParent && !i.parentId); // Món lẻ không thuộc nhóm nào
      return { parents, orphans };
  };

  const { parents, orphans } = groupedItems();

  const handleAddItem = async () => {
    // Validate
    if (!newItem.name) return alert("Vui lòng nhập tên món");
    
    // Nếu là món con hoặc món lẻ, cần có giá. Món mẹ có thể không cần giá (hoặc giá đại diện 0)
    if (!newItem.isParent && !newItem.price) return alert("Vui lòng nhập giá bán");

    const itemData: any = {
        name: newItem.name,
        price: newItem.isParent ? 0 : Number(newItem.price),
        stock: newItem.category === 'topping' ? 999999 : (newItem.isParent ? 0 : Number(newItem.stock || 0)),
        category: newItem.category,
        image: newItem.image,
        isParent: newItem.isParent,
    };

    if (!newItem.isParent && newItem.parentId) {
        itemData.parentId = newItem.parentId;
    }

    try {
        const docRef = await addDoc(collection(db, 'menu_items'), itemData);
        alert(`Thêm ${newItem.isParent ? 'Món Mẹ' : 'Món'} thành công!`);
        setNewItem({ name: '', price: '', stock: '', category: 'food', image: '', isParent: false, parentId: '' });
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

  const deleteItem = async (item: MenuItem) => {
      const isParent = item.isParent;
      const message = isParent 
        ? `Xóa nhóm "${item.name}"? Các món con bên trong sẽ trở thành món lẻ.` 
        : `Xóa món "${item.name}" khỏi thực đơn?`;

      if(confirm(message)) {
          try {
              const batch = writeBatch(db);
              
              // Xóa món hiện tại
              batch.delete(doc(db, 'menu_items', item.id));

              // Nếu là Món Mẹ, tìm các con và set parentId = null (thành món lẻ)
              if (isParent) {
                  const children = menuItems.filter(i => i.parentId === item.id);
                  children.forEach(child => {
                      const childRef = doc(db, 'menu_items', child.id);
                      // Dùng update để xóa field parentId (hoặc set null/empty string)
                      batch.update(childRef, { parentId: '' }); 
                  });
              }

              await batch.commit();
          } catch (e) {
              console.error("Error deleting item", e);
              alert("Lỗi khi xóa");
          }
      }
  }

  // Xử lý khi chọn file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Vui lòng chỉ chọn file ảnh hoặc video!');
        return;
    }

    const isVideoFile = file.type.startsWith('video/');
    const maxSize = isVideoFile ? 50 * 1024 * 1024 : 5 * 1024 * 1024; 
    
    if (file.size > maxSize) {
        alert(`File quá nặng!`);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
        return;
    }

    setIsUploading(true);
    try {
        const url = await uploadFileToFirebase(file, 'banhmi_menu');
        setNewItem(prev => ({ ...prev, image: url }));
    } catch (error) {
        console.error(error);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const isVideo = (url: string) => {
      return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
  };

  const renderItemCard = (item: MenuItem, isChild = false) => (
      <div key={item.id} className={`relative group flex gap-4 bg-white p-4 rounded-xl shadow-sm border ${isChild ? 'border-l-4 border-l-orange-200 ml-8 mt-2 bg-gray-50/50' : 'border-gray-200'}`}>
        <button onClick={() => deleteItem(item)} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Trash2 size={18} />
        </button>
        
        {/* Ảnh */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 relative">
            {item.image ? (
                    isVideo(item.image) ? (
                    <video src={item.image} className="w-full h-full object-cover" muted />
                    ) : (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )
            ) : (
                <div className="w-full h-full flex items-center justify-center text-orange-300">
                    {item.isParent ? <FolderPlus size={24} /> : <Utensils size={24} />}
                </div>
            )}
        </div>

        <div className="flex-1">
            <div className="flex items-center gap-2">
                <h4 className={`font-bold text-gray-800 line-clamp-1 flex-1 ${item.isParent ? 'text-lg text-orange-700' : ''}`} title={item.name}>
                    {item.name}
                </h4>
                {item.category === 'topping' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">TOPPING</span>}
                {item.isParent && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold border border-orange-200">MÓN MẸ</span>}
            </div>
            
            {!item.isParent && (
                <>
                <p className="text-sm font-semibold text-orange-600">{item.price.toLocaleString('vi-VN')} đ</p>
                <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Kho:</span>
                    {item.category === 'topping' ? (
                        <div className="flex items-center gap-2 text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-lg text-xs">
                            <Infinity size={14} /> Vô hạn
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateStock(item.id, item.stock - 1)} className="w-5 h-5 flex items-center justify-center bg-gray-50 border rounded hover:bg-gray-100"><Minus size={10}/></button>
                            <span className={`text-sm font-bold w-6 text-center ${item.stock < 5 ? 'text-red-500' : 'text-gray-800'}`}>{item.stock}</span>
                            <button onClick={() => updateStock(item.id, item.stock + 1)} className="w-5 h-5 flex items-center justify-center bg-gray-50 border rounded hover:bg-gray-100"><Plus size={10}/></button>
                        </div>
                    )}
                </div>
                </>
            )}
            {item.isParent && (
                <p className="text-xs text-gray-500 mt-1 italic">Nhóm món ăn (Container)</p>
            )}
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản lý kho & Thực đơn</h2>

      {/* Add Item Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="bg-green-500 text-white rounded-full p-1" size={20} /> Thêm mới
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Cột 1: Upload Ảnh */}
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
                        </div>
                    ) : newItem.image ? (
                        <>
                            {isVideo(newItem.image) ? (
                                <video src={newItem.image} className="w-full h-full object-cover" autoPlay muted loop />
                            ) : (
                                <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 shadow-sm hover:bg-red-50 z-10" onClick={(e) => { e.stopPropagation(); setNewItem({...newItem, image: ''}) }}>
                                <XCircle size={16} />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-gray-400 p-2 text-center">
                            <ImageIcon size={32} className="mb-2" />
                            <span className="text-xs font-medium">Chọn Ảnh/Video</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Cột 2: Form nhập liệu */}
            <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Switch Parent Mode */}
                <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="isParent"
                        checked={newItem.isParent}
                        onChange={e => {
                            const val = e.target.checked;
                            setNewItem(prev => ({ 
                                ...prev, 
                                isParent: val, 
                                parentId: val ? '' : prev.parentId, // Nếu là parent thì không có cha
                                stock: val ? '' : prev.stock, 
                                price: val ? '' : prev.price
                            }));
                        }}
                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                    <label htmlFor="isParent" className="cursor-pointer select-none">
                        <span className="font-bold text-blue-800 block">Tạo Món Mẹ (Nhóm món)</span>
                        <span className="text-xs text-blue-600">Ví dụ: "Bánh Mì" (chứa các loại nhân bên trong)</span>
                    </label>
                </div>

                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Tên hiển thị</label>
                    <input 
                        type="text" 
                        className="w-full p-2.5 border border-gray-200 rounded-lg mt-1 focus:ring-2 focus:ring-orange-500 outline-none" 
                        value={newItem.name} 
                        onChange={e => setNewItem({...newItem, name: e.target.value})} 
                        placeholder={newItem.isParent ? "Ví dụ: Bánh Mì Truyền Thống" : "Ví dụ: Bánh Mì Trứng"}
                    />
                </div>

                {!newItem.isParent && (
                    <>
                         <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Thuộc Món Mẹ nào?</label>
                            <div className="relative">
                                <Layers className="absolute left-3 top-3 text-gray-400" size={16} />
                                <select 
                                    className="w-full pl-9 p-2.5 border border-gray-200 rounded-lg mt-1 bg-white outline-none focus:ring-2 focus:ring-orange-500"
                                    value={newItem.parentId}
                                    onChange={e => setNewItem({...newItem, parentId: e.target.value})}
                                >
                                    <option value="">-- Là món lẻ (Không thuộc nhóm nào) --</option>
                                    {parentItems.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Phân loại</label>
                            <select 
                                className="w-full p-2.5 border border-gray-200 rounded-lg mt-1 bg-white outline-none"
                                value={newItem.category}
                                onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                            >
                                <option value="food">Đồ ăn</option>
                                <option value="topping">Topping</option>
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
                                className={`w-full p-2.5 border border-gray-200 rounded-lg mt-1 outline-none ${newItem.category === 'topping' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-orange-500'}`}
                                value={newItem.category === 'topping' ? '' : newItem.stock} 
                                onChange={e => setNewItem({...newItem, stock: e.target.value})} 
                                disabled={newItem.category === 'topping'}
                                placeholder={newItem.category === 'topping' ? 'Vô hạn' : '50'}
                            />
                        </div>
                    </>
                )}

                <div className="md:col-span-2 flex items-end mt-2">
                    <button 
                        onClick={handleAddItem} 
                        disabled={isUploading}
                        className={`w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black active:scale-95'}`}
                    >
                        <Save size={18} /> {newItem.isParent ? 'Lưu Món Mẹ' : 'Lưu Món'}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-8">
        
        {/* Render Parents and their Children */}
        {parents.length > 0 && (
            <div className="space-y-6">
                <h3 className="font-bold text-gray-600 uppercase text-sm border-b pb-2">Danh sách theo Nhóm món</h3>
                {parents.map(parent => {
                    const children = menuItems.filter(i => i.parentId === parent.id);
                    return (
                        <div key={parent.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                            {/* Parent Card */}
                            {renderItemCard(parent)}
                            
                            {/* Children List */}
                            <div className="mt-2 pl-4 md:pl-8 space-y-2 border-l-2 border-gray-200 ml-4 md:ml-8">
                                {children.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-400 italic flex items-center gap-2">
                                        <CornerDownRight size={16}/> Chưa có món con nào. Hãy thêm món và chọn thuộc nhóm "{parent.name}".
                                    </div>
                                ) : (
                                    children.map(child => renderItemCard(child, true))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Render Orphans */}
        {orphans.length > 0 && (
             <div className="space-y-4">
                <h3 className="font-bold text-gray-600 uppercase text-sm border-b pb-2 mt-8">Món lẻ (Không thuộc nhóm)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orphans.map(item => renderItemCard(item))}
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManager;
