import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from "react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import VideoControls from "@/components/product/VideoControls";
import { GalleryThumbnails } from "@/components/product/GalleryThumbnails";
import ImageGalleryControls from "@/components/product/ImageGalleryControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { ArrowUpToLine } from "lucide-react";
import InfoBand from "@/components/product/InfoBand";
import PriceInfo from "@/components/product/PriceInfo";
import TabsNavigation from "@/components/home/TabsNavigation";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import VerificationBadge from "@/components/shared/VerificationBadge";
import ProductDetails from "@/components/product/ProductDetails";
import SellerInfoOverlay from "@/components/product/SellerInfoOverlay";
import ConfigurationSummary from "@/components/product/ConfigurationSummary";
import CustomerReviewsEnhanced from "@/components/product/CustomerReviewsEnhanced";
import ProductQA from "@/components/product/ProductQA";
import ProductVariants from "@/components/product/ProductVariants";


interface ProductImageGalleryRef {
  getTabsContainer: () => HTMLDivElement | null;
  setActiveTab: (tab: string) => void;
  getActiveTab: () => string;
}

interface ProductImageGalleryProps {
  images: string[];
  videos?: {
    id: string;
    video_url: string;
    title?: string;
    description?: string;
    thumbnail_url?: string;
  }[];
  model3dUrl?: string;
  focusMode?: boolean;
  onFocusModeChange?: (focusMode: boolean) => void;
  seller?: {
    id: string;
    name: string;
    image_url?: string;
    verified: boolean;
    followers_count: number;
  };
  onSellerClick?: () => void;
  product?: {
    id: string;
    name: string;
    price: number;
    discount_price?: number | null;
  };
  bundlePrice?: number;
  onVariantChange?: (variantIndex: number, variant: any) => void;
  onProductDetailsClick?: () => void;
  onImageIndexChange?: (currentIndex: number, totalItems: number) => void;
  onVariantImageChange?: (imageUrl: string, variantName: string) => void;
  configurationData?: {
    selectedColor?: string;
    selectedStorage?: string;
    selectedNetwork?: string;
    selectedCondition?: string;
    colorVariants: any[];
    storageVariants: any[];
    networkVariants: any[];
    conditionVariants: any[];
    getSelectedColorVariant: () => any;
    getSelectedStorageVariant: () => any;
    getSelectedNetworkVariant: () => any;
    getSelectedConditionVariant: () => any;
    getStorageDisplayValue: (storage: string) => string;
    getVariantFormattedPrice: (id: number) => string;
    formatPrice: (price: number) => string;
  } | null;
}

interface GalleryItem {
  type: 'image' | 'video' | 'model3d';
  src: string;
  videoData?: any;
  index: number;
}

interface TouchPosition {
  x: number;
  y: number;
}

// Helper function to combine images, videos, and 3D models into a unified gallery
function createGalleryItems(images: string[], videos: any[] = [], model3dUrl?: string | any): GalleryItem[] {
  const items: GalleryItem[] = [];

  // Handle model3dUrl that might come as object from Supabase (can be string, object with value, or null)
  const processedModel3dUrl =
    typeof model3dUrl === 'string'
      ? model3dUrl
      : model3dUrl && typeof model3dUrl === 'object' && typeof (model3dUrl as any).value === 'string'
      ? (model3dUrl as any).value
      : null;

  // Add main image first if available
  if (images.length > 0) {
    items.push({
      type: 'image',
      src: images[0],
      index: items.length
    });
  }

  // Add 3D model second if available and valid
  if (typeof processedModel3dUrl === 'string' && processedModel3dUrl.trim() !== '') {
    items.push({
      type: 'model3d',
      src: processedModel3dUrl,
      index: items.length
    });
  }

  // Add remaining images (from index 1 onwards)
  images.slice(1).forEach((image) => {
    items.push({
      type: 'image',
      src: image,
      index: items.length
    });
  });

  // Add videos
  videos.forEach((video) => {
    items.push({
      type: 'video',
      src: video.video_url,
      videoData: video,
      index: items.length
    });
  });

  return items;
}

