'use client';

import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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

// Translations
const translations = {
  ru: {
    title: 'Проекты',
    subtitle: 'Управляйте вашими жилыми комплексами',
    createProject: 'Создать проект',
    empty: {
      title: 'Нет проектов',
      description: 'Создайте свой первый проект и начните управлять объектами недвижимости',
      button: 'Создать первый проект',
    },
    loading: 'Загрузка...',
    error: 'Ошибка загрузки проектов',
  },
  uz: {
    title: 'Loyihalar',
    subtitle: 'Turar-joy majmualaringizni boshqaring',
    createProject: 'Loyiha yaratish',
    empty: {
      title: 'Loyihalar yo\'q',
      description: 'Birinchi loyihangizni yarating va ko\'chmas mulkni boshqarishni boshlang',
      button: 'Birinchi loyihani yaratish',
    },
    loading: 'Yuklanmoqda...',
    error: 'Loyihalarni yuklashda xatolik',
  },
};

export default function ProjectsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'ru';
  const t = translations[locale as keyof typeof translations] || translations.ru;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        console.log('ProjectsPage: Fetching projects...');
        const token = localStorage.getItem('token');
        console.log('ProjectsPage: Token present:', !!token);
        const data = await api.get<Project[]>('/developer-projects');
        console.log('ProjectsPage: Received projects:', data.length);
        setProjects(data);
      } catch (err) {
        console.error('ProjectsPage: Error fetching projects:', err);
        setError(err instanceof Error ? err.message : t.error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [t.error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">{t.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
        </div>
        <Link
          href={`/${locale}/developer/projects/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t.createProject}
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t.empty.title}
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              {t.empty.description}
            </p>
            <Link
              href={`/${locale}/developer/projects/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t.empty.button}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
