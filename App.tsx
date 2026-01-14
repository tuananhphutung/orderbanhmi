
import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PaymentModal from './components/PaymentModal';
import InstallPrompt from './components/InstallPrompt';
import AdminLayout from './components/admin/AdminLayout';
import Toast from './components/Toast';
import { LoginFormData, User, Order, CartItem, CheckInRecord, MenuItem, OrderSource, Shift, Notification } from './types';
import { Loader2, Wifi, WifiOff, AlertTriangle, X } from 'lucide-react';
import { db, uploadFileToFirebase } from './firebase';

const App: React.FC = () => {
  // Global State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Local State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrderItems, setPendingOrderItems] = useState<CartItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingOrderInfo, setPendingOrderInfo] = useState<{source: OrderSource, name: string, phone: string} | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(true); 
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'permission-denied'>('connecting');
  const [showConnectionStatus, setShowConnectionStatus] = useState(true);

  // Toast & Sound
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info' | 'order'} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  };

  useEffect(() => {
    const checkAndCreateAdmin = async () => {
        try {
            // Using v8 query syntax
            const q = db.collection('users').where('username', '==', 'admin');
            const querySnapshot = await q.get();
            if (querySnapshot.empty) {
                await db.collection('users').add({
                    name: 'Administrator',
                    username: 'admin',
                    password: '123456',
                    role: 'admin',
                    status: 'active',
                    isOnline: false
                });
            }
        } catch (error: any) {
            if (error.code === 'permission-denied') setConnectionStatus('permission-denied');
        }
    };

    const heartbeat = async () => {
        try {
            // Using v8 doc/set syntax
            const statusRef = db.collection('_system').doc('connection_status');
            await statusRef.set({
                timestamp: new Date().toISOString(),
                status: 'ONLINE',
                last_updated: Date.now()
            }, { merge: true });
        } catch (e: any) {
            if (e.code === 'permission-denied') setConnectionStatus('permission-denied');
        }
    };

    checkAndCreateAdmin();
    const interval = setInterval(heartbeat, 15000);
    heartbeat();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleError = (error: any) => {
        if (error.code === 'permission-denied') setConnectionStatus('permission-denied');
        else setConnectionStatus('error');
        setIsLoggingIn(false);
    };

    // Using v8 onSnapshot syntax
    const unsubUsers = db.collection('users').onSnapshot((snapshot) => {
        setConnectionStatus('connected');
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(items);
        
        const savedUserId = localStorage.getItem('bm_saved_user_id');
        if (currentUser) {
            if (currentUser.id !== 'offline_admin') {
                const updatedMe = items.find(u => u.id === currentUser.id);
                if (updatedMe) {
                     if (updatedMe.status === 'locked') {
                         alert("Tài khoản của bạn đã bị khóa.");
                         handleLogout();
                     } else setCurrentUser(updatedMe); 
                }
            }
        } else if (savedUserId) {
            if (savedUserId === 'offline_admin') {
                 setCurrentUser({
                    id: 'offline_admin',
                    name: 'Administrator',
                    username: 'admin',
                    password: '123456',
                    role: 'admin',
                    status: 'active',
                    isOnline: true
                });
            } else {
                const foundUser = items.find(u => u.id === savedUserId);
                if (foundUser && foundUser.status === 'active') {
                    setCurrentUser(foundUser);
                    db.collection('users').doc(foundUser.id).update({ isOnline: true }).catch(() => {});
                } else localStorage.removeItem('bm_saved_user_id');
            }
        }
        setIsLoggingIn(false);
    }, handleError);

    const unsubMenu = db.collection('menu_items').onSnapshot((snapshot) => {
        setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    }, handleError);

    const unsubOrders = db.collection('orders').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, handleError);

    const unsubShifts = db.collection('shifts').onSnapshot((snapshot) => {
        setShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift)));
    }, handleError);

    const unsubCheckIns = db.collection('check_ins').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        setCheckIns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CheckInRecord)));
    }, handleError);
    
    const unsubNotifs = db.collection('notifications').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(notifs);

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data() as Notification;
                const isRecent = Date.now() - data.timestamp < 10000;
                if (isRecent && currentUser) {
                    const isForMe = data.userId === currentUser.id;
                    const isAdmin = currentUser.role === 'admin';
                    if (isForMe || (isAdmin && (data.type === 'order' || data.type === 'shift'))) {
                        playNotificationSound();
                        setToast({ message: data.message, type: data.type === 'order' ? 'order' : 'success' });
                    }
                }
            }
        });
    }, handleError);

    return () => {
        try { unsubUsers(); unsubMenu(); unsubOrders(); unsubShifts(); unsubCheckIns(); unsubNotifs(); } catch(e) {}
    };
  }, [currentUser?.id]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoggingIn(true);
    const cleanUsername = data.username.trim();
    const cleanPassword = data.password.trim();

    if (cleanUsername === 'admin' && cleanPassword === '123456') {
        const adminUser = {
            id: 'offline_admin', name: 'Administrator', username: 'admin', password: '123456',
            role: 'admin' as const, status: 'active' as const, isOnline: true
        };
        setCurrentUser(adminUser);
        localStorage.setItem('bm_saved_user_id', 'offline_admin');
        setIsLoggingIn(false);
        return; 
    }

    try {
        let user = users.find(u => 
            (u.username.toLowerCase() === cleanUsername.toLowerCase() || u.phone === cleanUsername) && 
            u.password === cleanPassword
        );

        if (!user) {
            const q = db.collection('users').where('username', '==', cleanUsername);
            const querySnapshot = await q.get();
            let foundDocs = querySnapshot.docs;
            if (foundDocs.length === 0) {
                 const qPhone = db.collection('users').where('phone', '==', cleanUsername);
                 const phoneSnapshot = await qPhone.get();
                 foundDocs = phoneSnapshot.docs;
            }
            const matchedDoc = foundDocs.find(d => d.data().password === cleanPassword);
            if (matchedDoc) user = { id: matchedDoc.id, ...matchedDoc.data() } as User;
        }

        if (user) {
            if (user.role === 'staff' && (user.status === 'pending' || user.status === 'locked')) {
                alert(user.status === 'pending' ? 'Tài khoản đang chờ duyệt!' : 'Tài khoản đã bị khóa!');
                setIsLoggingIn(false);
                return;
            }
            db.collection('users').doc(user.id).update({ isOnline: true }).catch(() => {});
            setCurrentUser({ ...user, isOnline: true });
            localStorage.setItem('bm_saved_user_id', user.id);
        } else alert('Sai thông tin đăng nhập!');
    } catch (e: any) {
        alert(`Lỗi kết nối: ${e.message}`);
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleRegister = async (data: any) => {
      if (users.some(u => u.phone === data.phone)) return alert('Số điện thoại này đã được đăng ký!');
      try {
        await db.collection('users').add({
            name: data.name, username: data.phone, password: data.password,
            role: 'staff', status: 'pending', phone: data.phone, isOnline: false
        });
        alert("Đăng ký thành công! Vui lòng chờ duyệt.");
      } catch (e: any) { alert(`Lỗi đăng ký: ${e.message}`); }
  };

  const handleLogout = async () => {
    const userId = currentUser?.id;
    localStorage.removeItem('bm_saved_user_id');
    setCurrentUser(null);
    setCart([]);
    setShowPaymentModal(false);
    if (userId && userId !== 'offline_admin') {
        try { await db.collection('users').doc(userId).update({ isOnline: false }); } catch (e) {}
    }
  };

  const addNotification = async (userId: string, message: string, type: 'system' | 'order' | 'shift' = 'system') => {
      try {
        await db.collection('notifications').add({ userId, message, isRead: false, timestamp: Date.now(), type });
      } catch (e) {}
  };

  const initiateOrder = (items: CartItem[], total: number, source: OrderSource, name: string, phone: string) => {
    setPendingOrderItems(items);
    setPendingTotal(total);
    setPendingOrderInfo({ source, name, phone });
    setShowPaymentModal(true);
  };

  const confirmOrder = async (method: 'cash' | 'transfer') => {
    const newOrder = {
      items: pendingOrderItems, total: pendingTotal, paymentMethod: method,
      status: 'completed' as const, timestamp: Date.now(),
      staffId: currentUser?.id || 'unknown', source: pendingOrderInfo?.source || 'app',
      customerName: pendingOrderInfo?.name || '', customerPhone: pendingOrderInfo?.phone || ''
    };

    try {
        const docRef = await db.collection('orders').add(newOrder);
        const shortId = docRef.id.slice(-4).toUpperCase();
        if (currentUser) await addNotification(currentUser.id, `Đơn hàng ID:${shortId} thành công!`, 'order');
        users.filter(u => u.role === 'admin').forEach(admin => {
             addNotification(admin.id, `Đơn mới từ ${currentUser?.name || 'Khách'}: ${pendingTotal.toLocaleString('vi-VN')}đ`, 'order');
        });
        
        pendingOrderItems.forEach(async (item) => {
            const menuItem = menuItems.find(m => m.id === item.id);
            if (menuItem) {
                const targetId = menuItem.parentId || menuItem.id;
                const targetItem = menuItems.find(m => m.id === targetId);
                if (targetItem) {
                     const newStock = Math.max(0, targetItem.stock - item.quantity);
                     db.collection('menu_items').doc(targetId).update({ stock: newStock }).catch(() => {});
                }
            }
        });
    } catch (e) { alert("Lỗi lưu đơn hàng."); }
    setShowPaymentModal(false); setCart([]); setPendingOrderItems([]); setPendingTotal(0); setPendingOrderInfo(null);
  };

  const handleCheckIn = async (lat: number, lng: number, type: 'in' | 'out', imageFile?: File) => {
    try {
        let imageUrl = '';
        if (imageFile) imageUrl = await uploadFileToFirebase(imageFile, 'checkin_evidence');
        await db.collection('check_ins').add({
            staffId: currentUser?.id || '', timestamp: Date.now(),
            latitude: lat, longitude: lng, address: type === 'in' ? 'Check In' : 'Check Out',
            type, imageUrl
        });
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        users.filter(u => u.role === 'admin').forEach(admin => {
             addNotification(admin.id, `${currentUser?.name} đã ${type === 'in' ? 'Check-in' : 'Check-out'} lúc ${timeStr}`, 'shift');
        });
        if (currentUser) addNotification(currentUser.id, `${type === 'in' ? 'Check-in' : 'Check-out'} thành công!`, 'system');
    } catch (e: any) { alert(`Lỗi chấm công: ${e.message}`); }
  };

  return (
    <>
      <InstallPrompt />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {showConnectionStatus && (
        <div className={`fixed bottom-4 left-4 z-[100] pl-3 pr-8 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-500 shadow-lg ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-700 border border-green-200' :
                connectionStatus === 'permission-denied' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                connectionStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500 opacity-0'
        }`}>
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {connectionStatus === 'connected' ? (
                    <div className="flex items-center gap-1"><Wifi size={12}/> Đã kết nối</div>
                ) : connectionStatus === 'permission-denied' ? (
                    <div className="flex items-center gap-1"><AlertTriangle size={12}/> Lỗi Rules!</div>
                ) : ( <div className="flex items-center gap-1"><WifiOff size={12}/> Mất kết nối</div> )}
                <button onClick={() => setShowConnectionStatus(false)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                    <X size={10} />
                </button>
        </div>
      )}

      {isLoggingIn && (
          <div className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-bounce">
                 <span className="text-2xl font-black text-white">BM</span>
              </div>
              <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-orange-500" />
                  <span className="font-medium text-gray-500">Đang khởi động...</span>
              </div>
          </div>
      )}

      {!currentUser && !isLoggingIn ? (
        <LoginForm onSubmit={handleLogin} onRegister={handleRegister} />
      ) : currentUser && !isLoggingIn ? (
        currentUser.role === 'admin' ? (
            <AdminLayout 
                user={currentUser}
                onLogout={handleLogout} users={users} setUsers={setUsers}
                orders={orders} menuItems={menuItems} setMenuItems={setMenuItems}
                shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={addNotification}
            />
        ) : (
            <>
            <MainLayout 
                user={currentUser} onLogout={handleLogout} orders={orders}
                cart={cart} setCart={setCart} menuItems={menuItems}
                onPlaceOrder={initiateOrder} onCheckIn={handleCheckIn}
                checkInHistory={checkIns.filter(c => c.staffId === currentUser.id)}
                notifications={notifications.filter(n => n.userId === currentUser.id)}
                shifts={shifts}
            />
            {showPaymentModal && <PaymentModal total={pendingTotal} onClose={() => setShowPaymentModal(false)} onConfirm={confirmOrder} />}
            </>
        )
      ) : null}
    </>
  );
};

export default App;
