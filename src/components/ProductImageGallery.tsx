import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from "react"; import{  Carousel, CarouselContent, CarouselItem, CarouselApi, }from "@/components/ui/carousel"; import VideoControls from"@/components/product/VideoControls"; import{ GalleryThumbnails } from "@/components/product/GalleryThumbnails"; import ImageGalleryControls from"@/components/product/ImageGalleryControls"; import{ useIsMobile } from "@/hooks/use-mobile"; import{ useNavigate } from "react-router-dom"; import{ toast } from "@/hooks/use-toast"; import{ ArrowUpToLine } from "lucide-react"; import InfoBand from"@/components/product/InfoBand"; import PriceInfo from"@/components/product/PriceInfo"; import TabsNavigation from"@/components/home/TabsNavigation"; import{ useCurrency } from "@/contexts/CurrencyContext"; import{ supabase } from "@/integrations/supabase/client"; import VerificationBadge from"@/components/shared/VerificationBadge"; import ProductDetails from"@/components/product/ProductDetails"; import SellerInfoOverlay from"@/components/product/SellerInfoOverlay"; import ConfigurationSummary from"@/components/product/ConfigurationSummary"; import CustomerReviewsEnhanced from"@/components/product/CustomerReviewsEnhanced"; import ProductQA from"@/components/product/ProductQA"; import ProductVariants from"@/components/product/ProductVariants";

interface ProductImageGalleryRef { getTabsContainer: () => HTMLDivElement | null; setActiveTab: (tab: string) => void; getActiveTab: () => string; }

interface ProductImageGalleryProps { images: string[]; videos?: { id: string; video_url: string; title?: string; description?: string; thumbnail_url?: string; }[]; model3dUrl?: string; focusMode?: boolean; onFocusModeChange?: (focusMode: boolean) => void; seller?: { id: string; name: string; image_url?: string; verified: boolean; followers_count: number; }; onSellerClick?: () => void; product?: { id: string; name: string; price: number; discount_price?: number | null; }; bundlePrice?: number; onVariantChange?: (variantIndex: number, variant: any) => void; onProductDetailsClick?: () => void; onImageIndexChange?: (currentIndex: number, totalItems: number) => void; onVariantImageChange?: (imageUrl: string, variantName: string) => void; configurationData?: { selectedColor?: string; selectedStorage?: string; selectedNetwork?: string; selectedCondition?: string; colorVariants: any[]; storageVariants: any[]; networkVariants: any[]; conditionVariants: any[]; getSelectedColorVariant: () => any; getSelectedStorageVariant: () => any; getSelectedNetworkVariant: () => any; getSelectedConditionVariant: () => any; getStorageDisplayValue: (storage: string) => string; getVariantFormattedPrice: (id: number) => string; formatPrice: (price: number) => string; } | null; }

interface GalleryItem { type: 'image' | 'video' | 'model3d'; src: string; videoData?: any; index: number; }

interface TouchPosition { x: number; y: number; }

// Helper function to combine images, videos, and 3D models into a unified gallery function createGalleryItems(images:string[], videos: any[] = [], model3dUrl?: string | any): GalleryItem[] { const items: GalleryItem[] = [];

// Handle model3dUrl that might come as object from Supabase (can be string, object with value, or null) const processedModel3dUrl = typeof model3dUrl === 'string' ? model3dUrl : model3dUrl && typeof model3dUrl === 'object' && typeof (model3dUrl as any).value === 'string' ? (model3dUrl as any).value : null;

// Add main image first if available if (images.length > 0) { items.push({ type: 'image', src: images[0], index: items.length }); }

// Add 3D model second if available and valid if (typeof processedModel3dUrl === 'string' && processedModel3dUrl.trim() !== '') { items.push({ type: 'model3d', src: processedModel3dUrl, index: items.length }); }

// Add remaining images (from index 1 onwards) images.slice(1).forEach((image) => { items.push({ type: 'image', src: image, index: items.length }); });

// Add videos videos.forEach((video) => { items.push({ type: 'video', src: video.video_url, videoData: video, index: items.length }); });

return items; }

