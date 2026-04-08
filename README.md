# ⚡# Thunderbolt Brand World - Technical Architecture Documentation

## 1. Project Overview

Thunderbolt Brand World is a production-grade e-commerce platform engineered for premium denim retail. The system implements a modern JAMstack architecture with React + TypeScript frontend, Vercel serverless backend, and MongoDB Atlas database, designed for scalability, performance, and exceptional user experience.

### Business Intent
- Premium denim e-commerce with cinematic user experience
- High-performance, mobile-first responsive design
- Advanced cart and wishlist management with hybrid storage
- Admin panel for product and order management
- Payment gateway ready architecture (Razorpay integration prepared)

### Architecture Philosophy
- **Frontend-Heavy**: Rich client-side interactions with serverless backend
- **Stateless Backend**: Vercel functions for API endpoints
- **Hybrid Storage**: localStorage + MongoDB for optimal performance
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Mobile-First**: Responsive design with touch-optimized interactions

## 2. System Architecture

### Frontend Architecture
```
src/
|-- components/          # Reusable UI components
|   |-- ui/             # shadcn/ui base components
|   |-- auth/           # Authentication components
|   |-- checkout/       # Checkout flow components
|   |-- *.tsx           # Feature-specific components
|-- context/            # React Context providers
|   |-- AuthContext.tsx
|   |-- CartContext.tsx
|   |-- WishlistContext.tsx
|-- hooks/              # Custom React hooks
|-- lib/                # Utility libraries
|   |-- firebase.ts     # Firebase configuration
|   |-- products.ts     # Product data management
|   |-- storage.ts      # Local storage utilities
|   |-- utils.ts        # General utilities
|-- pages/              # Route components
|   |-- Admin.tsx       # Admin dashboard
|   |-- ProductView.tsx # Product detail page
|   |-- Checkout.tsx    # Checkout flow
|   |-- *.tsx           # Other pages
```

### Backend Architecture (Vercel Serverless)
```
api/
|-- _lib/               # Shared backend utilities
|   |-- mongodb.js      # Database connection
|   |-- response.js     # Response helpers
|   |-- validator.js    # Input validation
|-- products/           # Product CRUD operations
|   |-- index.js        # GET/POST/PUT/DELETE
|-- categories/         # Category management
|   |-- index.js        # GET/POST/DELETE
|-- orders/             # Order management
|   |-- index.js        # GET user orders
|   |-- create.js       # POST new order
|   |-- [id].js         # PATCH/DELETE specific order
|-- cart/               # Cart operations
|   |-- index.js        # GET/POST/DELETE cart items
|-- wishlist/           # Wishlist operations
|   |-- index.js        # GET/POST/DELETE wishlist items
|-- users/              # User operations
|   |-- create.js       # POST new user
|-- address/            # Address management
|   |-- index.js        # GET/POST/PUT/DELETE addresses
```

### Database Design (MongoDB Atlas)

#### Collections Schema

