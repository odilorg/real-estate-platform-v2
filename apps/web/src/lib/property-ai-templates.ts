/**
 * Template-Based Property AI System
 * No external APIs required - works completely offline
 * Smart content generation using rules and templates
 */

// Types
interface PropertyData {
  propertyType: 'APARTMENT' | 'HOUSE' | 'LAND' | 'COMMERCIAL';
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  district: string;
  city: string;
  price: number;
  yearBuilt?: number;
  renovation?: 'NONE' | 'COSMETIC' | 'EURO' | 'DESIGNER';
  parking?: boolean;
  balcony?: boolean;
  furnished?: 'NO' | 'PARTIAL' | 'FULL';
  nearMetro?: string;
  metroDistance?: number;
  hasPool?: boolean;
  hasGym?: boolean;
  hasSecurity?: boolean;
  hasPlayground?: boolean;
  windowView?: string;
}

/**
 * SMART TITLE GENERATOR
 * Uses conditional logic to create contextual titles
 */
export class SmartTitleGenerator {
  private property: PropertyData;

  constructor(property: PropertyData) {
    this.property = property;
  }

  generate(style: 'professional' | 'emotional' | 'urgent' | 'luxury' = 'professional'): string[] {
    const titles: string[] = [];

    switch (style) {
      case 'professional':
        titles.push(...this.getProfessionalTitles());
        break;
      case 'emotional':
        titles.push(...this.getEmotionalTitles());
        break;
      case 'urgent':
        titles.push(...this.getUrgentTitles());
        break;
      case 'luxury':
        titles.push(...this.getLuxuryTitles());
        break;
    }

    // Remove duplicates and return top 3
    return [...new Set(titles)].slice(0, 3);
  }

  private getProfessionalTitles(): string[] {
    const titles: string[] = [];
    const { property: p } = this;

    // Basic template
    if (p.propertyType === 'APARTMENT') {
      titles.push(`${p.bedrooms}-комнатная квартира, ${p.area}м², ${p.district}`);
      titles.push(`${this.getRoomText()} ${p.area}м² • ${p.floor}/${p.totalFloors} этаж • ${p.district}`);
    }

    if (p.propertyType === 'HOUSE') {
      titles.push(`Дом ${p.area}м² • ${p.bedrooms} комнат • ${p.district}`);
      titles.push(`Частный дом с ${p.bedrooms} спальнями в ${p.district}`);
    }

    // Add features-based title
    const features = this.getKeyFeatures();
    if (features.length > 0) {
      titles.push(`${this.getPropertyTypeText()} с ${features.slice(0, 2).join(', ')} • ${p.district}`);
    }

    // Location-based
    if (p.nearMetro) {
      titles.push(`${this.getRoomText()} у метро ${p.nearMetro} • ${p.area}м²`);
    }

    return titles;
  }

  private getEmotionalTitles(): string[] {
    const titles: string[] = [];
    const { property: p } = this;

    // Family-oriented
    if (p.bedrooms && p.bedrooms >= 3) {
      titles.push(`🏠 Семейное гнездышко в ${p.district} • ${p.bedrooms} комнаты`);
      titles.push(`❤️ Идеальный дом для большой семьи • ${p.area}м²`);
    }

    // Cozy smaller apartments
    if (p.bedrooms && p.bedrooms <= 2) {
      titles.push(`✨ Уютная квартира для молодой пары в ${p.district}`);
      titles.push(`🔑 Ваш первый дом мечты • ${p.area}м² • ${p.district}`);
    }

    // Renovation-based
    if (p.renovation === 'EURO' || p.renovation === 'DESIGNER') {
      titles.push(`💎 Квартира с дизайнерским ремонтом • Заезжай и живи!`);
      titles.push(`✨ Стильная квартира с евроремонтом в ${p.district}`);
    }

    // View-based
    if (p.windowView) {
      titles.push(`🌅 Квартира с потрясающим видом на ${p.windowView}`);
    }

    return titles;
  }

