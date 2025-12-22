'use client';

import { useState, useEffect, use } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';
import { Button, Badge, Card, CardContent } from '@repo/ui';
import { ImageGallery, MortgageCalculator, PropertyKeyFacts, PropertyDetailedInfo, PropertyLocationMap, PropertyAmenities, PriceHistoryChart, NearbyPOIs, PropertyReviews, SocialShare, LoginModal, PropertyVideoPlayer, Property360Viewer } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Building2,
  Phone,
  Heart,
  Share2,
  Loader2,
  Edit,
  MessageSquare,
  Send,
  Star,
  User,
} from 'lucide-react';

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Agency {
  id: string;
  name: string;
  logo?: string | null;
  yearsOnPlatform: number;
  verified: boolean;
}

interface Agent {
  id: string;
  photo?: string | null;
  phone?: string | null;
  email?: string | null;
  yearsExperience: number;
  totalDeals: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  superAgent: boolean;
  agency?: Agency | null;
}

interface PropertyUser {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  role: string;
  agent?: Agent | null;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  propertyType: string;
  marketType: string | null;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  livingArea: number | null;
  kitchenArea: number | null;
  ceilingHeight: number | null;
  address: string;
  city: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  nearestMetro: string | null;
  metroDistance: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  buildingType: string | null;
  buildingClass: string | null;
  renovation: string | null;
  parking: number | null;
  parkingType: string | null;
  furnished: string | null;
  windowView: string | null;
  bathroomType: string | null;
  elevatorPassenger: number | null;
  elevatorCargo: number | null;
  balcony: number | null;
  images: PropertyImage[];
  videos?: Array<{
    id: string;
    url: string;
    title?: string;
    type: 'UPLOADED' | 'YOUTUBE' | 'VIMEO';
  }>;
  tours360?: Array<{
    id: string;
    url: string;
    roomName?: string;
    description?: string;
  }>;
  user: PropertyUser;
  views: number;
  featured: boolean;
  verified: boolean;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('property');
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Price history state
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [priceStats, setPriceStats] = useState<any>(null);

