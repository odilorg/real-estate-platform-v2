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
  Globe,
  Verified,
  Loader2,
  Calendar,
} from 'lucide-react';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  superAgent: boolean;
  specializations: string[];
}

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  yearsOnPlatform: number;
  verified: boolean;
  createdAt: string;
  agents: Agent[];
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

export default function AgencyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const agencySlug = resolvedParams.slug;
  const t = useTranslations('agencies');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [totalDealsCount, setTotalDealsCount] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchAgency();
    fetchAgencyProperties();
  }, [agencySlug]);

  const fetchAgency = async () => {
    try {
      const response = await fetch(`${apiUrl}/agencies/slug/${agencySlug}`);
      if (!response.ok) {
        throw new Error(t('errors.notFound'));
      }
      const data = await response.json();
      setAgency(data);

      // Calculate stats from agents
      const totalDeals = data.agents.reduce((sum: number, agent: Agent) => {
        // This would come from agent data if available
        return sum;
      }, 0);
      setTotalDealsCount(totalDeals);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencyProperties = async () => {
    try {
      // Fetch properties from the agency (would need backend support)
      const response = await fetch(`${apiUrl}/properties?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.items || []);
        setActiveListingsCount(data.items?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch agency properties:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !agency) {
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
          <Link href="/agencies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToAgencies')}
            </Button>
          </Link>
        </div>

        {/* Agency Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {agency.logo ? (
                  <img
                    src={agency.logo}
                    alt={agency.name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{agency.name}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      {agency.verified && (
                        <Badge variant="default">
                          <Verified className="h-3 w-3 mr-1" />
                          {t('verified')}
                        </Badge>
                      )}
                      {agency.yearsOnPlatform >= 3 && (
                        <Badge variant="default" className="bg-amber-600">
                          <Star className="h-3 w-3 mr-1 fill-white" />
                          {t('premium')}
                        </Badge>
                      )}
                      {agency.city && (
                        <Badge variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {agency.city}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('agents')}</div>
                    <div className="text-lg font-semibold">{agency.agents.length}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('activeListings')}</div>
                    <div className="text-lg font-semibold">{activeListingsCount}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('founded')}</div>
                    <div className="text-sm font-mono">
                      {new Date(agency.createdAt).getFullYear()}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex flex-wrap gap-3">
                  {agency.phone && (
                    <Button>
                      <Phone className="h-4 w-4 mr-2" />
                      {agency.phone}
                    </Button>
                  )}
                  {agency.email && (
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      {t('email')}
                    </Button>
                  )}
                  {agency.website && (
                    <a href={agency.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <Globe className="h-4 w-4 mr-2" />
                        {t('website')}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {agency.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">{t('about')}</h3>
                <p className="text-gray-700">{agency.description}</p>
              </div>
            )}

            {/* Contact Info */}
            {agency.address && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">{t('contact')}</h3>
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <span>{agency.address}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agency Agents */}
        {agency.agents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">{t('ourAgents')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agency.agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        {agent.photo ? (
                          <img
                            src={agent.photo}
                            alt={`${agent.firstName} ${agent.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <Award className="h-8 w-8 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {agent.firstName} {agent.lastName}
                          </h3>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {agent.verified && (
                              <Badge variant="default" className="text-xs">
                                <Verified className="h-3 w-3 mr-1" />
                                {t('verified')}
                              </Badge>
                            )}
                            {agent.superAgent && (
                              <Badge variant="default" className="bg-amber-600 text-xs">
                                <Star className="h-3 w-3 mr-1 fill-white" />
                                Super
                              </Badge>
                            )}
                          </div>

                          {agent.reviewCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold">{agent.rating.toFixed(1)}</span>
                              <span className="text-xs text-gray-600">
                                ({agent.reviewCount})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Specializations */}
                      {agent.specializations && agent.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {agent.specializations.slice(0, 2).map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {agent.specializations.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.specializations.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Agency's Properties */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('ourListings')}</h2>
            {properties.length > 6 && (
              <Link href={`/properties?agency=${agency.slug}`}>
                <Button variant="outline" size="sm">
                  {t('viewAllListings')}
                </Button>
              </Link>
            )}
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <PropertyListItem
                    title={property.title}
                    price={property.price}
                    listingType={property.listingType}
                    address={`${property.address}, ${property.city}`}
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
