'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@repo/ui';
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react';
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

const STEPS = [
  { number: 1, title: 'Тип', description: 'Выберите тип недвижимости' },
  { number: 2, title: 'Местоположение', description: 'Укажите адрес' },
  { number: 3, title: 'Основная информация', description: 'Цена и параметры' },
  { number: 4, title: 'Характеристики', description: 'Детали здания' },
  { number: 5, title: 'Фото и описание', description: 'Загрузите фото' },
  { number: 6, title: 'Проверка', description: 'Проверьте данные' },
];

const INITIAL_FORM_DATA: WizardFormData = {
  propertyType: '',
  listingType: 'SALE',
  address: '',
  city: 'Ташкент',
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
};

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
    console.error('Failed to decode token:', e);
    return null;
  }
};

// Helper function to get user-specific draft key
const getDraftStorageKey = (): string | null => {
  const userId = getUserIdFromToken();
  return userId ? `property_creation_draft_${userId}` : null;
};

export default function PropertyCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftKey = getDraftStorageKey();
    if (!draftKey) return; // No user logged in, skip draft loading

    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const shouldRestore = window.confirm(
          'Найден сохраненный черновик. Хотите продолжить с того места, где остановились?'
        );
        if (shouldRestore) {
          setFormData(draft.formData);
          setCurrentStep(draft.currentStep);
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
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
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
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
          newErrors.propertyType = 'Выберите тип недвижимости';
        }
        if (!formData.listingType) {
          newErrors.listingType = 'Выберите тип объявления';
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
          newErrors.price = 'Укажите корректную цену';
        }
        if (!formData.area || parseFloat(formData.area) <= 0) {
          newErrors.area = 'Укажите площадь больше 0 м²';
        }
        break;

      case 5:
        if (formData.images.length === 0) {
          newErrors.images = 'Загрузите хотя бы одно фото';
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
    if (!validateStep(5)) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          area: parseFloat(formData.area),
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          floor: formData.floor ? parseInt(formData.floor) : null,
          totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : null,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
          livingArea: formData.livingArea ? parseFloat(formData.livingArea) : null,
          kitchenArea: formData.kitchenArea ? parseFloat(formData.kitchenArea) : null,
          ceilingHeight: formData.ceilingHeight ? parseFloat(formData.ceilingHeight) : null,
          parking: formData.parking ? parseInt(formData.parking) : null,
          balcony: formData.balcony ? parseInt(formData.balcony) : null,
          loggia: formData.loggia ? parseInt(formData.loggia) : null,
          metroDistance: formData.metroDistance ? parseInt(formData.metroDistance) : null,
          elevatorPassenger: formData.elevatorPassenger ? parseInt(formData.elevatorPassenger) : null,
          elevatorCargo: formData.elevatorCargo ? parseInt(formData.elevatorCargo) : null,
          rooms: formData.rooms ? parseInt(formData.rooms) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create property');
      }

      const property = await response.json();

      // Clear draft on success
      const draftKey = getDraftStorageKey();
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }

      // Redirect to property page
      router.push(`/properties/${property.id}`);
    } catch (error) {
      console.error('Error creating property:', error);
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

        {/* Step Indicators */}
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

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>

          <Button
            variant="ghost"
            onClick={saveDraft}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Сохранить черновик
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="gap-2">
              Далее
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>Публикация...</>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Опубликовать
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
