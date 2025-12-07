'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { ArrowLeft, Loader2, Save, Eye } from 'lucide-react';

// Enums from schema
const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Квартира' },
  { value: 'HOUSE', label: 'Дом' },
  { value: 'CONDO', label: 'Апартаменты' },
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

const CURRENCIES = [
  { value: 'YE', label: 'у.е.' },
  { value: 'UZS', label: 'сум' },
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

interface FormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  propertyType: string;
  listingType: string;
  address: string;
  city: string;
  district: string;
  mahalla: string;
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
  hasGarbageChute: boolean;
  hasConcierge: boolean;
  hasGatedArea: boolean;
  images: string[];
}

const initialFormData: FormData = {
  title: '',
  description: '',
  price: '',
  currency: 'YE',
  propertyType: '',
  listingType: 'SALE',
  address: '',
  city: 'Ташкент',
  district: '',
  mahalla: '',
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
  hasGarbageChute: false,
  hasConcierge: false,
  hasGatedArea: false,
  images: [],
};

export default function NewPropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const handleChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError('Необходимо авторизоваться');
      setLoading(false);
      router.push('/auth/login');
      return;
    }

    // Build request body
    const body = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      currency: formData.currency,
      propertyType: formData.propertyType,
      listingType: formData.listingType,
      address: formData.address,
      city: formData.city,
      district: formData.district || undefined,
      mahalla: formData.mahalla || undefined,
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
      hasGarbageChute: formData.hasGarbageChute,
      hasConcierge: formData.hasConcierge,
      hasGatedArea: formData.hasGatedArea,
      images: formData.images,
    };

    try {
      const response = await fetch(`${apiUrl}/properties`, {
        method: 'POST',
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Ошибка создания объявления');
      }

      const property = await response.json();
      router.push(`/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания объявления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Новое объявление</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled>
                <Eye className="h-4 w-4 mr-2" />
                Предпросмотр
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Опубликовать
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
                  <Label htmlFor="price">Цена *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      placeholder="100000"
                      required
                      className="flex-1"
                    />
                    <div className="flex rounded-lg border overflow-hidden">
                      {CURRENCIES.map((curr) => (
                        <button
                          key={curr.value}
                          type="button"
                          onClick={() => handleChange('currency', curr.value)}
                          className={`px-3 py-2 text-sm font-medium transition-colors ${
                            formData.currency === curr.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {curr.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                  <Label htmlFor="mahalla">Махалля</Label>
                  <Input
                    id="mahalla"
                    value={formData.mahalla}
                    onChange={(e) => handleChange('mahalla', e.target.value)}
                    placeholder="Название махалли"
                  />
                  <p className="text-xs text-gray-500">Укажите название махалли для более точного расположения</p>
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
                        checked={formData.hasGarbageChute}
                        onCheckedChange={(checked) =>
                          handleChange('hasGarbageChute', checked === true)
                        }
                      />
                      <span className="text-sm">Мусоропровод</span>
                    </label>

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

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/properties">
              <Button variant="outline" type="button">
                Отмена
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Опубликовать
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
