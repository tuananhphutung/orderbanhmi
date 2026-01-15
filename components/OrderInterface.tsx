
import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem, OrderSource } from '../types';
import { ShoppingCart, Plus, Minus, UtensilsCrossed, X, Trash2, Tag, User, Phone, Video, Search, Calendar } from 'lucide-react';

interface OrderInterfaceProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  menuItems: MenuItem[];
  onPlaceOrder: (items: CartItem[], total: number, source: OrderSource, name: string, phone: string, customDate?: string) => void;
}

const OrderInterface: React.FC<OrderInterfaceProps> = ({ cart, setCart, menuItems, onPlaceOrder }) => {
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [orderSource, setOrderSource] = useState<OrderSource>('app');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customDate, setCustomDate] = useState(''); // State cho ngày tạo đơn
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'topping'>('all');

  const addToCart = (item: MenuItem) => {
    const isTopping = item.category === 'topping';
    const targetId = item.parentId || item.id;
    const targetItem = menuItems.find(m => m.id === targetId);
    if (!targetItem) return;

    const currentUsageInCart = cart.reduce((sum, cartItem) => {
        const cartItemInfo = menuItems.find(m => m.id === cartItem.id);
        const cartTargetId = cartItemInfo?.parentId || cartItemInfo?.id;
        return cartTargetId === targetId ? sum + cartItem.quantity : sum;
    }, 0);

    const maxStock = targetItem.stock;
    if (!isTopping && (currentUsageInCart + 1 > maxStock)) {
        alert(item.parentId ? `Hết vỏ bánh!` : `Hết hàng!`);
        return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const menuItem = menuItems.find(m => m.id === id);
        if (!menuItem) return item;
        const newQty = item.quantity + delta;
        if (delta < 0) return { ...item, quantity: Math.max(0, newQty) };
        const targetId = menuItem.parentId || menuItem.id;
        const targetItem = menuItems.find(m => m.id === targetId);
        const maxStock = targetItem ? targetItem.stock : 0;
        const currentTotalUsage = prev.reduce((sum, cartItem) => {
             const cartItemInfo = menuItems.find(m => m.id === cartItem.id);
             const cartTargetId = cartItemInfo?.parentId || cartItemInfo?.id;
             return cartTargetId === targetId ? sum + cartItem.quantity : sum;
        }, 0);
        if (menuItem.category !== 'topping' && (currentTotalUsage + 1 > maxStock)) {
            alert("Hết hàng!");
            return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
      if (cart.length === 0) return alert('Giỏ hàng trống');
      onPlaceOrder(cart, totalAmount, orderSource, customerName, customerPhone, customDate);
      setCustomerName(''); setCustomerPhone(''); setCustomDate('');
      setIsMobileCartOpen(false);
  };

  const filteredItems = useMemo(() => {
      return menuItems.filter(item => {
          if (item.isParent) return false;
          const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
      });
  }, [menuItems, selectedCategory, searchQuery]);

  const getDisplayStock = (item: MenuItem) => {
      if (item.category === 'topping') return 999;
      return item.parentId ? (menuItems.find(p => p.id === item.parentId)?.stock || 0) : item.stock;
  }

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row gap-3 shadow-sm z-10">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input type="text" placeholder="Tìm món..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"/>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                 {['all', 'food', 'topping'].map(cat => (
                     <button key={cat} onClick={() => setSelectedCategory(cat as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                         {cat === 'all' ? 'Tất cả' : cat === 'food' ? 'Đồ ăn' : 'Topping'}
                     </button>
                 ))}
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const displayStock = getDisplayStock(item);
              const isOutOfStock = item.category !== 'topping' && displayStock === 0;
              return (
                <div key={item.id} onClick={() => addToCart(item)}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group transition-all duration-200 active:scale-95 ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}>
                    <div className="h-32 md:h-40 w-full bg-gray-50 relative overflow-hidden">
                        {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><UtensilsCrossed size={32} /></div>
                        )}
                        <div className="absolute top-2 left-2">
                            {item.category === 'topping' ? <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded">TOPPING</span> : 
                             isOutOfStock ? <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">HẾT</span> :
                             <span className="bg-white/80 backdrop-blur text-gray-700 text-[10px] font-bold px-2 py-1 rounded border">Kho: {displayStock}</span>}
                        </div>
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                        <p className="font-bold text-orange-600 text-sm">{item.price.toLocaleString('vi-VN')} đ</p>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col h-full shadow-xl z-20">
        <CartContent cart={cart} totalAmount={totalAmount} orderSource={orderSource} setOrderSource={setOrderSource}
            customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
            customDate={customDate} setCustomDate={setCustomDate} updateQuantity={updateQuantity} removeFromCart={removeFromCart} handleCheckout={handleCheckout} />
      </div>

      {/* MOBILE CART BUTTON: Tối ưu không che menu (Glassmorphism, nhỏ gọn) */}
      <div className="md:hidden fixed bottom-20 right-4 left-4 z-30 px-4">
        <button onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-black/60 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between border border-white/20 active:scale-95 transition-all">
            <div className="flex items-center gap-2">
                <div className="bg-orange-500 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">{cart.reduce((s, i) => s + i.quantity, 0)}</div>
                <span className="font-bold text-sm">Xem đơn</span>
            </div>
            <span className="font-bold text-sm">{totalAmount.toLocaleString('vi-VN')} đ</span>
        </button>
      </div>

      {isMobileCartOpen && (
          <div className="md:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)}></div>
              <div className="absolute inset-x-0 bottom-0 top-10 bg-white rounded-t-3xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                      <h2 className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> Giỏ hàng</h2>
                      <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-white rounded-full"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                     <CartContent cart={cart} totalAmount={totalAmount} orderSource={orderSource} setOrderSource={setOrderSource}
                        customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                        customDate={customDate} setCustomDate={setCustomDate} updateQuantity={updateQuantity} removeFromCart={removeFromCart} handleCheckout={handleCheckout} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const CartContent = ({ cart, totalAmount, orderSource, setOrderSource, customerName, setCustomerName, customerPhone, setCustomerPhone, customDate, setCustomDate, updateQuantity, removeFromCart, handleCheckout }: any) => (
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60"><ShoppingCart size={40} /><p className="text-sm mt-2">Giỏ hàng trống</p></div> :
                cart.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-3">
                         <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <UtensilsCrossed size={14} className="m-auto mt-4 text-gray-300"/>}
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-gray-800 text-xs line-clamp-2">{item.name}</h4>
                                 <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                             </div>
                             <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-bold text-orange-600">{item.price.toLocaleString('vi-VN')} đ</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-xs">-</button>
                                    <span className="font-bold text-xs">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 rounded bg-orange-500 text-white flex items-center justify-center text-xs">+</button>
                                </div>
                             </div>
                         </div>
                    </div>
                ))
            }
        </div>
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
             <div className="flex rounded-lg bg-white p-1 border border-gray-200">
                {['app', 'grab', 'shopee', 'xanhsm'].map(src => (
                    <button key={src} onClick={() => setOrderSource(src)} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${orderSource === src ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
                        {src === 'app' ? 'Tại quán' : src === 'xanhsm' ? 'Xanh SM' : src}
                    </button>
                ))}
             </div>
             <div className="space-y-2">
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-orange-500" />
                </div>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input type="text" placeholder="Tên khách" value={customerName} onChange={e => setCustomerName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-orange-500"/>
                </div>
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input type="tel" placeholder="Số điện thoại" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-orange-500"/>
                </div>
             </div>
             <div className="flex justify-between items-center pt-2">
                 <span className="text-gray-500 text-sm">Tổng cộng</span>
                 <span className="text-xl font-bold text-gray-800">{totalAmount.toLocaleString('vi-VN')} đ</span>
             </div>
             <button onClick={handleCheckout} disabled={cart.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${cart.length === 0 ? 'bg-gray-400' : 'bg-orange-500'}`}>
                 <Tag size={18} className="inline mr-2" /> Thanh toán
             </button>
        </div>
    </div>
);

export default OrderInterface;