const ProductImageGallery = forwardRef<ProductImageGalleryRef, ProductImageGalleryProps>( ({  images,  videos = [], model3dUrl, focusMode: externalFocusMode, onFocusModeChange, seller, onSellerClick, product, bundlePrice, onVariantChange, onProductDetailsClick, onImageIndexChange, onVariantImageChange, configurationData }, ref) => { // Create unified gallery items const [displayImages, setDisplayImages] = useState<string[]>(images); const galleryItems = createGalleryItems(displayImages, videos, model3dUrl);

// Debug logging for 3D model console.log('📷 ProductImageGallery: model3dUrl received:', model3dUrl); console.log('📷 ProductImageGallery: galleryItems created:', galleryItems); const totalItems = galleryItems.length; const videoIndices = galleryItems.map((item, index) => item.type === 'video' ? index : -1).filter(i => i !== -1);

const [currentIndex, setCurrentIndex] = useState(0); const [api, setApi] = useState<CarouselApi | null>(null); const [isRotated, setIsRotated] = useState(0); const [isFlipped, setIsFlipped] = useState(false); const [preloadedItems, setPreloadedItems] = useState<string[]>([]); const [autoScrollEnabled, setAutoScrollEnabled] = useState(false); const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null); const [thumbnailViewMode, setThumbnailViewMode] = useState<"row" | "grid">("row"); const [copiedIndex, setCopiedIndex] = useState<number | null>(null); const [isFullscreenMode, setIsFullscreenMode] = useState(false); const [hoveredThumbnail, setHoveredThumbnail] = useState<number | null>(null); const [focusMode, setFocusMode] = useState(false); const [isMuted, setIsMuted] = useState(true); // Start muted const [volume, setVolume] = useState(1);

const [zoomLevel, setZoomLevel] = useState(1); const [showCompareMode, setShowCompareMode] = useState(false); const [compareIndex, setCompareIndex] = useState(0); const [showImageInfo, setShowImageInfo] = useState(false); const [viewHistory, setViewHistory] = useState<number[]>([0]); const [imageFilter, setImageFilter] = useState<string>("none"); const [showOtherColors, setShowOtherColors] = useState<boolean>(false); const [showAllControls, setShowAllControls] = useState<boolean>(false); const [viewMode, setViewMode] = useState<"default" | "immersive">("default"); const [internalConfigData, setInternalConfigData] = useState<any>(null);

const containerRef = useRef<HTMLDivElement>(null); const imageRef = useRef<HTMLImageElement>(null); const touchStartPosition = useRef<TouchPosition | null>(null); const fullscreenRef = useRef<HTMLDivElement>(null); const isMobile = useIsMobile(); const navigate = useNavigate();

const tabsContainerRef = useRef<HTMLDivElement>(null);

const [openedThumbnailMenu, setOpenedThumbnailMenu] = useState<number | null>(null);

// Update display images when props change useEffect(() => { setDisplayImages(images); }, [images]);

// Handle variant image selection const handleVariantImageChange = useCallback((imageUrl: string, variantName: string) => { console.log('📷 Variant image selected:', imageUrl, variantName);

}, [images, api, onVariantImageChange]);

const [isPlaying, setIsPlaying] = useState(false); const videoRef = useRef<HTMLVideoElement>(null);

const [currentTime, setCurrentTime] = useState(0); const [duration, setDuration] = useState(0); const [bufferedTime, setBufferedTime] = useState(0);

// Tabs navigation state const [activeTab, setActiveTab] = useState('overview'); const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

// Get current item const currentItem = galleryItems[currentIndex]; const isCurrentVideo = currentItem?.type === 'video'; const isCurrentModel3D = currentItem?.type === 'model3d';

// Debug logging useEffect(() => { console.log('Gallery items:', galleryItems); console.log('Current index:', currentIndex); console.log('Current item:', currentItem); console.log('Is current video:', isCurrentVideo); }, [galleryItems, currentIndex, currentItem, isCurrentVideo]);