const ProductImageGallery = forwardRef<ProductImageGalleryRef, ProductImageGalleryProps>(
  ({ 
    images, 
    videos = [],
    model3dUrl,
    focusMode: externalFocusMode,
    onFocusModeChange,
    seller,
    onSellerClick,
    product,
    bundlePrice,
    onVariantChange,
    onProductDetailsClick,
    onImageIndexChange,
    onVariantImageChange,
    configurationData
  }, ref) => {
  // Create unified gallery items
  const [displayImages, setDisplayImages] = useState<string[]>(images);
  const galleryItems = createGalleryItems(displayImages, videos, model3dUrl);
  
  // Debug logging for 3D model
  console.log('📷 ProductImageGallery: model3dUrl received:', model3dUrl);
  console.log('📷 ProductImageGallery: galleryItems created:', galleryItems);
  const totalItems = galleryItems.length;
  const videoIndices = galleryItems.map((item, index) => item.type === 'video' ? index : -1).filter(i => i !== -1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [isRotated, setIsRotated] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [preloadedItems, setPreloadedItems] = useState<string[]>([]);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
  const [thumbnailViewMode, setThumbnailViewMode] = useState<"row" | "grid">("row");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [hoveredThumbnail, setHoveredThumbnail] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [volume, setVolume] = useState(1);
const [showConfiguration, setShowConfiguration] = useState(false);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCompareMode, setShowCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState(0);
  const [showImageInfo, setShowImageInfo] = useState(false);
  const [viewHistory, setViewHistory] = useState<number[]>([0]);
  const [imageFilter, setImageFilter] = useState<string>("none");
  const [showOtherColors, setShowOtherColors] = useState<boolean>(false);
  const [showAllControls, setShowAllControls] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"default" | "immersive">("default");
  const [internalConfigData, setInternalConfigData] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartPosition = useRef<TouchPosition | null>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();


  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const [openedThumbnailMenu, setOpenedThumbnailMenu] = useState<number | null>(null);
  
  // Update display images when props change
  useEffect(() => {
    setDisplayImages(images);
  }, [images]);

  // Handle variant image selection
  const handleVariantImageChange = useCallback((imageUrl: string, variantName: string) => {
    console.log('📷 Variant image selected:', imageUrl, variantName);
    
    // Update the display images to show the variant image first
    const newImages = [imageUrl, ...images.filter(img => img !== imageUrl)];
    setDisplayImages(newImages);
    
    // Set the gallery to show the first image (the variant image)
    setTimeout(() => {
      if (api) {
        api.scrollTo(0);
      }
      setCurrentIndex(0);
    }, 100);
    
    // Call the external callback if provided
    if (onVariantImageChange) {
      onVariantImageChange(imageUrl, variantName);
    }
  }, [images, api, onVariantImageChange]);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  
  // Tabs navigation state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Get current item
  const currentItem = galleryItems[currentIndex];
  const isCurrentVideo = currentItem?.type === 'video';
  const isCurrentModel3D = currentItem?.type === 'model3d';

  // Debug logging
  useEffect(() => {
    console.log('Gallery items:', galleryItems);
    console.log('Current index:', currentIndex);
    console.log('Current item:', currentItem);
    console.log('Is current video:', isCurrentVideo);
  }, [galleryItems, currentIndex, currentItem, isCurrentVideo]);

  useEffect(() => {
    const preloadItems = async () => {
      const preloaded = await Promise.all(
        galleryItems.map((item) => {
          return new Promise<string>((resolve) => {
            if (item.type === 'image') {
              const img = new Image();
              img.src = item.src;
              img.onload = () => resolve(item.src);
              img.onerror = () => resolve(item.src);
            } else {
              // For videos, just resolve the URL
              resolve(item.src);
            }
          });
        })
      );
      setPreloadedItems(preloaded);
    };

    preloadItems();
  }, [galleryItems]);

  // Fixed video event listeners
  useEffect(() => {
    if (!isCurrentVideo || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onError = (e: Event) => {
      console.error('Video error:', e);
      // Don't crash the component on video error
    };

    try {
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('progress', onProgress);
      video.addEventListener('error', onError);

      return () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('progress', onProgress);
        video.removeEventListener('error', onError);
      };
    } catch (error) {
      console.error('Error setting up video event listeners:', error);
    }
  }, [isCurrentVideo, currentIndex]); // Added currentIndex as dependency

  const onApiChange = useCallback((api: CarouselApi | null) => {
    if (!api) return;

    setApi(api);
    const index = api.selectedScrollSnap();
    setCurrentIndex(index);
    onImageIndexChange?.(index, totalItems);

    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrentIndex(newIndex);
      onImageIndexChange?.(newIndex, totalItems);
      setIsRotated(0);
      setIsFlipped(false);
      setZoomLevel(1);
      setIsPlaying(false); // Reset video playing state
      setCurrentTime(0);
      setDuration(0);
      setBufferedTime(0);

      setViewHistory(prev => [...prev, newIndex]);
    });
  }, [onImageIndexChange, totalItems]);

  const handleThumbnailClick = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  }, [api]);

  const handlePrevious = useCallback(() => {
    if (api) api.scrollPrev();
  }, [api]);

  const handleNext = useCallback(() => {
    if (api) api.scrollNext();
  }, [api]);

  const handleRotate = useCallback(() => {
    setIsRotated(prev => (prev + 90) % 360);
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const downloadItem = useCallback((index: number) => {
    const item = galleryItems[index];
    const link = document.createElement('a');
    link.href = item.src;
    link.download = `product-${item.type}-${index + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: `${item.type === 'video' ? 'Video' : 'Image'} downloaded`,
      description: `${item.type === 'video' ? 'Video' : 'Image'} ${index + 1} has been downloaded`,
      duration: 2000,
    });
  }, [galleryItems]);

  const copyItemUrl = useCallback((index: number) => {
    const item = galleryItems[index];
    navigator.clipboard.writeText(item.src);

    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);

    toast({
      title: `${item.type === 'video' ? 'Video' : 'Image'} URL copied`,
      description: `${item.type === 'video' ? 'Video' : 'Image'} URL has been copied to clipboard`,
      duration: 2000,
    });
  }, [galleryItems]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreenMode(prev => !prev);

    if (!isFullscreenMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullscreenMode]);

  const toggleFocusMode = useCallback(() => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    onFocusModeChange?.(newFocusMode);
  }, [focusMode, onFocusModeChange]);

  // Sync external focus mode with internal state
  useEffect(() => {
    if (externalFocusMode !== undefined && externalFocusMode !== focusMode) {
      setFocusMode(externalFocusMode);
    }
  }, [externalFocusMode, focusMode]);

  // Auto-enable focus mode when viewing 3D model
  useEffect(() => {
    if (isCurrentModel3D && !focusMode) {
      setFocusMode(true);
      onFocusModeChange?.(true);
    }
  }, [isCurrentModel3D, focusMode, onFocusModeChange]);

  const handleImageClick = useCallback(() => {
    if (focusMode) {
      setFocusMode(false);
      onFocusModeChange?.(false);
    } else if (!isCurrentVideo && !isCurrentModel3D) {
      toggleFocusMode();
    }
  }, [focusMode, onFocusModeChange, toggleFocusMode, isCurrentVideo, isCurrentModel3D]);

  // Video control handlers
  const handleMuteToggle = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min((videoRef.current.currentTime || 0) + 10, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max((videoRef.current.currentTime || 0) - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFullscreenVideo = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };


// In ProductImageGallery component, update the useImperativeHandle to expose more methods:

useImperativeHandle(ref, () => ({
      getTabsContainer: () => tabsContainerRef.current,
      setActiveTab: (tab: string) => setActiveTab(tab),
      getActiveTab: () => activeTab
    }));

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => {
          console.error('Error playing video:', error);
        });
      }
    }
  };

  const toggleAutoScroll = useCallback(() => {
    setAutoScrollEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenMode) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreenMode, toggleFullscreen]);

  useEffect(() => {
    if (autoScrollEnabled && api) {
      const interval = setInterval(() => {
        api.scrollNext();
      }, 3000);

      setAutoScrollInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else if (!autoScrollEnabled && autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }

    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollEnabled, api]);

  if (totalItems === 0) {
    return (
      <div className="flex flex-col bg-transparent">
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500">No images or videos available</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col bg-transparent w-full max-w-full overflow-x-hidden">
      <div className="relative w-full aspect-square overflow-hidden max-w-full">
        <Carousel
          className="w-full h-full"
          opts={{
            loop: totalItems > 1,
          }}
          setApi={onApiChange}
        >
          <CarouselContent className="h-full">
            {galleryItems.map((item, index) => (
              <CarouselItem key={`${item.type}-${index}`} className="h-full">
                <div className="flex h-full w-full items-center justify-center overflow-hidden relative">
                  {item.type === 'model3d' ? (
  <div
    className="square-wrapper"
    style={{ position: "relative", width: "100%", paddingBottom: "100%" }}
  >
    <iframe
      title="3D Model"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; fullscreen; xr-spatial-tracking"
      src={item.src}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        border: 0,
      }}
    ></iframe>
  </div> ) : item.type === 'video' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        ref={index === currentIndex ? videoRef : undefined}
                        src={item.src}
                        className="w-full h-full object-contain cursor-pointer"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          aspectRatio: '1/1', 
                          objectFit: 'cover' 
                        }}
                        onClick={toggleVideo}
                        playsInline
                        loop
                        muted={isMuted}
                        autoPlay={false}
                        poster={item.videoData?.thumbnail_url}
                        preload="metadata"
                        onError={(e) => {
                          console.error('Video loading error:', e);
                          // You might want to show a fallback image here
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      {index === currentIndex && isCurrentVideo && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="pointer-events-auto h-full w-full flex items-end">
                            <VideoControls
                              isPlaying={isPlaying}
                              isMuted={isMuted}
                              volume={volume}
                              onPlayPause={toggleVideo}
                              onMuteToggle={handleMuteToggle}
                              onVolumeChange={handleVolumeChange}
                              currentTime={currentTime}
                              duration={duration}
                              bufferedTime={bufferedTime}
                              onSeek={handleSeek}
                              onSkipForward={handleSkipForward}
                              onSkipBackward={handleSkipBackward}
                              onFullscreenToggle={handleFullscreenVideo}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      ref={index === currentIndex ? imageRef : undefined}
                      src={item.src}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-contain transition-transform"
                      style={{
                        transform: `
                          rotate(${isRotated}deg)
                          ${isFlipped ? 'scaleX(-1)' : ''}
                          scale(${zoomLevel})
                        `,
                        transition: "transform 0.2s ease-out",
                        filter: imageFilter !== "none"
                          ? imageFilter === "grayscale" ? "grayscale(1)"
                            : imageFilter === "sepia" ? "sepia(0.7)"
                              : imageFilter === "brightness" ? "brightness(1.2)"
                                : imageFilter === "contrast" ? "contrast(1.2)"
                                  : "none"
                          : "none"
                      }}
                      draggable={false}
                      onClick={handleImageClick}
                      onError={(e) => {
                        console.error('Image loading error:', e);
                        // You might want to show a fallback image here
                      }}
                    />
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Show gallery controls for both images and videos */}
          <PriceInfo
            product={product}
            bundlePrice={bundlePrice}
            focusMode={focusMode}
            isPlaying={isCurrentVideo ? isPlaying : false}
            configurationData={configurationData || internalConfigData}
          />
          
          {/* Seller Info - Bottom Left */}
          <SellerInfoOverlay 
            seller={seller}
            onSellerClick={onSellerClick}
            focusMode={focusMode}
            isPlaying={isCurrentVideo && isPlaying}
          />

          {/* Product Details - Bottom Right */}
          {!(focusMode || (isCurrentVideo && isPlaying)) && (
            <ProductDetails onProductDetailsClick={onProductDetailsClick} />
          )}

          {/* Configuration Summary - Right Side (Focus Mode Only) */}
          {focusMode && (configurationData || internalConfigData) && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30">
              <ConfigurationSummary {...(configurationData || internalConfigData)} />
            </div>
          )}
          
        </Carousel>
      </div>

      <InfoBand />

      {/* Tabs Navigation */}
      {/* Tabs Navigation - FIXED */}
{totalItems > 1 && (
  <div ref={tabsContainerRef} className="w-full bg-white">
    <TabsNavigation
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'variants', label: 'Variants' },
        { id: 'reviews', label: 'Reviews' },
        { id: 'qna', label: 'Q&A' },
        { id: 'shipping', label: 'Shipping' },
{ id: 'recommendations', label: 'Recommendations' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      edgeToEdge={true}
      style={{ backgroundColor: 'white' }}
    />
  </div>
)}

      {/* Thumbnails - Always show when there's more than 1 item OR when there's a 3D model */}
      {(totalItems > 1 || galleryItems.some(item => item.type === 'model3d')) && (
        <div className="mt-1 w-full">
          {activeTab === 'overview' && (
            <GalleryThumbnails
              images={galleryItems.map(item => item.src)}
              currentIndex={currentIndex}
              onThumbnailClick={handleThumbnailClick}
              isPlaying={isPlaying}
              videoIndices={videoIndices}
              galleryItems={galleryItems}
            />
          )}
          {activeTab === 'variants' && (
             <div className="px-2">
        <ProductVariants 
          productId={product?.id}
          onImageSelect={handleVariantImageChange}
          onConfigurationChange={(configData) => {
            // Store configuration data in state to pass to ConfigurationSummary
            setInternalConfigData(configData);
          }}
        />
      </div>
          )}
          {activeTab === 'reviews' && (
            <div className="p-2">
              <CustomerReviewsEnhanced productId={product?.id || ''} limit={10} />
            </div>
          )}

           {activeTab === 'qna' && ( 
             <div className="p-2">
               <ProductQA/>
             </div>
           )}

           {activeTab === 'shipping' && (
             <div className="p-2">
               <div className="w-full space-y-6 py-4">
                 <div className="w-full">
                   <h3 className="w-full text-lg font-semibold text-gray-900 mb-3">Delivery Options</h3>
                   <div className="w-full space-y-3">
                     <div className="flex justify-between items-center w-full p-3 bg-green-50 rounded-lg border border-green-200">
                       <span className="text-gray-600">Local Delivery</span>
                       <span className="font-semibold text-green-700">1-2 business days</span>
                     </div>
                     <div className="flex justify-between items-center w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                       <span className="text-gray-600">International Shipping</span>
                       <span className="font-semibold text-blue-700">5-10 business days</span>
                     </div>
                   </div>
                 </div>

                 <div className="w-full">
                   <h3 className="w-full text-lg font-semibold text-gray-900 mb-3">Shipping Partners</h3>
                   <div className="w-full grid grid-cols-2 gap-3">
                     <div className="flex items-center w-full p-3 bg-gray-50 rounded-lg">
                       <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                         <span className="text-white text-xs font-bold">DHL</span>
                       </div>
                       <span className="text-gray-600">DHL Express</span>
                     </div>
                     <div className="flex items-center w-full p-3 bg-gray-50 rounded-lg">
                       <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                         <span className="text-white text-xs font-bold">FX</span>
                       </div>
                       <span className="text-gray-600">FedEx</span>
                     </div>
                   </div>
                 </div>

                 <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4">
                   <h3 className="w-full text-lg font-semibold text-gray-900 mb-3">Return Policy</h3>
                   <ul className="w-full space-y-2 text-gray-600">
                     <li className="flex items-start w-full">
                       <span className="text-amber-600 mr-2">•</span>
                       <span>30-day return window from delivery date</span>
                     </li>
                     <li className="flex items-start w-full">
                       <span className="text-amber-600 mr-2">•</span>
                       <span>Items must be in original condition with all accessories</span>
                     </li>
                   </ul>
                 </div>
               </div>
             </div>
           )}


        </div>
      )}

      {/* Fullscreen Mode */}
      {isFullscreenMode && (
        <div 
          ref={fullscreenRef}
          className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fade-in"
          onClick={toggleFullscreen}
        >
          <button 
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
            onClick={toggleFullscreen}
          >
            <ArrowUpToLine className="h-5 w-5" />
          </button>

          {isCurrentVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={currentItem.src}
                className="max-w-[90%] max-h-[90%] object-contain"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVideo();
                }}
                playsInline
                loop
                muted={isMuted}
                autoPlay={false}
                style={{ background: "black" }}
                controls={false}
                onError={(e) => {
                  console.error('Fullscreen video loading error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 pointer-events-none">
                <div className="pointer-events-auto h-full w-full flex items-end">
                  <VideoControls
                    isPlaying={isPlaying}
                    isMuted={isMuted}
                    volume={volume}
                    onPlayPause={toggleVideo}
                    onMuteToggle={handleMuteToggle}
                    onVolumeChange={handleVolumeChange}
                    currentTime={currentTime}
                    duration={duration}
                    bufferedTime={bufferedTime}
                    onSeek={handleSeek}
                    onSkipForward={handleSkipForward}
                    onSkipBackward={handleSkipBackward}
                    onFullscreenToggle={handleFullscreenVideo}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <img 
                src={currentItem.src} 
                alt={`Product fullscreen image ${currentIndex + 1}`} 
                className="max-w-[90%] max-h-[90%] object-contain"
                style={{
                  transform: `
                    rotate(${isRotated}deg)
                    ${isFlipped ? 'scaleX(-1)' : ''}
                    scale(${zoomLevel})
                  `,
                  filter: imageFilter !== "none"
                    ? imageFilter === "grayscale" ? "grayscale(1)"
                      : imageFilter === "sepia" ? "sepia(0.7)"
                        : imageFilter === "brightness" ? "brightness(1.2)"
                          : imageFilter === "contrast" ? "contrast(1.2)"
                            : "none"
                    : "none"
                }}
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('Fullscreen image loading error:', e);
                }}
              />
              <ImageGalleryControls
                currentIndex={currentIndex}
                totalImages={totalItems}
                isRotated={isRotated}
                isFlipped={isFlipped}
                autoScrollEnabled={autoScrollEnabled}
                focusMode={focusMode}
                variant="fullscreen"
                seller={seller}
                onRotate={(e) => {
                  if (e) e.stopPropagation();
                  handleRotate();
                }}
                onFlip={(e) => {
                  if (e) e.stopPropagation();
                  handleFlip();
                }}
                onToggleAutoScroll={toggleAutoScroll}
                onToggleFocusMode={toggleFocusMode}
                onPrevious={(e) => {
                  if (e) e.stopPropagation();
                  handlePrevious();
                }}
                onNext={(e) => {
                  if (e) e.stopPropagation();
                  handleNext();
                }}
                onDownload={(e) => {
                  if (e) e.stopPropagation();
                  downloadItem(currentIndex);
                }}
                onSellerClick={onSellerClick}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default ProductImageGallery;
export type { ProductImageGalleryRef };