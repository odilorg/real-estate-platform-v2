'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  Check,
  X,
} from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

export function SocialShare({ url, title, description, image }: SocialShareProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = async () => {
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
      } catch (err) {
        // User cancelled or error occurred, show modal instead
        if ((err as Error).name !== 'AbortError') {
          setShowModal(true);
        }
      }
    } else {
      setShowModal(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <>
      <Button variant="outline" size="lg" onClick={handleShare} className="min-w-[44px]">
        <Share2 className="h-5 w-5 sm:mr-2" />
        <span className="hidden sm:inline">Поделиться</span>
      </Button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <h3 className="text-xl font-semibold mb-4">Поделиться</h3>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => openShareWindow(shareLinks.facebook)}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Facebook</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.twitter)}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Twitter className="h-5 w-5 text-sky-500" />
                <span className="font-medium">Twitter</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.linkedin)}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Linkedin className="h-5 w-5 text-blue-700" />
                <span className="font-medium">LinkedIn</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.whatsapp)}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">WhatsApp</span>
              </button>

              <button
                onClick={() => openShareWindow(shareLinks.telegram)}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Telegram</span>
              </button>

              <a
                href={shareLinks.email}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Email</span>
              </a>
            </div>

            {/* Copy Link */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Или скопируйте ссылку</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fullUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <Button onClick={copyToClipboard} size="sm">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Копировать
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