**products**
```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  price: Number,
  image: String,           // Single image URL
  description: String,
  stock: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**categories**
```javascript
{
  _id: ObjectId,
  name: String,
  image: String,
  createdAt: Date
}
```

**users**
```javascript
{
  _id: ObjectId,
  email: String,
  displayName: String,
  photoURL: String,
  createdAt: Date,
  lastLogin: Date
}
```

**orders**
```javascript
{
  _id: ObjectId,
  userId: String,
  products: [{
    productId: String,
    name: String,
    price: Number,
    image: String,
    quantity: Number,
    size: String
  }],
  totalAmount: Number,
  status: String,          // pending, confirmed, shipped, delivered
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**cart**
```javascript
{
  _id: ObjectId,
  userId: String,
  items: [{
    productId: String,
    quantity: Number,
    size: String,
    addedAt: Date
  }],
  updatedAt: Date
}
```

**wishlist**
```javascript
{
  _id: ObjectId,
  userId: String,
  items: [{
    productId: String,
    name: String,
    price: Number,
    image: String,
    addedAt: Date
  }],
  updatedAt: Date
}
```

### Data Flow Architecture

```
User Interaction
    |
    v
React Component
    |
    v
Context Provider (Auth/Cart/Wishlist)
    |
    v
API Service Layer
    |
    v
Vercel Serverless Function
    |
    v
MongoDB Atlas
```

## 3. Feature Breakdown

### Authentication System

**Firebase Integration**
- Google OAuth and Email/Password authentication
- JWT token management with automatic refresh
- Session persistence in localStorage
- Protected route enforcement

**Token Handling**
```typescript
// AuthContext.tsx
const getIdToken = async () => {
  if (!user) return null;
  return await user.getIdToken(true); // Force refresh
};

// API calls include Authorization header
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Cart System

**Hybrid Storage Architecture**
- Primary: localStorage for instant UI updates
- Secondary: MongoDB for persistence across devices
- Sync mechanism: localStorage first, then async DB sync

**Sync Logic**
```typescript
// CartContext.tsx - syncLocalToDB
const syncLocalToDB = async () => {
  if (!user) return;
  
  // Get local cart
  const localCart = getCartFromStorage();
  
  // Sync to database
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ items: localCart })
  });
  
  // Merge with DB cart if conflicts
  const dbCart = await response.json();
  const mergedCart = mergeCarts(localCart, dbCart.items);
  saveCartToStorage(mergedCart);
};
```

### Wishlist System

**Toggle Logic**
```typescript
// WishlistContext.tsx
const toggleWishlist = async (product: Product) => {
  const isInWishlist = wishlistItems.some(item => item.productId === product._id);
  
  if (isInWishlist) {
    await removeFromWishlist(product._id);
  } else {
    await addToWishlist({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  }
};
```

### Product System

**Data Source**
- Single source of truth: MongoDB products collection
- No static product data in frontend
- Dynamic category system

**Category Filtering**
```typescript
// CategoryView.tsx
const filteredProducts = products.filter(product => 
  product.category.toLowerCase() === category.toLowerCase()
);
```

### Order System

**Order Creation Flow**
```typescript
// Checkout.tsx
const createOrder = async (orderData: OrderData) => {
  const response = await fetch('/api/orders/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  
  const order = await response.json();
  return order;
};
```

### Checkout System

**Current Implementation**
- Address collection and validation
- Order summary with itemized pricing
- WhatsApp checkout integration (legacy)

**Payment Gateway Ready**
```typescript
// Prepared for Razorpay integration
interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

// Future payment verification
const verifyPayment = async (paymentData: PaymentData) => {
  const response = await fetch('/api/verify-payment', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
  return response.json();
};
```

## 4. Payment System Design

### Razorpay Integration Architecture

**Order Creation Flow**
```
Frontend Request
    |
    v
/api/create-order (Serverless)
    |
    v
Razorpay API -> Create Order
    |
    v
Return Order ID to Frontend
    |
    v
Initialize Razorpay Checkout
    |
    v
Payment Completion
    |
    v
/api/verify-payment (Serverless)
    |
    v
Signature Verification
    |
    v
Update Order Status
```

### Serverless API Endpoints

**POST /api/create-order**
```javascript
export default async function handler(req, res) {
  const { amount, currency = 'INR', receipt } = req.body;
  
  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt,
    payment_capture: 1
  };
  
  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
}
```

**POST /api/verify-payment**
```javascript
export default async function handler(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest('hex');
  
  const isAuthentic = expectedSignature === razorpay_signature;
  
  if (isAuthentic) {
    // Update order status in database
    await updateOrderStatus(razorpay_order_id, 'confirmed');
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Invalid signature' });
  }
}
```

**POST /api/webhook**
```javascript
export default async function handler(req, res) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  
  // Verify webhook signature
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');
  
  if (signature === expectedSignature) {
    // Process webhook event
    const event = req.body.event;
    
    switch (event) {
      case 'payment.captured':
        await handlePaymentSuccess(req.body.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailure(req.body.payload.payment.entity);
        break;
    }
    
    res.status(200).json({ received: true });
  } else {
    res.status(400).json({ error: 'Invalid webhook signature' });
  }
}
```

### Security Considerations
- HMAC-SHA256 signature verification
- Webhook signature validation
- Server-side order status updates
- Payment amount validation
- Rate limiting on payment endpoints

## 5. Vercel Serverless Backend

### Stateless Architecture
- Each API call is independent
- No in-memory state between requests
- Database as single source of truth
- JWT tokens for authentication

### Execution Model
```javascript
// API Route Structure
export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
  // 2. Authentication Check
  const token = req.headers.authorization?.split(' ')[1];
  const user = await verifyToken(token);
  
  // 3. Database Connection
  const db = await getDb();
  
  // 4. Business Logic
  switch (req.method) {
    case 'GET':
      // Handle GET requests
      break;
    case 'POST':
      // Handle POST requests
      break;
    // ... other methods
  }
}
```

### Limitations and Mitigations
- **Cold Starts**: Keep functions warm with periodic calls
- **Execution Timeout**: Optimize database queries, use indexes
- **Memory Limits**: Stream large responses, paginate results
- **No Shared Memory**: Use Redis for caching if needed

### Best Practices
- Input validation with Zod schemas
- Error handling with consistent response format
- Database connection pooling
- Environment variable security
- Request logging and monitoring

## 6. Frontend Architecture

### Component Structure
```typescript
// Base Component Pattern
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Custom hooks
  const { data, loading, error } = useCustomHook();
  
  // Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Render
  return (
    <div className="component-styles">
      {/* Component JSX */}
    </div>
  );
};
```

### Context System
```typescript
// AuthContext Pattern
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State and logic
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Routing System
```typescript
// React Router v6 Configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'products/:id', element: <ProductView /> },
      { path: 'category/:category', element: <CategoryView /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'orders', element: <Orders /> },
      { path: 'admin', element: <Admin /> }
    ]
  }
]);
```

### State Management Philosophy
- **Context API**: For global state (auth, cart, wishlist)
- **Local State**: For component-specific state
- **Server State**: Fetched data with React Query (if needed)
- **URL State**: For filters, pagination, search

## 7. UI/UX System

### Design System (Void & Brass Theme)
```css
/* Color Palette */
:root {
  --void: #0a0a0a;          /* Primary background */
  --brass: #d4af37;         /* Primary accent */
  --tb-white: #ffffff;      /* Text primary */
  --sv-mid: #888888;        /* Text secondary */
  --surface: #1a1a1a;      /* Card backgrounds */
}

/* Typography */
.font-display { /* Display fonts for headings */ }
.font-condensed { /* Condensed fonts for emphasis */ }
```

### Animation System (Framer Motion)
```typescript
// Page Transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Component Animations
const cardVariants = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
};
```

### Search Overlay System
```typescript
// SearchOverlay.tsx
const SearchOverlay = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  
  // Real-time search with debouncing
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery) => {
      const results = await searchProducts(searchQuery);
      setResults(results);
    }, 300),
    []
  );
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80"
        >
          {/* Search UI */}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### Responsiveness Strategy
```css
/* Mobile-First Approach */
.grid {
  @apply grid grid-cols-2 gap-4;      /* Mobile: 2 cols */
  @apply md:grid-cols-3;             /* Tablet: 3 cols */
  @apply lg:grid-cols-4;             /* Desktop: 4 cols */
}

/* Touch-Optimized Interactions */
.button {
  @apply min-h-[44px] min-w-[44px];  /* Minimum touch target */
}
```

## 8. Performance Optimizations

### Lazy Loading
```typescript
// Component Lazy Loading
const Admin = lazy(() => import('./pages/Admin'));
const Checkout = lazy(() => import('./pages/Checkout'));

// Image Lazy Loading
<img
  src={product.image}
  alt={product.name}
  loading="lazy"
  className="w-full h-full object-cover"
/>
```

### Code Splitting
```typescript
// Route-based code splitting
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { 
        path: 'admin', 
        element: <Suspense fallback={<Loading />}><Admin /></Suspense> 
      }
    ]
  }
]);
```

### API Efficiency
```typescript
// Batching API calls
const fetchMultiple = async () => {
  const [products, categories, cart] = await Promise.all([
    fetch('/api/products'),
    fetch('/api/categories'),
    fetch('/api/cart')
  ]);
};

