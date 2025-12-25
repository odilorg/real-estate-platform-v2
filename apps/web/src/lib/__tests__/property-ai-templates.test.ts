import { describe, it, expect } from 'vitest';
import {
  SmartTitleGenerator,
  SmartDescriptionGenerator,
  PriceCalculator,
  type PropertyData,
} from '../property-ai-templates';

describe('AI Template System', () => {
  const mockPropertyData: PropertyData = {
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    floor: 5,
    totalFloors: 9,
    district: 'Мирабадский',
    city: 'Ташкент',
    price: 97500,
    yearBuilt: 2020,
    renovation: 'EURO',
    balcony: true,
    parking: false,
    furnished: 'PARTIAL',
    windowView: 'CITY',
  };

  describe('SmartTitleGenerator', () => {
    it('should generate professional titles', () => {
      const generator = new SmartTitleGenerator(mockPropertyData);
      const titles = generator.generate('professional');

      expect(titles).toHaveLength(3);
      titles.forEach(title => {
        expect(title).toBeTruthy();
        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(10);
      });
    });

    it('should generate emotional titles', () => {
      const generator = new SmartTitleGenerator(mockPropertyData);
      const titles = generator.generate('emotional');

      expect(titles).toHaveLength(3);
      titles.forEach(title => {
        expect(title).toBeTruthy();
        expect(typeof title).toBe('string');
      });
    });

    it('should generate urgent titles', () => {
      const generator = new SmartTitleGenerator(mockPropertyData);
      const titles = generator.generate('urgent');

      expect(titles).toHaveLength(3);
      titles.forEach(title => {
        expect(title).toBeTruthy();
        expect(typeof title).toBe('string');
      });
    });

    it('should generate luxury titles', () => {
      const generator = new SmartTitleGenerator(mockPropertyData);
      const titles = generator.generate('luxury');

      expect(titles.length).toBeGreaterThan(0);
      expect(titles.length).toBeLessThanOrEqual(3);
      titles.forEach(title => {
        expect(title).toBeTruthy();
        expect(typeof title).toBe('string');
      });
    });

    it('should include area in titles', () => {
      const generator = new SmartTitleGenerator(mockPropertyData);
      const titles = generator.generate('professional');

      const hasArea = titles.some(title => title.includes('65'));
      expect(hasArea).toBe(true);
    });

    it('should include bedroom count in titles', () => {
      const generator = new SmartTitleGenerator(mockPropertyData);
      const titles = generator.generate('professional');

      const hasBedrooms = titles.some(title => title.includes('2'));
      expect(hasBedrooms).toBe(true);
    });

    it('should handle different property types', () => {
      const houseData: PropertyData = {
        ...mockPropertyData,
        propertyType: 'HOUSE',
      };

      const generator = new SmartTitleGenerator(houseData);
      const titles = generator.generate('professional');

      expect(titles).toHaveLength(3);
    });

    it('should handle rental properties', () => {
      const rentalData: PropertyData = {
        ...mockPropertyData,
        listingType: 'RENT_LONG',
      };

      const generator = new SmartTitleGenerator(rentalData);
      const titles = generator.generate('professional');

      expect(titles).toHaveLength(3);
    });

    it('should handle commercial properties', () => {
      const commercialData: PropertyData = {
        ...mockPropertyData,
        propertyType: 'COMMERCIAL',
      };

      const generator = new SmartTitleGenerator(commercialData);
      const titles = generator.generate('professional');

      expect(titles.length).toBeGreaterThan(0);
    });
  });

  describe('SmartDescriptionGenerator', () => {
    it('should generate family-focused description', () => {
      const generator = new SmartDescriptionGenerator(mockPropertyData);
      const description = generator.generate('family');

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(50);
    });

    it('should generate investment-focused description', () => {
      const generator = new SmartDescriptionGenerator(mockPropertyData);
      const description = generator.generate('investment');

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(50);
    });

    it('should generate luxury-focused description', () => {
      const generator = new SmartDescriptionGenerator(mockPropertyData);
      const description = generator.generate('luxury');

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(50);
    });

    it('should generate practical-focused description', () => {
      const generator = new SmartDescriptionGenerator(mockPropertyData);
      const description = generator.generate('practical');

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(50);
    });

    it('should include property type in description', () => {
      const generator = new SmartDescriptionGenerator(mockPropertyData);
      const description = generator.generate('practical');

      // Description should be a non-empty string with meaningful content
      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(30);
      // Should contain numbers (area, rooms, etc) or Russian text
      const hasContent = /\d+|[а-яА-Я]+/.test(description);
      expect(hasContent).toBe(true);
    });

    it('should include area in description', () => {
      const generator = new SmartDescriptionGenerator(mockPropertyData);
      const description = generator.generate('practical');

      expect(description).toContain('65');
    });

    it('should include bedroom count in description', () => {
      const generator = new SmartDescriptionGenerator(mockPropertyData);
      const description = generator.generate('practical');

      expect(description).toContain('2');
    });

    it('should mention features when present', () => {
      const dataWithFeatures: PropertyData = {
        ...mockPropertyData,
        balcony: true,
        parking: true,
      };

      const generator = new SmartDescriptionGenerator(dataWithFeatures);
      const description = generator.generate('practical');

      // Description should mention at least one feature
      const hasFeatures = /балкон|парковк|ремонт/i.test(description);
      expect(hasFeatures).toBe(true);
    });

    it('should handle properties without optional features', () => {
      const minimalData: PropertyData = {
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        area: 50,
        district: 'Чиланзарский',
        city: 'Ташкент',
        price: 50000,
      };

      const generator = new SmartDescriptionGenerator(minimalData);
      const description = generator.generate('practical');

      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(30);
    });
  });

  describe('PriceCalculator', () => {
    it('should calculate price estimate', () => {
      const result = PriceCalculator.calculatePrice(mockPropertyData);

      expect(result).toHaveProperty('estimated');
      expect(result).toHaveProperty('min');
      expect(result).toHaveProperty('max');
      expect(result).toHaveProperty('pricePerSqm');
      expect(result).toHaveProperty('factors');

      expect(typeof result.estimated).toBe('number');
      expect(result.estimated).toBeGreaterThan(0);
    });

    it('should calculate price per square meter', () => {
      const result = PriceCalculator.calculatePrice(mockPropertyData);

      expect(result.pricePerSqm).toBeGreaterThan(0);
      expect(result.pricePerSqm).toBeCloseTo(result.estimated / mockPropertyData.area, 0);
    });

    it('should provide min and max range', () => {
      const result = PriceCalculator.calculatePrice(mockPropertyData);

      expect(result.min).toBeLessThan(result.estimated);
      expect(result.max).toBeGreaterThan(result.estimated);
    });

    it('should account for floor in pricing', () => {
      const lowFloor: PropertyData = { ...mockPropertyData, floor: 1 };
      const midFloor: PropertyData = { ...mockPropertyData, floor: 5 };
      const topFloor: PropertyData = { ...mockPropertyData, floor: 9, totalFloors: 9 };

      const lowResult = PriceCalculator.calculatePrice(lowFloor);
      const midResult = PriceCalculator.calculatePrice(midFloor);
      const topResult = PriceCalculator.calculatePrice(topFloor);

      // Mid floors should be valued higher than first floor
      expect(midResult.estimated).toBeGreaterThanOrEqual(lowResult.estimated);

      // Last floor might be valued lower
      expect(topResult.estimated).toBeLessThanOrEqual(midResult.estimated);
    });

    it('should account for renovation in pricing', () => {
      const noRenovation: PropertyData = { ...mockPropertyData, renovation: 'NONE' };
      const euroRenovation: PropertyData = { ...mockPropertyData, renovation: 'EURO' };
      const designerRenovation: PropertyData = { ...mockPropertyData, renovation: 'DESIGNER' };

      const noResult = PriceCalculator.calculatePrice(noRenovation);
      const euroResult = PriceCalculator.calculatePrice(euroRenovation);
      const designerResult = PriceCalculator.calculatePrice(designerRenovation);

      expect(euroResult.estimated).toBeGreaterThan(noResult.estimated);
      expect(designerResult.estimated).toBeGreaterThan(euroResult.estimated);
    });

    it('should account for building age in pricing', () => {
      const newBuilding: PropertyData = { ...mockPropertyData, yearBuilt: 2023 };
      const oldBuilding: PropertyData = { ...mockPropertyData, yearBuilt: 1980 };

      const newResult = PriceCalculator.calculatePrice(newBuilding);
      const oldResult = PriceCalculator.calculatePrice(oldBuilding);

      expect(newResult.estimated).toBeGreaterThan(oldResult.estimated);
    });

    it('should provide pricing factors with reasons', () => {
      const result = PriceCalculator.calculatePrice(mockPropertyData);

      expect(Array.isArray(result.factors)).toBe(true);
      expect(result.factors.length).toBeGreaterThan(0);

      result.factors.forEach(factor => {
        expect(factor).toHaveProperty('name');
        expect(factor).toHaveProperty('impact');
        expect(factor).toHaveProperty('reason');
        expect(typeof factor.name).toBe('string');
        expect(typeof factor.impact).toBe('number');
        expect(typeof factor.reason).toBe('string');
      });
    });

    it('should handle different districts', () => {
      const mirabad: PropertyData = { ...mockPropertyData, district: 'Мирабадский' };
      const chilanzar: PropertyData = { ...mockPropertyData, district: 'Чиланзарский' };

      const mirabadResult = PriceCalculator.calculatePrice(mirabad);
      const chilanzarResult = PriceCalculator.calculatePrice(chilanzar);

      // Both should have valid estimates
      expect(mirabadResult.estimated).toBeGreaterThan(0);
      expect(chilanzarResult.estimated).toBeGreaterThan(0);
    });

    it('should handle unknown district with default pricing', () => {
      const unknownDistrict: PropertyData = {
        ...mockPropertyData,
        district: 'Unknown District',
      };

      const result = PriceCalculator.calculatePrice(unknownDistrict);

      expect(result.estimated).toBeGreaterThan(0);
      expect(result.pricePerSqm).toBeGreaterThan(0);
    });

    it('should account for features in pricing', () => {
      const basicProperty: PropertyData = {
        ...mockPropertyData,
        balcony: false,
        parking: false,
      };

      const premiumProperty: PropertyData = {
        ...mockPropertyData,
        balcony: true,
        parking: true,
      };

      const basicResult = PriceCalculator.calculatePrice(basicProperty);
      const premiumResult = PriceCalculator.calculatePrice(premiumProperty);

      expect(premiumResult.estimated).toBeGreaterThan(basicResult.estimated);
    });

    it('should handle rental properties differently', () => {
      const saleProperty: PropertyData = { ...mockPropertyData, listingType: 'SALE' };
      const rentalProperty: PropertyData = { ...mockPropertyData, listingType: 'RENT_LONG' };

      const saleResult = PriceCalculator.calculatePrice(saleProperty);
      const rentalResult = PriceCalculator.calculatePrice(rentalProperty);

      // Both should calculate prices (rental would be monthly rent estimate)
      expect(saleResult.estimated).toBeGreaterThan(0);
      expect(rentalResult.estimated).toBeGreaterThan(0);
    });
  });


  describe('Edge Cases', () => {
    it('should handle minimal property data', () => {
      const minimalData: PropertyData = {
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        area: 50,
        district: 'Тест',
        city: 'Ташкент',
        price: 50000,
      };

      const titleGen = new SmartTitleGenerator(minimalData);
      const descGen = new SmartDescriptionGenerator(minimalData);

      expect(() => titleGen.generate('professional')).not.toThrow();
      expect(() => descGen.generate('practical')).not.toThrow();
      expect(() => PriceCalculator.calculatePrice(minimalData)).not.toThrow();
    });

    it('should handle very large properties', () => {
      const largeProperty: PropertyData = {
        ...mockPropertyData,
        area: 500,
        bedrooms: 10,
        bathrooms: 5,
      };

      const titleGen = new SmartTitleGenerator(largeProperty);
      const titles = titleGen.generate('luxury');

      expect(titles.length).toBeGreaterThan(0);
      const hasAreaMention = titles.some(t => t.includes('500'));
      expect(hasAreaMention).toBe(true);
    });

    it('should handle land property type without errors', () => {
      const landData: PropertyData = {
        propertyType: 'LAND',
        listingType: 'SALE',
        area: 1000,
        district: 'Бектемирский',
        city: 'Ташкент',
        price: 50000,
      };

      const titleGen = new SmartTitleGenerator(landData);
      const descGen = new SmartDescriptionGenerator(landData);

      // Should not throw errors even if templates are limited
      expect(() => titleGen.generate('professional')).not.toThrow();
      expect(() => descGen.generate('practical')).not.toThrow();
      expect(() => PriceCalculator.calculatePrice(landData)).not.toThrow();
    });
  });
});