useEffect(() => { const preloadItems = async () => { const preloaded = await Promise.all( galleryItems.map((item) => { return new Promise<string>((resolve) => { if (item.type === 'image') { const img = new Image(); img.src = item.src; img.onload = () => resolve(item.src); img.onerror = () => resolve(item.src); } else { // For videos, just resolve the URL resolve(item.src); } }); }) ); setPreloadedItems(preloaded); };

}, [galleryItems]);

// Fixed video event listeners useEffect(() => { if (!isCurrentVideo || !videoRef.current) { return; }

}, [isCurrentVideo, currentIndex]); // Added currentIndex as dependency

const onApiChange = useCallback((api: CarouselApi | null) => { if (!api) return;

}, [onImageIndexChange, totalItems]);

const handleThumbnailClick = useCallback((index: number) => { if (api) { api.scrollTo(index); } }, [api]);

const handlePrevious = useCallback(() => { if (api) api.scrollPrev(); }, [api]);

const handleNext = useCallback(() => { if (api) api.scrollNext(); }, [api]);

const handleRotate = useCallback(() => { setIsRotated(prev => (prev + 90) % 360); }, []);

const handleFlip = useCallback(() => { setIsFlipped(prev => !prev); }, []);

const downloadItem = useCallback((index: number) => { const item = galleryItems[index]; const link = document.createElement('a'); link.href = item.src; link.download = product-${item.type}-${index + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}; document.body.appendChild(link); link.click(); document.body.removeChild(link);

}, [galleryItems]);

const copyItemUrl = useCallback((index: number) => { const item = galleryItems[index]; navigator.clipboard.writeText(item.src);

}, [galleryItems]);

const toggleFullscreen = useCallback(() => { setIsFullscreenMode(prev => !prev);

}, [isFullscreenMode]);

const toggleFocusMode = useCallback(() => { const newFocusMode = !focusMode; setFocusMode(newFocusMode); onFocusModeChange?.(newFocusMode); }, [focusMode, onFocusModeChange]);

// Sync external focus mode with internal state useEffect(() => { if (externalFocusMode !== undefined && externalFocusMode !== focusMode) { setFocusMode(externalFocusMode); } }, [externalFocusMode, focusMode]);

// Auto-enable focus mode when viewing 3D model useEffect(() => { if (isCurrentModel3D && !focusMode) { setFocusMode(true); onFocusModeChange?.(true); } }, [isCurrentModel3D, focusMode, onFocusModeChange]);

const handleImageClick = useCallback(() => { if (focusMode) { setFocusMode(false); onFocusModeChange?.(false); } else if (!isCurrentVideo && !isCurrentModel3D) { toggleFocusMode(); } }, [focusMode, onFocusModeChange, toggleFocusMode, isCurrentVideo, isCurrentModel3D]);

// Video control handlers const handleMuteToggle = () => { if (videoRef.current) { const newMutedState = !isMuted; videoRef.current.muted = newMutedState; setIsMuted(newMutedState); } };

const handleVolumeChange = (newVolume: number) => { if (videoRef.current) { videoRef.current.volume = newVolume; setVolume(newVolume); setIsMuted(newVolume === 0); } };

const handleSeek = (newTime: number) => { if (videoRef.current) { videoRef.current.currentTime = newTime; setCurrentTime(newTime); } };

const handleSkipForward = () => { if (videoRef.current) { const newTime = Math.min((videoRef.current.currentTime || 0) + 10, duration); videoRef.current.currentTime = newTime; setCurrentTime(newTime); } };

const handleSkipBackward = () => { if (videoRef.current) { const newTime = Math.max((videoRef.current.currentTime || 0) - 10, 0); videoRef.current.currentTime = newTime; setCurrentTime(newTime); } };

const handleFullscreenVideo = () => { if (videoRef.current) { if (document.fullscreenElement) { document.exitFullscreen(); } else { videoRef.current.requestFullscreen(); } } };

// In ProductImageGallery component, update the useImperativeHandle to expose more methods:

useImperativeHandle(ref, () => ({ getTabsContainer: () => tabsContainerRef.current, setActiveTab: (tab: string) => setActiveTab(tab), getActiveTab: () => activeTab }));

const toggleVideo = () => { if (videoRef.current) { if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play().catch((error) => { console.error('Error playing video:', error); }); } } };

const toggleAutoScroll = useCallback(() => { setAutoScrollEnabled(prev => !prev); }, []);

useEffect(() => { const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isFullscreenMode) { toggleFullscreen(); } };

}, [isFullscreenMode, toggleFullscreen]);

useEffect(() => { if (autoScrollEnabled && api) { const interval = setInterval(() => { api.scrollNext(); }, 3000);

}, [autoScrollEnabled, api]);

if (totalItems === 0) { return ( <div className="flex flex-col bg-transparent"> <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center"> <span className="text-gray-500">No images or videos available</span> </div> </div> ); }

return ( <div ref={containerRef} className="flex flex-col bg-transparent w-full max-w-full overflow-x-hidden"> <div className="relative w-full aspect-square overflow-hidden max-w-full"> <Carousel className="w-full h-full" opts={{ loop: totalItems > 1, }} setApi={onApiChange} > <CarouselContent className="h-full"> {galleryItems.map((item, index) => ( <CarouselItem key={${item.type}-${index}} className="h-full"> <div className="flex h-full w-full items-center justify-center overflow-hidden relative"> {item.type === 'model3d' ? (

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

<ProductDetails onConfigurationSummaryClick={() => {
        // Trigger configuration summary logic here
        setActiveTab('overview'); // or whatever tab shows the configuration
        // You can add additional logic to show configuration summary
      }} />
{seller && (
  <SellerInfoOverlay
    seller={seller}
    onClick={onSellerClick}
    bottomContent={
      product && (
        <div className="flex flex-col gap-1">
          <InfoBand product={product} bundlePrice={bundlePrice} />
          <PriceInfo product={product} bundlePrice={bundlePrice} />
          <VerificationBadge seller={seller} />
        </div>
      )
    }
  />
)}

{isMobile && (
  <ImageGalleryControls
    onRotate={handleRotate}
    onFlip={handleFlip}
    onDownload={downloadItem.bind(null, currentIndex)}
    onCopyUrl={copyItemUrl.bind(null, currentIndex)}
    onFullscreenToggle={toggleFullscreen}
    onFocusModeToggle={toggleFocusMode}
    focusMode={focusMode}
    isCurrentVideo={isCurrentVideo}
    isPlaying={isPlaying}
    onPlayPause={toggleVideo}
    isMuted={isMuted}
    onMuteToggle={handleMuteToggle}
    volume={volume}
    onVolumeChange={handleVolumeChange}
    onSkipForward={handleSkipForward}
    onSkipBackward={handleSkipBackward}
    onFullscreenVideo={handleFullscreenVideo}
    showAllControls={showAllControls}
    onShowAllControlsChange={setShowAllControls}
    viewMode={viewMode}
    onViewModeChange={setViewMode}
  />
)}

{!isMobile && (
  <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 transition-opacity duration-300 ${showAllControls ? "opacity-100" : "opacity-50 hover:opacity-100"}`}>
    {totalItems > 1 && (
      <>
        <button onClick={handlePrevious} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-sm text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          {currentIndex + 1} / {totalItems}
        </div>
        <button onClick={handleNext} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </>
    )}
    {!isCurrentVideo && !isCurrentModel3D && (
      <button onClick={handleImageClick} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75">
        {focusMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.745 11.25c.025-.35.049-.71.049-1.056 0-1.169-.423-2.292-1.187-3.153a4.027 4.027 0 00-1.024-1.157l-.752-.654a2.163 2.163 0 01-.414-2.026l.155-.525a2.163 2.163 0 011.747-1.636l.576-.192c.618-.206 1.272-.206 1.89.002l.658.22c.596.2.99.597 1.187.995l.35.593a4.027 4.027 0 001.107 1.233c.55.348 1.14.619 1.767.813l.556.186a2.163 2.163 0 011.645 1.743l.158.536a2.163 2.163 0 01-.422 1.96l-.774.73a4.027 4.027 0 00-1.148 1.253l-.574.536c-.44.414-.774.995-.774 1.617v.555c0 .548.234 1.063.654 1.418l.525.427a2.163 2.163 0 01.437 1.754l-.525.525a2.163 2.163 0 01-1.747 1.643l-.658.22c-.596.2-1.272.2-1.89.002l-.658-.22a4.027 4.027 0 00-1.073-.996l-.467-.348z" />
          </svg>
        )}
      </button>
    )}
    {isCurrentVideo && (
      <button onClick={toggleVideo} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75">
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4 0v6m-2-3h6a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h6z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h1a2 2 0 002 2h1a2 2 0 002-2v-6a2 2 0 00-2-2H7a2 2 0 00-2 2zM14 19v-6a2 2 0 00-2-2h-1a2 2 0 00-2 2v6a2 2 0 002 2h1a2 2 0 002-2zM5 7a2 2 0 012-2h1a2 2 0 012 2v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7zM14 7a2 2 0 012-2h1a2 2 0 012 2v1a2 2 0 01-2 2h-1a2 2 0 01-2-2V7z" />
          </svg>
        )}
      </button>
    )}
    {totalItems > 1 && (
      <button onClick={toggleAutoScroll} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75">
        {autoScrollEnabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4 0v6m-2-3h6a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h6z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </button>
    )}
  </div>
)}

{showImageInfo && (
  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
    {currentItem?.type === 'image' && `Image ${currentIndex + 1}`}
    {currentItem?.type === 'video' && currentItem.videoData?.title}
    {currentItem?.type === 'model3d' && '3D Model'}
  </div>
)}

</div>
</div>
{/* Render ConfigurationSummary when needed, perhaps triggered by a state change */}
{/* {showConfigurationSummary && <ConfigurationSummary />} */}
{activeTab === 'overview' && configurationData && (
  <div className="p-4">
    <ConfigurationSummary
      configurationData={configurationData}
      onVariantChange={onVariantChange}
    />
  </div>
)}
{activeTab === 'variants' && configurationData && (
  <div className="p-4">
    <ProductVariants
      configurationData={configurationData}
      onVariantChange={onVariantChange}
    />
  </div>
)}
{activeTab === 'reviews' && (
  <div className="p-4">
    <CustomerReviewsEnhanced />
  </div>
)}
{activeTab === 'qna' && (
  <div className="p-4">
    <ProductQA />
  </div>
)}
{activeTab === 'shipping' && (
  <div className="p-4">
    {/* Placeholder for Shipping component */}
    <p>Shipping Information</p>
  </div>
)}
{activeTab === 'recommendations' && (
  <div className="p-4">
    {/* Placeholder for Recommendations component */}
    <p>Recommendations</p>
  </div>
)}
</div>
); });

export default ProductImageGallery; export type{ ProductImageGalleryRef };