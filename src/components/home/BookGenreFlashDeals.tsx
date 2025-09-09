import { Link } from "react-router-dom";
import { BookOpen, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlashDeals, trackProductView } from "@/integrations/supabase/products";
import SectionHeader from "./SectionHeader";
import TabsNavigation from "./TabsNavigation";

export default function BookGenreFlashDeals() {
  // Define book genre tabs
  const genreTabs = [
    { id: 'fiction', label: 'Fiction' },
    { id: 'science-fiction', label: 'Sci-Fi' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'romance', label: 'Romance' },
    { id: 'mystery', label: 'Mystery' },
    { id: 'thriller', label: 'Thriller' },
    { id: 'non-fiction', label: 'Non-Fiction' },
    { id: 'biography', label: 'Biography' },
    { id: 'business', label: 'Business' },
    { id: 'self-help', label: 'Self-Help' },
    { id: 'history', label: 'History' },
    { id: 'cooking', label: 'Cooking' }
  ];

  const [activeTab, setActiveTab] = useState(genreTabs[0]?.id || 'fiction');

  const { data: flashProducts = [], isLoading } = useQuery({
    queryKey: ['book-genre-deals', activeTab],
    queryFn: () => fetchFlashDeals(undefined, 'books'),
    refetchInterval: 5 * 60 * 1000,
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Calculate time remaining for flash deals
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!flashProducts || flashProducts.length === 0) return { hours: 0, minutes: 0, seconds: 0 };

      const latestFlashStart = flashProducts.reduce((latest, product) => {
        const startTime = new Date(product.flash_start_time || '').getTime();
        return startTime > latest ? startTime : latest;
      }, 0);

      if (latestFlashStart === 0) return { hours: 0, minutes: 0, seconds: 0 };

      const endTime = latestFlashStart + (24 * 60 * 60 * 1000);
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0 };

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [flashProducts]);

  // Process products with discount calculations
  const processedProducts = flashProducts.map(product => {
    const discountPercentage = product.discount_price 
      ? Math.round(((product.price - product.discount_price) / product.price) * 100) 
      : 0;

    return {
      ...product,
      discountPercentage,
      stock: product.inventory ?? 0,
      image: product.product_images?.[0]?.src || "https://placehold.co/300x300?text=No+Image"
    };
  });

  // Don't render if no products available
  if (!isLoading && processedProducts.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white">
      {/* Header Row with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white">
        <SectionHeader
          title="BOOK GENRES"
          icon={BookOpen}
          viewAllLink="/search?category=books"
          viewAllText="View All Books"
          showTabs={false}
        />
      </div>

      {/* Tabs Navigation */}
<div className="bg-white">
  <TabsNavigation
    tabs={genreTabs}
    activeTab={activeTab}
    onTabChange={setActiveTab}
    edgeToEdge={true}
    style={{ backgroundColor: 'white' }}
  />
</div>

      <div className="relative pt-4 px-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-[3:4] bg-gray-200 animate-pulse rounded-md"></div>
                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        ) : processedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {processedProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="space-y-2">
                <Link 
                  to={`/product/${product.id}`}
                  onClick={() => trackProductView(product.id)}
                  className="block"
                >
                  <div className="relative aspect-[3:4] overflow-hidden bg-gray-50 rounded-md">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Genre badge based on active tab */}
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
                      {genreTabs.find(tab => tab.id === activeTab)?.label}
                    </div>

                    {/* Discount badge */}
                    {product.discountPercentage > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                        -{product.discountPercentage}%
                      </div>
                    )}

                    {/* Timer overlay */}
                    {timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0 ? (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs flex items-center justify-center py-1 gap-1">
                        <Timer className="w-3 h-3" />
                        {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((unit, i) => (
                          <span key={i}>
                            {unit.toString().padStart(2, "0")}
                            {i < 2 && <span className="mx-0.5">:</span>}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Product info */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium line-clamp-2 text-gray-900">
                      {product.name}
                    </h4>

                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-semibold text-base">
                        ${Number(product.discount_price || product.price).toFixed(2)}
                      </span>
                      {product.discount_price && (
                        <span className="text-xs text-gray-500 line-through">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {product.stock} in stock
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No books available for {genreTabs.find(tab => tab.id === activeTab)?.label}
          </div>
        )}

        {/* View All Link */}
        {processedProducts.length > 8 && (
          <div className="flex justify-center pt-6">
            <Link 
              to="/search?category=books"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              View All {genreTabs.find(tab => tab.id === activeTab)?.label} Books
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}