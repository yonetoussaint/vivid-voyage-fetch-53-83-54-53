import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useSeller, 
  useSellerProducts, 
  useSellerCollections,
  useSellerReviews,
  useSellerReels 
} from '@/hooks/useSeller';
import { 
  ChevronLeft, MessageCircle, ExternalLink, ChevronDown, ChevronUp, Heart, Search
} from 'lucide-react';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import VerificationBadge from '@/components/shared/VerificationBadge';
import { supabase } from '@/integrations/supabase/client';

// Tab components
import SellerTabsNavigation from '@/components/seller/SellerTabsNavigation';
import SellerHomeTab from '@/components/seller/tabs/SellerHomeTab';
import SellerProductsTab from '@/components/seller/tabs/SellerProductsTab';
import SellerReelsTab from '@/components/seller/tabs/SellerReelsTab';
import SellerPostsTab from '@/components/seller/tabs/SellerPostsTab';

import { SocialMediaEditDialog } from '@/components/seller/SocialMediaEditDialog';
import { SellerEditDialog } from '@/components/seller/SellerEditDialog';
import { VideoUploadDialog } from '@/components/seller/VideoUploadDialog';
import { Product } from '@/integrations/supabase/products';

const SellerPage = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('home');
  const [showSocialEditDialog, setShowSocialEditDialog] = useState(false);
  const [showSellerEditDialog, setShowSellerEditDialog] = useState(false);
  const [showVideoUploadDialog, setShowVideoUploadDialog] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLinksDropdown, setShowLinksDropdown] = useState(false);
  const { progress } = useScrollProgress();

  const { data: seller, isLoading: sellerLoading } = useSeller(sellerId!);
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useSellerProducts(sellerId!);
  const { data: videos = [], isLoading: videosLoading, refetch: refetchVideos } = useSellerReels(sellerId!);
  const { data: collections = [], isLoading: collectionsLoading } = useSellerCollections(sellerId!);
  const { data: reviews = [], isLoading: reviewsLoading } = useSellerReviews(sellerId!);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (sellerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading seller...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Seller Not Found</h1>
          <p className="text-muted-foreground">The seller you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getSellerLogoUrl = (imagePath?: string): string => {
    if (!imagePath) return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face";

    const { data } = supabase.storage
      .from('seller-logos')
      .getPublicUrl(imagePath);

    return data.publicUrl;
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/product/${product.id}/edit`);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/reels?video=${videoId}`);
  };

  const handleVideoUploadSuccess = () => {
    refetchVideos();
    setShowVideoUploadDialog(false);
  };

  const handleEditVideo = (videoId: string) => {
    // TODO: Implement video editing functionality
    console.log('Edit video:', videoId);
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error deleting video:', error);
        return;
      }

      // Refresh the videos list
      refetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const formatLastOnline = (lastOnline?: string): string => {
    if (!lastOnline) return 'Active now';
    
    const now = new Date();
    const lastOnlineDate = new Date(lastOnline);
    const diffInMinutes = Math.floor((now.getTime() - lastOnlineDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `Active ${Math.floor(diffInMinutes / 1440)}d ago`;
    return 'Active 1w+ ago';
  };

  const mockSocialLinks = [
    { platform: 'instagram', url: 'https://instagram.com/seller', username: '@seller' },
    { platform: 'facebook', url: 'https://facebook.com/seller', username: 'Seller Page' },
    { platform: 'twitter', url: 'https://twitter.com/seller', username: '@seller' },
    { platform: 'website', url: 'https://seller-website.com', username: 'seller-website.com' }
  ];

  // Mock announcements data
  const announcements = [
    {
      id: '1',
      title: 'New iPhone 15 Pro Available',
      message: 'Get the latest iPhone 15 Pro with exclusive deals and fast shipping!',
      type: 'new_arrival',
      priority: 'high',
      date: '2024-01-20T10:00:00Z'
    },
    {
      id: '2',
      title: 'Free Shipping Weekend',
      message: 'Enjoy free shipping on all orders this weekend. Limited time offer!',
      type: 'event',
      priority: 'medium',
      date: '2024-01-19T08:00:00Z'
    },
    {
      id: '3',
      title: 'Updated Delivery Times',
      message: 'We have improved our delivery times for better customer experience.',
      type: 'update',
      priority: 'low',
      date: '2024-01-18T12:00:00Z'
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      {/* Adaptive Header */}
      <div className="bg-white fixed top-0 left-0 right-0 z-50 border-b border-gray-100">
        {/* Main Header Row */}
        <div 
          className="flex items-center px-3 py-2 gap-3 transition-all duration-300"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${0.95 + (progress * 0.05)})`,
            backdropFilter: `blur(${progress * 4}px)`,
          }}
        >
          {/* Back Button - Always Present */}
          <button 
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Collapsed Seller Info - Shows when scrolled */}
          {progress > 0.3 && seller && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img 
                src={getSellerLogoUrl(seller.image_url)} 
                alt={seller.name} 
                className="w-8 h-8 rounded-full flex-shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h2 className="text-sm font-semibold text-gray-900 truncate">{seller.name}</h2>
                  {seller.verified && <VerificationBadge size="sm" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Last seen 2 hours ago</span>
                </div>
              </div>
              
              {/* Quick Actions when scrolled */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isFollowing 
                      ? 'bg-gray-100 text-gray-700 border border-gray-200' 
                      : 'bg-blue-500 text-white'
                  }`}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Search Bar - Shows when not scrolled */}
          {progress <= 0.3 && (
            <>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-3 py-1.5 bg-gray-100 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              </div>

              {/* Message Icon */}
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <MessageCircle className="w-4 h-4 text-gray-600" />
              </button>
            </>
          )}
        </div>

        {/* Sticky Tabs Navigation */}
        <div className="border-t border-gray-100">
          <SellerTabsNavigation
            activeTab={activeMainTab}
            onTabChange={setActiveMainTab}
            productCount={products.length}
            reelsCount={videos.length}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-[120px] min-h-screen bg-gray-50">{/* Adjust padding for fixed header height */}
        {activeMainTab === 'home' && (
          <SellerHomeTab
            seller={seller}
            products={products as any}
            announcements={announcements}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            mockSocialLinks={mockSocialLinks}
            showLinksDropdown={showLinksDropdown}
            onToggleLinksDropdown={() => setShowLinksDropdown(!showLinksDropdown)}
            hideSellerInfo={progress > 0.3} // Hide seller info when scrolled
          />
        )}

        {activeMainTab === 'products' && (
          <SellerProductsTab
            products={products as any}
            isLoading={productsLoading}
            onEditProduct={handleEditProduct}
            onViewProduct={handleViewProduct}
          />
        )}

        {activeMainTab === 'reels' && (
          <SellerReelsTab
            videos={videos}
            isLoading={videosLoading}
            onVideoClick={handleVideoClick}
            onUploadClick={() => setShowVideoUploadDialog(true)}
            onEditVideo={handleEditVideo}
            onDeleteVideo={handleDeleteVideo}
          />
        )}

        {activeMainTab === 'posts' && (
          <SellerPostsTab
            onCreatePost={() => console.log('Create post clicked')}
          />
        )}
      </div>

      {/* Seller Edit Dialog */}
      <SellerEditDialog
        open={showSellerEditDialog}
        onOpenChange={setShowSellerEditDialog}
        seller={seller}
        onSuccess={() => {
          setShowSellerEditDialog(false);
        }}
      />

      {/* Social Media Edit Dialog */}
      <SocialMediaEditDialog
        open={showSocialEditDialog}
        onOpenChange={setShowSocialEditDialog}
        sellerId={sellerId!}
        currentLinks={mockSocialLinks}
        onSuccess={() => {
          setShowSocialEditDialog(false);
        }}
      />

      {/* Video Upload Dialog */}
      <VideoUploadDialog
        open={showVideoUploadDialog}
        onOpenChange={setShowVideoUploadDialog}
        sellerId={sellerId!}
        onSuccess={handleVideoUploadSuccess}
      />
    </div>
  );
};



export default SellerPage;