// Response caching
const cachedFetch = (() => {
  const cache = new Map();
  
  return async (url: string) => {
    if (cache.has(url)) {
      return cache.get(url);
    }
    
    const response = await fetch(url);
    const data = await response.json();
    cache.set(url, data);
    
    return data;
  };
})();
```

### Client vs Server Responsibilities
- **Client**: UI rendering, state management, user interactions
- **Server**: Data validation, database operations, authentication
- **Shared**: Type definitions, validation schemas

## 9. Security Considerations

### Authentication Security
```typescript
// JWT Token Validation
const verifyToken = async (token: string) => {
  try {
    const decodedToken = jwt.decode(token);
    const user = await adminAuth.getUser(decodedToken.uid);
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Admin Protection
const ADMIN_EMAIL = "nikhilwebworks@gmail.com";
const isAdmin = (user: User) => user.email === ADMIN_EMAIL;
```

### API Protection
```javascript
// Middleware Pattern
const withAuth = (handler) => {
  return async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const user = await verifyToken(token);
      req.user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

// Usage
export default withAuth(async (req, res) => {
  // Protected logic
});
```

### Payment Security
```typescript
// Signature Verification
const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest('hex');
  
  return expectedSignature === signature;
};

// Amount Validation
const validatePaymentAmount = (orderAmount: number, paidAmount: number) => {
  return orderAmount === paidAmount;
};
```

### Data Validation
```typescript
// Zod Schemas
const productSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  category: z.string(),
  image: z.string().url(),
  stock: z.number().min(0)
});

