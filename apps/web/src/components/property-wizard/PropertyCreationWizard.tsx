'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@repo/ui';
import { ArrowLeft, ArrowRight, Save, Check, Trash2, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Step1PropertyType from './steps/Step1PropertyType';
import Step2Location from './steps/Step2Location';
import Step3BasicInfo from './steps/Step3BasicInfo';
import Step4BuildingFeatures from './steps/Step4BuildingFeatures';
import Step5PhotosDescription from './steps/Step5PhotosDescription';
import Step6Review from './steps/Step6Review';

export interface WizardFormData {
  // Step 1: Property Type
  propertyType: string;
  listingType: string;
  marketType: string; // NEW_BUILDING or SECONDARY (mainly for apartments)

  // Step 2: Location
  address: string;
  city: string;
  district: string;
  mahalla: string;
  nearestMetro: string;
  metroDistance: string;
  latitude?: number;
  longitude?: number;

  // Step 3: Basic Info
  price: string;
  currency: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  totalFloors: string;
  rooms: string;

  // Step 4: Building & Features
  buildingType: string;
  buildingClass: string;
  yearBuilt: string;
  renovation: string;
  livingArea: string;
  kitchenArea: string;
  ceilingHeight: string;
  parking: string;
  parkingType: string;
  balcony: string;
  loggia: string;
  elevatorPassenger: string;
  elevatorCargo: string;
  hasGarbageChute: boolean;
  hasConcierge: boolean;
  hasGatedArea: boolean;
  windowView: string;
  bathroomType: string;
  furnished: string;

  // Step 5: Photos & Description
  images: string[];
  title: string;
  description: string;
}

// Helper function to get user ID from JWT token
const getUserIdFromToken = (): string | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Decode JWT token (format: header.payload.signature)
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload.sub || decodedPayload.userId || null;
  } catch (e) {
    return null;
  }
};

// Helper function to get user-specific draft key
const getDraftStorageKey = (): string | null => {
  const userId = getUserIdFromToken();
  return userId ? `property_creation_draft_${userId}` : null;
};

