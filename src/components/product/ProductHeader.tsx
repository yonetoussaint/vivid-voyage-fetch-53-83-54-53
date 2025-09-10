
import React, { useState } from "react";
import { Heart, Share, Package, BadgeInfo, Star, HelpCircle, Truck, Lightbulb, Search, ChevronRight } from "lucide-react";
import { useScrollProgress } from "./header/useScrollProgress";
import LiveBadge from "./header/LiveBadge";
import BackButton from "./header/BackButton";
import HeaderActionButton from "./header/HeaderActionButton";
import AliExpressSearchBar from "@/components/shared/AliExpressSearchBar";
import { useParams } from 'react-router-dom';
import { useProduct } from '@/hooks/useProduct';
import CategoryTabs from "../home/header/CategoryTabs";
import { Separator } from "@/components/ui/separator";

interface ProductHeaderProps {
  activeSection?: string;
  onTabChange?: (section: string) => void;
  focusMode?: boolean;
  showHeaderInFocus?: boolean;
  onProductDetailsClick?: () => void;
  currentImageIndex?: number;
  totalImages?: number;
  onShareClick?: () => void;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ 
  activeSection = "overview", 
  onTabChange,
  focusMode = false,
  showHeaderInFocus = false,
  onProductDetailsClick,
  currentImageIndex,
  totalImages,
  onShareClick
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { progress } = useScrollProgress();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { id: paramId } = useParams<{ id: string }>();
  const { data: product } = useProduct(paramId || '');

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const productSections = [
    { id: "overview", name: "Overview", icon: <Package className="w-4 h-4" />, path: "#overview" },
    { id: "description", name: "Description", icon: <BadgeInfo className="w-4 h-4" />, path: "#description" },
    { id: "reviews", name: "Reviews", icon: <Star className="w-4 h-4" />, path: "#reviews" },
    { id: "qa", name: "Q&A", icon: <HelpCircle className="w-4 h-4" />, path: "#qa" },
    { id: "shipping", name: "Shipping", icon: <Truck className="w-4 h-4" />, path: "#shipping" },
    { id: "specifications", name: "Specs", icon: <Lightbulb className="w-4 h-4" />, path: "#specifications" }
  ];
  
  return (
  <div 
    className={`fixed top-0 left-0 right-0 z-30 flex flex-col transition-all duration-300 ${
      focusMode && !showHeaderInFocus ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
    }`}
  >
    {/* Main Header */}
    <div 
      className="py-2 px-3 w-full transition-all duration-700"
      style={{
        backgroundColor: `rgba(255, 255, 255, ${progress * 0.95})`,
        backdropFilter: `blur(${progress * 8}px)`,
      }}
    >
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        {/* Left side - Back button only */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <BackButton progress={progress} />
        </div>

        {/* Center - Search bar when scrolled */}
        <div className="flex-1 mx-4">
          {progress >= 0.5 && (
            <div className="flex-1 relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1 text-sm font-medium border-2 border-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 bg-white shadow-sm"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 font-bold" />
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <HeaderActionButton 
            Icon={Heart} 
            active={isFavorite} 
            onClick={toggleFavorite} 
            progress={progress} 
            activeColor="#f43f5e"
            likeCount={147} // Example count - replace with actual data
          />

          <HeaderActionButton 
  Icon={Share} 
  progress={progress}
  shareCount={23}
  onClick={onShareClick}
/>
        </div>
      </div>
    </div>
  </div>
);
};

export default ProductHeader;
