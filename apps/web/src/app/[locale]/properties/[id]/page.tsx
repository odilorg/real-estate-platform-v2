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
        {/* Enhanced Action Bar - Better Mobile UX */}
        <div className="flex items-center justify-between gap-4 mb-8 bg-white rounded-xl p-4 shadow-sm">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="shrink-0 hover:bg-gray-50"
            size="lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">{t('actions.back')}</span>
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className="min-w-[44px] hover:bg-red-50 hover:border-red-300"
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
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
                  <Button variant="outline" size="lg" className="hover:bg-blue-50 hover:border-blue-300">
                    <Edit className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline font-medium">{t('actions.edit')}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePostToTelegram}
                  disabled={telegramLoading}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  {telegramLoading ? (
                    <Loader2 className="h-5 w-5 sm:mr-2 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline font-medium">Telegram</span>
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

            {/* Enhanced Title & Price Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge
                  variant={property.listingType === 'SALE' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1.5 font-semibold"
                >
                  {t(`listingTypes.${property.listingType}` as any)}
                </Badge>
                {property.verified && (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-sm px-3 py-1.5">
                    ✓ {t('actions.verified')}
                  </Badge>
                )}
                {property.featured && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600 text-sm px-3 py-1.5">
                    ⭐ {t('actions.featured')}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {property.title}
              </h1>

              {/* Location */}
              <div className="flex items-center text-gray-700 mb-6 text-lg">
                <MapPin className="h-5 w-5 mr-2 text-blue-600 shrink-0" />
                <span className="font-medium">
                  {property.address}
                  {property.district && `, ${property.district}`}
                  {`, ${property.city}`}
                </span>
              </div>

              {/* Price Section - More Prominent */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-5 mb-6">
                <div className="flex items-baseline justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-blue-600">
                      {property.price.toLocaleString()} {t('currency')}
                      {property.listingType === 'RENT_LONG' && (
                        <span className="text-2xl font-normal text-blue-500 ml-2">{t('perMonth')}</span>
                      )}
                      {property.listingType === 'RENT_DAILY' && (
                        <span className="text-2xl font-normal text-blue-500 ml-2">{t('perDay')}</span>
                      )}
                    </div>
                  </div>
                  {property.area > 0 && (
                    <div className="text-xl font-semibold text-gray-700">
                      {Math.round(property.price / property.area).toLocaleString()} {t('currency')}/м²
                    </div>
                  )}
                </div>
              </div>

              {/* Key Features - Card Style */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {property.bedrooms !== null && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <Bed className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="text-lg font-bold text-gray-900">{property.bedrooms}</div>
                      <div className="text-xs text-gray-500">{t('detail.roomsShort')}</div>
                    </div>
                  </div>
                )}
                {property.bathrooms !== null && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <Bath className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="text-lg font-bold text-gray-900">{property.bathrooms}</div>
                      <div className="text-xs text-gray-500">{t('detail.bathroomsShort')}</div>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                  <Maximize className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="text-lg font-bold text-gray-900">{property.area}</div>
                    <div className="text-xs text-gray-500">м²</div>
                  </div>
                </div>
                {property.floor && property.totalFloors && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {property.floor}/{property.totalFloors}
                      </div>
                      <div className="text-xs text-gray-500">{t('detail.floorOf')}</div>
                    </div>
                  </div>
                )}
                {property.yearBuilt && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="text-lg font-bold text-gray-900">{property.yearBuilt}</div>
                      <div className="text-xs text-gray-500">{t('detail.yearShort')}</div>
                    </div>
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

            {/* Enhanced Description Section */}
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('detail.description')}</h2>
                <p className="text-gray-700 whitespace-pre-line text-lg leading-relaxed">
                  {property.description}
                </p>
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
              {/* Enhanced Contact Card */}
              <Card className="shadow-md border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50" data-contact-card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-5">{t('detail.contact')}</h3>

                  {/* Seller Info */}
                  <div className="bg-white rounded-lg p-4 mb-5 border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-7 w-7 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900">
                          {property.user.firstName} {property.user.lastName}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">{t('detail.seller')}</div>
                      </div>
                    </div>
                    {property.user.agent && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm">
                          {property.user.agent.verified && (
                            <span className="text-green-600 font-semibold">✓ Проверенный агент</span>
                          )}
                          {property.user.agent.superAgent && (
                            <span className="text-amber-600 font-semibold">⭐ Супер агент</span>
                          )}
                        </div>
                        {property.user.agent.rating > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{property.user.agent.rating}</span>
                            <span className="text-sm text-gray-500">
                              ({property.user.agent.reviewCount} отзывов)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {property.user.phone && (
                      <Button className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700" size="lg">
                        <Phone className="h-5 w-5 mr-2" />
                        {property.user.phone}
                      </Button>
                    )}
                    {!isOwner && (
                      <>
                        {showMessageForm ? (
                          <div className="space-y-3">
                            {messageSent ? (
                              <div className="p-4 text-green-700 bg-green-50 rounded-lg text-center font-semibold">
                                ✓ {t('detail.messageSent')}
                              </div>
                            ) : (
                              <>
                                <textarea
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  placeholder={t('detail.messagePlaceholder')}
                                  className="w-full p-4 border-2 border-gray-200 rounded-lg resize-none h-32 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={sendingMessage}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={() => setShowMessageForm(false)}
                                    disabled={sendingMessage}
                                  >
                                    {t('actions.cancel')}
                                  </Button>
                                  <Button
                                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                                    onClick={handleSendMessage}
                                    disabled={sendingMessage || !message.trim()}
                                  >
                                    {sendingMessage ? (
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="h-5 w-5 mr-2" />
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
                            className="w-full h-14 text-lg font-semibold border-2 hover:bg-blue-50"
                            size="lg"
                            onClick={() => {
                              if (!isAuthenticated) {
                                router.push('/auth/login');
                              } else {
                                setShowMessageForm(true);
                              }
                            }}
                          >
                            <MessageSquare className="h-5 w-5 mr-2" />
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

            {/* Enhanced Stats Card */}
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Статистика</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-600">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 font-medium mb-1">{t('detail.views')}</div>
                    <div className="text-3xl font-bold text-gray-900">{property.views.toLocaleString()}</div>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-sm text-gray-600 font-medium">
                      {t('detail.publishedOn')}
                    </div>
                    <div className="text-base font-semibold text-gray-900 mt-1">
                      {new Date(property.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
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

      {/* Mobile Floating Contact Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {property.price.toLocaleString()} {t('currency')}
                {property.listingType === 'RENT_LONG' && (
                  <span className="text-base font-normal text-gray-600 ml-1">{t('perMonth')}</span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {property.area} м² • {property.bedrooms ? `${property.bedrooms} комн.` : ''}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {property.user.phone && (
              <Button className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-base font-semibold">
                <Phone className="h-5 w-5 mr-2" />
                Позвонить
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 h-12 border-2 text-base font-semibold"
              onClick={() => {
                if (!isAuthenticated) {
                  router.push('/auth/login');
                } else {
                  // Scroll to message form in contact card
                  const contactCard = document.querySelector('[data-contact-card]');
                  if (contactCard) {
                    contactCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  setShowMessageForm(true);
                }
              }}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Написать
            </Button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
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
