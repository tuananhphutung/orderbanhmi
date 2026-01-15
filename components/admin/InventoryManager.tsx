
import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';
import { Plus, Minus, Trash2, Utensils, Save, Image as ImageIcon, Loader2, XCircle, Layers, Edit3 } from 'lucide-react';
import { uploadFileToFirebase, db } from '../../firebase';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ menuItems }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{
      name: string, price: string, stock: string, category: 'food' | 'topping', image: string, isParent: boolean, parentId: string
  }>({ name: '', price: '', stock: '', category: 'food', image: '', isParent: false, parentId: '' });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parentItems = menuItems.filter(item => item.isParent);
  const parents = menuItems.filter(i => i.isParent);
  const orphans = menuItems.filter(i => !i.isParent && !i.parentId);

  const handleAddItem = async () => {
    if (!newItem.name) return alert("Nhập tên món");
    if (!newItem.isParent && !newItem.price) return alert("Nhập giá bán");

    const finalStock = newItem.category === 'topping' ? 999999 : (newItem.parentId ? 0 : Number(newItem.stock || 0));

    const itemData: any = {
        name: newItem.name,
        price: newItem.isParent ? 0 : Number(newItem.price),
        stock: finalStock,
        category: newItem.category,
        image: newItem.image,
        isParent: newItem.isParent,
        parentId: newItem.isParent ? '' : newItem.parentId
    };

    try {
        if (editingId) {
            await db.collection('menu_items').doc(editingId).update(itemData);
            alert("Cập nhật thành công!");
        } else {
            await db.collection('menu_items').add(itemData);
            alert("Thêm món thành công!");
        }
        resetForm();
    } catch (e: any) {
        alert(`Lỗi: ${e.message}`);
    }
  };

  const resetForm = () => {
      setEditingId(null);
      setNewItem({ name: '', price: '', stock: '', category: 'food', image: '', isParent: false, parentId: '' });
  };

  const startEdit = (item: MenuItem) => {
      setEditingId(item.id);
      setNewItem({
          name: item.name,
          price: item.price.toString(),
          stock: item.stock.toString(),
          category: item.category,
          image: item.image || '',
          isParent: item.isParent || false,
          parentId: item.parentId || ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStockDirectly = async (id: string, value: string) => {
    const val = parseInt(value) || 0;
    try {
        await db.collection('menu_items').doc(id).update({ stock: val });
    } catch (e) { console.error(e); }
  };

  const deleteItem = async (item: MenuItem) => {
      if(confirm(`Xóa món "${item.name}"?`)) {
          try {
              const batch = db.batch();
              batch.delete(db.collection('menu_items').doc(item.id));
              if (item.isParent) {
                  menuItems.filter(i => i.parentId === item.id).forEach(child => {
                      batch.update(db.collection('menu_items').doc(child.id), { parentId: '' }); 
                  });
              }
              await batch.commit();
          } catch (e) { alert("Lỗi khi xóa"); }
      }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const url = await uploadFileToFirebase(file, 'banhmi_menu');
        setNewItem(prev => ({ ...prev, image: url }));
    } catch (error) { console.error(error); } 
    finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const renderItemCard = (item: MenuItem, isChild = false) => (
      <div key={item.id} className={`relative group flex gap-4 bg-white p-4 rounded-xl shadow-sm border ${isChild ? 'border-l-4 border-l-orange-200 ml-8 mt-2 bg-gray-50/50' : 'border-gray-200'}`}>
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button onClick={() => startEdit(item)} className="p-1.5 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100"><Edit3 size={16} /></button>
            <button onClick={() => deleteItem(item)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
        </div>
        
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
            {item.image ? (
                <img src={item.image} alt="" className="w-full h-full object-contain bg-white" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-orange-300">{item.isParent ? <Layers size={24}/> : <Utensils size={24} />}</div>
            )}
        </div>

        <div className="flex-1">
            <h4 className={`font-bold text-gray-800 line-clamp-1 ${item.isParent ? 'text-orange-700' : ''}`}>{item.name}</h4>
            <div className="mt-1 flex items-center justify-between">
                {!item.isParent ? <p className="text-xs font-bold text-orange-600">{item.price.toLocaleString('vi-VN')} đ</p> : <div></div>}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 uppercase font-black">Kho:</span>
                    {item.category === 'topping' ? <span className="text-xs font-bold text-purple-600">∞</span> : 
                     item.parentId ? <span className="text-[10px] text-gray-400 italic">Theo mẹ</span> :
                     <input type="number" value={item.stock} onChange={e => updateStockDirectly(item.id, e.target.value)} 
                        className="w-14 p-1 text-center text-xs font-bold bg-gray-100 border rounded outline-none focus:ring-1 focus:ring-orange-500"/>
                    }
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 pb-32">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Thực đơn & Kho</h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            {editingId ? <Edit3 className="text-blue-500" size={20}/> : <Plus className="bg-green-500 text-white rounded-full p-1" size={20} />}
            {editingId ? 'Đang chỉnh sửa món' : 'Thêm món mới'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3 flex flex-col items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <div onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-gray-50 relative overflow-hidden">
                    {isUploading ? <Loader2 size={32} className="animate-spin text-orange-500" /> : 
                     newItem.image ? <img src={newItem.image} className="w-full h-full object-contain bg-white" /> :
                     <div className="text-gray-400 flex flex-col items-center"><ImageIcon size={32} /><span className="text-xs mt-1">Chọn ảnh</span></div>}
                    {newItem.image && <button onClick={(e) => { e.stopPropagation(); setNewItem({...newItem, image: ''}) }} className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500"><XCircle size={14}/></button>}
                </div>
            </div>

            <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg flex items-center gap-3">
                    <input type="checkbox" id="isParent" checked={newItem.isParent} onChange={e => setNewItem({...newItem, isParent: e.target.checked, parentId: '', stock: e.target.checked ? newItem.stock : '0'})} className="w-5 h-5 accent-blue-600"/>
                    <label htmlFor="isParent" className="text-sm font-bold text-blue-800">Đây là Món Mẹ (Nhóm vỏ bánh)</label>
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Tên món</label>
                    {/* Fix: changed setNewStaff to setNewItem */}
                    <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                {!newItem.isParent && (
                    <>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Thuộc nhóm (Món mẹ)</label>
                            <select className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none" value={newItem.parentId} onChange={e => setNewItem({...newItem, parentId: e.target.value})}>
                                <option value="">-- Món lẻ --</option>
                                {parentItems.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase">Giá bán</label>
                            <input type="number" className="w-full p-2.5 border rounded-lg text-sm outline-none" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                        </div>
                    </>
                )}
                {(!newItem.parentId || newItem.isParent) && (
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase">Số lượng kho</label>
                        <input type="number" className="w-full p-2.5 border rounded-lg text-sm outline-none" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} disabled={newItem.category === 'topping'} />
                    </div>
                )}
                <div className="md:col-span-2 flex gap-3">
                    <button onClick={handleAddItem} disabled={isUploading} className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-black active:scale-95 transition-all">
                        {editingId ? 'Cập nhật món' : 'Lưu món mới'}
                    </button>
                    {editingId && <button onClick={resetForm} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">Hủy</button>}
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        {parents.map(parent => {
            const children = menuItems.filter(i => i.parentId === parent.id);
            return (
                <div key={parent.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {renderItemCard(parent)}
                    <div className="mt-2 pl-6 space-y-2 border-l-2 border-gray-200 ml-6">
                        {children.map(child => renderItemCard(child, true))}
                    </div>
                </div>
            );
        })}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orphans.map(item => renderItemCard(item))}
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
