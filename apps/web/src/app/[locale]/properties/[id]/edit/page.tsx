'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@repo/ui';
import { ImageUploader } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Save, Eye, Trash2, Youtube } from 'lucide-react';

// Enums from schema
const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Квартира' },
  { value: 'HOUSE', label: 'Дом' },
  { value: 'TOWNHOUSE', label: 'Таунхаус' },
  { value: 'LAND', label: 'Участок' },
  { value: 'COMMERCIAL', label: 'Коммерческая' },
];

const LISTING_TYPES = [
  { value: 'SALE', label: 'Продажа' },
  { value: 'RENT_LONG', label: 'Долгосрочная аренда' },
  { value: 'RENT_DAILY', label: 'Посуточная аренда' },
];

const BUILDING_TYPES = [
  { value: 'BRICK', label: 'Кирпичный' },
  { value: 'PANEL', label: 'Панельный' },
  { value: 'MONOLITHIC', label: 'Монолитный' },
  { value: 'WOOD', label: 'Деревянный' },
  { value: 'BLOCK', label: 'Блочный' },
];

const BUILDING_CLASSES = [
  { value: 'ECONOMY', label: 'Эконом' },
  { value: 'COMFORT', label: 'Комфорт' },
  { value: 'BUSINESS', label: 'Бизнес' },
  { value: 'ELITE', label: 'Элитный' },
];

const RENOVATION_TYPES = [
  { value: 'NONE', label: 'Без ремонта' },
  { value: 'COSMETIC', label: 'Косметический' },
  { value: 'EURO', label: 'Евроремонт' },
  { value: 'DESIGNER', label: 'Дизайнерский' },
  { value: 'NEEDS_REPAIR', label: 'Требует ремонта' },
];

const PARKING_TYPES = [
  { value: 'STREET', label: 'Уличная' },
  { value: 'UNDERGROUND', label: 'Подземная' },
  { value: 'GARAGE', label: 'Гараж' },
  { value: 'MULTI_LEVEL', label: 'Многоуровневая' },
];

const CITIES = [
  'Ташкент',
  'Самарканд',
  'Бухара',
  'Навои',
  'Андижан',
  'Фергана',
  'Наманган',
  'Карши',
  'Нукус',
  'Термез',
];

interface PropertyVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  type: string;
  order: number;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  propertyType: string;
  listingType: string;
  address: string;
  city: string;
  district: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  livingArea: string;
  kitchenArea: string;
  floor: string;
  totalFloors: string;
  yearBuilt: string;
  buildingType: string;
  buildingClass: string;
  renovation: string;
  parking: string;
  parkingType: string;
  balcony: string;
  ceilingHeight: string;
  nearestMetro: string;
  metroDistance: string;
  hasConcierge: boolean;
  hasGatedArea: boolean;
  images: string[];
}

