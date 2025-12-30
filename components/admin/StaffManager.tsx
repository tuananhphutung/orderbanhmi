import React, { useState } from 'react';
import { User } from '../../types';
import { UserPlus, Lock, Unlock, Trash2, Check, X } from 'lucide-react';
import { db } from '../../firebase';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface StaffManagerProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const StaffManager: React.FC<StaffManagerProps> = ({ users }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', password: '' });

  const activeStaff = users.filter(u => u.role === 'staff' && u.status === 'active');
  const pendingStaff = users.filter(u => u.role === 'staff' && u.status === 'pending');
  const lockedStaff = users.filter(u => u.role === 'staff' && u.status === 'locked');

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone || !newStaff.password) return alert('Điền đủ thông tin');
    
    // Check duplicate
    if (users.some(u => u.username === newStaff.phone)) {
        return alert("Số điện thoại này đã tồn tại!");
    }

    try {
        const docRef = await addDoc(collection(db, 'users'), {
            name: newStaff.name,
            username: newStaff.phone,
            password: newStaff.password,
            role: 'staff',
            status: 'active',
            phone: newStaff.phone,
            isOnline: false
        });
        alert(`Đã thêm nhân viên thành công! \nID: ${docRef.id} \nHãy kiểm tra Firestore.`);
        setIsAdding(false);
        setNewStaff({ name: '', phone: '', password: '' });
    } catch (e: any) {
        console.error("Error adding staff", e);
        alert(`Lỗi khi thêm nhân viên: ${e.message}`);
    }
  };

  const updateUserStatus = async (id: string, status: 'active' | 'locked' | 'delete') => {
    try {
        if (status === 'delete') {
            if (confirm('Xóa nhân viên này?')) {
                await deleteDoc(doc(db, 'users', id));
            }
        } else {
            await updateDoc(doc(db, 'users', id), { status: status });
        }
    } catch (e) {
        console.error("Error updating status", e);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-20">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">Tổng nhân viên</p>
                <p className="text-2xl font-bold text-gray-800">{activeStaff.length + lockedStaff.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-600"><UserPlus size={24}/></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">Đang Online</p>
                <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'staff' && u.isOnline).length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-600"><Check size={24}/></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">Chờ duyệt</p>
                <p className="text-2xl font-bold text-orange-600">{pendingStaff.length}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-full text-orange-600"><Lock size={24}/></div>
         </div>
      </div>

      {/* Pending List */}
      {pendingStaff.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Yêu cầu tham gia mới
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {pendingStaff.map(u => (
                    <div key={u.id} className="p-4 border-b last:border-0 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <p className="font-bold text-gray-800">{u.name}</p>
                            <p className="text-sm text-gray-500">SĐT: {u.phone || u.username}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => updateUserStatus(u.id, 'active')} className="flex-1 md:flex-none bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600">Duyệt</button>
                            <button onClick={() => updateUserStatus(u.id, 'delete')} className="flex-1 md:flex-none bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200">Từ chối</button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* Staff List & Add */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h3 className="text-lg font-bold text-gray-800">Danh sách nhân viên</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="w-full md:w-auto bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2">
            <UserPlus size={18} /> Thêm nhân viên
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 animate-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Họ tên" className="p-2 border rounded" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                <input type="text" placeholder="Số điện thoại (Login ID)" className="p-2 border rounded" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
                <input type="text" placeholder="Mật khẩu" className="p-2 border rounded" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
            </div>
            <button onClick={handleAddStaff} className="mt-4 bg-orange-500 text-white px-4 py-2 rounded font-bold w-full md:w-auto">Lưu nhân viên</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                    <tr>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4">Tên</th>
                        <th className="px-6 py-4">SĐT / Username</th>
                        <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[...activeStaff, ...lockedStaff].map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {u.isOnline ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online</span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Offline</span>
                                    )}
                                    {u.status === 'locked' && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Đã khóa</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                            <td className="px-6 py-4 text-gray-500">{u.username}</td>
                            <td className="px-6 py-4 flex justify-end gap-2">
                                {u.status === 'active' ? (
                                    <button onClick={() => updateUserStatus(u.id, 'locked')} title="Khóa" className="p-2 text-orange-500 hover:bg-orange-50 rounded"><Lock size={18} /></button>
                                ) : (
                                    <button onClick={() => updateUserStatus(u.id, 'active')} title="Mở khóa" className="p-2 text-green-500 hover:bg-green-50 rounded"><Unlock size={18} /></button>
                                )}
                                <button onClick={() => updateUserStatus(u.id, 'delete')} title="Xóa" className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
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

export default StaffManager;