  private getUrgentTitles(): string[] {
    const titles: string[] = [];
    const { property: p } = this;

    titles.push(`🔥 СРОЧНАЯ ПРОДАЖА! ${this.getRoomText()} в ${p.district}`);
    titles.push(`⚡ Не упустите! ${p.area}м² по специальной цене`);
    titles.push(`🎯 Последняя квартира в доме! ${p.district} • ${p.area}м²`);

    // Price-focused
    if (p.price && p.area) {
      const pricePerSqm = Math.round(p.price / p.area);
      titles.push(`💰 Только $${pricePerSqm}/м²! ${this.getRoomText()} в ${p.district}`);
    }

    // Time-sensitive
    titles.push(`⏰ Предложение недели! ${this.getRoomText()} со скидкой`);

    return titles;
  }

  private getLuxuryTitles(): string[] {
    const titles: string[] = [];
    const { property: p } = this;

    titles.push(`🏰 Премиальная недвижимость в ${p.district}`);
    titles.push(`✨ Элитная ${p.bedrooms}-комнатная квартира • ${p.area}м²`);

    // High floor emphasis
    if (p.floor && p.totalFloors && p.floor >= p.totalFloors - 2) {
      titles.push(`🌟 Пентхаус с панорамными видами • ${p.floor} этаж`);
    }

    // Amenities
    const luxuryFeatures = [];
    if (p.hasPool) luxuryFeatures.push('бассейном');
    if (p.hasGym) luxuryFeatures.push('фитнес-центром');
    if (p.hasSecurity) luxuryFeatures.push('охраной 24/7');

    if (luxuryFeatures.length > 0) {
      titles.push(`💎 Резиденция с ${luxuryFeatures.join(', ')}`);
    }

    return titles;
  }

  private getRoomText(): string {
    if (!this.property.bedrooms) return 'Квартира';

    const roomWords: { [key: number]: string } = {
      1: 'Однокомнатная',
      2: 'Двухкомнатная',
      3: 'Трёхкомнатная',
      4: 'Четырёхкомнатная',
      5: 'Пятикомнатная'
    };

    return roomWords[this.property.bedrooms] || `${this.property.bedrooms}-комнатная`;
  }

  private getPropertyTypeText(): string {
    const types: { [key: string]: string } = {
      'APARTMENT': 'Квартира',
      'HOUSE': 'Дом',
      'LAND': 'Участок',
      'COMMERCIAL': 'Коммерческая недвижимость'
    };
    return types[this.property.propertyType] || 'Недвижимость';
  }

  private getKeyFeatures(): string[] {
    const features: string[] = [];

    if (this.property.renovation === 'EURO') features.push('евроремонтом');
    if (this.property.renovation === 'DESIGNER') features.push('дизайнерским ремонтом');
    if (this.property.parking) features.push('парковкой');
    if (this.property.balcony) features.push('балконом');
    if (this.property.furnished === 'FULL') features.push('мебелью');
    if (this.property.nearMetro) features.push(`у метро ${this.property.nearMetro}`);

    return features;
  }
}

/**
 * SMART DESCRIPTION GENERATOR
 * Creates detailed descriptions based on property features
 */
export class SmartDescriptionGenerator {
  private property: PropertyData;

  constructor(property: PropertyData) {
    this.property = property;
  }

  generate(tone: 'family' | 'investment' | 'luxury' | 'practical' = 'practical'): string {
    const sections: string[] = [];

    // Opening
    sections.push(this.getOpening(tone));

    // Main features
    sections.push(this.getMainFeatures());

    // Location benefits
    sections.push(this.getLocationBenefits());

    // Amenities
    if (this.hasAmenities()) {
      sections.push(this.getAmenities());
    }

    // Call to action
    sections.push(this.getCallToAction(tone));

    return sections.filter(s => s.length > 0).join('\n\n');
  }

  private getOpening(tone: string): string {
    const p = this.property;

    const openings = {
      family: [
        `Прекрасная возможность для семьи обрести свой уютный дом в ${p.district}!`,
        `Идеальная квартира для комфортной семейной жизни.`,
        `Создайте семейное гнездышко в этой замечательной квартире!`
      ],
      investment: [
        `Выгодная инвестиционная возможность в растущем районе ${p.district}.`,
        `Отличный вариант для инвестиций с высоким потенциалом роста.`,
        `Перспективная недвижимость для сдачи в аренду или перепродажи.`
      ],
      luxury: [
        `Эксклюзивное предложение для ценителей премиальной недвижимости.`,
        `Роскошная квартира в престижном районе ${p.district}.`,
        `Элитная недвижимость для тех, кто выбирает лучшее.`
      ],
      practical: [
        `Отличная квартира с оптимальным соотношением цена/качество.`,
        `Практичный вариант для комфортного проживания в ${p.district}.`,
        `Функциональная планировка и удобное расположение.`
      ]
    };

    const options = openings[tone as keyof typeof openings] || openings.practical;
    return options[Math.floor(Math.random() * options.length)];
  }

