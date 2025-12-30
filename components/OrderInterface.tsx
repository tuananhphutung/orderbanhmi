import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem, OrderSource } from '../types';
import { ShoppingCart, Plus, Minus, UtensilsCrossed, X, ChevronUp, Trash2, Tag, User, Phone, Video, Search } from 'lucide-react';

interface OrderInterfaceProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  menuItems: MenuItem[];
  onPlaceOrder: (items: CartItem[], total: number, source: OrderSource, name: string, phone: string) => void;
}

const OrderInterface: React.FC<OrderInterfaceProps> = ({ cart, setCart, menuItems, onPlaceOrder }) => {
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  // External Order State
  const [orderSource, setOrderSource] = useState<OrderSource>('app');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'drink'>('all');

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      alert('Món này đã hết hàng!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
           alert(`Chỉ còn ${item.stock} phần!`);
           return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const menuItem = menuItems.find(m => m.id === id);
        const maxStock = menuItem ? menuItem.stock : 999;
        const newQty = item.quantity + delta;
        
        if (newQty > maxStock) return item;
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
      setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
      if (cart.length === 0) return alert('Giỏ hàng đang trống');
      onPlaceOrder(cart, totalAmount, orderSource, customerName, customerPhone);
      // Reset form fields slightly
      setCustomerName('');
      setCustomerPhone('');
      setIsMobileCartOpen(false);
  };

  const isVideo = (url: string) => {
      if (!url) return false;
      return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
  };

  // Filter Logic
  const filteredItems = useMemo(() => {
      return menuItems.filter(item => {
          const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
      });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden relative">
      
      {/* Left Side: Menu Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row gap-3 shadow-sm z-10">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Tìm món ăn..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                 />
             </div>
             <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                 <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                     Tất cả
                 </button>
                 <button 
                    onClick={() => setSelectedCategory('food')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'food' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                     Đồ ăn
                 </button>
                 <button 
                    onClick={() => setSelectedCategory('drink')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'drink' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                     Đồ uống
                 </button>
             </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-md active:scale-95 ${item.stock === 0 ? 'opacity-60 grayscale' : ''}`}
              >
                {/* Image/Video Area */}
                <div className="h-32 md:h-40 w-full bg-gray-50 relative overflow-hidden">
                    {item.image ? (
                        isVideo(item.image) ? (
                            <>
                                <video 
                                    src={item.image} 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline 
                                />
                                <div className="absolute top-2 right-2 bg-black/30 backdrop-blur rounded-full p-1">
                                    <Video size={12} className="text-white" />
                                </div>
                            </>
                        ) : (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <UtensilsCrossed size={32} />
                        </div>
                    )}
                    
                    {/* Stock Badge */}
                    <div className="absolute top-2 left-2">
                        {item.stock === 0 ? (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">HẾT HÀNG</span>
                        ) : (
                            <span className="bg-white/90 backdrop-blur text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-gray-100">
                                Kho: {item.stock}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info Area */}
                <div className="p-3">
                  <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1 mb-1">{item.name}</h3>
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-orange-600">{item.price.toLocaleString('vi-VN')}</span>
                    <button className="bg-orange-50 text-orange-600 p-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                        <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart (Desktop) */}
      <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col h-full shadow-xl z-20">
        <CartContent 
            cart={cart} 
            totalAmount={totalAmount}
            orderSource={orderSource} setOrderSource={setOrderSource}
            customerName={customerName} setCustomerName={setCustomerName}
            customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
            updateQuantity={updateQuantity} removeFromCart={removeFromCart}
            handleCheckout={handleCheckout}
        />
      </div>

      {/* Mobile Cart Button & Drawer */}
      <div className="md:hidden fixed bottom-16 right-4 left-4 z-30">
        <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-gray-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-4"
        >
            <div className="flex items-center gap-3">
                <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                </div>
                <span className="font-bold">Xem giỏ hàng</span>
            </div>
            <span className="font-bold text-lg">{totalAmount.toLocaleString('vi-VN')} đ</span>
        </button>
      </div>

      {isMobileCartOpen && (
          <div className="md:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)}></div>
              <div className="absolute inset-x-0 bottom-0 top-10 bg-white rounded-t-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                      <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20}/> Giỏ hàng</h2>
                      <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-white rounded-full shadow-sm"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                     <CartContent 
                        cart={cart} 
                        totalAmount={totalAmount}
                        orderSource={orderSource} setOrderSource={setOrderSource}
                        customerName={customerName} setCustomerName={setCustomerName}
                        customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                        updateQuantity={updateQuantity} removeFromCart={removeFromCart}
                        handleCheckout={handleCheckout}
                    />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Extracted Cart Content Component for reuse
const CartContent = ({ 
    cart, totalAmount, orderSource, setOrderSource, 
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    updateQuantity, removeFromCart, handleCheckout
}: any) => (
    <div className="flex flex-col h-full">
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <ShoppingCart size={48} className="mb-2" />
                    <p>Chưa có món nào</p>
                </div>
            ) : (
                cart.map((item: CartItem) => (
                    <div key={item.id} className="flex gap-3">
                         <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
                            {item.image ? (
                                item.image.match(/\.(mp4|webm|ogg)$/i) ? (
                                     <video src={item.image} className="w-full h-full object-cover" muted />
                                ) : (
                                     <img src={item.image} alt="" className="w-full h-full object-cover" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><UtensilsCrossed size={16}/></div>
                            )}
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{item.name}</h4>
                                 <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                             </div>
                             <p className="text-sm font-semibold text-orange-600 mb-2">{item.price.toLocaleString('vi-VN')} đ</p>
                             <div className="flex items-center gap-3">
                                 <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus size={12}/></button>
                                 <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                 <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"><Plus size={12}/></button>
                             </div>
                         </div>
                    </div>
                ))
            )}
        </div>

        {/* Checkout Form */}
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
             {/* Source Selector */}
             <div className="flex rounded-lg bg-white p-1 border border-gray-200 shadow-sm">
                {(['app', 'grab', 'shopee', 'gojek'] as OrderSource[]).map(src => (
                    <button
                        key={src}
                        onClick={() => setOrderSource(src)}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${orderSource === src ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {src === 'app' ? 'Tại quán' : src}
                    </button>
                ))}
             </div>

             {orderSource === 'app' && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                     <div className="relative">
                        <User className="absolute left-3 top-2.5 text-gray-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Tên khách hàng (Tùy chọn)" 
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500"
                        />
                     </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={14} />
                        <input 
                            type="tel" 
                            placeholder="Số điện thoại" 
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500"
                        />
                     </div>
                 </div>
             )}

             <div className="flex justify-between items-center pt-2">
                 <span className="text-gray-500 font-medium">Tổng cộng</span>
                 <span className="text-2xl font-bold text-gray-800">{totalAmount.toLocaleString('vi-VN')} đ</span>
             </div>

             <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
             >
                 <Tag size={18} /> Thanh toán {cart.length > 0 && `(${cart.length})`}
             </button>
        </div>
    </div>
);

export default OrderInterface;