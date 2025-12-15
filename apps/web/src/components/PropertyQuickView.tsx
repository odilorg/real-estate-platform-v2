'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Maximize, Bed, Bath, Calendar, Eye } from 'lucide-react';
import { Button } from '@repo/ui';

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  address: string;
  city: string;
  images: PropertyImage[];
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface PropertyQuickViewProps {
  propertyId: string | null;
  onClose: () => void;
  onViewFull: (id: string) => void;
}

export function PropertyQuickView({ propertyId, onClose, onViewFull }: PropertyQuickViewProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!propertyId) {
      setProperty(null);
      return;
    }

    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/properties/${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          setProperty(data);
          setCurrentImageIndex(0);
        }
      } catch (error) {
        console.error('Failed to fetch property:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, apiUrl]);

  if (!propertyId) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getListingTypeLabel = (type: string) => {
    switch (type) {
      case 'SALE': return 'Продажа';
      case 'RENT_LONG': return 'Аренда';
      case 'RENT_DAILY': return 'Посуточно';
      default: return type;
    }
  };

  const formatPrice = (price: number, type: string) => {
    const formatted = price >= 1000 ? `${(price / 1000).toFixed(0)}K` : price.toString();
    const suffix = type === 'RENT_LONG' ? '/мес' : type === 'RENT_DAILY' ? '/сутки' : '';
    return `$${formatted} у.е.${suffix}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : property ? (
          <>
            {/* Image Gallery */}
            <div className="relative h-64 md:h-96 bg-gray-100">
              {property.images.length > 0 ? (
                <>
                  <img
                    src={property.images[currentImageIndex]?.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  {property.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {property.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <MapPin className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-2">
                      {getListingTypeLabel(property.listingType)}
                    </span>
                    <h2 className="text-2xl font-bold mb-1">{property.title}</h2>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property.address}, {property.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatPrice(property.price, property.listingType)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {property.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Спальни</div>
                      <div className="font-semibold">{property.bedrooms}</div>
                    </div>
                  </div>
                )}
                {property.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Ванные</div>
                      <div className="font-semibold">{property.bathrooms}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Площадь</div>
                    <div className="font-semibold">{property.area} м²</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Добавлено</div>
                    <div className="font-semibold">
                      {new Date(property.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Описание</h3>
                <p className="text-gray-600 line-clamp-4">{property.description}</p>
              </div>

              {/* Contact */}
              {property.user && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">Контактное лицо</h3>
                  <div className="text-gray-700">
                    {property.user.firstName} {property.user.lastName}
                    {property.user.phone && (
                      <a
                        href={`tel:${property.user.phone}`}
                        className="block mt-1 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {property.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => onViewFull(property.id)}
                  className="flex-1"
                  size="lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Подробнее
                </Button>
                {property.user?.phone && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.location.href = `tel:${property.user?.phone}`}
                  >
                    Позвонить
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Объект не найден</p>
          </div>
        )}
      </div>
    </div>
  );
}
