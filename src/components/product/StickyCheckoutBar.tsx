import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus, CreditCard, LogIn } from 'lucide-react';
import { useCurrency, currencies, currencyToCountry } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useAuthOverlay } from '@/context/AuthOverlayContext';
import { Button } from '@/components/ui/button';

// Payment Dialog with payment method selection
const MockPaymentDialog = ({ open, onOpenChange, product, quantity, totalPrice, selectedColor, selectedStorage, selectedNetwork, selectedCondition }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  
  if (!open) return null;
  
  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    alert(`Payment processed successfully with ${selectedPaymentMethod}!`);
    onOpenChange(false);
    setSelectedPaymentMethod('');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
        
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <div className="text-sm text-gray-600 mb-2">Order Summary</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>{product?.name}</span>
              <span>${totalPrice}</span>
            </div>
            <div className="text-xs text-gray-500">
              {selectedColor} • {selectedStorage} • Qty: {quantity}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedPaymentMethod === 'wallet' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPaymentMethod('wallet')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Pay with Wallet</div>
                  <div className="text-sm text-gray-500">Use your digital wallet</div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPaymentMethod === 'wallet' 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
              }`}>
                {selectedPaymentMethod === 'wallet' && (
                  <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                )}
              </div>
            </div>
          </div>

          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedPaymentMethod === 'moncash' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPaymentMethod('moncash')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/lovable-uploads/26276fb9-2443-4215-a6ae-d1d16e6c2f92.png" 
                    alt="MonCash" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Pay with Moncash</div>
                  <div className="text-sm text-gray-500">Mobile money payment</div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedPaymentMethod === 'moncash' 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300'
              }`}>
                {selectedPaymentMethod === 'moncash' && (
                  <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => {
              onOpenChange(false);
              setSelectedPaymentMethod('');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handlePayment}
            disabled={!selectedPaymentMethod}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPaymentMethod
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

const StickyCheckoutBar = ({ 
  product,
  quantity = 1,
  onQuantityChange = (newQuantity) => {},
  selectedColor,
  onColorChange = (color) => {},
  selectedStorage,
  onStorageChange = (storage) => {},
  selectedNetwork,
  selectedCondition,
  selectedColorImage = null,
  onBuyNow = () => {},
  currentPrice = null,
  currentStock = null,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const { isAuthenticated } = useAuth();
  const { openAuthOverlay } = useAuthOverlay();
  const { currentCurrency, formatPrice, convertPrice } = useCurrency();

  // Measure sticky bar height to position sign-in banner above it
  const barRef = useRef<HTMLDivElement | null>(null);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    if (!barRef.current) return;
    const update = () => setBarHeight(barRef.current?.offsetHeight || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(barRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [barRef.current, isExpanded, showPaymentMethods]);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Flag component as fallback
  const Flag = ({ country }) => (
    <span className="text-xs bg-gray-200 px-1 py-0.5 rounded">{country.toUpperCase()}</span>
  );

  // Use current stock from selected variant or product inventory
  const stockLeft = currentStock !== null ? currentStock : (product?.inventory || 0);

  // Quantity handlers
  const increaseQuantity = () => {
    if (quantity < stockLeft && typeof onQuantityChange === 'function') {
      onQuantityChange(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1 && typeof onQuantityChange === 'function') {
      onQuantityChange(quantity - 1);
    }
  };

  // Price calculations using shared currency context
  const basePrice = currentPrice || (() => {
    if (product?.storage_variants) {
      const storage = product.storage_variants.find(v => v.name === selectedStorage);
      return storage?.price || product?.price || 0;
    }
    return product?.price || 0;
  })();

  const isDiscountActive = product.discount && product.discount.active;
  const discountMultiplier = isDiscountActive ? (1 - product.discount.percentage / 100) : 1;

  const unitPrice = basePrice * discountMultiplier;
  const totalPrice = convertPrice(unitPrice * quantity);
  const totalOriginalPrice = convertPrice(basePrice * quantity);
  const discountAmount = totalOriginalPrice - totalPrice;

  // Action handlers
  const handleBuyNow = () => {
    if (!isAuthenticated) {
      openAuthOverlay();
      setIsExpanded(false);
      return;
    }
    setShowPaymentMethods(true);
  };

  const handleContinuePayment = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (selectedPaymentMethod === 'moncash') {
      try {
        const response = await fetch('https://app.pgecom.com/api/v1/moncash/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gdes: totalPrice,
            userID: "ec5f6d89-fe96-4d0c-aaab-cf4fcdc445ac",
            successUrl: window.location.origin + "/success",
            description: `Payment for ${product.name}`,
            referenceId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            errorUrl: window.location.origin + "/error",
            customerFirstName: "",
            customerLastName: "",
            customerEmail: "",
            metadata: {
              productName: product.name,
              quantity: quantity,
              color: selectedColor,
              storage: selectedStorage,
              network: selectedNetwork,
              condition: selectedCondition
            }
          })
        });

        if (!response.ok) {
          throw new Error('Payment request failed');
        }

        const data = await response.json();
        
        // Redirect to provided URL (redirectUrl preferred)
        const redirect = data.redirectUrl || data.paymentUrl || data.url;
        if (redirect) {
          window.location.href = redirect;
        } else {
          console.warn('No redirect URL found in response:', data);
          alert('MonCash payment initiated, but no redirect URL was provided.');
        }
      } catch (error) {
        console.error('MonCash payment error:', error);
        alert('Failed to process MonCash payment. Please try again.');
        return;
      }
    } else {
      alert(`Payment processed successfully with ${selectedPaymentMethod}!`);
    }
    
    setIsExpanded(false);
    setShowPaymentMethods(false);
    setSelectedPaymentMethod('');
  };

  if (!product) {
    return null;
  }

  return (
    <>
      {!isAuthenticated && (
        <div
          className="fixed left-0 right-0 z-50 bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-sm py-1.5 px-4 flex items-center justify-between shadow-md"
          style={{ bottom: barHeight }}
        >
          <div className="text-white text-xs font-medium">Sign in to explore more</div>
          <Button 
            onClick={openAuthOverlay}
            size="sm" 
            className="bg-white hover:bg-white/90 text-red-500 shadow-sm flex items-center gap-1 px-2 py-0.5 h-6 rounded-full"
          >
            <LogIn className="w-3 h-3" />
            <span className="text-xs font-medium">Sign in</span>
          </Button>
        </div>
      )}
      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sticky Bottom Bar */}
      <div ref={barRef} className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-[45] transition-all duration-300 ease-out ${className}`}>


        {/* Collapsed State */}
        <div 
          className={`transition-all duration-300 ${
            isExpanded ? 'rounded-t-2xl' : ''
          }`}
          style={{ 
            boxShadow: isExpanded ? '0 -10px 25px -5px rgba(0, 0, 0, 0.1)' : '0 -2px 10px -2px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Always visible collapsed bar */}
          <div 
            className="flex items-center px-3 py-2.5 pr-2 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
            onClick={toggleExpanded}
          >
            {/* Product Thumbnail */}
            <img 
              src={selectedColorImage || product.image || "/placeholder.svg"}
              alt={product.name || "Product"}
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-sm"
            />

            {/* Product Info - Compact */}
            <div className="flex-1 mx-2.5 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">
                {product.name}
                {selectedColor ? ` · ${selectedColor}` : ''}
                {selectedStorage ? ` · ${selectedStorage}` : ''}
                {selectedNetwork ? ` · ${selectedNetwork}` : ''}
                {selectedCondition ? ` · ${selectedCondition}` : ''}
              </div>
              <div className="flex items-center mt-0.5">
                <span className="text-base font-bold text-orange-500">
                  {currencies[currentCurrency]}{formatPrice(unitPrice * quantity)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  Qty: {quantity}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({stockLeft} available)
                </span>
              </div>
            </div>

            {/* Expand Icon */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-6 h-6 text-gray-700" strokeWidth={2.5} />
              ) : (
                <ChevronUp className="w-6 h-6 text-gray-700" strokeWidth={2.5} />
              )}
            </div>
          </div>

          {/* Expanded State */}
          <div className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-4 pb-4 space-y-4 pt-4">
              {!showPaymentMethods ? (
                <>
                  {/* Price Summary - Full Width */}
                  <div className="bg-gray-50 rounded-lg p-3">
                     <div className="flex justify-between items-center w-full">
                       <span className="text-lg font-bold text-gray-900">Total:</span>
                       <span className="text-lg font-bold text-orange-500">
                         {currencies[currentCurrency]}{formatPrice(unitPrice * quantity)}
                       </span>
                    </div>
                  </div>

                  {/* Action Buttons - Now with Quantity Selector and Buy Now */}
                  <div className="flex gap-3 items-stretch">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                      <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4 text-black" />
                      </button>
                      <span className="text-base font-medium px-3 text-gray-900">{quantity}</span>
                      <button
                        onClick={increaseQuantity}
                        disabled={quantity >= stockLeft}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4 text-black" />
                      </button>
                    </div>
                    
                    {/* Buy Now Button */}
                    <button 
                      onClick={handleBuyNow}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-full font-medium text-base hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      Buy Now
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">Order Summary</div>
                    <div className="text-sm space-y-1">
                       <div className="flex justify-between items-center">
                         <span className="text-gray-600">{product?.name}</span>
                         <span className="font-medium">{currencies[currentCurrency]}{formatPrice(unitPrice * quantity)}</span>
                       </div>
                      <div className="text-xs text-gray-500">
                        {selectedColor} • {selectedStorage} • Qty: {quantity}
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900 mb-2">Choose Payment Method</div>
                    
                    <div 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'wallet' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('wallet')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Pay with Wallet</div>
                            <div className="text-xs text-gray-500">Use your digital wallet</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedPaymentMethod === 'wallet' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'wallet' && (
                            <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`w-full border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'moncash' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('moncash')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                            <img 
                              src="/lovable-uploads/26276fb9-2443-4215-a6ae-d1d16e6c2f92.png" 
                              alt="MonCash" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Pay with Moncash</div>
                            <div className="text-xs text-gray-500">Mobile money payment</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedPaymentMethod === 'moncash' 
                            ? 'border-orange-500 bg-orange-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'moncash' && (
                            <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sticky Continue Button - Only shown when payment methods are visible */}
          {showPaymentMethods && isExpanded && (
            <div className="border-t border-gray-200 px-4 py-3 bg-white">
              <button 
                onClick={handleContinuePayment}
                disabled={!selectedPaymentMethod}
                className={`w-full py-3 rounded-full font-medium text-base transition-colors ${
                  selectedPaymentMethod
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mock Payment Dialog */}
      <MockPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        product={product}
        quantity={quantity}
        selectedColor={selectedColor}
        selectedStorage={selectedStorage}
        selectedNetwork={selectedNetwork}
        selectedCondition={selectedCondition}
        totalPrice={formatPrice(unitPrice * quantity)}
      />
    </>
  );
};

export default StickyCheckoutBar;