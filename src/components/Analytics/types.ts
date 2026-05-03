export interface AnalyticsOverview {
  totalRevenue: number;
  netRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalUsers: number;
}

export interface RevenuePoint {
  month?: string;
  day?: string;
  revenue: number;
}

export interface OrdersPoint {
  month?: string;
  day?: string;
  count: number;
}

export interface TopProduct {
  productId: string | null;
  name: string;
  image: string | null;
  price: number | null;
  totalSold: number;
}

export interface StockProduct {
  productId: string;
  name: string;
  image: string | null;
  stock: number;
  sizeStock: Record<string, number> | null;
  price: number | null;
}

export interface StockAlerts {
  threshold: number;
  outOfStock: StockProduct[];
  lowStock: StockProduct[];
}

export interface RecentOrder {
  _id: string;
  userId: string | null;
  customer: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface AnalyticsPayload {
  range: { from: string; to: string };
  selectedMonth?: string;
  overview: AnalyticsOverview;
  revenueSeries: RevenuePoint[];
  ordersSeries: OrdersPoint[];
  topProducts: TopProduct[];
  stockAlerts: StockAlerts;
  recentOrders: RecentOrder[];
}