  private getMainFeatures(): string {
    const p = this.property;
    const features: string[] = [];

    features.push(`📐 Площадь: ${p.area} м²`);

    if (p.bedrooms) {
      features.push(`🛏 Спален: ${p.bedrooms}`);
    }

    if (p.bathrooms) {
      features.push(`🚿 Санузлов: ${p.bathrooms}`);
    }

    if (p.floor && p.totalFloors) {
      features.push(`🏢 Этаж: ${p.floor} из ${p.totalFloors}`);
    }

    if (p.yearBuilt) {
      const age = new Date().getFullYear() - p.yearBuilt;
      if (age <= 2) {
        features.push(`🆕 Новостройка (${p.yearBuilt} год)`);
      } else if (age <= 10) {
        features.push(`🏗 Год постройки: ${p.yearBuilt}`);
      }
    }

    if (p.renovation === 'EURO' || p.renovation === 'DESIGNER') {
      features.push(`✨ ${p.renovation === 'EURO' ? 'Евроремонт' : 'Дизайнерский ремонт'}`);
    }

    return features.join('\n');
  }

  private getLocationBenefits(): string {
    const p = this.property;
    const benefits: string[] = [];

    benefits.push(`📍 Расположение: ${p.district}, ${p.city}`);

    if (p.nearMetro && p.metroDistance) {
      benefits.push(`🚇 До метро "${p.nearMetro}" - ${p.metroDistance} минут пешком`);
    }

    // District-specific benefits (Tashkent example)
    const districtBenefits: { [key: string]: string[] } = {
      'Мирабадский': ['Центр города', 'Развитая инфраструктура', 'Престижный район'],
      'Юнусабадский': ['Современный район', 'Множество парков', 'Хорошие школы'],
      'Чиланзарский': ['Доступные цены', 'Метро рядом', 'Крупные торговые центры'],
      'Яккасарайский': ['Исторический центр', 'Культурные достопримечательности', 'Тихий район']
    };

    const localBenefits = districtBenefits[p.district] || ['Удобное расположение', 'Развитая инфраструктура'];
    benefits.push(`✅ ${localBenefits.join(', ')}`);

    return benefits.join('\n');
  }

  private getAmenities(): string {
    const p = this.property;
    const amenities: string[] = [];

    amenities.push('🌟 Дополнительные удобства:');

    if (p.parking) amenities.push('• Парковочное место');
    if (p.balcony) amenities.push('• Балкон/лоджия');
    if (p.furnished === 'FULL') amenities.push('• Полностью меблирована');
    if (p.furnished === 'PARTIAL') amenities.push('• Частично меблирована');
    if (p.hasPool) amenities.push('• Бассейн в комплексе');
    if (p.hasGym) amenities.push('• Фитнес-центр');
    if (p.hasSecurity) amenities.push('• Охрана и видеонаблюдение');
    if (p.hasPlayground) amenities.push('• Детская площадка');
    if (p.windowView) amenities.push(`• Вид из окон: ${p.windowView}`);

    return amenities.length > 1 ? amenities.join('\n') : '';
  }

  private getCallToAction(tone: string): string {
    const calls = {
      family: '👨‍👩‍👧‍👦 Не упустите возможность создать семейное счастье в этом прекрасном доме! Звоните прямо сейчас для организации просмотра.',
      investment: '📈 Выгодная инвестиция с гарантированным ростом стоимости. Свяжитесь с нами для получения детальной информации о доходности.',
      luxury: '💎 Эксклюзивный показ по предварительной записи. Свяжитесь с нами для организации персонального визита.',
      practical: '📞 Готова к продаже. Возможен торг. Звоните для записи на просмотр!'
    };

    return calls[tone as keyof typeof calls] || calls.practical;
  }

  private hasAmenities(): boolean {
    const p = this.property;
    return !!(p.parking || p.balcony || p.furnished !== 'NO' ||
             p.hasPool || p.hasGym || p.hasSecurity || p.hasPlayground || p.windowView);
  }
}

