import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PaymentModal from './components/PaymentModal';
import InstallPrompt from './components/InstallPrompt';
import AdminLayout from './components/admin/AdminLayout';
import { LoginFormData, User, Order, CartItem, CheckInRecord, MenuItem, OrderSource, Shift, Notification } from './types';
import { Loader2, Wifi, WifiOff, AlertTriangle, X } from 'lucide-react';
import { db, uploadFileToFirebase } from './firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, doc, setDoc,
  query, where, getDocs, orderBy 
} from 'firebase/firestore';

const App: React.FC = () => {
  // Global State (Synced with Firestore)
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Local User State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrderItems, setPendingOrderItems] = useState<CartItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingOrderInfo, setPendingOrderInfo] = useState<{source: OrderSource, name: string, phone: string} | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'permission-denied'>('connecting');
  const [showConnectionStatus, setShowConnectionStatus] = useState(true);

  // --- INITIALIZATION & SYNC ---

  // 1. Create Default Admin & Heartbeat
  useEffect(() => {
    // Check/Create Admin
    const checkAndCreateAdmin = async () => {
        try {
            const q = query(collection(db, 'users'), where('username', '==', 'admin'));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                await addDoc(collection(db, 'users'), {
                    name: 'Administrator',
                    username: 'admin',
                    password: '123456',
                    role: 'admin',
                    status: 'active',
                    isOnline: false
                });
                console.log("Đã khởi tạo Admin mặc định thành công!");
            }
        } catch (error: any) {
            console.error("Lỗi khởi tạo:", error);
            if (error.code === 'permission-denied') {
                setConnectionStatus('permission-denied');
            }
        }
    };

    // Heartbeat: Ghi vào Firestore mỗi 10s để chứng minh kết nối
    const heartbeat = async () => {
        try {
            const statusRef = doc(db, '_system', 'connection_status');
            const data = {
                timestamp: new Date().toISOString(),
                status: 'ONLINE',
                message: 'App đang chạy tốt',
                last_updated: Date.now()
            };
            // Dùng setDoc với merge: true để tạo nếu chưa có hoặc cập nhật nếu đã có
            await setDoc(statusRef, data, { merge: true });
        } catch (e: any) {
            console.error("Heartbeat failed", e);
            if (e.code === 'permission-denied') {
                setConnectionStatus('permission-denied');
            }
        }
    };

    checkAndCreateAdmin();
    const interval = setInterval(heartbeat, 10000); // Chạy mỗi 10 giây
    heartbeat(); // Chạy ngay lập tức

    return () => clearInterval(interval);
  }, []);

  // 2. Realtime Listeners
  useEffect(() => {
    const handleError = (error: any) => {
        console.error("Firebase connection error:", error);
        if (error.code === 'permission-denied') {
            setConnectionStatus('permission-denied');
        } else {
            setConnectionStatus('error');
        }
    };

    // Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setConnectionStatus('connected');
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(items);
        
        if (currentUser && currentUser.id !== 'offline_admin') {
            const updatedMe = items.find(u => u.id === currentUser.id);
            if (updatedMe) {
                 if (updatedMe.status === 'locked') {
                     alert("Tài khoản của bạn đã bị khóa.");
                     handleLogout();
                 } else {
                     setCurrentUser(updatedMe); 
                 }
            }
        }
    }, handleError);

    // Menu Listener
    const unsubMenu = onSnapshot(collection(db, 'menu_items'), (snapshot) => {
        setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    }, handleError);

    // Orders Listener
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('timestamp', 'desc')), (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, handleError);

    // Shifts Listener
    const unsubShifts = onSnapshot(collection(db, 'shifts'), (snapshot) => {
        setShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift)));
    }, handleError);

    // Checkins Listener
    const unsubCheckIns = onSnapshot(query(collection(db, 'check_ins'), orderBy('timestamp', 'desc')), (snapshot) => {
        setCheckIns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CheckInRecord)));
    }, handleError);
    
    // Notifications Listener
    const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, handleError);

    return () => {
        try { unsubUsers(); unsubMenu(); unsubOrders(); unsubShifts(); unsubCheckIns(); unsubNotifs(); } catch(e) {}
    };
  }, [currentUser?.id]);

  // Handle Window Close/Refresh for Online Status
  useEffect(() => {
      const handleBeforeUnload = () => {
          if (currentUser) {
             // Best effort
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  // --- ACTIONS ---

  const handleLogin = async (data: LoginFormData) => {
    setIsLoggingIn(true);
    const cleanUsername = data.username.trim();
    const cleanPassword = data.password.trim();

    // Offline Admin Backdoor
    if (cleanUsername === 'admin' && cleanPassword === '123456') {
        setCurrentUser({
            id: 'offline_admin',
            name: 'Administrator',
            username: 'admin',
            password: '123456',
            role: 'admin',
            status: 'active',
            isOnline: true
        });
        setIsLoggingIn(false);
        return; 
    }

    try {
        let user = users.find(u => 
            (u.username.toLowerCase() === cleanUsername.toLowerCase() || u.phone === cleanUsername) && 
            u.password === cleanPassword
        );

        if (!user) {
            const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
            const querySnapshot = await getDocs(q);
            let foundDocs = querySnapshot.docs;
            
            if (foundDocs.length === 0) {
                 const qPhone = query(collection(db, 'users'), where('phone', '==', cleanUsername));
                 const phoneSnapshot = await getDocs(qPhone);
                 foundDocs = phoneSnapshot.docs;
            }

            const matchedDoc = foundDocs.find(d => d.data().password === cleanPassword);
            if (matchedDoc) {
                user = { id: matchedDoc.id, ...matchedDoc.data() } as User;
            }
        }

        if (user) {
            if (user.role === 'staff') {
                if (user.status === 'pending') {
                    alert('Tài khoản đang chờ Admin duyệt!');
                    setIsLoggingIn(false);
                    return;
                }
                if (user.status === 'locked') {
                    alert('Tài khoản đã bị khóa!');
                    setIsLoggingIn(false);
                    return;
                }
            }
            updateDoc(doc(db, 'users', user.id), { isOnline: true }).catch(() => {});
            setCurrentUser({ ...user, isOnline: true });
        } else {
            alert('Sai thông tin đăng nhập!');
        }
    } catch (e: any) {
        alert(`Lỗi kết nối: ${e.message}`);
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleRegister = async (data: any) => {
      if (users.some(u => u.phone === data.phone)) {
          alert('Số điện thoại này đã được đăng ký!');
          return;
      }
      try {
        await addDoc(collection(db, 'users'), {
            name: data.name,
            username: data.phone, 
            password: data.password,
            role: 'staff',
            status: 'pending',
            phone: data.phone,
            isOnline: false
        });
        alert("Đăng ký thành công! Vui lòng chờ duyệt.");
      } catch (e: any) {
          alert(`Lỗi đăng ký: ${e.message}`);
      }
  };

  const handleLogout = async () => {
    const userId = currentUser?.id;
    const isOfflineAdmin = userId === 'offline_admin';

    setCurrentUser(null);
    setCart([]);
    setShowPaymentModal(false);

    if (userId && !isOfflineAdmin) {
        try {
            await updateDoc(doc(db, 'users', userId), { isOnline: false });
        } catch (e) {}
    }
  };

  const addNotification = async (userId: string, message: string, type: 'system' | 'order' | 'shift' = 'system') => {
      try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            message,
            isRead: false,
            timestamp: Date.now(),
            type
        });
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
      items: pendingOrderItems,
      total: pendingTotal,
      paymentMethod: method,
      status: 'completed' as const,
      timestamp: Date.now(),
      staffId: currentUser?.id || 'unknown',
      source: pendingOrderInfo?.source || 'app',
      customerName: pendingOrderInfo?.name || '',
      customerPhone: pendingOrderInfo?.phone || ''
    };

    try {
        const docRef = await addDoc(collection(db, 'orders'), newOrder);
        
        // Notify the current user (staff) about success
        if (currentUser) {
            const shortId = docRef.id.slice(-4).toUpperCase();
            await addNotification(currentUser.id, `Đơn hàng ID:${shortId} đã thanh toán thành công!`, 'order');
        }

        // Notify Admin
        const adminUsers = users.filter(u => u.role === 'admin');
        adminUsers.forEach(admin => {
             addNotification(admin.id, `Đơn mới từ ${currentUser?.name || 'Khách'}: ${pendingTotal.toLocaleString('vi-VN')}đ`, 'order');
        });
        
        pendingOrderItems.forEach(async (item) => {
            const menuItem = menuItems.find(m => m.id === item.id);
            if (menuItem) {
                const newStock = Math.max(0, menuItem.stock - item.quantity);
                const itemRef = doc(db, 'menu_items', item.id);
                updateDoc(itemRef, { stock: newStock }).catch(() => {});
            }
        });
        
    } catch (e) {
        alert("Lỗi lưu đơn hàng (Mất kết nối).");
    }

    setShowPaymentModal(false);
    setCart([]); 
    setPendingOrderItems([]);
    setPendingTotal(0);
    setPendingOrderInfo(null);
  };

  const handleCheckIn = async (lat: number, lng: number, type: 'in' | 'out', imageFile?: File) => {
    try {
        let imageUrl = '';
        if (imageFile) {
            // Upload image evidence
            imageUrl = await uploadFileToFirebase(imageFile, 'checkin_evidence');
        }

        await addDoc(collection(db, 'check_ins'), {
            staffId: currentUser?.id || '',
            timestamp: Date.now(),
            latitude: lat,
            longitude: lng,
            address: type === 'in' ? 'Check In' : 'Check Out',
            type: type,
            imageUrl: imageUrl
        });

        // Notify Admin
        const adminUsers = users.filter(u => u.role === 'admin');
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        adminUsers.forEach(admin => {
             addNotification(admin.id, `${currentUser?.name} đã ${type === 'in' ? 'Check-in' : 'Check-out'} lúc ${timeStr}`, 'shift');
        });

        alert(`${type === 'in' ? 'Check-in' : 'Check-out'} thành công!`);
    } catch (e: any) {
        console.error(e);
        alert(`Lỗi chấm công: ${e.message}`);
    }
  };

  return (
    <>
      <InstallPrompt />
      
      {/* Connection Status Indicator */}
      {showConnectionStatus && (
        <div className={`fixed bottom-4 left-4 z-[100] pl-3 pr-8 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-500 shadow-lg group ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-700 border border-green-200' :
                connectionStatus === 'permission-denied' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                connectionStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                'bg-gray-100 text-gray-500 opacity-0'
        }`}>
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {connectionStatus === 'connected' ? (
                    <div className="flex items-center gap-1"><Wifi size={12}/> Đã kết nối Server</div>
                ) : connectionStatus === 'permission-denied' ? (
                    <div className="flex items-center gap-1"><AlertTriangle size={12}/> Lỗi: Chưa mở khóa Rules!</div>
                ) : (
                    <div className="flex items-center gap-1"><WifiOff size={12}/> Mất kết nối</div>
                )}
                
                <button 
                    onClick={() => setShowConnectionStatus(false)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 bg-black/5 hover:bg-black/10 rounded-full"
                >
                    <X size={10} />
                </button>
        </div>
      )}

      {isLoggingIn && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
              <div className="bg-white p-4 rounded-xl flex items-center gap-3">
                  <Loader2 className="animate-spin text-orange-500" />
                  <span className="font-medium">Đang xử lý...</span>
              </div>
          </div>
      )}

      {!currentUser ? (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative font-sans">
          <LoginForm onSubmit={handleLogin} onRegister={handleRegister} />
        </div>
      ) : (
        currentUser.role === 'admin' ? (
            <AdminLayout 
                onLogout={handleLogout}
                users={users} setUsers={setUsers}
                orders={orders}
                menuItems={menuItems} setMenuItems={setMenuItems}
                shifts={shifts} setShifts={setShifts}
                checkIns={checkIns}
                onNotify={addNotification}
            />
        ) : (
            <>
            <MainLayout 
                user={currentUser} 
                onLogout={handleLogout}
                orders={orders}
                cart={cart}
                setCart={setCart}
                menuItems={menuItems}
                onPlaceOrder={initiateOrder}
                onCheckIn={handleCheckIn}
                checkInHistory={checkIns.filter(c => c.staffId === currentUser.id)}
                notifications={notifications.filter(n => n.userId === currentUser.id)}
                shifts={shifts}
            />
            {showPaymentModal && (
                <PaymentModal 
                total={pendingTotal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={confirmOrder}
                />
            )}
            </>
        )
      )}
    </>
  );
};

export default App;