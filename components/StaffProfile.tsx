import React, { useState } from 'react';
import { User, CheckInRecord } from '../types';
import { MapPin, Clock, Calendar, User as UserIcon, ShieldCheck, MapPinned } from 'lucide-react';

interface StaffProfileProps {
  user: User;
  onCheckIn: (lat: number, lng: number) => void;
  checkInHistory: CheckInRecord[];
}

const StaffProfile: React.FC<StaffProfileProps> = ({ user, onCheckIn, checkInHistory }) => {
  const [checkingIn, setCheckingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckInClick = () => {
    setCheckingIn(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
      setErrorMsg('Trình duyệt không hỗ trợ định vị.');
      setCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onCheckIn(position.coords.latitude, position.coords.longitude);
        setCheckingIn(false);
      },
      (error) => {
        console.error(error);
        if (error.code === error.PERMISSION_DENIED) {
            setErrorMsg('Bạn cần cấp quyền truy cập vị trí để Check-in.');
        } else {
            setErrorMsg('Không thể lấy vị trí. Vui lòng thử lại.');
        }
        setCheckingIn(false);
      }
    );
  };

  const hasCheckedInToday = checkInHistory.some(c => {
    const d = new Date(c.timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  });

  const currentDateStr = new Date().toLocaleDateString('vi-VN');

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-3xl p-8 text-white shadow-lg mb-8 flex items-center gap-6">
        <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
          <UserIcon size={48} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{user.name}</h2>
          <div className="flex items-center gap-2 mt-2 text-orange-100">
            <ShieldCheck size={18} />
            <span className="uppercase tracking-wider text-sm font-semibold">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Schedule Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="text-orange-500" />
            Lịch làm việc
          </h3>
          
          <div className="space-y-4">
             <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-blue-600 font-medium">Hôm nay</span>
              <span className="font-bold text-blue-800 text-lg">{currentDateStr}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-500">Ca làm việc</span>
              <span className="font-semibold text-gray-800">{user.shiftStart} - {user.shiftEnd}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-500">Ngày trực</span>
              <div className="flex gap-2 flex-wrap justify-end">
                {user.shiftDays?.map(day => (
                  <span key={day} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <MapPin className="text-orange-500" />
            Khu vực Check-in
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center mb-6">
            {!hasCheckedInToday ? (
              <>
                 <button
                  onClick={handleCheckInClick}
                  disabled={checkingIn}
                  className="group relative flex items-center justify-center w-40 h-40 bg-orange-50 rounded-full border-4 border-orange-100 transition-all hover:scale-105 active:scale-95 hover:border-orange-200"
                >
                  <div className={`absolute inset-0 rounded-full bg-orange-500 opacity-20 ${checkingIn ? 'animate-ping' : ''}`}></div>
                  <div className="z-10 flex flex-col items-center text-orange-600">
                    <MapPinned size={40} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                    <span className="font-bold">CHECK IN</span>
                  </div>
                </button>
                <p className="mt-6 text-center text-sm text-gray-500">
                  Nhấn vào nút để điểm danh.<br/>Hệ thống sẽ lưu vị trí của bạn.
                </p>
                {errorMsg && <p className="mt-2 text-red-500 text-sm font-medium">{errorMsg}</p>}
              </>
            ) : (
              <div className="text-center animate-in zoom-in">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <ShieldCheck size={48} />
                </div>
                <h4 className="text-xl font-bold text-gray-800">Đã Check-in hôm nay</h4>
                <p className="text-gray-500 mt-1">Chúc bạn một ngày làm việc vui vẻ!</p>
              </div>
            )}
          </div>

          {/* Mini History */}
          <div className="border-t border-gray-100 pt-4">
             <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Lịch sử chấm công</h4>
             <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
               {checkInHistory.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có dữ liệu chấm công.</p>}
               {checkInHistory.slice().reverse().map(record => (
                 <div key={record.id} className="flex items-start gap-3 text-sm">
                   <Clock size={16} className="text-gray-400 mt-0.5" />
                   <div>
                     <p className="font-medium text-gray-800">
                       {new Date(record.timestamp).toLocaleDateString('vi-VN')} - {new Date(record.timestamp).toLocaleTimeString('vi-VN')}
                     </p>
                     <p className="text-xs text-gray-500 truncate w-48">
                       Lat: {record.latitude.toFixed(5)}, Lng: {record.longitude.toFixed(5)}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffProfile;