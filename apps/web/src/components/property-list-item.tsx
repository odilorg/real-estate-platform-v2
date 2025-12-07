'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Bed, Bath, Maximize, Heart, Phone, MessageCircle } from 'lucide-react';
import { Badge } from '@repo/ui';

interface PropertyListItemProps {
  id: string;
  title: string;
  price: number;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  address: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  imageUrl?: string;
  images?: Array<{ url: string }>;
  description?: string;
  propertyType?: string;
  floor?: number | null;
  totalFloors?: number | null;
  yearBuilt?: number | null;
  onFavoriteClick?: (id: string) => void;
  isFavorite?: boolean;
  owner?: {
    id?: string;
    name: string;
    type?: 'OWNER' | 'DEVELOPER' | 'AGENT';
    phone?: string;
    email?: string;
    avatar?: string;
  };
}

function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat('ru-RU').format(price);
  if (listingType === 'SALE') {
    return `${formatted} у.е.`;
  }
  return `${formatted} у.е./мес`;
}

function getListingTypeBadge(listingType: string) {
  switch (listingType) {
    case 'SALE':
      return 'Продажа';
    case 'RENT_LONG':
      return 'Аренда';
    case 'RENT_DAILY':
      return 'Посуточно';
    default:
      return listingType;
  }
}

function getOwnerTypeLabel(ownerType?: string) {
  switch (ownerType) {
    case 'DEVELOPER':
      return 'ЗАСТРОЙЩИК';
    case 'AGENT':
      return 'АГЕНТ';
    case 'OWNER':
      return 'ВЛАДЕЛЕЦ';
    default:
      return 'КОНТАКТ';
  }
}

export function PropertyListItem({
  id,
  title,
  price,
  listingType,
  address,
  city,
  bedrooms,
  bathrooms,
  area,
  imageUrl,
  images,
  description,
  propertyType,
  floor,
  totalFloors,
  yearBuilt,
  onFavoriteClick,
  isFavorite = false,
  owner,
}: PropertyListItemProps) {
  const router = useRouter();
  const primaryImage = imageUrl || images?.[0]?.url;
  const additionalImagesCount = images && images.length > 1 ? images.length - 1 : 0;

  const handleMessageClick = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Validate required fields
    if (!id || typeof id !== 'string') {
      console.error('Invalid property ID:', id);
      alert('Ошибка: некорректный ID объявления');
      return;
    }

    try {
      // Start a conversation for this property
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const payload = {
        propertyId: id,
        message: `Здравствуйте! Меня интересует объект "${title}". Можете предоставить дополнительную информацию?`,
      };

      console.log('Sending message request:', payload);

      const response = await fetch(`${apiUrl}/messages/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to messages page with conversation ID
        router.push(`/dashboard/messages?conversationId=${data.conversation.id}`);
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        router.push('/auth/login');
      } else {
        const errorText = await response.text();
        console.error('Failed to start conversation:', response.status, errorText);
        // Still navigate to messages page
        router.push('/dashboard/messages');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Navigate to messages page anyway
      router.push('/dashboard/messages');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Image Section */}
        <div className="relative w-full lg:w-80 h-64 lg:h-auto flex-shrink-0">
          <Link href={`/properties/${id}`}>
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Нет фото</span>
              </div>
            )}
          </Link>

          {/* Badge overlay */}
          <div className="absolute top-3 left-3">
            <Badge variant="default" className="bg-blue-600 text-white">
              {getListingTypeBadge(listingType)}
            </Badge>
          </div>

          {/* Additional images indicator */}
          {additionalImagesCount > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
              Еще {additionalImagesCount} фото
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavoriteClick?.(id);
            }}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
          >
            <Heart
              className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 min-w-0">
          <Link href={`/properties/${id}`}>
            <div className="space-y-3">
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                {title}
              </h3>

              {/* Property details */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    <span>{bedrooms} комн.</span>
                  </div>
                )}
                {bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    <span>{bathrooms}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Maximize className="h-4 w-4" />
                  <span>{area} м²</span>
                </div>
                {floor && totalFloors && (
                  <span>{floor}/{totalFloors} этаж</span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{address}, {city}</span>
              </div>

              {/* Description */}
              {description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {description}
                </p>
              )}

              {/* Additional info */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {propertyType && (
                  <span className="capitalize">{propertyType}</span>
                )}
                {yearBuilt && (
                  <span>Построен в {yearBuilt}</span>
                )}
              </div>

              {/* Price */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(price, listingType)}
                </div>
                {area && (
                  <div className="text-sm text-gray-500">
                    {Math.round(price / area).toLocaleString('ru-RU')} ₽/м²
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Owner Section */}
        {owner && (
          <div className="w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 bg-gray-50">
            <div className="space-y-4">
              {/* Owner type label */}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {getOwnerTypeLabel(owner.type)}
              </div>

              {/* Owner avatar and name */}
              <div className="flex items-center gap-3">
                {owner.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-800"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-white font-bold text-lg">
                    {owner.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {owner.name}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Link
                  href={`/properties?userId=${owner.id || ''}`}
                  className="flex items-center justify-center w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-colors text-sm"
                >
                  Посмотреть все объекты
                </Link>

                {owner.phone && (
                  <a
                    href={`tel:${owner.phone}`}
                    className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="truncate">{owner.phone}</span>
                  </a>
                )}

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleMessageClick();
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Написать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
