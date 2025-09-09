// components/product/StickyTabsNavigation.tsx
import React, { useState, useEffect } from 'react';
import TabsNavigation from "@/components/home/TabsNavigation";

interface StickyTabsNavigationProps {
  headerHeight: number;
  tabsContainerRef: React.RefObject<HTMLDivElement>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const StickyTabsNavigation: React.FC<StickyTabsNavigationProps> = ({
  headerHeight,
  tabsContainerRef,
  activeTab,
  onTabChange
}) => {
  const [showStickyTabs, setShowStickyTabs] = useState(false);

  useEffect(() => {
    const handleScrollForStickyTabs = () => {
      if (tabsContainerRef.current) {
        const tabsRect = tabsContainerRef.current.getBoundingClientRect();
        
        // Show sticky tabs when the original tabs start to scroll out of view
        // (when top of tabs container reaches bottom of header)
        const shouldShow = tabsRect.top <= headerHeight;
        
        setShowStickyTabs(shouldShow);
        
        console.log('📊 Tabs scroll detection:', {
          tabsTop: tabsRect.top,
          headerHeight,
          shouldShow
        });
      }
    };

    window.addEventListener('scroll', handleScrollForStickyTabs, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollForStickyTabs);
  }, [tabsContainerRef, headerHeight]);

  // Handle tab click with smooth scrolling
  const handleTabClick = (tabId: string) => {
    // Update the active tab
    onTabChange(tabId);
    
    // Scroll to the corresponding section
    const targetElement = document.getElementById(tabId);
    if (targetElement) {
      const offsetTop = targetElement.offsetTop - headerHeight - 60; // 60px buffer for sticky tabs
      
      window.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: 'smooth'
      });
    }
  };

  if (!showStickyTabs) return null;

  return (
    <div 
      className="fixed left-0 right-0 z-40 bg-white border-b"
      style={{ top: `${headerHeight}px` }}
    >
      <div className="w-screen bg-white -mx-4">
        <TabsNavigation
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'variants', label: 'Variants' },
            { id: 'reviews', label: 'Reviews' },
            { id: 'qna', label: 'Q&A' },
            { id: 'shipping', label: 'Shipping' }
          ]}
          activeTab={activeTab}
          onTabChange={handleTabClick}
          edgeToEdge={true}
          style={{ 
            backgroundColor: 'white',
            margin: 0,
            padding: 0
          }}
        />
      </div>
    </div>
  );
};

export default StickyTabsNavigation;