// API Validation
export default async function handler(req, res) {
  try {
    const validatedData = productSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid data' });
  }
}
```

## 10. Environment Variables

### Required Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Razorpay (Future Implementation)
RAZORPAY_KEY_ID=rzp_live_abcdef
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Admin Configuration
ADMIN_EMAIL=nikhilwebworks@gmail.com

# Application Configuration
NODE_ENV=production
VITE_API_BASE_URL=https://your-domain.vercel.app
```

### Environment Setup
```typescript
// firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## 11. Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Firebase project

### Installation Steps
```bash
# Clone repository
git clone https://github.com/your-username/thunderbolt-brand-world.git
cd thunderbolt-brand-world

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "npm run server & npm run dev:client",
    "dev:client": "vite",
    "server": "node server.js",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Local API Development
```bash
# Start local server for API testing
npm run server

# API endpoints available at:
# http://localhost:3000/api/products
# http://localhost:3000/api/categories
# http://localhost:3000/api/orders
```

### Testing Flows
```typescript
// Example test setup
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Test example
test('adds product to cart', async () => {
  render(<ProductView productId="123" />, { wrapper: TestWrapper });
  
  const addToCartButton = screen.getByText('Add to Cart');
  fireEvent.click(addToCartButton);
  
  expect(screen.getByText('Added to cart')).toBeInTheDocument();
});
```

## 12. Deployment

### Vercel Deployment Process
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy with custom domain
vercel --prod your-domain.com
```

### Environment Setup on Vercel
1. Go to Vercel dashboard
2. Select project
3. Go to Settings > Environment Variables
4. Add all required environment variables
5. Redeploy application

### Production Considerations
- **Database Indexes**: Ensure proper MongoDB indexes
- **CORS Configuration**: Set allowed origins
- **Rate Limiting**: Implement API rate limiting
- **Monitoring**: Set up error tracking and analytics
- **CDN**: Configure for static assets

### Deployment Checklist
```bash
# Pre-deployment checks
npm run lint                    # Code quality
npm run test                    # Test suite
npm run build                   # Build verification

# Production deployment
vercel --prod                   # Deploy to production

# Post-deployment verification
curl https://your-domain.com/api/products  # API health check
```

## 13. Edge Cases & Failure Handling

### Payment Failures
```typescript
// Payment failure handling
const handlePaymentFailure = async (paymentData: PaymentData) => {
  // Update order status
  await updateOrderStatus(paymentData.orderId, 'failed');
  
  // Notify user
  toast.error('Payment failed. Please try again.');
  
  // Log error for monitoring
  console.error('Payment failure:', paymentData);
  
  // Offer retry option
  showRetryPayment(paymentData.orderId);
};
```

### Cart Sync Conflicts
```typescript
// Conflict resolution strategy
const resolveCartConflicts = (localCart: CartItem[], dbCart: CartItem[]) => {
  const merged = new Map();
  
  // Add local items (take precedence)
  localCart.forEach(item => {
    merged.set(`${item.productId}-${item.size}`, item);
  });
  
  // Add DB items only if not present locally
  dbCart.forEach(item => {
    const key = `${item.productId}-${item.size}`;
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  });
  
  return Array.from(merged.values());
};
```

### Auth Edge Cases
```typescript
// Token refresh handling
const refreshToken = async () => {
  try {
    await user?.getIdToken(true); // Force refresh
    return true;
  } catch (error) {
    // Clear invalid session
    logout();
    navigate('/login');
    return false;
  }
};

