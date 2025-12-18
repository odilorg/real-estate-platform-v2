'use client';

import { useState, useEffect, use } from 'react';
import { Link } from '@/i18n/routing';
import { Button, Badge, Card, CardContent } from '@repo/ui';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  Star,
  Verified,
  Loader2,
  Globe,
  MessageSquare,
  Calendar,
  Users,
} from 'lucide-react';

interface Developer {
  id: string;
  name: string;
  nameUz: string | null;
  slug: string;
  logo: string | null;
  descriptionRu: string | null;
  descriptionUz: string | null;
  licenseNumber: string | null;
  innTin: string | null;
  legalEntity: string | null;
  legalAddress: string | null;
  establishedYear: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  telegram: string | null;
  whatsapp: string | null;
  city: string;
  officeAddress: string | null;
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  totalProjects: number;
  activeProjects: number;
  totalUnits: number;
  unitsSold: number;
  unitsAvailable: number;
  createdAt: string;
}

interface DeveloperProject {
  id: string;
  slug: string;
  name: string;
  nameUz: string | null;
  status: string;
  completionDate: string | null;
  totalUnits: number;
  unitsAvailable: number;
  buildingClass: string | null;
  address: string;
  city: string;
  images: Array<{ url: string }>;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export default function DeveloperProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const developerSlug = resolvedParams.slug;
  const t = useTranslations('developers');
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchDeveloper();
  }, [developerSlug]);

  const fetchDeveloper = async () => {
    try {
      const response = await fetch(`${apiUrl}/developers/slug/${developerSlug}`);
      if (!response.ok) {
        throw new Error(t('errors.notFound'));
      }
      const data = await response.json();
      setDeveloper(data);

      // Fetch projects for this developer
      if (data.id) {
        fetchDeveloperProjects(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDeveloperProjects = async (developerId: string) => {
    try {
      const response = await fetch(`${apiUrl}/developer-projects?developerId=${developerId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch developer projects:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !developer) {
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
          <Link href="/developers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToDevelopers')}
            </Button>
          </Link>
        </div>

        {/* Developer Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {developer.logo ? (
                  <img
                    src={developer.logo}
                    alt={developer.name}
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
                    <h1 className="text-3xl font-bold mb-2">
                      {developer.name}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      {developer.verified && (
                        <Badge variant="default">
                          <Verified className="h-3 w-3 mr-1" />
                          {t('verified')}
                        </Badge>
                      )}
                      {developer.featured && (
                        <Badge variant="default" className="bg-amber-600">
                          <Star className="h-3 w-3 mr-1 fill-white" />
                          {t('featured')}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {developer.city}
                      </Badge>
                    </div>
                  </div>

                  {/* Rating */}
                  {developer.reviewCount > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-bold">{developer.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {developer.reviewCount} {t('reviews')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('stats.totalProjects')}</div>
                    <div className="text-lg font-semibold">{developer.totalProjects}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('stats.totalUnits')}</div>
                    <div className="text-lg font-semibold">{developer.totalUnits}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('stats.unitsSold')}</div>
                    <div className="text-lg font-semibold">{developer.unitsSold}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('stats.unitsAvailable')}</div>
                    <div className="text-lg font-semibold">{developer.unitsAvailable}</div>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex flex-wrap gap-3">
                  {developer.phone && (
                    <Button>
                      <Phone className="h-4 w-4 mr-2" />
                      {developer.phone}
                    </Button>
                  )}
                  {developer.email && (
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      {t('emailDeveloper')}
                    </Button>
                  )}
                  {developer.website && (
                    <Button variant="outline" asChild>
                      <a href={developer.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  {developer.whatsapp && (
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                  {developer.telegram && (
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Telegram
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {developer.descriptionRu && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">{t('about')}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{developer.descriptionRu}</p>
              </div>
            )}

            {/* Legal Info */}
            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-3 text-sm">{t('legalInfo')}</h4>
                <div className="space-y-2 text-sm">
                  {developer.legalEntity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Юридическое лицо:</span>
                      <span className="font-medium">{developer.legalEntity}</span>
                    </div>
                  )}
                  {developer.innTin && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('inn')}:</span>
                      <span className="font-mono font-medium">{developer.innTin}</span>
                    </div>
                  )}
                  {developer.licenseNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('license')}:</span>
                      <span className="font-mono font-medium">{developer.licenseNumber}</span>
                    </div>
                  )}
                  {developer.establishedYear && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('establishedYear')}:</span>
                      <span className="font-medium">{developer.establishedYear}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm">{t('contactInfo')}</h4>
                <div className="space-y-2 text-sm">
                  {developer.officeAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{developer.officeAddress}</span>
                    </div>
                  )}
                  {developer.legalAddress && developer.legalAddress !== developer.officeAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-xs">
                        Юр. адрес: {developer.legalAddress}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer's Projects */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('ourProjects')}</h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link key={project.id} href={`/developer/projects/${project.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      {/* Project Image */}
                      {project.images?.[0]?.url ? (
                        <img
                          src={project.images[0].url}
                          alt={project.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
                          <Building2 className="h-16 w-16 text-gray-400" />
                        </div>
                      )}

                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{project.name}</h3>

                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant={project.status === 'COMPLETED' ? 'default' : 'outline'}>
                            {project.status === 'COMPLETED' ? 'Сдан' :
                             project.status === 'UNDER_CONSTRUCTION' ? 'Строится' :
                             'Планируется'}
                          </Badge>
                          {project.buildingClass && (
                            <Badge variant="outline">{project.buildingClass}</Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {project.address}, {project.city}
                        </div>

                        {project.completionDate && (
                          <div className="text-sm text-gray-600 mb-3">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Сдача: {new Date(project.completionDate).toLocaleDateString('ru-RU', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 p-2 rounded text-center">
                            <div className="text-xs text-gray-600">Всего</div>
                            <div className="font-semibold">{project.totalUnits}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded text-center">
                            <div className="text-xs text-gray-600">Доступно</div>
                            <div className="font-semibold">{project.unitsAvailable}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">{t('noProjects')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
