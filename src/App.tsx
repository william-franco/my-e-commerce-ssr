import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type Category = 'electronics' | 'clothing' | 'books' | 'home' | 'sports';
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  rating: number;
  reviews: number;
  image: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: number;
  customerInfo: CustomerInfo;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

interface StoreData {
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const isClient = typeof window !== 'undefined';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'electronics', label: 'Eletrônicos' },
  { value: 'clothing', label: 'Roupas' },
  { value: 'books', label: 'Livros' },
  { value: 'home', label: 'Casa' },
  { value: 'sports', label: 'Esportes' },
];

const PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Smartphone Premium X1',
    description: 'Smartphone de última geração com câmera 108MP e 5G',
    price: 3499.90,
    originalPrice: 4199.90,
    category: 'electronics',
    rating: 4.8,
    reviews: 324,
    image: '📱',
    stock: 15,
  },
  {
    id: 'prod_2',
    name: 'Notebook Pro 15"',
    description: 'Notebook profissional com processador i7 e 16GB RAM',
    price: 5299.90,
    category: 'electronics',
    rating: 4.9,
    reviews: 189,
    image: '💻',
    stock: 8,
  },
  {
    id: 'prod_3',
    name: 'Fone Bluetooth Premium',
    description: 'Fone com cancelamento de ruído ativo e autonomia de 30h',
    price: 899.90,
    originalPrice: 1299.90,
    category: 'electronics',
    rating: 4.7,
    reviews: 567,
    image: '🎧',
    stock: 42,
  },
  {
    id: 'prod_4',
    name: 'Smartwatch Fitness',
    description: 'Relógio inteligente com monitoramento de saúde',
    price: 1299.90,
    category: 'electronics',
    rating: 4.6,
    reviews: 234,
    image: '⌚',
    stock: 25,
  },
  {
    id: 'prod_5',
    name: 'Camiseta Premium Cotton',
    description: 'Camiseta 100% algodão egípcio com corte moderno',
    price: 89.90,
    originalPrice: 149.90,
    category: 'clothing',
    rating: 4.5,
    reviews: 892,
    image: '👕',
    stock: 120,
  },
  {
    id: 'prod_6',
    name: 'Tênis Esportivo Pro',
    description: 'Tênis profissional para corrida com amortecimento',
    price: 449.90,
    category: 'sports',
    rating: 4.8,
    reviews: 445,
    image: '👟',
    stock: 34,
  },
  {
    id: 'prod_7',
    name: 'Livro: Clean Code',
    description: 'Guia completo de boas práticas em programação',
    price: 79.90,
    category: 'books',
    rating: 5.0,
    reviews: 1203,
    image: '📚',
    stock: 67,
  },
  {
    id: 'prod_8',
    name: 'Cafeteira Inteligente',
    description: 'Cafeteira com controle via app e timer programável',
    price: 599.90,
    originalPrice: 799.90,
    category: 'home',
    rating: 4.4,
    reviews: 178,
    image: '☕',
    stock: 19,
  },
  {
    id: 'prod_9',
    name: 'Bola de Futebol Oficial',
    description: 'Bola oficial de campeonato com tecnologia anti-derrapante',
    price: 189.90,
    category: 'sports',
    rating: 4.7,
    reviews: 312,
    image: '⚽',
    stock: 55,
  },
  {
    id: 'prod_10',
    name: 'Luminária LED Smart',
    description: 'Luminária inteligente RGB com controle por voz',
    price: 249.90,
    category: 'home',
    rating: 4.6,
    reviews: 267,
    image: '💡',
    stock: 41,
  },
];

// ============================================================================
// STORAGE SERVICE
// ============================================================================

class StorageService {
  private static readonly STORAGE_KEYS = Object.freeze({
    DARK_MODE: 'ecommerce_darkMode',
    STORE_DATA: 'ecommerce_storeData',
  });

  /**
   * Save data to sessionStorage (client-side only)
   */
  static saveToStorage(key: string, value: any): void {
    if (!isClient) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }

