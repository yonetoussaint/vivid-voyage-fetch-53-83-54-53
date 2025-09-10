import React from "react";
import { X, Facebook, MessageCircle, Twitter, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SocialSharePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const SocialSharePanel: React.FC<SocialSharePanelProps> = ({ 
  open, 
  onOpenChange, 
  product 
}) => {
  const shareUrl = window.location.href;
  const productName = product?.name || "Check out this product";

  const shareOptions = [
    {
      name: "Facebook",
      icon: <Facebook className="w-6 h-6" />,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      }
    },
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-6 h-6" />,
      color: "bg-green-500 hover:bg-green-600",
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${productName} ${shareUrl}`)}`, '_blank');
      }
    },
    {
      name: "X (Twitter)",
      icon: <Twitter className="w-6 h-6" />,
      color: "bg-black hover:bg-gray-800",
      onClick: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${productName} ${shareUrl}`)}`, '_blank');
      }
    },
    {
      name: "Telegram",
      icon: <Send className="w-6 h-6" />,
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(productName)}`, '_blank');
      }
    }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[80vh]">
        <SheetHeader className="text-left mb-6">
          <SheetTitle>Share this product</SheetTitle>
        </SheetHeader>
        
        <div className="grid grid-cols-4 gap-4 mb-8">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              className={`flex flex-col items-center justify-center h-20 w-20 rounded-full p-0 ${option.color} text-white`}
              onClick={option.onClick}
            >
              {option.icon}
              <span className="sr-only">{option.name}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 mb-6">
          <div className="flex-1 bg-gray-100 rounded-lg p-3 text-sm truncate">
            {shareUrl}
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              // You could add a toast notification here
            }}
            variant="secondary"
            size="sm"
          >
            Copy
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SocialSharePanel;