  // Telegram share state
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`${apiUrl}/properties/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(t('errors.notFound'));
          }
          throw new Error(t('errors.loadError'));
        }
        const data = await response.json();
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, apiUrl]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !id) return;

      const token = getAuthToken();
      if (!token) return;

      try {
        const response = await fetch(`${apiUrl}/favorites/${id}/check`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isFavorite);
        }
      } catch {
        // Ignore errors
      }
    };

    checkFavorite();
  }, [isAuthenticated, id, apiUrl]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${apiUrl}/reviews/property/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
          setReviewStats(data.stats);
        }
      } catch {
        // Ignore errors
      }
    };

    const fetchUserReview = async () => {
      if (!isAuthenticated) return;
      const token = getAuthToken();
      if (!token) return;

      try {
        const response = await fetch(`${apiUrl}/reviews/property/${id}/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserReview(data);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchReviews();
    fetchUserReview();
  }, [id, apiUrl, isAuthenticated]);

  // Track property view
  useEffect(() => {
    const trackView = async () => {
      if (!id) return;

      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        // Get user agent and referrer
        const userAgent = navigator.userAgent;
        const referrer = document.referrer;

        await fetch(`${apiUrl}/properties/${id}/track-view?userAgent=${encodeURIComponent(userAgent)}&referrer=${encodeURIComponent(referrer)}`, {
          method: 'POST',
          headers,
        });
      } catch {
        // Silently fail - analytics shouldn't block the user
      }
    };

    trackView();
  }, [id, apiUrl]);

  // Fetch price history
  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        const response = await fetch(`${apiUrl}/properties/${id}/price-history`);
        if (response.ok) {
          const data = await response.json();
          setPriceHistory(data.history || []);
          setPriceStats(data.stats || null);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchPriceHistory();
  }, [id, apiUrl]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setFavoriteLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      console.log(`Toggling favorite: ${method} ${apiUrl}/favorites/${id}`);

      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token exists (phone/email login)
      // For OAuth logins, authentication works via HTTP-only cookies
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/favorites/${id}`, {
        method,
        headers,
        credentials: 'include', // Include cookies for OAuth authentication
      });

      console.log('Favorite response status:', response.status);

      if (response.ok) {
        setIsFavorite(!isFavorite);
        console.log('Favorite toggled successfully:', !isFavorite);
      } else {
        const errorData = await response.text();
        console.error('Failed to toggle favorite:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePostToTelegram = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setTelegramLoading(true);
    try {
      const response = await fetch(`${apiUrl}/properties/${id}/telegram`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(t('detail.telegram.success'), 'success');
        } else {
          showToast(data.error || t('detail.telegram.error'), 'error');
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.message || t('detail.telegram.error'), 'error');
      }
    } catch (error) {
      console.error('Error posting to Telegram:', error);
      showToast(t('detail.telegram.networkError'), 'error');
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!message.trim()) return;

    const token = getAuthToken();
    if (!token) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`${apiUrl}/messages/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: id,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setMessageSent(true);
        setMessage('');
        setTimeout(() => {
          setShowMessageForm(false);
          setMessageSent(false);
        }, 2000);
      }
    } catch {
      // Ignore errors
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (reviewRating === 0 || !reviewComment.trim()) return;

    const token = getAuthToken();
    if (!token) return;

    setSubmittingReview(true);
    try {
      const response = await fetch(`${apiUrl}/reviews/property/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews((prev) => [newReview, ...prev]);
        setUserReview(newReview);
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewComment('');
        // Update stats
        if (reviewStats) {
          const newTotal = reviewStats.totalReviews + 1;
          const newAverage =
            (reviewStats.averageRating * reviewStats.totalReviews + reviewRating) / newTotal;
          setReviewStats({
            ...reviewStats,
            totalReviews: newTotal,
            averageRating: Math.round(newAverage * 10) / 10,
            ratingDistribution: {
              ...reviewStats.ratingDistribution,
              [reviewRating]: (reviewStats.ratingDistribution[reviewRating] || 0) + 1,
            },
          });
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setSubmittingReview(false);
    }
  };

  const StarRating = ({
    rating,
    onSelect,
    onHover,
    interactive = false,
  }: {
    rating: number;
    onSelect?: (rating: number) => void;
    onHover?: (rating: number) => void;
    interactive?: boolean;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onSelect?.(star)}
          onMouseEnter={() => interactive && onHover?.(star)}
          onMouseLeave={() => interactive && onHover?.(0)}
        />
      ))}
    </div>
  );

  const isOwner = isAuthenticated && user?.id === property?.user?.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || t('errors.notFound')}</h1>
          <Button onClick={() => router.push('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('actions.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  const imageUrls = property.images.map((img) => img.url);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Action Bar - Mobile Responsive */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('actions.back')}
          </Button>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
            >
              <Heart
                className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
            <SocialShare
              url={`/properties/${id}`}
              title={property.title}
              description={property.description}
              image={property.images[0]?.url}
            />
            {isOwner && (
              <>
                <Link href={`/properties/${id}/edit`}>
                  <Button variant="outline" size="icon" className="sm:w-auto sm:px-3">
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('actions.edit')}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePostToTelegram}
                  disabled={telegramLoading}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 sm:w-auto sm:px-3"
                >
                  {telegramLoading ? (
                    <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">Telegram</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <ImageGallery images={imageUrls} alt={property.title} />

            {/* Property Media - Videos, 360 Tours (Images already shown in ImageGallery above) */}
            {(property.videos?.length > 0 || property.tours360?.length > 0) && (
              <div className="space-y-6">
                {/* Video Player */}
                {property.videos && property.videos.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">{t('detail.videos')}</h2>
                    <PropertyVideoPlayer videos={property.videos} />
                  </div>
                )}

                {/* 360 Panoramic Tours */}
                {property.tours360 && property.tours360.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">{t('detail.virtualTour')}</h2>
                    <Property360Viewer tours={property.tours360} />
                  </div>
                )}
              </div>
            )}

            {/* Title & Price */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={property.listingType === 'SALE' ? 'default' : 'secondary'}>
                      {t(`listingTypes.${property.listingType}` as any)}
                    </Badge>
                    {property.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {t('actions.verified')}
                      </Badge>
                    )}
                    {property.featured && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        {t('actions.featured')}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {property.price.toLocaleString()} {t('currency')}
                    {property.listingType === 'RENT_LONG' && (
                      <span className="text-lg font-normal text-gray-500">{t('perMonth')}</span>
                    )}
                    {property.listingType === 'RENT_DAILY' && (
                      <span className="text-lg font-normal text-gray-500">{t('perDay')}</span>
                    )}
                  </div>
                  {property.area > 0 && (
                    <div className="text-sm text-gray-500">
                      {(property.price / property.area).toFixed(1)} {t('currency')}/м²
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address}, {property.district && `${property.district}, `}
                {property.city}
              </div>

              {/* Key Features */}
              <div className="flex flex-wrap gap-4">
                {property.bedrooms !== null && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Bed className="h-5 w-5" />
                    <span>{property.bedrooms} {t('detail.roomsShort')}</span>
                  </div>
                )}
                {property.bathrooms !== null && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Bath className="h-5 w-5" />
                    <span>{property.bathrooms} {t('detail.bathroomsShort')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-600">
                  <Maximize className="h-5 w-5" />
                  <span>{property.area} м²</span>
                </div>
                {property.floor && property.totalFloors && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Building2 className="h-5 w-5" />
                    <span>
                      {property.floor}/{property.totalFloors} {t('detail.floorOf')}
                    </span>
                  </div>
                )}
                {property.yearBuilt && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span>{property.yearBuilt} {t('detail.yearShort')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Facts */}
            <PropertyKeyFacts
              area={property.area}
              floor={property.floor}
              totalFloors={property.totalFloors}
              yearBuilt={property.yearBuilt}
              buildingType={property.buildingType}
              renovation={property.renovation}
            />

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t('detail.description')}</h2>
                <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
              </CardContent>
            </Card>

            {/* Detailed Information */}
            <PropertyDetailedInfo
              propertyType={property.propertyType}
              marketType={property.marketType}
              area={property.area}
              livingArea={property.livingArea}
              kitchenArea={property.kitchenArea}
              ceilingHeight={property.ceilingHeight}
              bathrooms={property.bathrooms}
              renovation={property.renovation}
              furnished={property.furnished}
              yearBuilt={property.yearBuilt}
              buildingType={property.buildingType}
              buildingClass={property.buildingClass}
              elevatorPassenger={property.elevatorPassenger}
              elevatorCargo={property.elevatorCargo}
              parking={property.parking}
              parkingType={property.parkingType}
              windowView={property.windowView}
              bathroomType={property.bathroomType}
              balcony={property.balcony}
            />

            {/* Location Map */}
            <PropertyLocationMap
              address={property.address}
              city={property.city}
              district={property.district}
              latitude={property.latitude}
              longitude={property.longitude}
              nearestMetro={property.nearestMetro}
              metroDistance={property.metroDistance}
            />

            {/* Nearby Points of Interest */}
            <NearbyPOIs propertyId={property.id} />

            {/* Price History Chart */}
            {priceHistory.length > 0 && priceStats && (
              <PriceHistoryChart history={priceHistory} stats={priceStats} />
            )}

            {/* Reviews Section */}
            <PropertyReviews propertyId={property.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sticky Container */}
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('detail.contact')}</h3>
                  <div className="mb-4">
                    <div className="font-medium">
                      {property.user.firstName} {property.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{t('detail.seller')}</div>
                  </div>
                  <div className="space-y-3">
                    {property.user.phone && (
                      <Button className="w-full" size="lg">
                        <Phone className="h-4 w-4 mr-2" />
                        {property.user.phone}
                      </Button>
                    )}
                    {!isOwner && (
                      <>
                        {showMessageForm ? (
                          <div className="space-y-3">
                            {messageSent ? (
                              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md text-center">
                                {t('detail.messageSent')}
                              </div>
                            ) : (
                              <>
                                <textarea
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  placeholder={t('detail.messagePlaceholder')}
                                  className="w-full p-3 border rounded-md resize-none h-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={sendingMessage}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowMessageForm(false)}
                                    disabled={sendingMessage}
                                  >
                                    {t('actions.cancel')}
                                  </Button>
                                  <Button
                                    className="flex-1"
                                    onClick={handleSendMessage}
                                    disabled={sendingMessage || !message.trim()}
                                  >
                                    {sendingMessage ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="h-4 w-4 mr-2" />
                                        {t('detail.send')}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            onClick={() => {
                              if (!isAuthenticated) {
                                router.push('/auth/login');
                              } else {
                                setShowMessageForm(true);
                              }
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {t('detail.writeToSeller')}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mortgage Calculator */}
              <MortgageCalculator propertyPrice={property.price} />
            </div>

            {/* Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-500 mb-1">{t('detail.views')}</div>
                <div className="text-2xl font-bold">{property.views}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {t('detail.publishedOn')}{' '}
                  {new Date(property.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Login Modal for unauthenticated users */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-80 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
