
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  Check, 
  ArrowUpDown,
  Heart,
  Star,
  ShoppingCart,
  Grid3X3,
  LayoutList,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import SearchSkeleton from '@/components/search/SearchSkeleton';
import { motion } from 'framer-motion';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [ratings, setRatings] = useState<number[]>([]);
  const [freeShipping, setFreeShipping] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Mock data
  const categories = [
    "Electronics", "Fashion", "Home & Garden", "Beauty", "Sports", 
    "Toys & Games", "Automotive", "Office Supplies", "Health"
  ];

  useEffect(() => {
    // Update search query from URL when page loads
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
      handleSearch(queryParam);
    }
  }, []);

  const handleSearch = (query: string = searchQuery) => {
    setIsLoading(true);
    setShowSuggestions(false);
    
    // Update URL with search query
    setSearchParams({ q: query });
    
    // Simulate search delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.length > 0) {
      setShowSuggestions(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    toast({
      title: "Sort order updated",
      description: `Products are now sorted by ${value}`,
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const applyFilters = () => {
    setFiltersOpen(false);
    toast({
      title: "Filters applied",
      description: "Your search results have been updated",
    });
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setRatings([]);
    setFreeShipping(false);
    setSelectedCategories([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Search Header */}
      <div className="sticky top-0 bg-white z-30 shadow-sm">
        <div className="p-3 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="relative flex-1">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}>
              <Input
                type="text"
                placeholder="Search on AliExpress"
                className="pl-9 pr-9 h-9 rounded-full text-sm"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              )}
            </form>
          </div>
          
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 text-xs flex gap-1.5 rounded-full"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90%]" : ""}>
              <SheetHeader className="mb-4">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              
              <div className="overflow-auto h-[calc(100%-9rem)]">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="price">
                    <AccordionTrigger className="text-sm">Price Range</AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4 px-1">
                        <Slider
                          defaultValue={[priceRange[0], priceRange[1]]}
                          max={1000}
                          step={10}
                          onValueChange={(values) => setPriceRange([values[0], values[1]])}
                          className="mb-6"
                        />
                        <div className="flex justify-between">
                          <div className="border rounded p-2 w-[45%] text-center text-sm">
                            ${priceRange[0]}
                          </div>
                          <div className="border rounded p-2 w-[45%] text-center text-sm">
                            ${priceRange[1]}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="category">
                    <AccordionTrigger className="text-sm">Category</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div 
                            key={category} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => toggleCategory(category)}
                          >
                            <span className="text-sm">{category}</span>
                            {selectedCategories.includes(category) && (
                              <Check className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="ratings">
                    <AccordionTrigger className="text-sm">Customer Reviews</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {[4, 3, 2, 1].map((rating) => (
                          <div 
                            key={rating} 
                            className={`flex items-center p-2 rounded cursor-pointer ${ratings.includes(rating) ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                            onClick={() => {
                              setRatings(prev => 
                                prev.includes(rating) 
                                  ? prev.filter(r => r !== rating) 
                                  : [...prev, rating]
                              );
                            }}
                          >
                            <div className="flex items-center">
                              {Array(rating).fill(0).map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              ))}
                              {Array(5 - rating).fill(0).map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 text-gray-300" />
                              ))}
                              <span className="ml-2 text-sm">& Up</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="shipping">
                    <AccordionTrigger className="text-sm">Shipping Options</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">Free Shipping</span>
                        <Switch 
                          checked={freeShipping} 
                          onCheckedChange={setFreeShipping} 
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 border-t p-4 bg-white flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={resetFilters}
                >
                  Reset
                </Button>
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600" 
                  onClick={applyFilters}
                >
                  Apply
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Search sorting and view options */}
        <div className="px-3 pb-2 flex items-center justify-between bg-white">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Best Match</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest Arrivals</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-sm ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Active filters display */}
        {(selectedCategories.length > 0 || freeShipping || ratings.length > 0) && (
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
            {selectedCategories.map(category => (
              <Badge key={category} variant="outline" className="flex items-center gap-1 text-xs">
                {category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleCategory(category)} 
                />
              </Badge>
            ))}
            
            {freeShipping && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                Free Shipping
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFreeShipping(false)} 
                />
              </Badge>
            )}
            
            {ratings.map(rating => (
              <Badge key={rating} variant="outline" className="flex items-center gap-1 text-xs">
                {rating}+ Stars
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setRatings(prev => prev.filter(r => r !== rating))} 
                />
              </Badge>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2" 
              onClick={resetFilters}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Search suggestions dropdown */}
      {showSuggestions && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-[60px] left-0 right-0 bg-white z-40 shadow-lg border-t max-h-[70vh] overflow-y-auto"
        >
          <SearchSuggestions 
            query={searchQuery} 
            onSelectSuggestion={(suggestion) => {
              setSearchQuery(suggestion);
              handleSearch(suggestion);
            }} 
            onClose={() => setShowSuggestions(false)} 
          />
        </motion.div>
      )}

      {/* Search results area */}
      <div className="p-3">
        {isLoading ? (
          <SearchSkeleton viewMode={viewMode} />
        ) : (
          <SearchResults 
            viewMode={viewMode} 
            sortBy={sortBy}
            filters={{
              priceRange,
              categories: selectedCategories,
              ratings,
              freeShipping
            }}
          />
        )}
      </div>
    </div>
  );
}