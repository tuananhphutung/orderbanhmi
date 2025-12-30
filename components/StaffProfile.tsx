import React, { useState, useRef } from 'react';
import { User, CheckInRecord, Shift } from '../types';
import { MapPin, Clock, Calendar, User as UserIcon, ShieldCheck, MapPinned, Camera, Upload, LogOut, Loader2, Save, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, uploadFileToFirebase } from '../firebase';

interface StaffProfileProps {
  user: User;
  onCheckIn: (lat: number, lng: number, type: 'in' | 'out', imageFile?: File) => void;
  checkInHistory: CheckInRecord[];
  shifts: Shift[];
}

const StaffProfile: React.FC<StaffProfileProps> = ({ user, onCheckIn, checkInHistory, shifts }) => {
  const [checkingIn, setCheckingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [checkType, setCheckType] = useState<'in' | 'out'>('in');
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: user.name, password: user.password || '', avatar: user.avatar || '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // 1. Logic Check-in/Check-out Action
  const handleActionClick = (type: 'in' | 'out') => {
    setCheckType(type);
    setCheckingIn(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
      // Fallback immediately if no support
      openCamera();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success Geo
        onCheckIn(position.coords.latitude, position.coords.longitude, type);
        setCheckingIn(false);
      },
      (error) => {
        console.warn("Geo error, falling back to camera:", error);
        // Error Geo -> Open Camera
        openCamera();
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // 2. Camera Logic
  const openCamera = async () => {
      setShowCamera(true);
      setCheckingIn(false); // Stop the spinner
      try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
          setStream(mediaStream);
          if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
          }
      } catch (e) {
          setErrorMsg("Không thể mở camera. Vui lòng cấp quyền.");
          setShowCamera(false);
      }
  };

  const closeCamera = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setShowCamera(false);
  };

  const captureAndSubmit = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((blob) => {
                  if (blob) {
                      const file = new File([blob], `checkin_${Date.now()}.jpg`, { type: 'image/jpeg' });
                      // Submit with dummy coordinates (0,0) or last known
                      onCheckIn(0, 0, checkType, file);
                      closeCamera();
                  }
              }, 'image/jpeg', 0.8);
          }
      }
  };

  // 3. Profile Logic
  const handleSaveProfile = async () => {
      setIsSavingProfile(true);
      try {
          await updateDoc(doc(db, 'users', user.id), {
              name: editForm.name,
              password: editForm.password,
              avatar: editForm.avatar
          });
          setIsEditing(false);
          alert("Cập nhật hồ sơ thành công!");
      } catch (e) {
          alert("Lỗi cập nhật hồ sơ");
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setIsSavingProfile(true);
              const url = await uploadFileToFirebase(file, 'avatars');
              setEditForm(prev => ({ ...prev, avatar: url }));
          } catch (e) {
              alert("Lỗi upload ảnh");
          } finally {
              setIsSavingProfile(false);
          }
      }
  };

  // Determine current status
  const todayRecords = checkInHistory.filter(c => {
    const d = new Date(c.timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  }).sort((a,b) => a.timestamp - b.timestamp);

  const lastRecord = todayRecords[todayRecords.length - 1];
  const isCheckedIn = lastRecord && lastRecord.type === 'in';
  
  // Schedule
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const todayShift = shifts.find(s => s.date === todayStr && s.staffIds.includes(user.id));
  const futureShifts = shifts.filter(s => s.staffIds.includes(user.id) && s.date > todayStr).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-3xl p-6 text-white shadow-lg mb-8 relative">
        <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white text-xs font-bold">
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
        
        {isEditing ? (
            <div className="flex flex-col gap-4 animate-in fade-in">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        {editForm.avatar ? (
                            <img src={editForm.avatar} className="w-20 h-20 rounded-full object-cover border-2 border-white" />
                        ) : (
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center"><UserIcon size={32}/></div>
                        )}
                        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={16} />
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange}/>
                    </div>
                    <div className="flex-1 space-y-2">
                        <input 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50" 
                            placeholder="Tên nhân viên"
                        />
                        <input 
                            type="password"
                            value={editForm.password} 
                            onChange={e => setEditForm({...editForm, password: e.target.value})}
                            className="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50" 
                            placeholder="Mật khẩu mới"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile}
                    className="bg-white text-orange-600 font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                >
                    {isSavingProfile ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Lưu thay đổi
                </button>
            </div>
        ) : (
            <div className="flex items-center gap-6">
                <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm">
                    {user.avatar ? (
                        <img src={user.avatar} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                         <div className="w-20 h-20 flex items-center justify-center"><UserIcon size={40} className="text-white" /></div>
                    )}
                </div>
                <div>
                <h2 className="text-3xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2 mt-2 text-orange-100">
                    <ShieldCheck size={18} />
                    <span className="uppercase tracking-wider text-sm font-semibold">{user.role}</span>
                </div>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Schedule Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="text-orange-500" /> Lịch làm việc
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-blue-600 font-medium">Hôm nay</span>
              <span className="font-bold text-blue-800 text-lg">
                  {todayShift ? `${todayShift.startTime} - ${todayShift.endTime}` : 'Không có lịch'}
              </span>
            </div>
            <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Lịch sắp tới:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {futureShifts.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="font-medium">{new Date(s.date).toLocaleDateString('vi-VN')}</span>
                            <span className="text-gray-600">{s.startTime} - {s.endTime}</span>
                        </div>
                    ))}
                    {futureShifts.length === 0 && <p className="text-gray-400 text-sm italic">Chưa có lịch mới.</p>}
                </div>
            </div>
          </div>
        </div>

        {/* Check-in/Out Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <MapPin className="text-orange-500" /> Điểm danh
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center mb-6">
            {!isCheckedIn ? (
              // Show CHECK IN Button
               <button
                  onClick={() => handleActionClick('in')}
                  disabled={checkingIn}
                  className="group relative flex items-center justify-center w-40 h-40 bg-green-50 rounded-full border-4 border-green-100 transition-all hover:scale-105 active:scale-95 hover:border-green-200"
                >
                  <div className={`absolute inset-0 rounded-full bg-green-500 opacity-20 ${checkingIn ? 'animate-ping' : ''}`}></div>
                  <div className="z-10 flex flex-col items-center text-green-600">
                    <MapPinned size={40} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                    <span className="font-bold">CHECK IN</span>
                  </div>
                </button>
            ) : (
                // Show CHECK OUT Button
                 <button
                  onClick={() => handleActionClick('out')}
                  disabled={checkingIn}
                  className="group relative flex items-center justify-center w-40 h-40 bg-red-50 rounded-full border-4 border-red-100 transition-all hover:scale-105 active:scale-95 hover:border-red-200"
                >
                  <div className={`absolute inset-0 rounded-full bg-red-500 opacity-20 ${checkingIn ? 'animate-ping' : ''}`}></div>
                  <div className="z-10 flex flex-col items-center text-red-600">
                    <LogOut size={40} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                    <span className="font-bold">CHECK OUT</span>
                  </div>
                </button>
            )}
            
            <p className="mt-6 text-center text-sm text-gray-500">
                {isCheckedIn ? 'Bạn đang trong ca làm việc.' : 'Hãy check-in khi bắt đầu ca.'}
            </p>
            {errorMsg && <p className="mt-2 text-red-500 text-sm font-medium">{errorMsg}</p>}
          </div>

          <div className="border-t border-gray-100 pt-4">
             <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Lịch sử hôm nay</h4>
             <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
               {todayRecords.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có dữ liệu.</p>}
               {todayRecords.map(record => (
                 <div key={record.id} className="flex items-start gap-3 text-sm">
                   <div className={`mt-0.5 w-2 h-2 rounded-full ${record.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   <div>
                     <p className="font-bold text-gray-800">
                       {record.type === 'in' ? 'Check In' : 'Check Out'} - {new Date(record.timestamp).toLocaleTimeString('vi-VN')}
                     </p>
                     <p className="text-xs text-gray-500">
                       {record.imageUrl ? '📸 Đã chụp ảnh báo cáo' : `📍 ${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* CAMERA MODAL */}
      {showCamera && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
              <div className="relative flex-1 bg-black flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <button onClick={closeCamera} className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full">
                      <X size={32} />
                  </button>
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center pb-safe">
                      <button onClick={captureAndSubmit} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                          <div className="w-16 h-16 bg-white border-2 border-black rounded-full"></div>
                      </button>
                  </div>
                  <div className="absolute top-10 left-0 right-0 text-center px-4">
                      <p className="text-white bg-red-600/80 px-4 py-2 rounded-full inline-block font-bold shadow-lg">
                         ⚠️ Không lấy được vị trí. Vui lòng chụp ảnh tại quán!
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StaffProfile;