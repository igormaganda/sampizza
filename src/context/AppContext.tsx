import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

export type ConfigCategory = 'taille' | 'sauce' | 'supplement' | 'cuisson' | 'fromage' | 'viande' | 'legumes';

export type ConfigOption = {
  id: string;
  name: string;
  price: number;
  category: ConfigCategory;
};

export type ItemCategory = 'pizza' | 'salade' | 'panini' | 'sandwich' | 'boisson' | 'dessert';

export type Product = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  category: ItemCategory;
  available: boolean;
  allowedConfigCategories: ConfigCategory[];
};

export type Menu = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceHT: number;
  vatRate: number;
  image: string;
  sortOrder: number;
  available: boolean;
  compositions?: MenuComposition[];
};

export type MenuComposition = {
  id: string;
  menuId: string;
  productId: string;
  category: string;
  quantity: number;
  required: boolean;
  product?: Product;
};

export type CartItem = {
  id: string;
  menuItem: Product | Menu;
  quantity: number;
  configurations: ConfigOption[];
  totalPrice: number;
  isMenu?: boolean;
};

export type OrderStatus = 'attente_paiement' | 'en_attente' | 'en_preparation' | 'pret' | 'livre';

export type DeliveryMethod = 'sur_place' | 'livraison';

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  deliveryMethod: DeliveryMethod;
};

interface AppContextType {
  products: Product[];
  menus: Menu[];
  configOptions: ConfigOption[];
  cart: CartItem[];
  orders: Order[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (customerName: string, deliveryMethod: DeliveryMethod, deliveryDate?: string, deliveryTime?: string, comments?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateMenuItemAvailability: (itemId: string, available: boolean) => void;
  addMenuItem: (item: Partial<Product>) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<Product>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  isCartVisible: boolean;
  setCartVisible: (visible: boolean) => void;
  lastAddedItemId: string | null;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('sam_pizza_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartVisible, setCartVisible] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousOrdersCount = useRef<number>(0);

  const fetchMenu = async () => {
    try {
      const menuRes = await fetch('https://apisam.mgd-crm.com/api/menu');
      const menuData = await menuRes.json();

      setProducts(menuData.products || []);
      setConfigOptions(menuData.configOptions);

      // Fetch menus
      const menusRes = await fetch('https://apisam.mgd-crm.com/api/menus');
      const menusData = await menusRes.json();
      setMenus(menusData);

      // Try to fetch orders, but don't fail if not authenticated
      try {
        const ordersRes = await fetch('https://apisam.mgd-crm.com/api/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();

          // Check for new orders to play sound
          if (previousOrdersCount.current !== 0 && ordersData.length > previousOrdersCount.current) {
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(e => console.log('Audio play failed:', e));
          }
          previousOrdersCount.current = ordersData.length;

          setOrders(ordersData);
        }
      } catch (ordersError) {
        // Silently fail for orders - user might not be admin
        console.log('Orders fetch failed (expected for non-admin users):', ordersError);
      }
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    
    // Poll for new orders every 10 seconds
    const interval = setInterval(() => {
      fetchMenu();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('sam_pizza_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    setCartVisible(true);
    setLastAddedItemId(item.id);
    setTimeout(() => setLastAddedItemId(null), 2000);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              totalPrice: (item.menuItem.basePrice + item.configurations.reduce((sum, c) => sum + c.price, 0)) * quantity,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (customerName: string, deliveryMethod: DeliveryMethod, deliveryDate?: string, deliveryTime?: string, comments?: string) => {
    if (cart.length === 0) return;

    // Calculate default delivery time (now + 35 minutes)
    const defaultDeliveryDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    now.setMinutes(now.getMinutes() + 35);
    const defaultDeliveryTime = now.toTimeString().slice(0, 5); // Format: HH:MM

    const finalDeliveryDate = deliveryDate || defaultDeliveryDate;
    const finalDeliveryTime = deliveryTime || defaultDeliveryTime;

    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0) + (deliveryMethod === 'livraison' ? 2.5 : 0);

    try {
      const response = await fetch('https://apisam.mgd-crm.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          deliveryMethod,
          customerName,
          deliveryDate: finalDeliveryDate,
          deliveryTime: finalDeliveryTime,
          comments,
          total
        })
      });

      if (response.ok) {
        const ordersRes = await fetch('https://apisam.mgd-crm.com/api/orders');
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
        // NOTE: Cart is NOT cleared here anymore - it will be cleared on OrderSuccess page
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const updateMenuItemAvailability = async (itemId: string, available: boolean) => {
    try {
      await fetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available })
      });
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, available } : item))
      );
    } catch (error) {
      console.error('Failed to update menu item availability:', error);
    }
  };

  const addMenuItem = async (item: Partial<MenuItem>) => {
    try {
      await fetch('https://apisam.mgd-crm.com/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      await fetchMenu();
    } catch (error) {
      console.error('Failed to add menu item:', error);
    }
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    try {
      await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      await fetchMenu();
    } catch (error) {
      console.error('Failed to update menu item:', error);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await fetch(`/api/menu/${id}`, {
        method: 'DELETE'
      });
      await fetchMenu();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        menus,
        configOptions,
        cart,
        orders,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        placeOrder,
        updateOrderStatus,
        updateMenuItemAvailability,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        isCartVisible,
        setCartVisible,
        lastAddedItemId,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
