export interface LoginFormData {
  phone: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  avatar?: string;
  shiftStart?: string;
  shiftEnd?: string;
  shiftDays?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'drink';
  image?: string; // Placeholder for UI logic
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'transfer';
  status: 'pending' | 'completed';
  timestamp: number;
  staffId: string;
}

export interface CheckInRecord {
  id: string;
  staffId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  address?: string; // Simulated address
}