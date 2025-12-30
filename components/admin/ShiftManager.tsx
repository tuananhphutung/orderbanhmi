import React, { useState } from 'react';
import { User, Shift, CheckInRecord } from '../../types';
import { CalendarClock, MapPin, CheckCircle, AlertCircle, Plus, Camera, LogOut, LogIn } from 'lucide-react';
import { db } from '../../firebase';
import { addDoc, collection } from 'firebase/firestore';

interface ShiftManagerProps {
  users: User[];
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  checkIns: CheckInRecord[];
  onNotify: (userId: string, message: string) => void;
}

const ShiftManager: React.FC<ShiftManagerProps> = ({ users, shifts, checkIns, onNotify }) => {
  const [newShift, setNewShift] = useState<{staffIds: string[], date: string, start: string, end: string}>({
    staffIds: [], date: '', start: '08:00', end: '16:00'
  });

  const staffList = users.filter(u => u.role === 'staff' && u.status === 'active');

  const handleCreateShift = async () => {
    if (newShift.staffIds.length === 0 || !newShift.date) return alert('Vui lòng chọn nhân viên và ngày');
    
    const shiftData = {
        staffIds: newShift.staffIds,
        date: newShift.date,
        startTime: newShift.start,
        endTime: newShift.end
    };

    try {
        await addDoc(collection(db, 'shifts'), shiftData);
        newShift.staffIds.forEach(uid => {
            onNotify(uid, `Bạn có lịch trực mới ngày ${newShift.date} (${newShift.start} - ${newShift.end})`);
        });

        alert('Đã tạo ca trực thành công!');
        setNewShift({ ...newShift, staffIds: [] });
    } catch (e) {
        console.error("Error creating shift", e);
        alert("Lỗi khi tạo ca trực");
    }
  };

  const toggleStaffSelection = (id: string) => {
    setNewShift(prev => {
        if (prev.staffIds.includes(id)) return { ...prev, staffIds: prev.staffIds.filter(sid => sid !== id) };
        return { ...prev, staffIds: [...prev.staffIds, id] };
    });
  };

  const getShiftForCheckIn = (checkIn: CheckInRecord) => {
      const checkInDate = new Date(checkIn.timestamp).toLocaleDateString('en-CA');
      return shifts.find(s => s.date === checkInDate && s.staffIds.includes(checkIn.staffId));
  };

  const isLate = (checkIn: CheckInRecord, shift: Shift) => {
      const time = new Date(checkIn.timestamp);
      // Logic for IN: Late if > Start Time + 15m
      // Logic for OUT: Early if < End Time - 15m
      if (checkIn.type === 'in' || !checkIn.type) {
          const [h, m] = shift.startTime.split(':').map(Number);
          const target = new Date(time);
          target.setHours(h, m, 0, 0);
          return time.getTime() > target.getTime() + 15 * 60000;
      } else {
           const [h, m] = shift.endTime.split(':').map(Number);
           const target = new Date(time);
           target.setHours(h, m, 0, 0);
           return time.getTime() < target.getTime() - 15 * 60000;
      }
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Create Shift Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="bg-orange-500 text-white rounded-full p-1" size={24} /> Giao ca trực
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày trực</label>
                    <input type="date" className="w-full p-2 border rounded-lg" value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                        <input type="time" className="w-full p-2 border rounded-lg" value={newShift.start} onChange={e => setNewShift({...newShift, start: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                        <input type="time" className="w-full p-2 border rounded-lg" value={newShift.end} onChange={e => setNewShift({...newShift, end: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chọn nhân viên ({newShift.staffIds.length})</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded-lg">
                        {staffList.map(u => (
                            <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={newShift.staffIds.includes(u.id)}
                                    onChange={() => toggleStaffSelection(u.id)}
                                    className="accent-orange-500 w-4 h-4"
                                />
                                <span className="text-sm font-medium">{u.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button onClick={handleCreateShift} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                    Xác nhận giao ca & Thông báo
                </button>
            </div>
          </div>

          {/* Check-in Monitor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarClock className="text-orange-500" /> Giám sát chấm công
            </h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {checkIns.length === 0 && <p className="text-gray-400 text-center py-4">Chưa có dữ liệu chấm công</p>}
                {[...checkIns].reverse().map(ci => {
                    const staff = users.find(u => u.id === ci.staffId);
                    const shift = getShiftForCheckIn(ci);
                    const isCheckInLate = shift ? isLate(ci, shift) : false;
                    const type = ci.type || 'in';

                    return (
                        <div key={ci.id} className="p-3 border rounded-xl flex items-start gap-3 bg-gray-50">
                             <div className={`mt-1 rounded-full p-1.5 flex-shrink-0 ${!shift ? 'bg-gray-200 text-gray-500' : isCheckInLate ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
                                {shift ? (isCheckInLate ? <AlertCircle size={16} /> : <CheckCircle size={16} />) : <MapPin size={16} />}
                             </div>
                             
                             {ci.imageUrl && (
                                 <div className="w-16 h-16 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-gray-200">
                                     <img src={ci.imageUrl} className="w-full h-full object-cover" alt="Evidence" />
                                 </div>
                             )}

                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <p className="font-bold text-gray-800 flex items-center gap-1">
                                        {staff?.name || 'Unknown'}
                                        {type === 'out' ? <LogOut size={14} className="text-red-500"/> : <LogIn size={14} className="text-green-500"/>}
                                    </p>
                                    <span className="text-xs text-gray-500">{new Date(ci.timestamp).toLocaleString('vi-VN')}</span>
                                </div>
                                
                                {shift ? (
                                    <p className={`text-xs font-semibold mt-1 ${isCheckInLate ? 'text-red-500' : 'text-green-600'}`}>
                                        {type === 'in' 
                                            ? (isCheckInLate ? `Đến muộn (Lịch: ${shift.startTime})` : `Đúng giờ (Lịch: ${shift.startTime})`)
                                            : (isCheckInLate ? `Về sớm (Lịch: ${shift.endTime})` : `Về đúng giờ (Lịch: ${shift.endTime})`)
                                        }
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-1">Ngoài lịch làm việc</p>
                                )}

                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 truncate">
                                    {ci.imageUrl ? <Camera size={10} /> : <MapPin size={10} />}
                                    {ci.imageUrl ? 'Chụp ảnh báo cáo' : `${ci.latitude.toFixed(4)}, ${ci.longitude.toFixed(4)}`}
                                </p>
                             </div>
                        </div>
                    );
                })}
            </div>
          </div>

      </div>

      {/* Shifts List */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Danh sách ca trực đã giao</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 font-semibold text-gray-700">
                    <tr>
                        <th className="p-3">Ngày</th>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Nhân viên</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[...shifts].reverse().map(s => (
                        <tr key={s.id}>
                            <td className="p-3 font-medium">{new Date(s.date).toLocaleDateString('vi-VN')}</td>
                            <td className="p-3">{s.startTime} - {s.endTime}</td>
                            <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                    {s.staffIds.map(sid => {
                                        const st = users.find(u => u.id === sid);
                                        return <span key={sid} className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs border border-orange-100">{st?.name}</span>
                                    })}
                                </div>
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

export default ShiftManager;