// Network error handling
const apiCallWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * i));
    }
  }
};
```

### API Failures
```typescript
// Graceful degradation
const fetchWithFallback = async (url: string, fallbackData: any) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API error');
    return response.json();
  } catch (error) {
    console.warn('API failed, using fallback:', error);
    return fallbackData;
  }
};

// Error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

## 14. Future Roadmap

### Payment Gateway Full Rollout
- Razorpay integration completion
- Multiple payment methods (UPI, Cards, NetBanking)
- Payment analytics and reporting
- Refund and cancellation handling

### Admin Dashboard Expansion
- Advanced order management
- Customer analytics
- Inventory management
- Sales reporting dashboard
- Bulk product operations

### Analytics Implementation
- Google Analytics integration
- Custom event tracking
- User behavior analysis
- Conversion funnel optimization
- A/B testing framework

### Scalability Improvements
- Redis caching layer
- CDN optimization
- Database sharding strategy
- Microservices architecture
- GraphQL API implementation

### Feature Enhancements
- Product recommendation engine
- Customer reviews and ratings
- Advanced search with filters
- Multi-language support
- Progressive Web App (PWA)

## 15. Code Quality & Standards

### TypeScript Usage
```typescript
// Strict type checking
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}

// Interface definitions
interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generic types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}
```

### Component Design Principles
```typescript
// Single Responsibility Principle
const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  // Only handles product display and add to cart
  return (
    <div className="product-card">
      {/* Product content */}
    </div>
  );
};

// Composition over Inheritance
const ProductGrid = ({ products, loading }: ProductGridProps) => {
  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard 
          key={product._id} 
          product={product} 
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
};
```

### Folder Structure Explanation
```
src/
|-- components/          # Reusable UI components
|   |-- ui/             # Base UI components (buttons, inputs, etc.)
|   |-- auth/           # Authentication-specific components
|   |-- checkout/       # Checkout flow components
|   |-- *.tsx           # Feature-specific components
|-- context/            # Global state management
|-- hooks/              # Custom React hooks
|-- lib/                # Utility functions and configurations
|-- pages/              # Route-level components
|-- styles/             # Global styles and CSS
|-- types/              # TypeScript type definitions
|-- utils/              # Helper functions
```

### Code Standards
- **ESLint**: Enforce code quality and consistency
- **Prettier**: Automatic code formatting
- **Husky**: Git hooks for pre-commit checks
- **Conventional Commits**: Standardized commit messages
- **TypeScript**: Strict type checking throughout

### Testing Strategy
```typescript
// Unit tests with Vitest
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    const product = {
      _id: '1',
      name: 'Test Product',
      price: 99.99,
      image: 'test.jpg',
      category: 'test'
    };
    
    render(<ProductCard product={product} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
  });
});

// Integration tests
import { renderWithProviders } from '../test-utils';
import { Cart } from './Cart';

test('cart displays correct total', async () => {
  renderWithProviders(<Cart />);
  
  // Add items to cart
  // Verify total calculation
  expect(screen.getByText('Total: ¥199.98')).toBeInTheDocument();
});
```

---

## Conclusion

Thunderbolt Brand World represents a modern, production-ready e-commerce platform built with cutting-edge web technologies. The architecture emphasizes scalability, performance, and maintainability while providing an exceptional user experience.

The system is designed for:
- **High Performance**: Optimized for speed and efficiency
- **Scalability**: Built to handle growth and traffic spikes
- **Maintainability**: Clean code architecture and comprehensive documentation
- **Security**: Enterprise-grade security measures
- **User Experience**: Cinematic, responsive, and intuitive interface

This documentation serves as a comprehensive guide for developers, architects, and system administrators working with or extending the Thunderbolt Brand World platform.*