/**
 * PRICE CALCULATOR
 * Simple price suggestions based on user input
 */
export class PriceCalculator {
  // Base prices per m² for different districts (example for Tashkent)
  private static districtPrices: { [key: string]: number } = {
    'Мирабадский': 1500,
    'Яккасарайский': 1400,
    'Юнусабадский': 1300,
    'Шайхантахурский': 1200,
    'Чиланзарский': 1100,
    'Сергелийский': 1000,
    'Алмазарский': 1050,
    'Бектемирский': 950,
    'Учтепинский': 1000,
    'Яшнабадский': 900,
    'Мирзо-Улугбекский': 1250,
    'default': 1100
  };

  static calculatePrice(property: PropertyData): {
    estimated: number;
    min: number;
    max: number;
    pricePerSqm: number;
    factors: Array<{ name: string; impact: number; reason: string }>;
  } {
    const basePrice = this.districtPrices[property.district] || this.districtPrices.default;
    let adjustedPrice = basePrice;
    const factors: Array<{ name: string; impact: number; reason: string }> = [];

    // Property type adjustment
    if (property.propertyType === 'HOUSE') {
      adjustedPrice *= 1.2;
      factors.push({ name: 'Тип: Дом', impact: 0.2, reason: 'Дома дороже квартир' });
    }

    // Floor adjustment (for apartments)
    if (property.propertyType === 'APARTMENT' && property.floor && property.totalFloors) {
      if (property.floor === 1) {
        adjustedPrice *= 0.95;
        factors.push({ name: 'Первый этаж', impact: -0.05, reason: 'Снижение цены' });
      } else if (property.floor === property.totalFloors) {
        adjustedPrice *= 0.97;
        factors.push({ name: 'Последний этаж', impact: -0.03, reason: 'Небольшое снижение' });
      } else if (property.floor >= 3 && property.floor <= 7) {
        adjustedPrice *= 1.05;
        factors.push({ name: 'Удобный этаж', impact: 0.05, reason: 'Предпочтительные этажи' });
      }
    }

    // Renovation adjustment
    if (property.renovation === 'EURO') {
      adjustedPrice *= 1.15;
      factors.push({ name: 'Евроремонт', impact: 0.15, reason: 'Премиум отделка' });
    } else if (property.renovation === 'DESIGNER') {
      adjustedPrice *= 1.25;
      factors.push({ name: 'Дизайнерский ремонт', impact: 0.25, reason: 'Эксклюзивная отделка' });
    } else if (property.renovation === 'COSMETIC') {
      adjustedPrice *= 1.05;
      factors.push({ name: 'Косметический ремонт', impact: 0.05, reason: 'Базовая отделка' });
    }

    // Year built adjustment
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      if (age <= 2) {
        adjustedPrice *= 1.1;
        factors.push({ name: 'Новостройка', impact: 0.1, reason: 'Новое здание' });
      } else if (age > 20) {
        adjustedPrice *= 0.95;
        factors.push({ name: 'Старое здание', impact: -0.05, reason: 'Требует обновления' });
      }
    }

    // Metro proximity
    if (property.nearMetro && property.metroDistance) {
      if (property.metroDistance <= 5) {
        adjustedPrice *= 1.1;
        factors.push({ name: 'Близко к метро', impact: 0.1, reason: `${property.metroDistance} мин пешком` });
      } else if (property.metroDistance <= 10) {
        adjustedPrice *= 1.05;
        factors.push({ name: 'Рядом с метро', impact: 0.05, reason: `${property.metroDistance} мин пешком` });
      }
    }

    // Additional amenities
    if (property.parking) {
      adjustedPrice *= 1.05;
      factors.push({ name: 'Парковка', impact: 0.05, reason: 'Есть парковочное место' });
    }

    if (property.furnished === 'FULL') {
      adjustedPrice *= 1.1;
      factors.push({ name: 'С мебелью', impact: 0.1, reason: 'Полностью меблирована' });
    }

    const totalPrice = Math.round(adjustedPrice * property.area);

