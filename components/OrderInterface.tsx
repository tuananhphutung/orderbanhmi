import React, { useState } from 'react';
import { MenuItem, CartItem } from '../types';
import { ShoppingCart, Plus, Minus, Coffee, UtensilsCrossed, X, ChevronUp } from 'lucide-react';

interface OrderInterfaceProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onPlaceOrder: (items: CartItem[], total: number) => void;
}

// Mock Menu Data
const MENU_ITEMS: MenuItem[] = [
  // Drinks
  { id: 'd1', name: 'Nước suối', price: 10000, category: 'drink' },
  { id: 'd2', name: 'Sting', price: 12000, category: 'drink' },
  { id: 'd3', name: 'Vario (Warrior)', price: 12000, category: 'drink' },
  { id: 'd4', name: 'Bò húc', price: 12000, category: 'drink' },
  { id: 'd5', name: 'Revive', price: 12000, category: 'drink' },
  // Food
  { id: 'f1', name: 'Bánh mì không', price: 6000, category: 'food' },
  { id: 'f2', name: 'Bánh mì thịt', price: 20000, category: 'food' },
  { id: 'f3', name: 'Bánh mì Hội An', price: 25000, category: 'food' },
  { id: 'f4', name: 'Bánh mì xíu mại', price: 20000, category: 'food' },
  { id: 'f5', name: 'Bánh mì chả', price: 20000, category: 'food' },
];

const OrderInterface: React.FC<OrderInterfaceProps> = ({ cart, setCart, onPlaceOrder }) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'food' | 'drink'>('all');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredMenu = categoryFilter === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === categoryFilter);

  const CartContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
            <ShoppingCart size={48} className="mb-2" />
            <p>Chưa có món nào</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                <p className="text-gray-500 text-xs mt-1">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-gray-100 bg-white">
        <div className="flex justify-between items-end mb-4">
          <span className="text-gray-500 font-medium">Tổng tiền</span>
          <span className="text-2xl font-bold text-orange-600">{totalAmount.toLocaleString('vi-VN')} đ</span>
        </div>
        <button 
          disabled={cart.length === 0}
          onClick={() => {
             setIsMobileCartOpen(false);
             onPlaceOrder(cart, totalAmount);
          }}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-900 hover:bg-orange-500 active:scale-95'}`}
        >
          Thanh toán
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-gray-50 relative">
      
      {/* Left Side: Menu Grid */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto pb-24 lg:pb-6">
        {/* Category Filters */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 hide-scrollbar">
          <button 
            onClick={() => setCategoryFilter('all')}
            className={`px-5 py-2.5 rounded-full font-medium transition-colors whitespace-nowrap ${categoryFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setCategoryFilter('food')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors whitespace-nowrap ${categoryFilter === 'food' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-orange-100'}`}
          >
            <UtensilsCrossed size={18} /> Bánh mì
          </button>
          <button 
            onClick={() => setCategoryFilter('drink')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors whitespace-nowrap ${categoryFilter === 'drink' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-blue-100'}`}
          >
            <Coffee size={18} /> Nước uống
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMenu.map(item => (
            <div 
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 cursor-pointer transition-all duration-200 group flex flex-col items-center justify-between h-40 active:scale-95"
            >
              <div className={`p-3 rounded-full mb-2 ${item.category === 'food' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {item.category === 'food' ? <UtensilsCrossed size={24} /> : <Coffee size={24} />}
              </div>
              <h3 className="font-bold text-gray-800 text-center leading-tight line-clamp-2">{item.name}</h3>
              <p className="font-semibold text-orange-600 mt-2">{item.price.toLocaleString('vi-VN')} đ</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Cart Side Panel */}
      <div className="hidden lg:flex w-96 bg-white shadow-xl border-l border-gray-100 flex-col h-full z-10">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <ShoppingCart className="text-orange-500" />
          <h2 className="font-bold text-lg text-gray-800">Đơn hàng hiện tại</h2>
          <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
            {totalItems} món
          </span>
        </div>
        <CartContent />
      </div>

      {/* Mobile Cart Floating Bar */}
      <div className="lg:hidden fixed bottom-[60px] left-0 right-0 p-4 z-40">
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full bg-gray-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-3">
             <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">
               {totalItems}
             </div>
             <span className="font-medium">Xem giỏ hàng</span>
          </div>
          <span className="font-bold text-lg text-orange-400">
            {totalAmount.toLocaleString('vi-VN')} đ
          </span>
          <ChevronUp size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Mobile Cart Full Screen Modal */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-white animate-in slide-in-from-bottom-full duration-300">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
             <div className="flex items-center gap-2">
               <ShoppingCart className="text-orange-500" />
               <h2 className="font-bold text-lg text-gray-800">Giỏ hàng</h2>
             </div>
             <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
               <X size={20} />
             </button>
          </div>
          <CartContent />
        </div>
      )}

    </div>
  );
};

export default OrderInterface;