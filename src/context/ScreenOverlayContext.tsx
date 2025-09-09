import React, { createContext, useContext, useState } from 'react';

interface ScreenOverlayContextType {
  isLanguageScreenOpen: boolean;
  isLocationScreenOpen: boolean;
  isLocationListScreenOpen: boolean;
  locationListScreenData: {
    title: string;
    items: Array<{ code: string; name: string }>;
    onSelect: (item: any) => void;
    searchPlaceholder?: string;
  } | null;
  setLanguageScreenOpen: (open: boolean) => void;
  setLocationScreenOpen: (open: boolean) => void;
  setLocationListScreenOpen: (open: boolean, data?: any) => void;
  hasActiveOverlay: boolean;
}

const ScreenOverlayContext = createContext<ScreenOverlayContextType | undefined>(undefined);

export const ScreenOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLanguageScreenOpen, setIsLanguageScreenOpen] = useState(false);
  const [isLocationScreenOpen, setIsLocationScreenOpen] = useState(false);
  const [isLocationListScreenOpen, setIsLocationListScreenOpen] = useState(false);
  const [locationListScreenData, setLocationListScreenData] = useState<any>(null);

  const setLanguageScreenOpen = (open: boolean) => {
    setIsLanguageScreenOpen(open);
  };

  const setLocationScreenOpen = (open: boolean) => {
    setIsLocationScreenOpen(open);
  };

  const setLocationListScreenOpen = (open: boolean, data?: any) => {
    setIsLocationListScreenOpen(open);
    setLocationListScreenData(open ? data : null);
  };

  const hasActiveOverlay = isLanguageScreenOpen || isLocationScreenOpen || isLocationListScreenOpen;

  return (
    <ScreenOverlayContext.Provider
      value={{
        isLanguageScreenOpen,
        isLocationScreenOpen,
        isLocationListScreenOpen,
        locationListScreenData,
        setLanguageScreenOpen,
        setLocationScreenOpen,
        setLocationListScreenOpen,
        hasActiveOverlay,
      }}
    >
      {children}
    </ScreenOverlayContext.Provider>
  );
};

export const useScreenOverlay = () => {
  const context = useContext(ScreenOverlayContext);
  if (context === undefined) {
    throw new Error('useScreenOverlay must be used within a ScreenOverlayProvider');
  }
  return context;
};