const initialFormData: FormData = {
  title: '',
  description: '',
  price: '',
  propertyType: '',
  listingType: 'SALE',
  address: '',
  city: 'Ташкент',
  district: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  livingArea: '',
  kitchenArea: '',
  floor: '',
  totalFloors: '',
  yearBuilt: '',
  buildingType: '',
  buildingClass: '',
  renovation: '',
  parking: '',
  parkingType: '',
  balcony: '',
  ceilingHeight: '',
  nearestMetro: '',
  metroDistance: '',
  hasConcierge: false,
  hasGatedArea: false,
  images: [],
};

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube video state
  const [videos, setVideos] = useState<PropertyVideo[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [addingYoutube, setAddingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // YouTube URL parser - extracts video ID from various YouTube URL formats
  const extractYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Get YouTube thumbnail URL
  const getYoutubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch property data
  useEffect(() => {
    if (!isAuthenticated || !propertyId) return;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        const response = await fetch(`${apiUrl}/properties/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Объявление не найдено');
          }
          if (response.status === 403) {
            throw new Error('У вас нет прав для редактирования этого объявления');
          }
          throw new Error('Ошибка загрузки объявления');
        }

        const property = await response.json();

        // Map property data to form data
        setFormData({
          title: property.title || '',
          description: property.description || '',
          price: property.price?.toString() || '',
          propertyType: property.propertyType || '',
          listingType: property.listingType || 'SALE',
          address: property.address || '',
          city: property.city || 'Ташкент',
          district: property.district || '',
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          area: property.area?.toString() || '',
          livingArea: property.livingArea?.toString() || '',
          kitchenArea: property.kitchenArea?.toString() || '',
          floor: property.floor?.toString() || '',
          totalFloors: property.totalFloors?.toString() || '',
          yearBuilt: property.yearBuilt?.toString() || '',
          buildingType: property.buildingType || '',
          buildingClass: property.buildingClass || '',
          renovation: property.renovation || '',
          parking: property.parking?.toString() || '',
          parkingType: property.parkingType || '',
          balcony: property.balcony?.toString() || '',
          ceilingHeight: property.ceilingHeight?.toString() || '',
          nearestMetro: property.nearestMetro || '',
          metroDistance: property.metroDistance?.toString() || '',
          hasConcierge: property.hasConcierge || false,
          hasGatedArea: property.hasGatedArea || false,
          images: property.images?.map((img: { url: string }) => img.url) || [],
        });

        // Fetch videos
        try {
          const videosResponse = await fetch(`${apiUrl}/properties/${propertyId}/media/videos`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            setVideos(videosData || []);
          }
        } catch (err) {
          console.error('Error loading videos:', err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [isAuthenticated, propertyId, apiUrl]);

  const handleChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle adding YouTube video
  const handleAddYoutubeVideo = async () => {
    setYoutubeError('');

    const videoId = extractYoutubeVideoId(youtubeUrl.trim());
    if (!videoId) {
      setYoutubeError('Неверная ссылка на YouTube');
      return;
    }

    try {
      setAddingYoutube(true);
      const token = getAuthToken();

      const response = await fetch(`${apiUrl}/properties/${propertyId}/media/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnailUrl: getYoutubeThumbnail(videoId),
          title: youtubeTitle.trim() || undefined,
          type: 'YOUTUBE',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add video');
      }

      const newVideo = await response.json();
      setVideos([...videos, newVideo]);
      setYoutubeUrl('');
      setYoutubeTitle('');
    } catch (err) {
      console.error('Error adding YouTube video:', err);
      setYoutubeError('Ошибка добавления видео');
    } finally {
      setAddingYoutube(false);
    }
  };

  // Handle deleting video
  const handleDeleteVideo = async (videoId: string) => {
    try {
      const token = getAuthToken();
      await fetch(`${apiUrl}/properties/${propertyId}/media/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVideos(videos.filter((v) => v.id !== videoId));
    } catch (err) {
      console.error('Error deleting video:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError('Необходимо авторизоваться');
      setSaving(false);
      router.push('/auth/login');
      return;
    }

    // Build request body
    const body = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      propertyType: formData.propertyType,
      listingType: formData.listingType,
      address: formData.address,
      city: formData.city,
      district: formData.district || undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
      area: formData.area ? parseFloat(formData.area) : undefined,
      livingArea: formData.livingArea ? parseFloat(formData.livingArea) : undefined,
      kitchenArea: formData.kitchenArea ? parseFloat(formData.kitchenArea) : undefined,
      floor: formData.floor ? parseInt(formData.floor) : undefined,
      totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
      buildingType: formData.buildingType || undefined,
      buildingClass: formData.buildingClass || undefined,
      renovation: formData.renovation || undefined,
      parking: formData.parking ? parseInt(formData.parking) : undefined,
      parkingType: formData.parkingType || undefined,
      balcony: formData.balcony ? parseInt(formData.balcony) : undefined,
      ceilingHeight: formData.ceilingHeight ? parseFloat(formData.ceilingHeight) : undefined,
      nearestMetro: formData.nearestMetro || undefined,
      metroDistance: formData.metroDistance ? parseInt(formData.metroDistance) : undefined,
      hasConcierge: formData.hasConcierge,
      hasGatedArea: formData.hasGatedArea,
      images: formData.images,
    };

    try {
      const response = await fetch(`${apiUrl}/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setError('Сессия истекла. Пожалуйста, войдите снова.');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }
        if (response.status === 403) {
          throw new Error('У вас нет прав для редактирования этого объявления');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Ошибка сохранения объявления');
      }

      router.push(`/properties/${propertyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения объявления');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link href="/dashboard" className="shrink-0">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-base sm:text-xl font-semibold truncate">Редактирование</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link href={`/properties/${propertyId}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Просмотр</span>
                </Button>
              </Link>
              <Button onClick={handleSubmit} disabled={saving} size="sm">
                {saving ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Сохранить</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Тип недвижимости *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(v) => handleChange('propertyType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="listingType">Тип сделки *</Label>
                    <Select
                      value={formData.listingType}
                      onValueChange={(v) => handleChange('listingType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Например: 3-комнатная квартира в центре"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание *</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Подробное описание объекта..."
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Цена (у.е.) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="100000"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {formData.listingType === 'SALE'
                      ? 'Стоимость объекта'
                      : 'Стоимость аренды в месяц'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Расположение</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Город *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(v) => handleChange('city', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите город" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">Район</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleChange('district', e.target.value)}
                      placeholder="Например: Мирзо-Улугбекский"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Улица, дом"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nearestMetro">Ближайшее метро</Label>
                    <Input
                      id="nearestMetro"
                      value={formData.nearestMetro}
                      onChange={(e) => handleChange('nearestMetro', e.target.value)}
                      placeholder="Станция метро"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metroDistance">Расстояние до метро (м)</Label>
                    <Input
                      id="metroDistance"
                      type="number"
                      value={formData.metroDistance}
                      onChange={(e) => handleChange('metroDistance', e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Характеристики</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Комнат</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => handleChange('bedrooms', e.target.value)}
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Санузлов</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => handleChange('bathrooms', e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floor">Этаж</Label>
                    <Input
                      id="floor"
                      type="number"
                      value={formData.floor}
                      onChange={(e) => handleChange('floor', e.target.value)}
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalFloors">Этажей в доме</Label>
                    <Input
                      id="totalFloors"
                      type="number"
                      value={formData.totalFloors}
                      onChange={(e) => handleChange('totalFloors', e.target.value)}
                      placeholder="9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Общая площадь (м²)</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => handleChange('area', e.target.value)}
                      placeholder="85"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="livingArea">Жилая площадь (м²)</Label>
                    <Input
                      id="livingArea"
                      type="number"
                      step="0.1"
                      value={formData.livingArea}
                      onChange={(e) => handleChange('livingArea', e.target.value)}
                      placeholder="65"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kitchenArea">Площадь кухни (м²)</Label>
                    <Input
                      id="kitchenArea"
                      type="number"
                      step="0.1"
                      value={formData.kitchenArea}
                      onChange={(e) => handleChange('kitchenArea', e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ceilingHeight">Высота потолков (м)</Label>
                    <Input
                      id="ceilingHeight"
                      type="number"
                      step="0.1"
                      value={formData.ceilingHeight}
                      onChange={(e) => handleChange('ceilingHeight', e.target.value)}
                      placeholder="2.7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balcony">Балконов</Label>
                    <Input
                      id="balcony"
                      type="number"
                      value={formData.balcony}
                      onChange={(e) => handleChange('balcony', e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Год постройки</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => handleChange('yearBuilt', e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Building Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">О доме</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buildingType">Тип дома</Label>
                    <Select
                      value={formData.buildingType}
                      onValueChange={(v) => handleChange('buildingType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUILDING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buildingClass">Класс жилья</Label>
                    <Select
                      value={formData.buildingClass}
                      onValueChange={(v) => handleChange('buildingClass', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUILDING_CLASSES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renovation">Ремонт</Label>
                    <Select
                      value={formData.renovation}
                      onValueChange={(v) => handleChange('renovation', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {RENOVATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parking">Парковочных мест</Label>
                    <Input
                      id="parking"
                      type="number"
                      value={formData.parking}
                      onChange={(e) => handleChange('parking', e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parkingType">Тип парковки</Label>
                    <Select
                      value={formData.parkingType}
                      onValueChange={(v) => handleChange('parkingType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {PARKING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Дополнительно</Label>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.hasConcierge}
                        onCheckedChange={(checked) =>
                          handleChange('hasConcierge', checked === true)
                        }
                      />
                      <span className="text-sm">Консьерж</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.hasGatedArea}
                        onCheckedChange={(checked) =>
                          handleChange('hasGatedArea', checked === true)
                        }
                      />
                      <span className="text-sm">Закрытая территория</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Фотографии</h2>
              <ImageUploader
                images={formData.images}
                onChange={(images) => handleChange('images', images)}
                maxImages={20}
              />
            </CardContent>
          </Card>

          {/* YouTube Videos */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold">Видео с YouTube</h2>
              </div>

              {/* Add YouTube Video Form */}
              <div className="space-y-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="youtubeUrl">Ссылка на YouTube видео *</Label>
                      <Input
                        id="youtubeUrl"
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => {
                          setYoutubeUrl(e.target.value);
                          setYoutubeError('');
                        }}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="youtubeTitle">Название видео (необязательно)</Label>
                      <Input
                        id="youtubeTitle"
                        type="text"
                        value={youtubeTitle}
                        onChange={(e) => setYoutubeTitle(e.target.value)}
                        placeholder="например: Видеотур по квартире"
                      />
                    </div>

                    {youtubeError && (
                      <p className="text-sm text-red-600">{youtubeError}</p>
                    )}

                    {/* YouTube Preview */}
                    {youtubeUrl && extractYoutubeVideoId(youtubeUrl) && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black max-w-md">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeVideoId(youtubeUrl)}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={handleAddYoutubeVideo}
                      disabled={addingYoutube || !youtubeUrl.trim()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {addingYoutube ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Добавление...
                        </>
                      ) : (
                        <>
                          <Youtube className="h-4 w-4 mr-2" />
                          Добавить видео
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Existing Videos List */}
              {videos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Добавленные видео ({videos.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((video) => {
                      const videoId = video.type === 'YOUTUBE' ? extractYoutubeVideoId(video.url) : null;
                      return (
                        <div key={video.id} className="bg-white rounded-lg border overflow-hidden">
                          {/* Video Preview */}
                          <div className="aspect-video relative bg-gray-900">
                            {video.type === 'YOUTUBE' && videoId ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Youtube className="w-12 h-12 text-gray-600" />
                              </div>
                            )}
                            {/* Type Badge */}
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                              YouTube
                            </div>
                          </div>

                          {/* Video Info */}
                          <div className="p-3 flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900 truncate flex-1">
                              {video.title || 'Без названия'}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {videos.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Нет добавленных видео. Добавьте ссылку на YouTube выше.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <Button variant="outline" type="button">
                Отмена
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
