
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitcher } from '@/hooks/useLanguageSwitcher';
import { Button } from '@/components/ui/button';

export default function TranslationExample() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguageSwitcher();
  
  return (
    <div className="py-4 bg-white">
      <div className="container mx-auto px-3">
        <div className="max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg">
          <h2 className="text-base font-bold mb-2">Translation Example</h2>
          <p className="text-sm text-gray-600 mb-3">
            This component shows how translations work. Current language: <span className="font-medium">{currentLanguage.name}</span>
          </p>
          
          <div className="space-y-2">
            <div className="bg-white p-2 rounded border">
              <div className="text-xs text-gray-500">Category names:</div>
              <ul className="text-sm">
                <li>{t('forYou', { ns: 'home' })}</li>
                <li>{t('posts', { ns: 'home' })}</li>
                <li>{t('messages', { ns: 'home' })}</li>
                <li>{t('trending', { ns: 'home' })}</li>
                <li>{t('videos', { ns: 'home' })}</li>
              </ul>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="text-xs text-gray-500">Product actions:</div>
              <Button size="sm" className="mt-2 bg-orange-500 hover:bg-orange-600">
                {t('addToCart', { ns: 'product' })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
