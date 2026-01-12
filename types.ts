
export interface LoginFormData {
  username: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  username: string; // Added username for login
  password?: string; // Added password
  role: 'admin' | 'staff';
  status: 'active' | 'pending' | 'locked'; // Added status
  isOnline?: boolean; // Added online status
  avatar?: string;
  phone?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'topping';
  image?: string;
  stock: number;
  isParent?: boolean; // True nếu đây là Món Mẹ (Nhóm)
  parentId?: string; // ID của Món Mẹ nếu đây là món con
}

export interface CartItem extends MenuItem {
  quantity: number;
}

// Updated 'be' to 'xanhsm'
export type OrderSource = 'app' | 'grab' | 'shopee' | 'xanhsm';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'transfer';
  status: 'pending' | 'completed';
  timestamp: number;
  staffId: string;
  source: OrderSource;
  customerName?: string;
  customerPhone?: string;
}

export interface CheckInRecord {
  id: string;
  staffId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string; // Evidence photo
  type: 'in' | 'out'; // Check-in or Check-out
}

export interface Shift {
  id: string;
  staffIds: string[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  note?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  timestamp: number;
  type: 'shift' | 'system' | 'order';
}
