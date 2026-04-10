import { CartItem } from '../../lib/storage';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../../lib/cloudinary';

// Flexible interface to handle both cart items and single product data
interface CheckoutItem {
  productId?: string;
  name?: string;
  price?: string | number;
  image?: string;
  size?: string;
  quantity?: number;
  productImage?: string;
  productName?: string;
  productUrl?: string;
}

interface Props {
  items: CheckoutItem[];
  totalAmount: number;
}

export default function ProductSummary({ items, totalAmount }: Props) {
  // Debug: Log to identify NaN source
  console.log("PRODUCT SUMMARY DEBUG: items:", items);
  console.log("PRODUCT SUMMARY DEBUG: totalAmount:", totalAmount);
  
  return (
    <div className="border border-white/[0.07] bg-surface overflow-hidden">
      {/* Items List */}
      <div className="p-5 md:p-6 space-y-4">
        <h3 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-4">
          Order Summary
        </h3>
        
        <div className="space-y-3">
          {items.map((item, index) => {
            // Debug: Log each item to find NaN source
            console.log(`ITEM DEBUG ${index}:`, item);
            console.log(`ITEM DEBUG ${index} price:`, item.price);
            console.log(`ITEM DEBUG ${index} quantity:`, item.quantity);
            
            // Parse price to handle currency symbols
            let price: number;
            if (typeof item.price === 'string') {
              price = parseFloat(item.price.replace(/[^\d.]/g, ''));
            } else if (typeof item.price === 'number') {
              price = item.price;
            } else {
              price = 0;
            }
            
            console.log(`ITEM DEBUG ${index} parsed price:`, price);
            console.log(`ITEM DEBUG ${index} calculated:`, price * (item.quantity || 0));
            
            return (
            <div key={`${item.productId || item.productUrl?.split('/').pop() || 'unknown'}-${item.size}`} className="flex items-center gap-4 p-3 border-b border-white/10 last:border-b-0">
              {/* Product Image */}
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={optimizeCloudinaryUrl(item.image || item.productImage || '/placeholder.png', IMG_SIZES.thumbnail)}
                  alt={item.name || item.productName || 'Product'}
                  className="w-full h-full object-cover rounded"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.png';
                  }}
                />
              </div>
              
              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-condensed font-semibold text-tb-white text-sm">
                  {item.name || item.productName || 'Unknown Product'}
                </h4>
                <div className="flex items-center gap-2 text-xs text-sv-mid">
                  <span>Size: {item.size}</span>
                  <span>×</span>
                  <span>Qty: {item.quantity}</span>
                </div>
                <div className="font-condensed text-tb-white">
                  ₹{(price * (item.quantity || 0)).toFixed(2)}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-white/20 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display text-lg tracking-[0.1em] text-tb-white uppercase">
              Total Amount
            </h4>
            <p className="font-condensed text-sm text-sv-mid mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          
          <div className="text-right">
            <div className="font-condensed text-2xl text-tb-white">
              ₹{(totalAmount || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
