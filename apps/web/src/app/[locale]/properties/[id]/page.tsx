'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Badge, Card, CardContent } from '@repo/ui';
import { ImageGallery, MortgageCalculator, PropertyKeyFacts, PropertyDetailedInfo, PropertyLocationMap, PropertyAmenities, PriceHistoryChart } from '@/components';
import { useAuth } from '@/context/AuthContext';
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
  hasGarbageChute: boolean;
  balcony: number | null;
  loggia: number | null;
  images: PropertyImage[];
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

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Квартира',
  HOUSE: 'Дом',
  CONDO: 'Апартаменты',
  TOWNHOUSE: 'Таунхаус',
  VILLA: 'Вилла',
  STUDIO: 'Студия',
  COMMERCIAL: 'Коммерческая',
  LAND: 'Участок',
};

const BUILDING_CLASS_LABELS: Record<string, string> = {
  ECONOMY: 'Эконом',
  COMFORT: 'Комфорт',
  BUSINESS: 'Бизнес',
  ELITE: 'Элитный',
};

const RENOVATION_LABELS: Record<string, string> = {
  NONE: 'Без ремонта',
  COSMETIC: 'Косметический',
  EURO: 'Евроремонт',
  DESIGNER: 'Дизайнерский',
  NEEDS_RENOVATION: 'Требует ремонта',
};

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
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
            throw new Error('Объект не найден');
          }
          throw new Error('Ошибка загрузки');
        }
        const data = await response.json();
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
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
      router.push('/auth/login');
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setFavoriteLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(`${apiUrl}/favorites/${id}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch {
      // Ignore errors
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
          <h1 className="text-2xl font-bold mb-4">{error || 'Объект не найден'}</h1>
          <Button onClick={() => router.push('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            К списку объектов
          </Button>
        </div>
      </div>
    );
  }

  const imageUrls = property.images.map((img) => img.url);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Link href={`/properties/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={imageUrls} alt={property.title} />

            {/* Title & Price */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={property.listingType === 'SALE' ? 'default' : 'secondary'}>
                      {property.listingType === 'SALE' ? 'Продажа' : property.listingType === 'RENT_DAILY' ? 'Посуточно' : 'Аренда'}
                    </Badge>
                    {property.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Проверено
                      </Badge>
                    )}
                    {property.featured && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        Топ
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {property.price.toLocaleString()} у.е.
                    {property.listingType === 'RENT_LONG' && (
                      <span className="text-lg font-normal text-gray-500">/мес</span>
                    )}
                    {property.listingType === 'RENT_DAILY' && (
                      <span className="text-lg font-normal text-gray-500">/сутки</span>
                    )}
                  </div>
                  {property.area > 0 && (
                    <div className="text-sm text-gray-500">
                      {Math.round(property.price / property.area).toLocaleString()} у.е./м²
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
                    <span>{property.bedrooms} комн.</span>
                  </div>
                )}
                {property.bathrooms !== null && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Bath className="h-5 w-5" />
                    <span>{property.bathrooms} сан.</span>
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
                      {property.floor}/{property.totalFloors} этаж
                    </span>
                  </div>
                )}
                {property.yearBuilt && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span>{property.yearBuilt} г.</span>
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
                <h2 className="text-xl font-semibold mb-4">Описание</h2>
                <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
              </CardContent>
            </Card>

            {/* Detailed Information */}
            <PropertyDetailedInfo
              propertyType={property.propertyType}
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
              hasGarbageChute={property.hasGarbageChute}
              balcony={property.balcony}
              loggia={property.loggia}
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

            {/* Walking Score & Nearby Amenities */}
            {property.latitude && property.longitude && (
              <PropertyAmenities propertyId={property.id} />
            )}

            {/* Price History Chart */}
            {priceHistory.length > 0 && priceStats && (
              <PriceHistoryChart history={priceHistory} stats={priceStats} />
            )}

            {/* Reviews Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Отзывы</h2>
                    {reviewStats && reviewStats.totalReviews > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={Math.round(reviewStats.averageRating)} />
                        <span className="text-lg font-medium">{reviewStats.averageRating}</span>
                        <span className="text-gray-500">({reviewStats.totalReviews} отзывов)</span>
                      </div>
                    )}
                  </div>
                  {!isOwner && !userReview && (
                    <Button
                      variant={showReviewForm ? 'outline' : 'default'}
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push('/auth/login');
                        } else {
                          setShowReviewForm(!showReviewForm);
                        }
                      }}
                    >
                      {showReviewForm ? 'Отмена' : 'Написать отзыв'}
                    </Button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && !userReview && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Ваша оценка</label>
                      <StarRating
                        rating={hoverRating || reviewRating}
                        onSelect={setReviewRating}
                        onHover={setHoverRating}
                        interactive
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Ваш отзыв</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Поделитесь своим опытом..."
                        className="w-full p-3 border rounded-md resize-none h-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submittingReview}
                      />
                    </div>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                      className="w-full"
                    >
                      {submittingReview ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Отправить отзыв
                    </Button>
                  </div>
                )}

                {/* Your Review */}
                {userReview && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 font-medium mb-2">Ваш отзыв</div>
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={userReview.rating} />
                    </div>
                    <p className="text-gray-700">{userReview.comment}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(userReview.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews
                      .filter((r) => r.id !== userReview?.id)
                      .map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {review.user.firstName} {review.user.lastName}
                              </div>
                              <div className="flex items-center gap-2">
                                <StarRating rating={review.rating} />
                                <span className="text-xs text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 ml-13">{review.comment}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  !userReview && (
                    <div className="text-center py-8 text-gray-500">
                      Пока нет отзывов. Будьте первым!
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sticky Container */}
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Контакт</h3>
                  <div className="mb-4">
                    <div className="font-medium">
                      {property.user.firstName} {property.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">Продавец</div>
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
                                Сообщение отправлено!
                              </div>
                            ) : (
                              <>
                                <textarea
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  placeholder="Введите ваше сообщение..."
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
                                    Отмена
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
                                        Отправить
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
                            Написать продавцу
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
                <div className="text-sm text-gray-500 mb-1">Просмотров</div>
                <div className="text-2xl font-bold">{property.views}</div>
                <div className="text-xs text-gray-400 mt-2">
                  Опубликовано{' '}
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
    </div>
  );
}
