'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Home,
  Loader2,
  Plus,
  Globe,
  DollarSign,
  Ruler,
  Calendar,
  Hash,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { api } from '@/lib/api';

interface DeveloperProject {
  id: string;
  name: string;
  nameUz?: string;
  slug: string;
}

// Translations
const translations = {
  ru: {
    title: 'Новый объект',
    subtitle: 'Добавьте новую квартиру или помещение в ваш проект',
    back: 'Назад к объектам',

    // Sections
    projectSection: 'Проект',
    projectDesc: 'Выберите проект, к которому относится объект',
    selectProject: 'Выберите проект',
    noProjects: 'Нет проектов. Сначала создайте проект.',

    basicSection: 'Основная информация',
    basicDesc: 'Название и описание объекта',
    titleRu: 'Название (RU)',
    titleRuPlaceholder: '3-комнатная квартира с видом на парк',
    titleUz: 'Название (UZ)',
    titleUzPlaceholder: 'Parkga qaraydigan 3 xonali kvartira',
    description: 'Описание',
    descriptionPlaceholder: 'Подробное описание объекта...',

    locationSection: 'Расположение',
    locationDesc: 'Адрес и местоположение объекта',
    address: 'Адрес',
    addressPlaceholder: 'ул. Амира Темура, 10',
    city: 'Город',
    selectCity: 'Выберите город',
    district: 'Район',
    selectDistrict: 'Выберите район',

    unitSection: 'Параметры квартиры',
    unitDesc: 'Блок, номер квартиры и этаж',
    buildingBlock: 'Блок/Корпус',
    buildingBlockPlaceholder: 'Блок A',
    unitNumber: 'Номер квартиры',
    unitNumberPlaceholder: '305',
    entrance: 'Подъезд',
    entrancePlaceholder: '1',
    floor: 'Этаж',
    totalFloors: 'Всего этажей',

    propertySection: 'Характеристики',
    propertyDesc: 'Площадь, комнаты и тип',
    propertyType: 'Тип объекта',
    rooms: 'Комнат',
    bedrooms: 'Спален',
    bathrooms: 'Санузлов',
    area: 'Общая площадь',
    areaUnit: 'м²',
    livingArea: 'Жилая площадь',
    kitchenArea: 'Площадь кухни',

    priceSection: 'Цена и оплата',
    priceDesc: 'Стоимость и условия оплаты',
    price: 'Цена',
    currency: 'Валюта',
    listingType: 'Тип объявления',
    paymentPlan: 'Рассрочка доступна',
    downPayment: 'Первоначальный взнос',
    installmentMonths: 'Срок рассрочки (мес.)',

    deliverySection: 'Сроки сдачи',
    deliveryDesc: 'Дата готовности объекта',
    estimatedDelivery: 'Планируемая дата сдачи',
    isReady: 'Сдан и готов к заселению',

    // Enums
    propertyTypes: {
      APARTMENT: 'Квартира',
      HOUSE: 'Дом',
      CONDO: 'Кондо',
      TOWNHOUSE: 'Таунхаус',
      LAND: 'Участок',
      COMMERCIAL: 'Коммерция',
    },
    listingTypes: {
      SALE: 'Продажа',
      RENT_LONG: 'Долгосрочная аренда',
      RENT_DAILY: 'Посуточная аренда',
    },
    currencies: {
      YE: 'у.е.',
      UZS: 'UZS',
    },

    // Actions
    cancel: 'Отмена',
    create: 'Создать объект',
    creating: 'Создание...',
    error: 'Ошибка при создании объекта',
  },
  uz: {
    title: 'Yangi obyekt',
    subtitle: 'Loyihangizga yangi kvartira yoki xona qoshing',
    back: 'Obyektlarga qaytish',

    projectSection: 'Loyiha',
    projectDesc: 'Obyekt tegishli bolgan loyihani tanlang',
    selectProject: 'Loyihani tanlang',
    noProjects: 'Loyihalar yoq. Avval loyiha yarating.',

    basicSection: 'Asosiy malumotlar',
    basicDesc: 'Obyekt nomi va tavsifi',
    titleRu: 'Nom (RU)',
    titleRuPlaceholder: 'Parkga qaraydigan 3 xonali kvartira',
    titleUz: 'Nom (UZ)',
    titleUzPlaceholder: 'Parkga qaraydigan 3 xonali kvartira',
    description: 'Tavsif',
    descriptionPlaceholder: 'Obyektning batafsil tavsifi...',

    locationSection: 'Joylashuv',
    locationDesc: 'Obyekt manzili va joylashuvi',
    address: 'Manzil',
    addressPlaceholder: 'Amir Temur kochasi, 10',
    city: 'Shahar',
    selectCity: 'Shaharni tanlang',
    district: 'Tuman',
    selectDistrict: 'Tumanni tanlang',

    unitSection: 'Kvartira parametrlari',
    unitDesc: 'Blok, kvartira raqami va qavat',
    buildingBlock: 'Blok/Korpus',
    buildingBlockPlaceholder: 'A Blok',
    unitNumber: 'Kvartira raqami',
    unitNumberPlaceholder: '305',
    entrance: 'Kirish',
    entrancePlaceholder: '1',
    floor: 'Qavat',
    totalFloors: 'Jami qavatlar',

    propertySection: 'Xususiyatlar',
    propertyDesc: 'Maydon, xonalar va turi',
    propertyType: 'Obyekt turi',
    rooms: 'Xonalar',
    bedrooms: 'Yotoqxonalar',
    bathrooms: 'Hammomlar',
    area: 'Umumiy maydon',
    areaUnit: 'm²',
    livingArea: 'Yashash maydoni',
    kitchenArea: 'Oshxona maydoni',

    priceSection: 'Narx va tolov',
    priceDesc: 'Narx va tolov shartlari',
    price: 'Narx',
    currency: 'Valyuta',
    listingType: 'Elon turi',
    paymentPlan: 'Bolib tolash mavjud',
    downPayment: 'Dastlabki tolov',
    installmentMonths: 'Bolib tolash muddati (oy)',

    deliverySection: 'Topshirish muddati',
    deliveryDesc: 'Obyektning tayyor bolish sanasi',
    estimatedDelivery: 'Rejalashtirilgan topshirish sanasi',
    isReady: 'Topshirilgan va yashashga tayyor',

    propertyTypes: {
      APARTMENT: 'Kvartira',
      HOUSE: 'Uy',
      CONDO: 'Kondo',
      TOWNHOUSE: 'Taunxaus',
      LAND: 'Yer',
      COMMERCIAL: 'Tijorat',
    },
    listingTypes: {
      SALE: 'Sotish',
      RENT_LONG: 'Uzoq muddatli ijara',
      RENT_DAILY: 'Kunlik ijara',
    },
    currencies: {
      YE: 'y.e.',
      UZS: 'UZS',
    },

    cancel: 'Bekor qilish',
    create: 'Obyekt yaratish',
    creating: 'Yaratilmoqda...',
    error: 'Obyektni yaratishda xatolik',
  },
};

