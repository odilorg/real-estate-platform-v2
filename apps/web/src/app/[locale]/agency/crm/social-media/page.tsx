'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, Button, Badge } from '@repo/ui';
import { SocialMediaPoster } from '@/components/crm/SocialMediaPoster';
import {
  Share2,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  ChevronRight,
  Filter,
  Search,
  BarChart3,
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  district: string;
  city: string;
  images: Array<{ url: string }>;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  status: string;
  views: number;
  socialShares?: number;
}

export default function SocialMediaManagementPage() {
  const t = useTranslations();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/properties/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalShares: properties.reduce((acc, p) => acc + (p.socialShares || 0), 0),
    totalViews: properties.reduce((acc, p) => acc + p.views, 0),
    avgEngagement: '4.2%',
    bestTime: '19:00',
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || property.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Социальные сети и продвижение
        </h1>
        <p className="text-gray-600 mt-1">
          Публикуйте объекты в социальных сетях одним кликом
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего публикаций</p>
                <p className="text-2xl font-bold mt-1">{stats.totalShares}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Просмотры</p>
                <p className="text-2xl font-bold mt-1">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Вовлеченность</p>
                <p className="text-2xl font-bold mt-1">{stats.avgEngagement}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Лучшее время</p>
                <p className="text-2xl font-bold mt-1">{stats.bestTime}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Поиск объектов..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                {/* Property Items */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredProperties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => setSelectedProperty(property)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        selectedProperty?.id === property.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {property.images?.[0] && (
                          <img
                            src={property.images[0].url}
                            alt={property.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{property.title}</div>
                          <div className="text-sm text-gray-500">
                            {property.district}, {property.city}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {property.bedrooms} комн.
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {property.area} м²
                            </Badge>
                            {property.socialShares && (
                              <Badge variant="outline" className="text-xs">
                                <Share2 className="h-3 w-3 mr-1" />
                                {property.socialShares}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Poster */}
        <div className="lg:col-span-2">
          {selectedProperty ? (
            <SocialMediaPoster
              property={selectedProperty}
              agencyName="Premium Real Estate"
              agentPhone="+998 90 123 45 67"
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выберите объект
                </h3>
                <p className="text-gray-500">
                  Выберите объект из списка слева для публикации в социальных сетях
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scheduled Posts */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Запланированные публикации</h3>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Расписание
            </Button>
          </div>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Нет запланированных публикаций</p>
            <p className="text-sm mt-1">Публикации будут появляться здесь после планирования</p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Эффективность публикаций</h3>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Подробнее
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">Telegram</div>
              <div className="text-sm text-gray-600 mt-1">Лучшая конверсия</div>
              <div className="text-lg font-semibold mt-2">8.5%</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">Instagram</div>
              <div className="text-sm text-gray-600 mt-1">Больше всего лайков</div>
              <div className="text-lg font-semibold mt-2">342</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">OLX</div>
              <div className="text-sm text-gray-600 mt-1">Больше звонков</div>
              <div className="text-lg font-semibold mt-2">27</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}