  /**
   * Load data from sessionStorage with default fallback (client-side only)
   */
  static loadFromStorage<T>(key: string, defaultValue: T): T {
    if (!isClient) return defaultValue;
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Clear all app data from storage (client-side only)
   */
  static clearStorage(): void {
    if (!isClient) return;
    try {
      sessionStorage.removeItem(this.STORAGE_KEYS.DARK_MODE);
      sessionStorage.removeItem(this.STORAGE_KEYS.STORE_DATA);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Get storage keys
   */
  static getKeys() {
    return this.STORAGE_KEYS;
  }
}

// ============================================================================
// MODEL LAYER
// ============================================================================

/**
 * E-commerce Model - Handles data structure and business logic
 */
class EcommerceModel {
  private products: Product[];
  private cart: CartItem[];
  private wishlist: string[];
  private orders: Order[];

  constructor(initialData?: StoreData) {
    this.products = [...PRODUCTS];
    this.cart = initialData?.cart || [];
    this.wishlist = initialData?.wishlist || [];
    this.orders = initialData?.orders || [];
  }

  // ==================== PRODUCT OPERATIONS ====================

  getAllProducts(): Product[] {
    return [...this.products];
  }

  getProductById(id: string): Product | null {
    return this.products.find(p => p.id === id) || null;
  }

  searchProducts(term: string): Product[] {
    const lowerTerm = term.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(lowerTerm) ||
      p.description.toLowerCase().includes(lowerTerm)
    );
  }

  filterByCategory(category: Category): Product[] {
    return this.products.filter(p => p.category === category);
  }

  filterByPriceRange(min: number, max: number): Product[] {
    return this.products.filter(p => p.price >= min && p.price <= max);
  }

  filterByRating(minRating: number): Product[] {
    return this.products.filter(p => p.rating >= minRating);
  }

  // ==================== CART OPERATIONS ====================

  getCart(): CartItem[] {
    return [...this.cart];
  }

  addToCart(productId: string, quantity: number = 1): boolean {
    const product = this.getProductById(productId);
    if (!product || product.stock < quantity) return false;

    const existingItem = this.cart.find(item => item.product.id === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) return false;
      existingItem.quantity = newQuantity;
    } else {
      this.cart.push({ product, quantity });
    }

    return true;
  }

  updateCartItemQuantity(productId: string, quantity: number): boolean {
    const item = this.cart.find(item => item.product.id === productId);
    if (!item) return false;

    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    if (quantity > item.product.stock) return false;

    item.quantity = quantity;
    return true;
  }

  removeFromCart(productId: string): boolean {
    const initialLength = this.cart.length;
    this.cart = this.cart.filter(item => item.product.id !== productId);
    return this.cart.length < initialLength;
  }

  clearCart(): void {
    this.cart = [];
  }

  getCartTotal(): number {
    return this.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  // ==================== WISHLIST OPERATIONS ====================

  getWishlist(): string[] {
    return [...this.wishlist];
  }

  getWishlistProducts(): Product[] {
    return this.products.filter(p => this.wishlist.includes(p.id));
  }

  addToWishlist(productId: string): boolean {
    if (this.wishlist.includes(productId)) return false;
    this.wishlist.push(productId);
    return true;
  }

  removeFromWishlist(productId: string): boolean {
    const initialLength = this.wishlist.length;
    this.wishlist = this.wishlist.filter(id => id !== productId);
    return this.wishlist.length < initialLength;
  }

  toggleWishlist(productId: string): boolean {
    if (this.wishlist.includes(productId)) {
      this.removeFromWishlist(productId);
      return false;
    } else {
      this.addToWishlist(productId);
      return true;
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist.includes(productId);
  }

  // ==================== ORDER OPERATIONS ====================

  getOrders(): Order[] {
    return [...this.orders].sort((a, b) => b.date - a.date);
  }

  createOrder(customerInfo: CustomerInfo): Order | null {
    if (this.cart.length === 0) return null;

    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: [...this.cart],
      total: this.getCartTotal(),
      status: 'pending',
      date: Date.now(),
      customerInfo: { ...customerInfo },
    };

    this.orders.push(order);
    this.clearCart();

    return order;
  }

  getOrderById(orderId: string): Order | null {
    return this.orders.find(o => o.id === orderId) || null;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;
    order.status = status;
    return true;
  }

  // ==================== SYNC ====================

  syncToStorage(): void {
    StorageService.saveToStorage(StorageService.getKeys().STORE_DATA, {
      cart: this.cart,
      wishlist: this.wishlist,
      orders: this.orders,
    });
  }

  static loadFromStorage(): EcommerceModel {
    const data = StorageService.loadFromStorage<StoreData | null>(
      StorageService.getKeys().STORE_DATA,
      null
    );
    return new EcommerceModel(data || undefined);
  }
}

// ============================================================================
// CONTROLLER LAYER
// ============================================================================

/**
 * E-commerce Controller - Manages state and coordinates between Model and View
 */
class EcommerceController {
  private model: EcommerceModel;
  private listeners: Set<() => void>;

  constructor(model: EcommerceModel) {
    this.model = model;
    this.listeners = new Set();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
    this.model.syncToStorage();
  }

  // Product methods
  getAllProducts = () => this.model.getAllProducts();
  getProductById = (id: string) => this.model.getProductById(id);
  searchProducts = (term: string) => this.model.searchProducts(term);
  filterByCategory = (category: Category) => this.model.filterByCategory(category);
  filterByPriceRange = (min: number, max: number) => this.model.filterByPriceRange(min, max);
  filterByRating = (minRating: number) => this.model.filterByRating(minRating);

  // Cart methods
  getCart = () => this.model.getCart();
  getCartTotal = () => this.model.getCartTotal();
  getCartItemCount = () => this.model.getCartItemCount();

  addToCart(productId: string, quantity: number = 1): boolean {
    const success = this.model.addToCart(productId, quantity);
    if (success) this.notify();
    return success;
  }

  updateCartItemQuantity(productId: string, quantity: number): void {
    this.model.updateCartItemQuantity(productId, quantity);
    this.notify();
  }

  removeFromCart(productId: string): void {
    this.model.removeFromCart(productId);
    this.notify();
  }

  clearCart(): void {
    this.model.clearCart();
    this.notify();
  }

  // Wishlist methods
  getWishlist = () => this.model.getWishlist();
  getWishlistProducts = () => this.model.getWishlistProducts();
  isInWishlist = (productId: string) => this.model.isInWishlist(productId);

  toggleWishlist(productId: string): void {
    this.model.toggleWishlist(productId);
    this.notify();
  }

  // Order methods
  getOrders = () => this.model.getOrders();
  getOrderById = (orderId: string) => this.model.getOrderById(orderId);

  createOrder(customerInfo: CustomerInfo): Order | null {
    const order = this.model.createOrder(customerInfo);
    if (order) this.notify();
    return order;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface StoreContextType {
  controller: EcommerceController;
  forceUpdate: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

/**
 * Header Component
 */
const Header: React.FC<{
  darkMode: boolean;
  toggleTheme: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}> = ({ darkMode, toggleTheme, onNavigate, currentView }) => {
  const { controller } = useStore();
  const cartCount = controller.getCartItemCount();
  const wishlistCount = controller.getWishlist().length;

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand" onClick={() => onNavigate('products')}>
          <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h1>My E-Commerce</h1>
        </div>

        <nav className="header-nav">
          <button
            onClick={() => onNavigate('products')}
            className={currentView === 'products' ? 'active' : ''}
          >
            Produtos
          </button>
          <button
            onClick={() => onNavigate('wishlist')}
            className={currentView === 'wishlist' ? 'active' : ''}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favoritos
            {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className={currentView === 'orders' ? 'active' : ''}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Pedidos
          </button>
        </nav>

        <div className="header-actions">
          <button onClick={() => onNavigate('cart')} className="cart-button">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
          <button onClick={toggleTheme} className="theme-toggle">
            {darkMode ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Product Card Component
 */
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { controller, forceUpdate } = useStore();
  const isInWishlist = controller.isInWishlist(product.id);

  const handleAddToCart = () => {
    const success = controller.addToCart(product.id);
    if (success) {
      alert('Produto adicionado ao carrinho!');
    } else {
      alert('Produto sem estoque!');
    }
  };

  const handleToggleWishlist = () => {
    controller.toggleWishlist(product.id);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-card">
      {discount > 0 && <div className="discount-badge">-{discount}%</div>}
      <button
        onClick={handleToggleWishlist}
        className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
      >
        <svg fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <div className="product-image">{product.image}</div>

      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(product.rating) ? 'active' : ''}>★</span>
            ))}
          </div>
          <span className="rating-text">{product.rating} ({product.reviews})</span>
        </div>

        <div className="product-footer">
          <div className="price-container">
            {product.originalPrice && (
              <span className="original-price">R$ {product.originalPrice.toFixed(2)}</span>
            )}
            <span className="price">R$ {product.price.toFixed(2)}</span>
          </div>
          <span className="stock">Estoque: {product.stock}</span>
        </div>

        <button onClick={handleAddToCart} className="btn-add-cart">
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
};

/**
 * Filters Component
 */
const Filters: React.FC<{
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
}> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  minRating,
  onMinRatingChange,
}) => {
    return (
      <div className="filters">
        <div className="search-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-section">
          <h4>Categoria</h4>
          <div className="category-filters">
            <button
              onClick={() => onCategoryChange(null)}
              className={!selectedCategory ? 'active' : ''}
            >
              Todas
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={selectedCategory === cat.value ? 'active' : ''}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4>Faixa de Preço</h4>
          <div className="price-range">
            <input
              type="number"
              value={priceRange[0]}
              onChange={e => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
              placeholder="Mín"
            />
            <span>até</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={e => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
              placeholder="Máx"
            />
          </div>
        </div>

        <div className="filter-section">
          <h4>Avaliação Mínima</h4>
          <div className="rating-filter">
            {[4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                onClick={() => onMinRatingChange(rating)}
                className={minRating === rating ? 'active' : ''}
              >
                {rating}★ ou mais
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

/**
 * Products View
 */
const ProductsView: React.FC = () => {
  const { controller } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);

  const products = useMemo(() => {
    let filtered = controller.getAllProducts();

    if (searchTerm) {
      const searchResults = controller.searchProducts(searchTerm);
      filtered = filtered.filter(p => searchResults.some(sr => sr.id === p.id));
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    filtered = filtered.filter(p => p.rating >= minRating);

    return filtered;
  }, [controller, searchTerm, selectedCategory, priceRange, minRating]);

  return (
    <div className="products-view">
      <Filters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        minRating={minRating}
        onMinRatingChange={setMinRating}
      />

      <div className="products-container">
        <div className="products-header">
          <h2>Produtos</h2>
          <span className="product-count">{products.length} produtos encontrados</span>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Cart View
 */
const CartView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { controller, forceUpdate } = useStore();
  const cart = controller.getCart();
  const total = controller.getCartTotal();

  const handleQuantityChange = (productId: string, quantity: number) => {
    controller.updateCartItemQuantity(productId, quantity);
  };

  const handleRemove = (productId: string) => {
    controller.removeFromCart(productId);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-view">
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3>Seu carrinho está vazio</h3>
          <p>Adicione produtos para continuar</p>
          <button onClick={() => onNavigate('products')} className="btn-primary">
            Ver Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-view">
      <h2>Carrinho de Compras</h2>

      <div className="cart-content">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.product.id} className="cart-item">
              <div className="cart-item-image">{item.product.image}</div>
              <div className="cart-item-info">
                <h3>{item.product.name}</h3>
                <p>R$ {item.product.price.toFixed(2)}</p>
              </div>
              <div className="cart-item-quantity">
                <button onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}>+</button>
              </div>
              <div className="cart-item-total">
                R$ {(item.product.price * item.quantity).toFixed(2)}
              </div>
              <button onClick={() => handleRemove(item.product.id)} className="cart-item-remove">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Resumo do Pedido</h3>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Frete</span>
            <span>Grátis</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <button onClick={() => onNavigate('checkout')} className="btn-checkout">
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Checkout View
 */
const CheckoutView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { controller } = useStore();
  const [formData, setFormData] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  const validate = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email válido é obrigatório';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'CEP é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const order = controller.createOrder(formData);
    if (order) {
      alert('Pedido realizado com sucesso!');
      onNavigate('orders');
    }
  };

  const handleChange = (field: keyof CustomerInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const cart = controller.getCart();
  const total = controller.getCartTotal();

  return (
    <div className="checkout-view">
      <h2>Finalizar Compra</h2>

      <div className="checkout-content">
        <form onSubmit={handleSubmit} className="checkout-form">
          <h3>Informações de Entrega</h3>

          <div className="form-group">
            <label>Nome Completo *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Telefone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Endereço *</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              className={errors.address ? 'error' : ''}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cidade *</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                className={errors.city ? 'error' : ''}
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label>CEP *</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={e => handleChange('zipCode', e.target.value)}
                className={errors.zipCode ? 'error' : ''}
              />
              {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
            </div>
          </div>

          <button type="submit" className="btn-primary">Confirmar Pedido</button>
        </form>

        <div className="order-summary">
          <h3>Resumo do Pedido</h3>
          <div className="order-items">
            {cart.map(item => (
              <div key={item.product.id} className="order-item">
                <span>{item.product.name} x{item.quantity}</span>
                <span>R$ {(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Orders View
 */
const OrdersView: React.FC = () => {
  const { controller } = useStore();
  const orders = controller.getOrders();

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'status-pending' },
      processing: { label: 'Processando', className: 'status-processing' },
      completed: { label: 'Concluído', className: 'status-completed' },
      cancelled: { label: 'Cancelado', className: 'status-cancelled' },
    };
    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  if (orders.length === 0) {
    return (
      <div className="orders-view">
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3>Nenhum pedido realizado</h3>
          <p>Seus pedidos aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-view">
      <h2>Meus Pedidos</h2>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div>
                <h3>Pedido #{order.id.slice(-8)}</h3>
                <span className="order-date">
                  {new Date(order.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="order-items">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <span className="item-emoji">{item.product.image}</span>
                  <span className="item-name">{item.product.name}</span>
                  <span className="item-qty">x{item.quantity}</span>
                  <span className="item-price">
                    R$ {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="order-customer">
                <strong>{order.customerInfo.name}</strong>
                <span>{order.customerInfo.address}, {order.customerInfo.city}</span>
              </div>
              <div className="order-total">
                <span>Total:</span>
                <strong>R$ {order.total.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Wishlist View
 */
const WishlistView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { controller } = useStore();
  const wishlistProducts = controller.getWishlistProducts();

  if (wishlistProducts.length === 0) {
    return (
      <div className="wishlist-view">
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3>Sua lista de favoritos está vazia</h3>
          <p>Adicione produtos que você gosta para encontrá-los facilmente</p>
          <button onClick={() => onNavigate('products')} className="btn-primary">
            Ver Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-view">
      <h2>Meus Favoritos</h2>
      <div className="products-grid">
        {wishlistProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return StorageService.loadFromStorage(StorageService.getKeys().DARK_MODE, false);
  });

  const [controller] = useState(() => {
    const model = EcommerceModel.loadFromStorage();
    return new EcommerceController(model);
  });

  const [, setUpdateCount] = useState(0);
  const forceUpdate = () => setUpdateCount(prev => prev + 1);

  const [currentView, setCurrentView] = useState<string>('products');

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      forceUpdate();
    });
    return unsubscribe;
  }, [controller]);

  useEffect(() => {
    if (isClient) {
      document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      StorageService.saveToStorage(StorageService.getKeys().DARK_MODE, darkMode);
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <StoreContext.Provider value={{ controller, forceUpdate }}>
      <div className="app">
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          onNavigate={setCurrentView}
          currentView={currentView}
        />

        <main className="main-content">
          {currentView === 'products' && <ProductsView />}
          {currentView === 'cart' && <CartView onNavigate={setCurrentView} />}
          {currentView === 'checkout' && <CheckoutView onNavigate={setCurrentView} />}
          {currentView === 'orders' && <OrdersView />}
          {currentView === 'wishlist' && <WishlistView onNavigate={setCurrentView} />}
        </main>
      </div>
    </StoreContext.Provider>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const APP_STYLES = `
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #06b6d4;
  
  --bg: #f8fafc;
  --surface: #ffffff;
  --card-bg: #ffffff;
  --text: #0f172a;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --shadow: rgba(0, 0, 0, 0.1);
  --shadow-lg: rgba(0, 0, 0, 0.15);
  
  --header-bg: #ffffff;
  --header-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg: #0f172a;
  --surface: #1e293b;
  --card-bg: #1e293b;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #334155;
  --shadow: rgba(0, 0, 0, 0.3);
  --shadow-lg: rgba(0, 0, 0, 0.5);
  
  --header-bg: #1e293b;
  --header-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: var(--header-bg);
  box-shadow: var(--header-shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.header-icon {
  width: 32px;
  height: 32px;
  color: var(--primary);
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.header-nav {
  display: flex;
  gap: 0.5rem;
}

.header-nav button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.header-nav button:hover {
  background: var(--surface);
}

.header-nav button.active {
  background: var(--primary);
  color: white;
}

.header-nav button svg {
  width: 20px;
  height: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-button {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px var(--shadow);
}

.cart-button:hover {
  transform: scale(1.05);
  background: var(--primary);
  color: white;
}

.cart-button svg {
  width: 20px;
  height: 20px;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px var(--shadow);
}

.theme-toggle:hover {
  transform: scale(1.05);
  background: var(--primary);
  color: white;
}

.theme-toggle svg {
  width: 20px;
  height: 20px;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--danger);
  color: white;
  border-radius: 10px;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

/* Main Content */
.main-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

/* Products View */
.products-view {
  display: flex;
  gap: 2rem;
}

/* Filters */
.filters {
  width: 280px;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-box svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.9375rem;
}

.search-box input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.filter-section h4 {
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
}

.category-filters,
.rating-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-filters button,
.rating-filter button {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.category-filters button:hover,
.rating-filter button:hover {
  background: var(--border);
}

.category-filters button.active,
.rating-filter button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.price-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-range input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
}

.price-range input:focus {
  outline: none;
  border-color: var(--primary);
}

.price-range span {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Products Container */
.products-container {
  flex: 1;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.products-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
}

.product-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Product Card */
.product-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px var(--shadow);
  transition: all 0.2s ease;
  position: relative;
  border: 1px solid var(--border);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px var(--shadow-lg);
}

.discount-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: var(--danger);
  color: white;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  z-index: 1;
}

.wishlist-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--surface);
  color: var(--danger);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
  box-shadow: 0 2px 4px var(--shadow);
}

.wishlist-btn:hover {
  transform: scale(1.1);
}

.wishlist-btn.active {
  background: var(--danger);
  color: white;
}

.wishlist-btn svg {
  width: 20px;
  height: 20px;
}

.product-image {
  font-size: 4rem;
  text-align: center;
  margin: 1rem 0;
}

.product-info h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.product-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stars {
  display: flex;
  gap: 0.125rem;
}

.stars span {
  color: var(--border);
  font-size: 1rem;
}

.stars span.active {
  color: var(--warning);
}

.rating-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.price-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.original-price {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.stock {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-add-cart {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-cart:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Cart View */
.cart-view {
  max-width: 1000px;
}

.cart-view h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-item-image {
  font-size: 3rem;
  flex-shrink: 0;
}

.cart-item-info {
  flex: 1;
}

.cart-item-info h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.cart-item-info p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.cart-item-quantity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--surface);
  border-radius: 8px;
  padding: 0.5rem;
}

.cart-item-quantity button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: var(--border);
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cart-item-quantity button:hover {
  background: var(--primary);
  color: white;
}

.cart-item-quantity span {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
}

.cart-item-total {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary);
  min-width: 100px;
  text-align: right;
}

.cart-item-remove {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cart-item-remove:hover {
  background: var(--danger);
  color: white;
}

.cart-item-remove svg {
  width: 18px;
  height: 18px;
}

.cart-summary {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.cart-summary h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 2px solid var(--border);
  font-size: 1.25rem;
  font-weight: 700;
}

.btn-checkout {
  width: 100%;
  padding: 1rem;
  margin-top: 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--success);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-checkout:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* Checkout View */
.checkout-view h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.checkout-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.checkout-form {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
}

.checkout-form h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text);
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input.error {
  border-color: var(--danger);
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--danger);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.order-summary {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.order-summary h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.order-items {
  margin-bottom: 1rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.order-total {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 2px solid var(--border);
  font-size: 1.25rem;
  font-weight: 700;
}

.btn-primary {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Orders View */
.orders-view h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.order-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.order-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-pending {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.status-processing {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary);
}

.status-completed {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-cancelled {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.order-items {
  margin-bottom: 1.25rem;
}

.order-item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}

.order-item-row:last-child {
  border-bottom: none;
}

.item-emoji {
  font-size: 2rem;
}

.item-name {
  flex: 1;
  font-weight: 500;
}

.item-qty {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.item-price {
  font-weight: 600;
  min-width: 100px;
  text-align: right;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.order-customer {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-customer strong {
  font-size: 0.9375rem;
}

.order-customer span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.order-total {
  text-align: right;
}

.order-total span {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.order-total strong {
  font-size: 1.5rem;
  color: var(--primary);
}

/* Wishlist View */
.wishlist-view h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  min-height: 400px;
}

.empty-state svg {
  width: 80px;
  height: 80px;
  color: var(--text-secondary);
  opacity: 0.5;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .products-view {
    flex-direction: column;
  }

  .filters {
    width: 100%;
  }

  .cart-content,
  .checkout-content {
    grid-template-columns: 1fr;
  }

  .cart-summary,
  .order-summary {
    position: static;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-wrap: wrap;
  }

  .header-nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .main-content {
    padding: 1rem;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .cart-item {
    flex-wrap: wrap;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-card,
.cart-item,
.order-card {
  animation: fadeIn 0.3s ease-out;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: var(--bg);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
`;

// ============================================================================
// SSR SETUP & EXPORT
// ============================================================================

if (isClient) {
  const styleId = 'app-styles';
  let styleElement = document.getElementById(styleId);

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = APP_STYLES;
    document.head.appendChild(styleElement);
  }
}

export default App;
