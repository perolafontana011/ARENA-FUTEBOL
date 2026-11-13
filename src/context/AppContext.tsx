import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Product, 
  Customer, 
  Sale, 
  Expense, 
  PixConfig, 
  PushNotification, 
  CartItem, 
  PaymentMethod,
  DebtPayment,
  MonthlyReportSummary
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_EXPENSES, 
  INITIAL_SALES, 
  INITIAL_PIX_CONFIG, 
  INITIAL_NOTIFICATIONS 
} from '../data/mockData';
import { playNotificationSound, triggerBrowserPushNotification } from '../utils/messaging';
import { 
  db, 
  validateFirestoreConnection, 
  COLLECTIONS,
  doc,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch
} from '../services/firebase';

interface AppContextType {
  // Navigation & Role (Exclusivo do Dono)
  activeTab: 'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports';
  setActiveTab: (tab: 'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports') => void;
  isAdmin: boolean;
  unlockAdmin: (pin: string) => boolean;
  lockAdmin: () => void;
  adminPin: string;
  setAdminPin: (pin: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Real-time Database Status
  isFirestoreConnected: boolean;
  firestoreSyncStatus: 'synced' | 'syncing' | 'offline';

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCost: number;

  // Core Data (Synced with Firestore)
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  debtPayments: DebtPayment[];
  pixConfig: PixConfig;
  setPixConfig: (config: PixConfig) => void;
  notifications: PushNotification[];
  unreadNotificationCount: number;

  // Operations
  makeSale: (params: { 
    paymentMethod: PaymentMethod; 
    customerId?: string; 
    fiadoCustomerData?: {
      name: string;
      phone: string;
      teamOrShirt?: string;
    };
    notes?: string; 
  }) => { success: boolean; sale?: Sale; error?: string };

  addCustomer: (data: { 
    name: string; 
    phone: string; 
    teamOrShirt: string; 
    creditLimit: number; 
    notes?: string; 
  }) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  settleCustomerDebt: (params: { 
    customerId: string; 
    amount: number; 
    paymentMethod: 'pix' | 'dinheiro'; 
    payerName?: string;
    payerPhone?: string;
    notes?: string; 
    pixTxId?: string;
  }) => DebtPayment | null;

  addExpense: (data: Omit<Expense, 'id' | 'timestamp'>) => Expense;
  addProduct: (data: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  restockProduct: (id: string, quantityToAdd: number, autoRegisterExpense?: boolean) => void;

  sendDebtNotice: (params: { 
    customerId: string; 
    amount: number; 
    message: string; 
    type: 'whatsapp' | 'push'; 
  }) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (title: string, body: string, type: PushNotification['type']) => void;

  // Financial summary helpers
  cashFlowSummary: {
    totalRevenue: number;
    cashInDrawer: number;
    pixReceived: number;
    cardReceived: number;
    fiadoOutstanding: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMarginPercent: number;
  };

  getMonthlyReport: (yearMonth: string) => MonthlyReportSummary;
  availableReportMonths: string[];

  // Utilities
  resetToMockData: () => void;
}

const STORAGE_KEYS = {
  PRODUCTS: 'arena_gol_products_v1',
  CUSTOMERS: 'arena_gol_customers_v1',
  SALES: 'arena_gol_sales_v1',
  EXPENSES: 'arena_gol_expenses_v1',
  DEBT_PAYMENTS: 'arena_gol_debt_payments_v1',
  PIX_CONFIG: 'arena_gol_pix_config_v1',
  NOTIFICATIONS: 'arena_gol_notifications_v1',
  ADMIN_PIN: 'arena_gol_admin_pin_v1',
  IS_ADMIN: 'arena_gol_is_admin_v1',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Role - Sistema exclusivo do Dono (Admin ativo por padrão)
  const [activeTab, setActiveTab] = useState<'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports'>('pos');
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [adminPin, setAdminPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
  });

  // Database status
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('arena_gol_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('arena_gol_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Local storage cache states (servem de fallback e inicialização instantânea)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((p: Product) => {
        const initial = INITIAL_PRODUCTS.find((ip) => ip.id === p.id);
        return {
          ...p,
          imageUrl: initial ? initial.imageUrl : (p.imageUrl || ''),
        };
      });
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEBT_PAYMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [pixConfig, setPixConfigState] = useState<PixConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PIX_CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_PIX_CONFIG;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEBT_PAYMENTS, JSON.stringify(debtPayments));
  }, [debtPayments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PIX_CONFIG, JSON.stringify(pixConfig));
  }, [pixConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, adminPin);
  }, [adminPin]);

  // Real-time Firestore Synchronizer
  useEffect(() => {
    let isMounted = true;

    // 1. Check probe connection
    validateFirestoreConnection()
      .then((ok) => {
        if (isMounted) {
          setIsFirestoreConnected(ok);
          setFirestoreSyncStatus(ok ? 'synced' : 'offline');
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsFirestoreConnected(false);
          setFirestoreSyncStatus('offline');
        }
      });

    // 2. Subscribe to Firestore Products
    const unsubProducts = onSnapshot(
      collection(db, COLLECTIONS.PRODUCTS),
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.empty) {
          // Initial Database Seeding on first run
          const batch = writeBatch(db);
          INITIAL_PRODUCTS.forEach((p) => {
            batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
          });
          batch.commit().catch(console.error);
        } else {
          const list: Product[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Product;
            const initial = INITIAL_PRODUCTS.find((ip) => ip.id === data.id);
            list.push({
              ...data,
              imageUrl: initial ? initial.imageUrl : (data.imageUrl || ''),
            });
          });
          setProducts(list);
          setFirestoreSyncStatus('synced');
        }
      },
      (error) => {
        console.warn('Firestore Products fallback to local:', error);
        setFirestoreSyncStatus('offline');
      }
    );

    // 3. Subscribe to Firestore Customers
    const unsubCustomers = onSnapshot(
      collection(db, COLLECTIONS.CUSTOMERS),
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_CUSTOMERS.forEach((c) => {
            batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), c);
          });
          batch.commit().catch(console.error);
        } else {
          const list: Customer[] = [];
          snapshot.forEach((d) => list.push(d.data() as Customer));
          setCustomers(list);
        }
      },
      (error) => {
        console.warn('Firestore Customers fallback to local:', error);
      }
    );

    // 4. Subscribe to Firestore Sales
    const unsubSales = onSnapshot(
      collection(db, COLLECTIONS.SALES),
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_SALES.forEach((s) => {
            batch.set(doc(db, COLLECTIONS.SALES, s.id), s);
          });
          batch.commit().catch(console.error);
        } else {
          const list: Sale[] = [];
          snapshot.forEach((d) => list.push(d.data() as Sale));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setSales(list);
        }
      },
      (error) => {
        console.warn('Firestore Sales fallback to local:', error);
      }
    );

    // 5. Subscribe to Firestore Expenses
    const unsubExpenses = onSnapshot(
      collection(db, COLLECTIONS.EXPENSES),
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_EXPENSES.forEach((e) => {
            batch.set(doc(db, COLLECTIONS.EXPENSES, e.id), e);
          });
          batch.commit().catch(console.error);
        } else {
          const list: Expense[] = [];
          snapshot.forEach((d) => list.push(d.data() as Expense));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setExpenses(list);
        }
      },
      (error) => {
        console.warn('Firestore Expenses fallback to local:', error);
      }
    );

    // 6. Subscribe to Firestore Debt Payments
    const unsubPayments = onSnapshot(
      collection(db, COLLECTIONS.DEBT_PAYMENTS),
      (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const list: DebtPayment[] = [];
          snapshot.forEach((d) => list.push(d.data() as DebtPayment));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setDebtPayments(list);
        }
      },
      (error) => {
        console.warn('Firestore Debt Payments fallback to local:', error);
      }
    );

    // 7. Subscribe to PIX Config
    const unsubPix = onSnapshot(
      doc(db, COLLECTIONS.SETTINGS, 'pix_config'),
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          setPixConfigState(snapshot.data() as PixConfig);
        } else {
          setDoc(doc(db, COLLECTIONS.SETTINGS, 'pix_config'), INITIAL_PIX_CONFIG).catch(console.error);
        }
      },
      (error) => {
        console.warn('Firestore PIX Config fallback to local:', error);
      }
    );

    return () => {
      isMounted = false;
      unsubProducts();
      unsubCustomers();
      unsubSales();
      unsubExpenses();
      unsubPayments();
      unsubPix();
    };
  }, []);

  // Admin PIN management (opcional para proteger a tela se o dono se ausentar)
  const unlockAdmin = (pin: string): boolean => {
    if (pin.trim() === adminPin.trim()) {
      setIsAdmin(true);
      playNotificationSound('success');
      return true;
    }
    playNotificationSound('alert');
    return false;
  };

  const lockAdmin = () => {
    setIsAdmin(false);
    if (['cashflow', 'reports'].includes(activeTab)) {
      setActiveTab('pos');
    }
  };

  const setAdminPin = (newPin: string) => {
    setAdminPinState(newPin);
  };

  const setPixConfig = (newConfig: PixConfig) => {
    setPixConfigState(newConfig);
    setDoc(doc(db, COLLECTIONS.SETTINGS, 'pix_config'), newConfig).catch(console.error);
  };

  // Cart management
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    playNotificationSound('push');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);
  }, [cart]);

  const cartCost = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.costPrice * item.quantity, 0);
  }, [cart]);

  // Notifications
  const addNotification = (title: string, body: string, type: PushNotification['type']) => {
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      body,
      timestamp: new Date().toISOString(),
      type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    playNotificationSound(type === 'pix' ? 'pix' : type === 'estoque' ? 'alert' : 'push');
    triggerBrowserPushNotification(title, body);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Make Sale: Real-time stock decrement, cart clearing, fiado debit + Firestore Write
  const makeSale = ({
    paymentMethod,
    customerId,
    fiadoCustomerData,
    notes,
  }: {
    paymentMethod: PaymentMethod;
    customerId?: string;
    fiadoCustomerData?: {
      name: string;
      phone: string;
      teamOrShirt?: string;
    };
    notes?: string;
  }) => {
    if (cart.length === 0) {
      return { success: false, error: 'O carrinho está vazio.' };
    }

    // Check stock availability
    for (const item of cart) {
      const currentProd = products.find((p) => p.id === item.product.id);
      if (!currentProd) {
        return { success: false, error: `Produto ${item.product.name} não encontrado.` };
      }
      if (currentProd.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Estoque insuficiente para ${currentProd.name}. Restam apenas ${currentProd.stockQuantity} unidades.`,
        };
      }
    }

    // Resolve or create customer if 'fiado'
    let selectedCustomer: Customer | undefined;
    let isNewInlineCustomer = false;

    if (paymentMethod === 'fiado') {
      if (customerId) {
        selectedCustomer = customers.find((c) => c.id === customerId);
        if (!selectedCustomer) {
          return { success: false, error: 'Cliente não encontrado.' };
        }
      } else if (fiadoCustomerData && fiadoCustomerData.name.trim()) {
        const cleanName = fiadoCustomerData.name.trim();
        const cleanPhone = fiadoCustomerData.phone.replace(/\D/g, '');
        if (cleanPhone.length < 8) {
          return { success: false, error: 'Informe um número de telefone/WhatsApp válido para anotar no fiado.' };
        }

        // Try matching an existing customer by phone digits or exact name
        const existingMatch = customers.find(
          (c) =>
            (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone) ||
            c.name.trim().toLowerCase() === cleanName.toLowerCase()
        );

        if (existingMatch) {
          selectedCustomer = {
            ...existingMatch,
            name: cleanName,
            phone: cleanPhone || existingMatch.phone,
            teamOrShirt: fiadoCustomerData.teamOrShirt?.trim() || existingMatch.teamOrShirt,
          };
        } else {
          isNewInlineCustomer = true;
          selectedCustomer = {
            id: `cust-${Date.now()}`,
            name: cleanName,
            phone: cleanPhone,
            teamOrShirt: fiadoCustomerData.teamOrShirt?.trim() || 'Torcedor',
            creditLimit: Math.max(150, Math.ceil(cartTotal / 50) * 50),
            totalDebt: 0,
            status: 'em_dia',
            createdAt: new Date().toISOString(),
          };
        }
      } else {
        return { success: false, error: 'Informe o nome e o número da pessoa ou selecione um cliente cadastrado para o fiado.' };
      }

      const newDebt = selectedCustomer.totalDebt + cartTotal;
      if (!isNewInlineCustomer && newDebt > selectedCustomer.creditLimit) {
        return {
          success: false,
          error: `Limite de fiado excedido! O limite de ${selectedCustomer.name} é de R$ ${selectedCustomer.creditLimit.toFixed(2)}, e o débito passaria para R$ ${newDebt.toFixed(2)}.`,
        };
      }
    }

    const saleItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.salePrice,
      costPrice: item.product.costPrice,
      subtotal: item.product.salePrice * item.quantity,
    }));

    const totalAmount = cartTotal;
    const totalCost = cartCost;
    const profit = totalAmount - totalCost;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: saleItems,
      totalAmount,
      totalCost,
      profit,
      paymentMethod,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      notes,
    };

    // 1. Decrement Stock local and remote
    const lowStockAlerts: { name: string; remaining: number }[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find((c) => c.product.id === prod.id);
        if (cartItem) {
          const newQty = prod.stockQuantity - cartItem.quantity;
          if (newQty <= prod.minStockThreshold) {
            lowStockAlerts.push({ name: prod.name, remaining: newQty });
          }
          // Firestore update
          updateDoc(doc(db, COLLECTIONS.PRODUCTS, prod.id), {
            stockQuantity: newQty,
          }).catch(console.error);

          return { ...prod, stockQuantity: newQty };
        }
        return prod;
      })
    );

    // 2. If fiado, create or update customer totalDebt and status
    if (paymentMethod === 'fiado' && selectedCustomer) {
      const newTotalDebt = selectedCustomer.totalDebt + totalAmount;
      const updatedStatus = newTotalDebt > 0 ? (selectedCustomer.status === 'inadimplente' ? 'inadimplente' : 'em_dia') : 'em_dia';

      if (isNewInlineCustomer) {
        const createdWithDebt: Customer = {
          ...selectedCustomer,
          totalDebt: newTotalDebt,
          lastPurchaseDate: new Date().toISOString(),
          status: updatedStatus,
        };
        setCustomers((prev) => [createdWithDebt, ...prev]);
        setDoc(doc(db, COLLECTIONS.CUSTOMERS, createdWithDebt.id), createdWithDebt).catch(console.error);
        addNotification(
          '👤 Novo Cliente Cadastrado no Fiado',
          `${createdWithDebt.name} (WhatsApp: ${createdWithDebt.phone}) iniciou comanda de R$ ${newTotalDebt.toFixed(2)}.`,
          'sistema'
        );
      } else {
        const updatedCustomer: Partial<Customer> = {
          name: fiadoCustomerData?.name?.trim() || selectedCustomer.name,
          phone: fiadoCustomerData?.phone?.replace(/\D/g, '') || selectedCustomer.phone,
          totalDebt: newTotalDebt,
          lastPurchaseDate: new Date().toISOString(),
          status: updatedStatus,
        };

        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer!.id ? { ...c, ...updatedCustomer } : c))
        );

        updateDoc(doc(db, COLLECTIONS.CUSTOMERS, selectedCustomer.id), updatedCustomer).catch(console.error);
      }
    }

    // 3. Record Sale to Firestore & Local
    setSales((prev) => [newSale, ...prev]);
    setDoc(doc(db, COLLECTIONS.SALES, newSale.id), newSale).catch(console.error);

    clearCart();

    // Trigger alerts
    playNotificationSound(paymentMethod === 'pix' ? 'pix' : 'success');

    if (lowStockAlerts.length > 0) {
      lowStockAlerts.forEach((alert) => {
        addNotification(
          `⚠️ Alerta de Estoque Baixo: ${alert.name}`,
          `Restam apenas ${alert.remaining} unidades na barraca. Providencie reposição!`,
          'estoque'
        );
      });
    }

    return { success: true, sale: newSale };
  };

  // Customer Management + Firestore Write
  const addCustomer = ({
    name,
    phone,
    teamOrShirt,
    creditLimit,
    notes,
  }: {
    name: string;
    phone: string;
    teamOrShirt: string;
    creditLimit: number;
    notes?: string;
  }): Customer => {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      teamOrShirt: teamOrShirt.trim() || 'Torcedor',
      creditLimit: Number(creditLimit) || 100,
      totalDebt: 0,
      status: 'em_dia',
      createdAt: new Date().toISOString(),
      notes,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setDoc(doc(db, COLLECTIONS.CUSTOMERS, newCustomer.id), newCustomer).catch(console.error);

    addNotification(
      '👤 Novo Cliente Cadastrado',
      `${newCustomer.name} (${newCustomer.teamOrShirt}) com limite de R$ ${newCustomer.creditLimit.toFixed(2)}.`,
      'sistema'
    );
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    updateDoc(doc(db, COLLECTIONS.CUSTOMERS, id), updates).catch(console.error);
  };

  // Settle Customer Debt via PIX or Dinheiro + Firestore Write
  const settleCustomerDebt = ({
    customerId,
    amount,
    paymentMethod,
    payerName,
    payerPhone,
    notes,
    pixTxId,
  }: {
    customerId: string;
    amount: number;
    paymentMethod: 'pix' | 'dinheiro';
    payerName?: string;
    payerPhone?: string;
    notes?: string;
    pixTxId?: string;
  }): DebtPayment | null => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return null;

    const actualAmount = Math.min(amount, customer.totalDebt);
    if (actualAmount <= 0) return null;

    const resolvedName = payerName?.trim() || customer.name;
    const cleanPhone = payerPhone ? payerPhone.replace(/\D/g, '') : '';
    const resolvedPhone = cleanPhone.length >= 8 ? cleanPhone : customer.phone;

    const payment: DebtPayment = {
      id: `pay-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customerId,
      customerName: resolvedName,
      amount: actualAmount,
      paymentMethod,
      pixTxId: pixTxId || (paymentMethod === 'pix' ? `PIX-${Date.now().toString(36).toUpperCase()}` : undefined),
      notes: notes || (resolvedPhone ? `WhatsApp: ${resolvedPhone}` : undefined),
    };

    const newDebt = Math.max(0, customer.totalDebt - actualAmount);
    const newStatus = newDebt === 0 ? 'em_dia' : customer.status;

    // Update customer debt + name/phone if updated
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            name: resolvedName,
            phone: resolvedPhone,
            totalDebt: newDebt,
            status: newStatus,
          };
        }
        return c;
      })
    );

    updateDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId), {
      name: resolvedName,
      phone: resolvedPhone,
      totalDebt: newDebt,
      status: newStatus,
    }).catch(console.error);

    // Record payment to Firestore
    setDebtPayments((prev) => [payment, ...prev]);
    setDoc(doc(db, COLLECTIONS.DEBT_PAYMENTS, payment.id), payment).catch(console.error);

    // Notify
    addNotification(
      `💸 Quitação ${paymentMethod === 'pix' ? 'PIX' : 'em Dinheiro'} Recebida!`,
      `${resolvedName} (${resolvedPhone}) quitou R$ ${actualAmount.toFixed(2)}. Restante da comanda: R$ ${newDebt.toFixed(2)}.`,
      paymentMethod === 'pix' ? 'pix' : 'sistema'
    );

    return payment;
  };

  // Expenses & Cash Flow + Firestore Write
  const addExpense = (data: Omit<Expense, 'id' | 'timestamp'>): Expense => {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setDoc(doc(db, COLLECTIONS.EXPENSES, newExpense.id), newExpense).catch(console.error);
    return newExpense;
  };

  // Products & Stock + Firestore Write
  const addProduct = (data: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);
    setDoc(doc(db, COLLECTIONS.PRODUCTS, newProduct.id), newProduct).catch(console.error);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), updates).catch(console.error);
  };

  const restockProduct = (id: string, quantityToAdd: number, autoRegisterExpense: boolean = true) => {
    const prod = products.find((p) => p.id === id);
    if (!prod || quantityToAdd <= 0) return;

    const newStock = prod.stockQuantity + quantityToAdd;

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stockQuantity: newStock } : p))
    );
    updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), { stockQuantity: newStock }).catch(console.error);

    if (autoRegisterExpense) {
      const expenseAmount = prod.costPrice * quantityToAdd;
      addExpense({
        description: `Reposição de Estoque: +${quantityToAdd} ${prod.unit} de ${prod.name}`,
        category: 'mercadoria_estoque',
        amount: expenseAmount,
        paymentMethod: 'pix',
        notes: `Custo unitário: R$ ${prod.costPrice.toFixed(2)}`,
      });
    }

    addNotification(
      '📦 Estoque Reabastecido',
      `+${quantityToAdd} ${prod.unit} de ${prod.name} adicionados ao estoque.`,
      'estoque'
    );
  };

  // Debt Notice dispatcher
  const sendDebtNotice = ({
    customerId,
    amount,
    message,
    type,
  }: {
    customerId: string;
    amount: number;
    message: string;
    type: 'whatsapp' | 'push';
  }) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    updateCustomer(customerId, {
      lastReminderDate: new Date().toISOString(),
    });

    addNotification(
      `📲 Cobrança Enviada (${type === 'whatsapp' ? 'WhatsApp' : 'Push'})`,
      `Cobrança de R$ ${amount.toFixed(2)} disparada para ${customer.name}.`,
      'cobranca'
    );
  };

  // Cash Flow calculations
  const cashFlowSummary = useMemo(() => {
    let totalRevenue = 0;
    let cashInDrawer = 0;
    let pixReceived = 0;
    let cardReceived = 0;
    let fiadoOutstanding = 0;
    let totalCost = 0;

    sales.forEach((s) => {
      totalRevenue += s.totalAmount;
      totalCost += s.totalCost;

      if (s.paymentMethod === 'dinheiro') {
        cashInDrawer += s.totalAmount;
      } else if (s.paymentMethod === 'pix') {
        pixReceived += s.totalAmount;
      } else if (s.paymentMethod === 'cartao_debito' || s.paymentMethod === 'cartao_credito') {
        cardReceived += s.totalAmount;
      } else if (s.paymentMethod === 'fiado') {
        fiadoOutstanding += s.totalAmount;
      }
    });

    debtPayments.forEach((p) => {
      if (p.paymentMethod === 'dinheiro') {
        cashInDrawer += p.amount;
      } else if (p.paymentMethod === 'pix') {
        pixReceived += p.amount;
      }
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const grossProfit = totalRevenue - totalCost;
    const netProfit = (cashInDrawer + pixReceived + cardReceived) - totalExpenses;
    const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      cashInDrawer,
      pixReceived,
      cardReceived,
      fiadoOutstanding,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMarginPercent,
    };
  }, [sales, expenses, debtPayments]);

  // Monthly Reports generator
  const availableReportMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-11');
    sales.forEach((s) => {
      const ym = s.timestamp.substring(0, 7);
      months.add(ym);
    });
    expenses.forEach((e) => {
      const ym = e.timestamp.substring(0, 7);
      months.add(ym);
    });
    return Array.from(months).sort().reverse();
  }, [sales, expenses]);

  const getMonthlyReport = (yearMonth: string): MonthlyReportSummary => {
    const monthSales = sales.filter((s) => s.timestamp.startsWith(yearMonth));
    const monthExpenses = expenses.filter((e) => e.timestamp.startsWith(yearMonth));
    const monthPayments = debtPayments.filter((p) => p.timestamp.startsWith(yearMonth));

    let totalSales = 0;
    let cashSales = 0;
    let pixSales = 0;
    let cardSales = 0;
    let fiadoSales = 0;
    let totalCost = 0;

    monthSales.forEach((s) => {
      totalSales += s.totalAmount;
      totalCost += s.totalCost;
      if (s.paymentMethod === 'dinheiro') cashSales += s.totalAmount;
      else if (s.paymentMethod === 'pix') pixSales += s.totalAmount;
      else if (s.paymentMethod === 'cartao_debito' || s.paymentMethod === 'cartao_credito') cardSales += s.totalAmount;
      else if (s.paymentMethod === 'fiado') fiadoSales += s.totalAmount;
    });

    const debtCollected = monthPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const grossProfit = totalSales - totalCost;
    const netProfit = (cashSales + pixSales + cardSales + debtCollected) - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    const totalDelinquentDebt = customers.reduce((acc, c) => acc + c.totalDebt, 0);
    const totalCreditedEver = totalSales + totalDelinquentDebt;
    const delinquencyRate = totalCreditedEver > 0 ? (totalDelinquentDebt / totalCreditedEver) * 100 : 0;

    // Top selling products
    const productCountMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    monthSales.forEach((s) => {
      s.items.forEach((item) => {
        if (!productCountMap[item.productId]) {
          productCountMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productCountMap[item.productId].quantity += item.quantity;
        productCountMap[item.productId].revenue += item.subtotal;
      });
    });

    const topSellingProducts = Object.values(productCountMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const [year, month] = yearMonth.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthLabel = `${monthNames[parseInt(month, 10) - 1] || month} de ${year}`;

    return {
      monthKey: yearMonth,
      monthLabel,
      totalSales,
      cashSales,
      pixSales,
      cardSales,
      fiadoSales,
      debtCollected,
      totalCost,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMargin,
      totalDelinquentDebt,
      delinquencyRate,
      salesCount: monthSales.length,
      topSellingProducts,
    };
  };

  const resetToMockData = () => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setDebtPayments([]);
    setPixConfigState(INITIAL_PIX_CONFIG);
    setNotifications(INITIAL_NOTIFICATIONS);
    setIsAdmin(true);
    setAdminPinState('1234');
    setCart([]);

    // Seed Firestore
    const batch = writeBatch(db);
    INITIAL_PRODUCTS.forEach((p) => {
      batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
    });
    INITIAL_CUSTOMERS.forEach((c) => {
      batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), c);
    });
    INITIAL_SALES.forEach((s) => {
      batch.set(doc(db, COLLECTIONS.SALES, s.id), s);
    });
    INITIAL_EXPENSES.forEach((e) => {
      batch.set(doc(db, COLLECTIONS.EXPENSES, e.id), e);
    });
    batch.set(doc(db, COLLECTIONS.SETTINGS, 'pix_config'), INITIAL_PIX_CONFIG);
    batch.commit().catch(console.error);

    addNotification('🔄 Dados Restaurados', 'Todos os dados e fotos foram sincronizados no Banco de Dados da barraca.', 'sistema');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAdmin,
        unlockAdmin,
        lockAdmin,
        adminPin,
        setAdminPin,
        theme,
        toggleTheme,
        isFirestoreConnected,
        firestoreSyncStatus,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCost,
        products,
        customers,
        sales,
        expenses,
        debtPayments,
        pixConfig,
        setPixConfig,
        notifications,
        unreadNotificationCount,
        makeSale,
        addCustomer,
        updateCustomer,
        settleCustomerDebt,
        addExpense,
        addProduct,
        updateProduct,
        restockProduct,
        sendDebtNotice,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        cashFlowSummary,
        getMonthlyReport,
        availableReportMonths,
        resetToMockData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