export default function NewPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ru';
  const t = translations[locale as keyof typeof translations] || translations.ru;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [formData, setFormData] = useState({
    developerProjectId: '',
    title: '',
    titleUz: '',
    description: '',
    address: '',
    city: '',
    district: '',
    buildingBlock: '',
    unitNumber: '',
    entrance: '',
    floor: '',
    totalFloors: '',
    propertyType: 'APARTMENT',
    rooms: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    livingArea: '',
    kitchenArea: '',
    price: '',
    currency: 'YE',
    listingType: 'SALE',
    paymentPlanAvailable: false,
    downPaymentPercent: '',
    installmentMonths: '',
    estimatedDelivery: '',
    isReadyToMoveIn: false,
  });

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await api.get<DeveloperProject[]>('/developer-projects');
        setProjects(data);
      } catch (err) {
        console.error('Error loading projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || formData.title,
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        marketType: 'NEW_BUILDING',
        address: formData.address,
        city: formData.city,
        district: formData.district || undefined,
        price: parseFloat(formData.price),
        currency: formData.currency,
        rooms: formData.rooms ? parseInt(formData.rooms, 10) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms, 10) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        livingArea: formData.livingArea ? parseFloat(formData.livingArea) : undefined,
        kitchenArea: formData.kitchenArea ? parseFloat(formData.kitchenArea) : undefined,
        floor: formData.floor ? parseInt(formData.floor, 10) : undefined,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors, 10) : undefined,
        developerProjectId: formData.developerProjectId || undefined,
        buildingBlock: formData.buildingBlock || undefined,
        unitNumber: formData.unitNumber || undefined,
        entrance: formData.entrance || undefined,
        paymentPlanAvailable: formData.paymentPlanAvailable,
        downPaymentPercent: formData.downPaymentPercent ? parseInt(formData.downPaymentPercent, 10) : undefined,
        installmentMonths: formData.installmentMonths ? parseInt(formData.installmentMonths, 10) : undefined,
        estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery).toISOString() : undefined,
        isReadyToMoveIn: formData.isReadyToMoveIn,
        listingSource: 'DEVELOPER_PROJECT',
      };

      await api.post('/properties', payload);
      router.push('/developer/projects');
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none";
  const disabledInputClass = "block w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-60";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/developer/projects"
          className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
          {t.back}
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t.projectSection}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">{t.projectDesc}</p>
          </div>
          <div className="p-6">
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-gray-500">{t.noProjects}</p>
            ) : (
              <select
                name="developerProjectId"
                value={formData.developerProjectId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">{t.selectProject}</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {locale === 'uz' && project.nameUz ? project.nameUz : project.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t.basicSection}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">{t.basicDesc}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <span>🇷🇺</span> {t.titleRu} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder={t.titleRuPlaceholder}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <span>🇺🇿</span> {t.titleUz}
                </label>
                <input
                  type="text"
                  name="titleUz"
                  value={formData.titleUz}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={t.titleUzPlaceholder}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.description}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={inputClass + " resize-none"}
                placeholder={t.descriptionPlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t.locationSection}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">{t.locationDesc}</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.address} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder={t.addressPlaceholder}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.city} <span className="text-red-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">{t.selectCity}</option>
                  <option value="Ташкент">Ташкент</option>
                  <option value="Самарканд">Самарканд</option>
                  <option value="Бухара">Бухара</option>
                  <option value="Наманган">Наманган</option>
                  <option value="Андижан">Андижан</option>
                  <option value="Фергана">Фергана</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.district}
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  disabled={!formData.city}
                  className={disabledInputClass}
                >
                  <option value="">{t.selectDistrict}</option>
                  {formData.city === 'Ташкент' && (
                    <>
                      <option value="Юнусабад">Юнусабад</option>
                      <option value="Чиланзар">Чиланзар</option>
                      <option value="Мирзо Улугбек">Мирзо Улугбек</option>
                      <option value="Яккасарай">Яккасарай</option>
                      <option value="Сергели">Сергели</option>
                      <option value="Шайхантахур">Шайхантахур</option>
                      <option value="Мирабад">Мирабад</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Details */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t.unitSection}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">{t.unitDesc}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.buildingBlock}
                </label>
                <input
                  type="text"
                  name="buildingBlock"
                  value={formData.buildingBlock}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={t.buildingBlockPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.unitNumber}
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={t.unitNumberPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.floor}
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  min="1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.totalFloors}
                </label>
                <input
                  type="number"
                  name="totalFloors"
                  value={formData.totalFloors}
                  onChange={handleChange}
                  min="1"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t.propertySection}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">{t.propertyDesc}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.propertyType}
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {Object.entries(t.propertyTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.rooms}
                </label>
                <input
                  type="number"
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleChange}
                  min="1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.bedrooms}
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.bathrooms}
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.area} ({t.areaUnit}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.livingArea} ({t.areaUnit})
                </label>
                <input
                  type="number"
                  name="livingArea"
                  value={formData.livingArea}
                  onChange={handleChange}
                  min="1"
                  step="0.1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.kitchenArea} ({t.areaUnit})
                </label>
                <input
                  type="number"
                  name="kitchenArea"
                  value={formData.kitchenArea}
                  onChange={handleChange}
                  min="1"
                  step="0.1"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t.priceSection}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">{t.priceDesc}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.price} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.currency}
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {Object.entries(t.currencies).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.listingType}
                </label>
                <select
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {Object.entries(t.listingTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Plan */}
            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="paymentPlanAvailable"
                  checked={formData.paymentPlanAvailable}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{t.paymentPlan}</span>
                </div>
              </label>

              {formData.paymentPlanAvailable && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4 ml-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.downPayment} (%)
                    </label>
                    <input
                      type="number"
                      name="downPaymentPercent"
                      value={formData.downPaymentPercent}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className={inputClass}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.installmentMonths}
                    </label>
                    <input
                      type="number"
                      name="installmentMonths"
                      value={formData.installmentMonths}
                      onChange={handleChange}
                      min="1"
                      className={inputClass}
                      placeholder="12"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t.deliverySection}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">{t.deliveryDesc}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.estimatedDelivery}
                </label>
                <input
                  type="date"
                  name="estimatedDelivery"
                  value={formData.estimatedDelivery}
                  onChange={handleChange}
                  disabled={formData.isReadyToMoveIn}
                  className={disabledInputClass}
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isReadyToMoveIn"
                    checked={formData.isReadyToMoveIn}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">{t.isReady}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <Link
            href="/developer/projects"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            {t.cancel}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.creating}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {t.create}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
