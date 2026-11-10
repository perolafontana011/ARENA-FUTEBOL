export type ProductCategory = 
  | 'comidas'
  | 'bebidas_alcoolicas'
  | 'bebidas'
  | 'petiscos_doces';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  costPrice: number; // Preço de custo
  salePrice: number; // Preço de venda
  stockQuantity: number; // Estoque atual
  minStockThreshold: number; // Alerta de estoque mínimo
  unit: string; // 'un', 'lata', 'espeto', 'copo', 'dose'
  description?: string;
  imageUrl?: string;
}

export type DebtStatus = 'em_dia' | 'atencao' | 'inadimplente';

export interface Customer {
  id: string;
  name: string;
  phone: string; // WhatsApp: e.g. "11987654321"
  teamOrShirt: string; // ex: "Camisa 10 - Unidos da Vila", "Torcedor do Grêmio"
  creditLimit: number; // Limite de fiado
  totalDebt: number; // Saldo devedor total
  status: DebtStatus;
  createdAt: string;
  lastPurchaseDate?: string;
  lastReminderDate?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'fiado';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  timestamp: string; // ISO string
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'mercadoria_estoque'
  | 'gelo_carvao'
  | 'aluguel_taxa_campeonato'
  | 'mao_de_obra'
  | 'descartaveis_utensilios'
  | 'outros';

export interface Expense {
  id: string;
  timestamp: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'pix' | 'dinheiro' | 'transferencia';
  notes?: string;
}

export interface DebtPayment {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'pix' | 'dinheiro';
  pixTxId?: string;
  notes?: string;
}

export interface DebtNotice {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  amount: number;
  timestamp: string;
  type: 'whatsapp' | 'push';
  message: string;
  status: 'enviada' | 'visualizada' | 'paga';
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'cobranca' | 'estoque' | 'pix' | 'sistema';
  read: boolean;
  actionUrl?: string;
}

export interface PixConfig {
  key: string;
  keyType: 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria';
  merchantName: string;
  merchantCity: string;
}

export interface MonthlyReportSummary {
  monthKey: string; // e.g. "2026-11"
  monthLabel: string; // e.g. "Novembro / 2026"
  totalSales: number;
  cashSales: number;
  pixSales: number;
  cardSales: number;
  fiadoSales: number;
  debtCollected: number;
  totalCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalDelinquentDebt: number; // Dívidas vencidas
  delinquencyRate: number; // Taxa de inadimplência (%)
  salesCount: number;
  topSellingProducts: { name: string; quantity: number; revenue: number }[];
}
