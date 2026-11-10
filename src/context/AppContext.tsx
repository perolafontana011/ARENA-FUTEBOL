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

interface AppContextType {
  // Navigation & Role
  activeTab: 'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports';
  setActiveTab: (tab: 'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports') => void;
  isAdmin: boolean;
  unlockAdmin: (pin: string) => boolean;
  lockAdmin: () => void;
  adminPin: string;
  setAdminPin: (pin: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCost: number;

  // Core Data
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
  // Navigation & Role
  const [activeTab, setActiveTab] = useState<'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports'>('pos');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
  });
  const [adminPin, setAdminPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
  });

  // Data Collections with LocalStorage caching
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((p: Product) => {
        const initial = INITIAL_PRODUCTS.find((ip) => ip.id === p.id);
        return {
          ...p,
          imageUrl: p.imageUrl || initial?.imageUrl,
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

  // Sync with LocalStorage
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
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, adminPin);
  }, [adminPin]);

  // Admin PIN management
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
    // If on a restricted tab, go back to POS
    if (['cashflow', 'reports'].includes(activeTab)) {
      setActiveTab('pos');
    }
  };

  const setAdminPin = (newPin: string) => {
    setAdminPinState(newPin);
  };

  const setPixConfig = (newConfig: PixConfig) => {
    setPixConfigState(newConfig);
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

  // Make Sale: Real-time stock decrement, cart clearing, fiado debit
  const makeSale = ({
    paymentMethod,
    customerId,
    notes,
  }: {
    paymentMethod: PaymentMethod;
    customerId?: string;
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

    // Check customer credit limit if 'fiado'
    let selectedCustomer: Customer | undefined;
    if (paymentMethod === 'fiado') {
      if (!customerId) {
        return { success: false, error: 'Selecione um cliente para registrar no fiado.' };
      }
      selectedCustomer = customers.find((c) => c.id === customerId);
      if (!selectedCustomer) {
        return { success: false, error: 'Cliente não encontrado.' };
      }
      const newDebt = selectedCustomer.totalDebt + cartTotal;
      if (newDebt > selectedCustomer.creditLimit) {
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

    // 1. Decrement Stock
    const lowStockAlerts: { name: string; remaining: number }[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find((c) => c.product.id === prod.id);
        if (cartItem) {
          const newQty = prod.stockQuantity - cartItem.quantity;
          if (newQty <= prod.minStockThreshold) {
            lowStockAlerts.push({ name: prod.name, remaining: newQty });
          }
          return { ...prod, stockQuantity: newQty };
        }
        return prod;
      })
    );

    // 2. If fiado, update customer totalDebt and status
    if (paymentMethod === 'fiado' && selectedCustomer) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === selectedCustomer!.id) {
            const newTotalDebt = c.totalDebt + totalAmount;
            return {
              ...c,
              totalDebt: newTotalDebt,
              lastPurchaseDate: new Date().toISOString(),
              status: newTotalDebt > 0 ? (c.status === 'inadimplente' ? 'inadimplente' : 'em_dia') : 'em_dia',
            };
          }
          return c;
        })
      );
    }

    // 3. Record Sale
    setSales((prev) => [newSale, ...prev]);
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

  // Customer Management
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
  };

  // Settle Customer Debt via PIX or Dinheiro
  const settleCustomerDebt = ({
    customerId,
    amount,
    paymentMethod,
    notes,
    pixTxId,
  }: {
    customerId: string;
    amount: number;
    paymentMethod: 'pix' | 'dinheiro';
    notes?: string;
    pixTxId?: string;
  }): DebtPayment | null => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return null;

    const actualAmount = Math.min(amount, customer.totalDebt);
    if (actualAmount <= 0) return null;

    const payment: DebtPayment = {
      id: `pay-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customerId,
      customerName: customer.name,
      amount: actualAmount,
      paymentMethod,
      pixTxId: pixTxId || (paymentMethod === 'pix' ? `PIX-${Date.now().toString(36).toUpperCase()}` : undefined),
      notes,
    };

    // Update customer debt
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.totalDebt - actualAmount);
          return {
            ...c,
            totalDebt: newDebt,
            status: newDebt === 0 ? 'em_dia' : c.status,
          };
        }
        return c;
      })
    );

    // Record payment
    setDebtPayments((prev) => [payment, ...prev]);

    // Notify
    addNotification(
      `💸 Quitação ${paymentMethod === 'pix' ? 'PIX' : 'em Dinheiro'} Recebida!`,
      `${customer.name} quitou R$ ${actualAmount.toFixed(2)}. Restante da comanda: R$ ${(customer.totalDebt - actualAmount).toFixed(2)}.`,
      paymentMethod === 'pix' ? 'pix' : 'sistema'
    );

    return payment;
  };

  // Expenses & Cash Flow
  const addExpense = (data: Omit<Expense, 'id' | 'timestamp'>): Expense => {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  // Products & Stock
  const addProduct = (data: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const restockProduct = (id: string, quantityToAdd: number, autoRegisterExpense: boolean = true) => {
    const prod = products.find((p) => p.id === id);
    if (!prod || quantityToAdd <= 0) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stockQuantity: p.stockQuantity + quantityToAdd } : p
      )
    );

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

  // Financial summary computation
  const cashFlowSummary = useMemo(() => {
    // Sales breakdown
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
      }
    });

    // Add debt payments (quitação de fiado)
    debtPayments.forEach((dp) => {
      if (dp.paymentMethod === 'dinheiro') {
        cashInDrawer += dp.amount;
      } else if (dp.paymentMethod === 'pix') {
        pixReceived += dp.amount;
      }
    });

    // Current total outstanding debt across all customers
    fiadoOutstanding = customers.reduce((acc, c) => acc + c.totalDebt, 0);

    // Expenses breakdown
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const grossProfit = totalRevenue - totalCost;
    // Net profit = Cash + PIX + Card actually collected (or total sales) minus total expenses
    // Cash balance in hand = (Cash in drawer + PIX in account) minus expenses paid
    const netProfit = totalRevenue - totalExpenses;
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
  }, [sales, expenses, debtPayments, customers]);

  // Automated Monthly Report Builder
  const availableReportMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    // Add current month
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentYearMonth);

    // Add previous month
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(prevYearMonth);

    // Add months from sales and expenses
    sales.forEach((s) => {
      const d = new Date(s.timestamp);
      monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    expenses.forEach((e) => {
      const d = new Date(e.timestamp);
      monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });

    return Array.from(monthsSet).sort().reverse();
  }, [sales, expenses]);

  const getMonthlyReport = (yearMonth: string): MonthlyReportSummary => {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthLabel = `${monthNames[month - 1]} de ${year}`;

    // Filter sales for month
    const monthSales = sales.filter((s) => {
      const d = new Date(s.timestamp);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    // Filter expenses for month
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.timestamp);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    // Filter debt payments for month
    const monthDebtPayments = debtPayments.filter((p) => {
      const d = new Date(p.timestamp);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    let totalSales = 0;
    let cashSales = 0;
    let pixSales = 0;
    let cardSales = 0;
    let fiadoSales = 0;
    let totalCost = 0;

    const productSalesMap = new Map<string, { quantity: number; revenue: number }>();

    monthSales.forEach((s) => {
      totalSales += s.totalAmount;
      totalCost += s.totalCost;
      if (s.paymentMethod === 'dinheiro') cashSales += s.totalAmount;
      if (s.paymentMethod === 'pix') pixSales += s.totalAmount;
      if (s.paymentMethod === 'cartao_debito' || s.paymentMethod === 'cartao_credito') cardSales += s.totalAmount;
      if (s.paymentMethod === 'fiado') fiadoSales += s.totalAmount;

      s.items.forEach((item) => {
        const cur = productSalesMap.get(item.productName) || { quantity: 0, revenue: 0 };
        productSalesMap.set(item.productName, {
          quantity: cur.quantity + item.quantity,
          revenue: cur.revenue + item.subtotal,
        });
      });
    });

    const debtCollected = monthDebtPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const grossProfit = totalSales - totalCost;
    const netProfit = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Inadimplência calculation: Customers with debt in status 'inadimplente'
    const totalDelinquentDebt = customers
      .filter((c) => c.status === 'inadimplente' && c.totalDebt > 0)
      .reduce((acc, c) => acc + c.totalDebt, 0);

    const delinquencyRate = totalSales > 0 ? (totalDelinquentDebt / totalSales) * 100 : 0;

    const topSellingProducts = Array.from(productSalesMap.entries())
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

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
    setIsAdmin(false);
    setAdminPinState('1234');
    setCart([]);
    addNotification('🔄 Dados Restaurados', 'Todos os dados foram resetados para a demonstração da barraca.', 'sistema');
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