export default function PropertyCreationWizard() {
  const t = useTranslations('wizard');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Define steps using translations
  const STEPS = [
    { number: 1, title: t('steps.1.title'), description: t('steps.1.description') },
    { number: 2, title: t('steps.2.title'), description: t('steps.2.description') },
    { number: 3, title: t('steps.3.title'), description: t('steps.3.description') },
    { number: 4, title: t('steps.4.title'), description: t('steps.4.description') },
    { number: 5, title: t('steps.5.title'), description: t('steps.5.description') },
    { number: 6, title: t('steps.6.title'), description: t('steps.6.description') },
  ];

  // Initial form data using translation for city
  const getInitialFormData = (): WizardFormData => ({
    propertyType: '',
    listingType: 'SALE',
    marketType: '',
    address: '',
    city: t('defaultCity'),
    district: '',
    mahalla: '',
    nearestMetro: '',
    metroDistance: '',
    latitude: undefined,
    longitude: undefined,
    price: '',
    currency: 'YE',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    totalFloors: '',
    rooms: '',
    buildingType: '',
    buildingClass: '',
    yearBuilt: '',
    renovation: '',
    livingArea: '',
    kitchenArea: '',
    ceilingHeight: '',
    parking: '',
    parkingType: '',
    balcony: '',
    loggia: '',
    elevatorPassenger: '',
    elevatorCargo: '',
    hasGarbageChute: false,
    hasConcierge: false,
    hasGatedArea: false,
    windowView: '',
    bathroomType: '',
    furnished: '',
    images: [],
    title: '',
    description: '',
  });

  const [formData, setFormData] = useState<WizardFormData>(getInitialFormData());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ step: number; field: string; message: string }>>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string>('');
  const [showDraftDropdown, setShowDraftDropdown] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftKey = getDraftStorageKey();
    if (!draftKey) return; // No user logged in, skip draft loading

    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);

        // Migrate invalid enum values to match backend schema
        if (draft.formData) {
          // Currency migration: USD -> YE
          if (draft.formData.currency === 'USD') {
            draft.formData.currency = 'YE';
          }

          // ParkingType migration: GROUND -> STREET, MULTILEVEL -> MULTI_LEVEL, remove OPEN
          if (draft.formData.parkingType === 'GROUND') {
            draft.formData.parkingType = 'STREET';
          }
          if (draft.formData.parkingType === 'MULTILEVEL') {
            draft.formData.parkingType = 'MULTI_LEVEL';
          }
          if (draft.formData.parkingType === 'OPEN') {
            draft.formData.parkingType = '';
          }

          // Renovation migration: NO_RENOVATION -> NONE, DESIGN -> DESIGNER, NEEDS_RENOVATION -> NEEDS_REPAIR
          if (draft.formData.renovation === 'NO_RENOVATION') {
            draft.formData.renovation = 'NONE';
          }
          if (draft.formData.renovation === 'DESIGN') {
            draft.formData.renovation = 'DESIGNER';
          }
          if (draft.formData.renovation === 'NEEDS_RENOVATION') {
            draft.formData.renovation = 'NEEDS_REPAIR';
          }

          // BuildingType migration: MONOLITH -> MONOLITHIC, remove MONOLITH_BRICK
          if (draft.formData.buildingType === 'MONOLITH') {
            draft.formData.buildingType = 'MONOLITHIC';
          }
          if (draft.formData.buildingType === 'MONOLITH_BRICK') {
            draft.formData.buildingType = 'BRICK'; // Fallback to BRICK as closest match
          }
        }

        // Silently restore draft without confirmation
        setFormData(draft.formData);
        setCurrentStep(draft.currentStep);
      } catch (e) {
        // Silently fail - corrupted draft will be ignored
      }
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, currentStep]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDraftDropdown(false);
      }
    };

    if (showDraftDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDraftDropdown]);

  const saveDraft = () => {
    const draftKey = getDraftStorageKey();
    if (!draftKey) return; // No user logged in, skip draft saving

    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formData,
          currentStep,
          savedAt: new Date().toISOString(),
        })
      );

      // Show saved indicator
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000); // Hide after 2 seconds
    } catch (e) {
      // Silently fail - localStorage might be full or disabled
    }
  };

  const clearDraft = () => {
    setShowClearConfirm(true);
  };

  const confirmClearDraft = () => {
    const draftKey = getDraftStorageKey();
    if (draftKey) {
      localStorage.removeItem(draftKey);
      setFormData(getInitialFormData());
      setCurrentStep(1);
      setErrors({});
    }
    setShowClearConfirm(false);
  };

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setErrors({}); // Clear errors when user makes changes
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.propertyType) {
          newErrors.propertyType = t('validation.propertyType');
        }
        if (!formData.listingType) {
          newErrors.listingType = t('validation.listingType');
        }
        break;

      case 2:
        if (!formData.address) {
          newErrors.address = 'Укажите адрес';
        }
        if (!formData.city) {
          newErrors.city = 'Выберите город';
        }
        break;

      case 3:
        if (!formData.price || parseFloat(formData.price) <= 0) {
          newErrors.price = t('validation.price');
        }
        if (!formData.area || parseFloat(formData.area) <= 0) {
          newErrors.area = 'Укажите площадь больше 0 м²';
        }
        break;

      case 5:
        if (formData.images.length === 0) {
          newErrors.images = t('validation.images');
        }
        if (!formData.title || formData.title.length < 10) {
          newErrors.title = 'Заголовок должен содержать минимум 10 символов';
        }
        if (!formData.description || formData.description.length < 50) {
          newErrors.description = 'Описание должно содержать минимум 50 символов';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSteps = (): Array<{ step: number; field: string; message: string }> => {
    const allErrors: Array<{ step: number; field: string; message: string }> = [];

    // Step 1: Property Type
    if (!formData.propertyType) {
      allErrors.push({ step: 1, field: 'Тип недвижимости', message: 'Выберите тип недвижимости' });
    }
    if (!formData.listingType) {
      allErrors.push({ step: 1, field: 'Тип объявления', message: 'Выберите тип объявления' });
    }

    // Step 2: Location
    if (!formData.address) {
      allErrors.push({ step: 2, field: 'Адрес', message: 'Укажите адрес' });
    }
    if (!formData.city) {
      allErrors.push({ step: 2, field: 'Город', message: 'Выберите город' });
    }

    // Step 3: Basic Info
    if (!formData.price || parseFloat(formData.price) <= 0) {
      allErrors.push({ step: 3, field: 'Цена', message: 'Укажите корректную цену' });
    }
    if (!formData.currency) {
      allErrors.push({ step: 3, field: 'Валюта', message: 'Выберите валюту' });
    }
    if (!formData.area || parseFloat(formData.area) <= 0) {
      allErrors.push({ step: 3, field: 'Площадь', message: 'Укажите площадь больше 0 м²' });
    }

    // Step 5: Photos & Description
    if (formData.images.length === 0) {
      allErrors.push({ step: 5, field: 'Фотографии', message: 'Загрузите хотя бы одно фото' });
    }
    if (!formData.title || formData.title.length < 10) {
      allErrors.push({ step: 5, field: 'Заголовок', message: 'Заголовок должен содержать минимум 10 символов' });
    }
    if (!formData.description || formData.description.length < 50) {
      allErrors.push({ step: 5, field: 'Описание', message: 'Описание должно содержать минимум 50 символов' });
    }

    return allErrors;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      saveDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Validate all steps before submitting
    const allErrors = validateAllSteps();

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationModal(true);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // Helper to convert empty strings to undefined
      const cleanValue = (value: any) => {
        if (value === '' || value === null) return undefined;
        return value;
      };

      // Build payload with cleaned values
      const payload = {
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        marketType: cleanValue(formData.marketType),
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,

        // Location
        address: formData.address,
        city: formData.city,
        district: cleanValue(formData.district),
        mahalla: cleanValue(formData.mahalla),
        nearestMetro: cleanValue(formData.nearestMetro),
        metroDistance: formData.metroDistance ? parseInt(formData.metroDistance) : undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,

        // Property details
        area: parseFloat(formData.area),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,

        // Building info
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        livingArea: formData.livingArea ? parseFloat(formData.livingArea) : undefined,
        kitchenArea: formData.kitchenArea ? parseFloat(formData.kitchenArea) : undefined,
        ceilingHeight: formData.ceilingHeight ? parseFloat(formData.ceilingHeight) : undefined,

        // Features
        parking: formData.parking ? parseInt(formData.parking) : undefined,
        parkingType: cleanValue(formData.parkingType),
        balcony: formData.balcony ? parseInt(formData.balcony) : undefined,
        loggia: formData.loggia ? parseInt(formData.loggia) : undefined,
        elevatorPassenger: formData.elevatorPassenger ? parseInt(formData.elevatorPassenger) : undefined,
        elevatorCargo: formData.elevatorCargo ? parseInt(formData.elevatorCargo) : undefined,

        // Building characteristics
        buildingType: cleanValue(formData.buildingType),
        buildingClass: cleanValue(formData.buildingClass),
        renovation: cleanValue(formData.renovation),
        windowView: cleanValue(formData.windowView),
        bathroomType: cleanValue(formData.bathroomType),
        furnished: cleanValue(formData.furnished),
        hasGarbageChute: formData.hasGarbageChute,
        hasConcierge: formData.hasConcierge,
        hasGatedArea: formData.hasGatedArea,

        // Images
        images: formData.images,
      };

      // Remove undefined values
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );

      // Build headers - include Authorization header only if token exists
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/properties`, {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for OAuth authentication
        body: JSON.stringify(cleanPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Show specific validation errors if available
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          alert(`Ошибка валидации:\n${errorData.errors.join('\n')}`);
        } else {
          alert(t('errors.createFailed', { message: errorData?.message || t('errors.unknownError') }));
        }
        throw new Error(errorData?.message || 'Failed to create property');
      }

      const property = await response.json();

      // Clear draft on success
      const draftKey = getDraftStorageKey();
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }

      // Show success modal instead of immediate redirect
      setCreatedPropertyId(property.id);
      setShowSuccessModal(true);
    } catch (error) {
      alert('Ошибка при создании объявления. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PropertyType formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 2:
        return <Step2Location formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 3:
        return <Step3BasicInfo formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 4:
        return <Step4BuildingFeatures formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 5:
        return <Step5PhotosDescription formData={formData} updateFormData={updateFormData} errors={errors} />;
      case 6:
        return <Step6Review formData={formData} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Создать объявление
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Шаг {currentStep} из {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Mobile Step Indicator - Compact */}
        <div className="md:hidden flex items-center justify-between mb-6 px-4 py-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            Шаг {currentStep} из {STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className={`h-2 w-2 rounded-full transition-all ${
                  step.number === currentStep
                    ? 'bg-blue-600 w-8'
                    : step.number < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Step Indicators */}
        <div className="hidden md:grid md:grid-cols-6 gap-2 mb-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={`text-center p-3 rounded-lg border-2 transition-all ${
                step.number === currentStep
                  ? 'border-blue-600 bg-blue-50'
                  : step.number < currentStep
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {step.number < currentStep ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      step.number === currentStep ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {step.number}
                  </span>
                )}
              </div>
              <div
                className={`text-xs font-medium ${
                  step.number === currentStep
                    ? 'text-blue-600'
                    : step.number < currentStep
                      ? 'text-green-600'
                      : 'text-gray-500'
                }`}
              >
                {step.title}
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-gray-600 mt-1">
                {STEPS[currentStep - 1].description}
              </p>
            </div>

            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Single Row Design */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2 px-3 md:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад</span>
          </Button>

          {/* Draft Actions Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDraftDropdown(!showDraftDropdown)}
              className="inline-flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span className="hidden xs:inline">
                {draftSaved ? 'Сохранено ✓' : 'Черновик'}
              </span>
              <span className="xs:hidden">
                {draftSaved ? '✓' : 'Сохр'}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showDraftDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDraftDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                <button
                  type="button"
                  onClick={() => {
                    saveDraft();
                    // Delay closing to show the "Saved" feedback
                    setTimeout(() => setShowDraftDropdown(false), 800);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors first:rounded-t-lg ${
                    draftSaved
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  {draftSaved ? '✓ Сохранено!' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft();
                    setShowDraftDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors last:rounded-b-lg border-t border-gray-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </button>
              </div>
            )}
          </div>

          {/* Next/Submit Button */}
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="flex-1 md:flex-auto gap-2 ml-auto">
              <span>Далее</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 md:flex-auto gap-2 ml-auto bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>Публикация...</>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Опубликовать</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Clear Draft Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Удалить черновик?
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Вы уверены, что хотите удалить черновик и начать заново? Все несохраненные данные будут потеряны.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={confirmClearDraft}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Удалить черновик
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Modal */}
        {showValidationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Заполните обязательные поля
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('errors.found', {
                        count: validationErrors.length,
                        errors: validationErrors.length === 1 ? t('errors.error_one') : t('errors.error_other')
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {STEPS.filter(step => validationErrors.some(err => err.step === step.number)).map((step) => {
                    const stepErrors = validationErrors.filter(err => err.step === step.number);
                    return (
                      <div key={step.number} className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-sm font-bold">
                            {step.number}
                          </span>
                          <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        </div>
                        <ul className="ml-8 space-y-1">
                          {stepErrors.map((error, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                              <span className="font-medium">{error.field}:</span>{' '}
                              <span className="text-gray-600">{error.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowValidationModal(false)}
                  >
                    Закрыть
                  </Button>
                  <Button
                    onClick={() => {
                      const firstErrorStep = validationErrors[0]?.step || 1;
                      setCurrentStep(firstErrorStep);
                      setShowValidationModal(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Перейти к шагу {validationErrors[0]?.step || 1}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Success Icon with Animation */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  {/* Success Message */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Объявление опубликовано!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ваше объявление успешно создано и теперь доступно для просмотра.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSuccessModal(false);
                        router.push('/');
                      }}
                      className="flex-1"
                    >
                      На главную
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSuccessModal(false);
                        router.push(`/properties/${createdPropertyId}`);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Посмотреть объявление
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