    return {
      estimated: totalPrice,
      min: Math.round(totalPrice * 0.9),
      max: Math.round(totalPrice * 1.1),
      pricePerSqm: Math.round(adjustedPrice),
      factors
    };
  }

  static getQuickSalePrice(normalPrice: number): number {
    return Math.round(normalPrice * 0.92); // 8% discount for quick sale
  }

  static getPremiumPrice(normalPrice: number): number {
    return Math.round(normalPrice * 1.08); // 8% premium for patient sellers
  }
}

/**
 * PHOTO QUALITY ANALYZER
 * Analyzes photos without AI - using basic image properties
 */
export class PhotoQualityAnalyzer {
  static analyzeImage(imageFile: File): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const analysis = this.performAnalysis(img, imageFile);
          resolve(analysis);
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(imageFile);
    });
  }

  private static performAnalysis(img: HTMLImageElement, file: File) {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check resolution
    if (img.width < 800 || img.height < 600) {
      score -= 30;
      issues.push('Низкое разрешение');
      suggestions.push('Используйте фото минимум 800x600 пикселей');
    } else if (img.width < 1200) {
      score -= 10;
      issues.push('Среднее разрешение');
      suggestions.push('Рекомендуем фото от 1200px по ширине');
    }

    // Check aspect ratio
    const aspectRatio = img.width / img.height;
    if (aspectRatio < 1.2 || aspectRatio > 1.8) {
      score -= 10;
      issues.push('Необычные пропорции');
      suggestions.push('Используйте горизонтальную ориентацию 16:9 или 4:3');
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 10) {
      score -= 20;
      issues.push('Слишком большой файл');
      suggestions.push('Оптимизируйте фото до 5MB');
    } else if (sizeMB < 0.1) {
      score -= 20;
      issues.push('Слишком сжатое фото');
      suggestions.push('Используйте более качественные фото');
    }

    // Determine quality level
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) {
      quality = 'excellent';
      if (suggestions.length === 0) {
        suggestions.push('Отличное качество фото!');
      }
    } else if (score >= 75) {
      quality = 'good';
      if (suggestions.length === 0) {
        suggestions.push('Хорошее качество, можно улучшить');
      }
    } else if (score >= 60) {
      quality = 'fair';
    } else {
      quality = 'poor';
      suggestions.push('Рекомендуем переснять фото');
    }

    return { quality, score, issues, suggestions };
  }

  // Guess room type based on filename or basic heuristics
  static guessRoomType(filename: string): string {
    const name = filename.toLowerCase();

    const roomTypes: { [key: string]: string[] } = {
      'Гостиная': ['living', 'гостиная', 'зал', 'salon'],
      'Спальня': ['bedroom', 'спальня', 'bed'],
      'Кухня': ['kitchen', 'кухня', 'cook'],
      'Ванная': ['bathroom', 'ванная', 'toilet', 'wc', 'санузел'],
      'Балкон': ['balcony', 'балкон', 'лоджия'],
      'Коридор': ['corridor', 'коридор', 'hall', 'прихожая'],
      'Детская': ['kids', 'детская', 'children']
    };

    for (const [room, keywords] of Object.entries(roomTypes)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return room;
      }
    }

    // Default based on order
    const orderGuess = ['Гостиная', 'Спальня', 'Кухня', 'Ванная', 'Балкон'];
    return orderGuess[Math.floor(Math.random() * orderGuess.length)];
  }
}

/**
 * USAGE EXAMPLE
 */
export function generatePropertyContent(propertyData: PropertyData) {
  // Generate titles
  const titleGen = new SmartTitleGenerator(propertyData);
  const professionalTitles = titleGen.generate('professional');
  const emotionalTitles = titleGen.generate('emotional');

  // Generate description
  const descGen = new SmartDescriptionGenerator(propertyData);
  const familyDescription = descGen.generate('family');

  // Calculate price
  const priceAnalysis = PriceCalculator.calculatePrice(propertyData);

  return {
    titles: {
      professional: professionalTitles,
      emotional: emotionalTitles
    },
    description: familyDescription,
    pricing: {
      suggested: priceAnalysis.estimated,
      range: {
        min: priceAnalysis.min,
        max: priceAnalysis.max
      },
      strategies: {
        quick: PriceCalculator.getQuickSalePrice(priceAnalysis.estimated),
        optimal: priceAnalysis.estimated,
        premium: PriceCalculator.getPremiumPrice(priceAnalysis.estimated)
      },
      factors: priceAnalysis.factors
    }
  };
}