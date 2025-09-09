
import React from 'react';
import { Clock } from 'lucide-react';

const RecentlyViewed = () => {
  const products = [
    {
      name: 'Wireless Headphones',
      price: 59.99,
      rating: 5,
      reviews: 42,
      color: 'bg-blue-500',
      freeShipping: true
    },
    {
      name: 'Smart Watch',
      price: 99.99,
      originalPrice: 129.99,
      rating: 5,
      reviews: 42,
      discount: '23% OFF',
      color: 'bg-green-500',
      freeShipping: true
    },
    {
      name: 'Ultra Slim PowerBank',
      price: 45.99,
      rating: 5,
      reviews: 42,
      color: 'bg-purple-500',
      freeShipping: true
    },
    {
      name: 'Bluetooth Speaker',
      price: 79.99,
      originalPrice: 89.99,
      rating: 4,
      reviews: 36,
      discount: '11% OFF',
      color: 'bg-red-500',
      freeShipping: true
    },
    {
      name: 'Wireless Mouse',
      price: 29.99,
      rating: 4,
      reviews: 28,
      color: 'bg-gray-600',
      freeShipping: false
    },
    {
      name: 'USB-C Hub',
      price: 39.99,
      originalPrice: 49.99,
      rating: 5,
      reviews: 55,
      discount: '20% OFF',
      color: 'bg-indigo-500',
      freeShipping: true
    },
    {
      name: 'Smart Bulb Set',
      price: 34.99,
      rating: 4,
      reviews: 19,
      color: 'bg-yellow-400',
      freeShipping: true
    },
    {
      name: 'Fitness Tracker',
      price: 69.99,
      originalPrice: 89.99,
      rating: 4,
      reviews: 47,
      discount: '22% OFF',
      color: 'bg-pink-500',
      freeShipping: true
    },
    {
      name: 'Desktop Stand',
      price: 24.99,
      rating: 5,
      reviews: 33,
      color: 'bg-teal-500',
      freeShipping: false
    },
    {
      name: 'Wireless Charger',
      price: 19.99,
      originalPrice: 29.99,
      rating: 4,
      reviews: 61,
      discount: '33% OFF',
      color: 'bg-orange-500',
      freeShipping: true
    }
  ];

  return (
    <div className="max-w-full">
      <div className="flex justify-between items-center px-2 mb-2">
        <div className="flex items-center space-x-1">
          <Clock size={16} className="text-orange-500" />
          <span className="font-bold text-sm">Recently Viewed</span>
        </div>
        <div className="flex items-center text-xs">
          <button className="text-gray-500 mr-2">× Clear</button>
          <a href="#" className="text-orange-500">View All ›</a>
        </div>
      </div>
      
      <div className="flex overflow-x-auto px-2 -mx-2 scrollbar-hide">
        {/* Left padding spacer */}
        <div className="flex-shrink-0 w-2"></div>
        
        {products.map((product, index) => (
          <div key={index} className="flex-shrink-0 w-20 pb-1 mx-1">
            <div className="relative">
              <div className={`${product.color} h-20 w-20 rounded flex items-center justify-center`}>
                {product.discount && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-tr">
                    {product.discount}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-medium text-xs text-orange-600">${product.price}</span>
              {product.originalPrice && (
                <span className="text-gray-400 text-xs line-through">${product.originalPrice}</span>
              )}
            </div>
            
            <button className="mt-1 w-full bg-gray-100 rounded text-xs py-1">
              Add
            </button>
          </div>
        ))}
        
        {/* Right padding spacer */}
        <div className="flex-shrink-0 w-2"></div>
      </div>
    </div>
  );
};

export default RecentlyViewed;
