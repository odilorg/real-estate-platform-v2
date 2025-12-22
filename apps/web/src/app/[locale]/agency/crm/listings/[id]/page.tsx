'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, Building, MapPin, Edit, Trash2, CheckCircle, XCircle,
  Home, DollarSign, Calendar, User, Phone, Mail, Eye
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  propertyType: string;
  listingType: string;
  status: string;
  marketType?: string;
  address: string;
  city: string;
  district?: string;
  mahalla?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  buildingType?: string;
  buildingClass?: string;
  renovation?: string;
  yearBuilt?: number;
  amenities?: string[];
  ownerName?: string;
  ownerPhone?: string;
  ownerIsAnonymous?: boolean;
  images?: string[];
  notes?: string;
  member: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Активно',
  PENDING: 'Ожидание',
  SOLD: 'Продано',
  RENTED: 'Арендовано',
  INACTIVE: 'Неактивно',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-blue-100 text-blue-800',
  RENTED: 'bg-purple-100 text-purple-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
};

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Квартира',
  HOUSE: 'Дом',
  CONDO: 'Кондоминиум',
  TOWNHOUSE: 'Таунхаус',
  LAND: 'Земля',
  COMMERCIAL: 'Коммерческая',
};

const listingTypeLabels: Record<string, string> = {
  SALE: 'Продажа',
  RENT_LONG: 'Долгосрочная аренда',
  RENT_DAILY: 'Посуточная аренда',
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const data = await api.get<Listing>(`/agency-crm/listings/${params.id}`);
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/agency-crm/listings/${params.id}`);
      router.push('/agency/crm/listings');
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Ошибка при удалении объекта');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/agency-crm/listings/${params.id}`, { status: newStatus });
      setListing((prev) => (prev ? { ...prev, status: newStatus } : null));
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleMarkSold = async () => {
    const soldPrice = prompt('Введите фактическую цену продажи:');
    if (!soldPrice) return;

    try {
      await api.post(`/agency-crm/listings/${params.id}/mark-sold`, {
        soldPrice: parseFloat(soldPrice),
        soldDate: new Date().toISOString(),
      });
      setListing((prev) => (prev ? { ...prev, status: 'SOLD' } : null));
    } catch (error) {
      console.error('Error marking as sold:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'UZS') {
      return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
    }
    return '$' + new Intl.NumberFormat('en-US').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Объект не найден</h3>
        <Link href="/agency/crm/listings">
          <button className="text-blue-600 hover:text-blue-700">
            Вернуться к списку
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/agency/crm/listings">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="h-5 w-5" />
            <span>Назад к списку</span>
          </button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{listing.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[listing.status]}`}>
                {statusLabels[listing.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{listing.address}, {listing.city}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Изменить статус
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Активно
                  </button>
                  <button
                    onClick={() => handleStatusChange('PENDING')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Ожидание
                  </button>
                  <button
                    onClick={handleMarkSold}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Отметить как проданное
                  </button>
                  <button
                    onClick={() => handleStatusChange('INACTIVE')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    Деактивировать
                  </button>
                </div>
              )}
            </div>

            <Link href={`/agency/crm/listings/${listing.id}/edit`}>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Редактировать
              </button>
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl md:text-4xl font-bold text-blue-900">
            {formatPrice(listing.price, listing.currency)}
          </span>
          {listing.area && (
            <span className="text-lg text-blue-700">
              ({Math.round(listing.price / listing.area)} за м²)
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm text-blue-700">
          <span className="px-2.5 py-1 bg-blue-100 rounded-full">
            {listingTypeLabels[listing.listingType]}
          </span>
          <span>{propertyTypeLabels[listing.propertyType]}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {listing.description && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Описание</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {/* Property Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Характеристики</h2>
            <div className="grid grid-cols-2 gap-4">
              {listing.bedrooms !== undefined && (
                <div>
                  <div className="text-sm text-gray-500">Комнат</div>
                  <div className="font-medium text-gray-900">{listing.bedrooms}</div>
                </div>
              )}
              {listing.bathrooms !== undefined && (
                <div>
                  <div className="text-sm text-gray-500">Санузлов</div>
                  <div className="font-medium text-gray-900">{listing.bathrooms}</div>
                </div>
              )}
              {listing.area && (
                <div>
                  <div className="text-sm text-gray-500">Площадь</div>
                  <div className="font-medium text-gray-900">{listing.area} м²</div>
                </div>
              )}
              {listing.floor !== undefined && (
                <div>
                  <div className="text-sm text-gray-500">Этаж</div>
                  <div className="font-medium text-gray-900">
                    {listing.floor}{listing.totalFloors ? ` из ${listing.totalFloors}` : ''}
                  </div>
                </div>
              )}
              {listing.buildingType && (
                <div>
                  <div className="text-sm text-gray-500">Тип здания</div>
                  <div className="font-medium text-gray-900">{listing.buildingType}</div>
                </div>
              )}
              {listing.buildingClass && (
                <div>
                  <div className="text-sm text-gray-500">Класс здания</div>
                  <div className="font-medium text-gray-900">{listing.buildingClass}</div>
                </div>
              )}
              {listing.renovation && (
                <div>
                  <div className="text-sm text-gray-500">Ремонт</div>
                  <div className="font-medium text-gray-900">{listing.renovation}</div>
                </div>
              )}
              {listing.yearBuilt && (
                <div>
                  <div className="text-sm text-gray-500">Год постройки</div>
                  <div className="font-medium text-gray-900">{listing.yearBuilt}</div>
                </div>
              )}
            </div>

            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mt-6">
                <div className="text-sm text-gray-500 mb-2">Удобства</div>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Местоположение
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Адрес</div>
                <div className="font-medium text-gray-900">{listing.address}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Город</div>
                  <div className="font-medium text-gray-900">{listing.city}</div>
                </div>
                {listing.district && (
                  <div>
                    <div className="text-sm text-gray-500">Район</div>
                    <div className="font-medium text-gray-900">{listing.district}</div>
                  </div>
                )}
              </div>
              {listing.mahalla && (
                <div>
                  <div className="text-sm text-gray-500">Махалля</div>
                  <div className="font-medium text-gray-900">{listing.mahalla}</div>
                </div>
              )}
            </div>
          </div>

          {/* Owner Info */}
          {!listing.ownerIsAnonymous && (listing.ownerName || listing.ownerPhone) && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Информация о собственнике
              </h2>
              <div className="space-y-3">
                {listing.ownerName && (
                  <div>
                    <div className="text-sm text-gray-500">Имя</div>
                    <div className="font-medium text-gray-900">{listing.ownerName}</div>
                  </div>
                )}
                {listing.ownerPhone && (
                  <div>
                    <div className="text-sm text-gray-500">Телефон</div>
                    <div className="font-medium text-gray-900">{listing.ownerPhone}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {listing.notes && (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Внутренние заметки</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Ответственный агент</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {listing.member.user.firstName} {listing.member.user.lastName}
                </div>
                <div className="text-sm text-gray-500">Агент</div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Информация о записи</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Создано</div>
                <div className="text-gray-900">{formatDate(listing.createdAt)}</div>
              </div>
              <div>
                <div className="text-gray-500">Обновлено</div>
                <div className="text-gray-900">{formatDate(listing.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить объект?</h3>
            <p className="text-gray-600 mb-6">
              Это действие нельзя отменить. Объект будет удален безвозвратно.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
