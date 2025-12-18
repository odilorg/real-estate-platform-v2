'use client';

import { Link } from '@/i18n/routing';
import { Building2, MapPin, Calendar, Package } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  nameUz?: string;
  slug: string;
  status: string;
  completionDate: Date | string;
  totalUnits: number;
  unitsAvailable: number;
  unitsSold: number;
  city: {
    nameRu: string;
    nameUz: string;
  };
  district: {
    nameRu: string;
    nameUz: string;
  };
  address: string;
}

interface ProjectCardProps {
  project: Project;
  locale?: string;
}

export function ProjectCard({ project, locale = 'ru' }: ProjectCardProps) {
  const projectName = locale === 'uz' && project.nameUz ? project.nameUz : project.name;
  const cityName = locale === 'uz' ? project.city.nameUz : project.city.nameRu;
  const districtName = locale === 'uz' ? project.district.nameUz : project.district.nameRu;

  const statusColors: Record<string, string> = {
    PLANNING: 'bg-yellow-100 text-yellow-800',
    UNDER_CONSTRUCTION: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    HANDED_OVER: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    PLANNING: locale === 'uz' ? 'Rejalashtirilmoqda' : 'Планируется',
    UNDER_CONSTRUCTION: locale === 'uz' ? 'Qurilmoqda' : 'Строится',
    COMPLETED: locale === 'uz' ? 'Tugallangan' : 'Завершено',
    HANDED_OVER: locale === 'uz' ? 'Topshirilgan' : 'Сдано',
    CANCELLED: locale === 'uz' ? 'Bekor qilingan' : 'Отменено',
  };

  const completionDate = new Date(project.completionDate);
  const formattedDate = completionDate.toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Link
      href={`/developer/projects/${project.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {projectName}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{cityName}, {districtName}</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[project.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[project.status] || project.status}
          </span>
        </div>

        {/* Address */}
        <p className="text-sm text-gray-600 mb-4">{project.address}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <Package className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">
                {locale === 'uz' ? 'Jami kvartiralar' : 'Всего квартир'}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {project.totalUnits}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">
                {locale === 'uz' ? 'Topshirish' : 'Сдача'}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {locale === 'uz' ? 'Sotilgan' : 'Продано'}: {project.unitsSold}
            </span>
            <span>
              {locale === 'uz' ? 'Mavjud' : 'Доступно'}: {project.unitsAvailable}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${(project.unitsSold / project.totalUnits) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
