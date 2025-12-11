'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button, Badge, Card, CardContent } from '@repo/ui';
import { PropertyListItem } from '@/components';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Award,
  Star,
  Building2,
  MessageSquare,
  Calendar,
  Verified,
  Loader2,
} from 'lucide-react';

interface Agent {
  id: string;
  userId: string;
  photo: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  whatsapp: string | null;
  telegram: string | null;
  licenseNumber: string | null;
  yearsExperience: number;
  totalDeals: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  superAgent: boolean;
  showPhone: boolean;
  showEmail: boolean;
  specializations: string[];
  languages: string[];
  areasServed: string[];
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  agency: {
    id: string;
    name: string;
    logo: string | null;
    slug: string;
  } | null;
}

interface Property {
  id: string;
  title: string;
  price: number;
  listingType: string;
  propertyType: string;
  address: string;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  images: Array<{ url: string }>;
}

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const agentId = resolvedParams.id;
  const t = useTranslations('agents');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchAgent();
    fetchAgentProperties();
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`${apiUrl}/agents/${agentId}`);
      if (!response.ok) {
        throw new Error(t('errors.notFound'));
      }
      const data = await response.json();
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentProperties = async () => {
    try {
      // Assuming there's a way to get agent's user ID to filter properties
      // For now we'll use a placeholder - you may need to add an endpoint
      const response = await fetch(`${apiUrl}/properties?limit=100`);
      if (response.ok) {
        const data = await response.json();
        // Filter by agent's userId once we have it
        setProperties(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch agent properties:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error || t('errors.notFound')}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToAgents')}
            </Button>
          </Link>
        </div>

        {/* Agent Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo */}
              <div className="flex-shrink-0">
                {agent.photo ? (
                  <img
                    src={agent.photo}
                    alt={`${agent.user.firstName} ${agent.user.lastName}`}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <Award className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {agent.user.firstName} {agent.user.lastName}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      {agent.verified && (
                        <Badge variant="default">
                          <Verified className="h-3 w-3 mr-1" />
                          {t('verified')}
                        </Badge>
                      )}
                      {agent.superAgent && (
                        <Badge variant="default" className="bg-amber-600">
                          <Star className="h-3 w-3 mr-1 fill-white" />
                          {t('superAgent')}
                        </Badge>
                      )}
                      {agent.agency && (
                        <Badge variant="outline">
                          <Building2 className="h-3 w-3 mr-1" />
                          {agent.agency.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {agent.reviewCount > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-bold">{agent.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {agent.reviewCount} {t('reviews')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('experience')}</div>
                    <div className="text-lg font-semibold">
                      {agent.yearsExperience} {t('years')}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('totalDeals')}</div>
                    <div className="text-lg font-semibold">{agent.totalDeals}</div>
                  </div>
                  {agent.licenseNumber && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">{t('license')}</div>
                      <div className="text-sm font-mono">{agent.licenseNumber}</div>
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="flex flex-wrap gap-3">
                  {agent.showPhone && agent.phone && (
                    <Button>
                      <Phone className="h-4 w-4 mr-2" />
                      {agent.phone}
                    </Button>
                  )}
                  {agent.showEmail && agent.email && (
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      {t('emailAgent')}
                    </Button>
                  )}
                  {agent.whatsapp && (
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                  {agent.telegram && (
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Telegram
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {agent.bio && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">{t('about')}</h3>
                <p className="text-gray-700">{agent.bio}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              {agent.specializations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">{t('specializations')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.specializations.map((spec) => (
                      <Badge key={spec} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {agent.languages.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">{t('languages')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang) => (
                      <Badge key={lang} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {agent.areasServed.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">{t('areasServed')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.areasServed.map((area) => (
                      <Badge key={area} variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent's Properties */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('listings')}</h2>
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <PropertyListItem
                    id={property.id}
                    title={property.title}
                    price={property.price}
                    listingType={property.listingType as 'SALE' | 'RENT_LONG' | 'RENT_DAILY'}
                    address={property.address}
                    city={property.city}
                    bedrooms={property.bedrooms ?? undefined}
                    bathrooms={property.bathrooms ?? undefined}
                    area={property.area}
                    imageUrl={property.images?.[0]?.url}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">{t('noListings')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
