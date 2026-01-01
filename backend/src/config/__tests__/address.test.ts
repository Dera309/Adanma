import {
  ADDRESS_CONFIGS,
  SUPPORTED_COUNTRIES,
  getAddressConfig,
  validateAddressData,
  formatAddress,
  getCountryOptions
} from '../address';

describe('Address Configuration', () => {
  describe('ADDRESS_CONFIGS', () => {
    it('should contain all 6 supported countries', () => {
      expect(Object.keys(ADDRESS_CONFIGS)).toHaveLength(6);
      expect(ADDRESS_CONFIGS).toHaveProperty('NIGERIA');
      expect(ADDRESS_CONFIGS).toHaveProperty('GHANA');
      expect(ADDRESS_CONFIGS).toHaveProperty('KENYA');
      expect(ADDRESS_CONFIGS).toHaveProperty('SOUTH_AFRICA');
      expect(ADDRESS_CONFIGS).toHaveProperty('CAMEROON');
      expect(ADDRESS_CONFIGS).toHaveProperty('EGYPT');
    });

    it('should have correct field structure for Nigeria', () => {
      const config = ADDRESS_CONFIGS.NIGERIA;
      expect(config.country).toBe('Nigeria');
      expect(config.countryCode).toBe('NG');
      expect(config.postalCodeRequired).toBe(true);
      expect(config.fields).toHaveLength(5);
      
      const fieldNames = config.fields.map(f => f.name);
      expect(fieldNames).toContain('state');
      expect(fieldNames).toContain('lga');
      expect(fieldNames).toContain('city');
      expect(fieldNames).toContain('streetAddress');
      expect(fieldNames).toContain('postalCode');
    });

    it('should have correct field structure for Ghana', () => {
      const config = ADDRESS_CONFIGS.GHANA;
      expect(config.country).toBe('Ghana');
      expect(config.countryCode).toBe('GH');
      expect(config.postalCodeRequired).toBe(false);
      
      const fieldNames = config.fields.map(f => f.name);
      expect(fieldNames).toContain('region');
      expect(fieldNames).toContain('district');
      expect(fieldNames).toContain('city');
      expect(fieldNames).toContain('streetAddress');
      expect(fieldNames).toContain('postalCode');
    });

    it('should have correct field structure for Kenya', () => {
      const config = ADDRESS_CONFIGS.KENYA;
      expect(config.country).toBe('Kenya');
      expect(config.countryCode).toBe('KE');
      expect(config.postalCodeRequired).toBe(true);
      
      const fieldNames = config.fields.map(f => f.name);
      expect(fieldNames).toContain('county');
      expect(fieldNames).toContain('subCounty');
      expect(fieldNames).toContain('city');
      expect(fieldNames).toContain('streetAddress');
      expect(fieldNames).toContain('postalCode');
    });

    it('should have correct field structure for South Africa', () => {
      const config = ADDRESS_CONFIGS.SOUTH_AFRICA;
      expect(config.country).toBe('South Africa');
      expect(config.countryCode).toBe('ZA');
      expect(config.postalCodeRequired).toBe(true);
      
      const fieldNames = config.fields.map(f => f.name);
      expect(fieldNames).toContain('province');
      expect(fieldNames).toContain('municipality');
      expect(fieldNames).toContain('city');
      expect(fieldNames).toContain('streetAddress');
      expect(fieldNames).toContain('postalCode');
    });

    it('should have correct field structure for Cameroon', () => {
      const config = ADDRESS_CONFIGS.CAMEROON;
      expect(config.country).toBe('Cameroon');
      expect(config.countryCode).toBe('CM');
      expect(config.postalCodeRequired).toBe(false);
      
      const fieldNames = config.fields.map(f => f.name);
      expect(fieldNames).toContain('region');
      expect(fieldNames).toContain('division');
      expect(fieldNames).toContain('city');
      expect(fieldNames).toContain('streetAddress');
      expect(fieldNames).toContain('postalCode');
    });

    it('should have correct field structure for Egypt', () => {
      const config = ADDRESS_CONFIGS.EGYPT;
      expect(config.country).toBe('Egypt');
      expect(config.countryCode).toBe('EG');
      expect(config.postalCodeRequired).toBe(true);
      
      const fieldNames = config.fields.map(f => f.name);
      expect(fieldNames).toContain('governorate');
      expect(fieldNames).toContain('city');
      expect(fieldNames).toContain('district');
      expect(fieldNames).toContain('streetAddress');
      expect(fieldNames).toContain('postalCode');
    });
  });

  describe('getAddressConfig', () => {
    it('should return config for valid country names', () => {
      expect(getAddressConfig('NIGERIA')).toBe(ADDRESS_CONFIGS.NIGERIA);
      expect(getAddressConfig('nigeria')).toBe(ADDRESS_CONFIGS.NIGERIA);
      expect(getAddressConfig('South Africa')).toBe(ADDRESS_CONFIGS.SOUTH_AFRICA);
      expect(getAddressConfig('south africa')).toBe(ADDRESS_CONFIGS.SOUTH_AFRICA);
    });

    it('should return null for invalid country names', () => {
      expect(getAddressConfig('INVALID')).toBeNull();
      expect(getAddressConfig('United States')).toBeNull();
      expect(getAddressConfig('')).toBeNull();
    });
  });

  describe('validateAddressData', () => {
    it('should validate complete Nigeria address', () => {
      const addressData = {
        state: 'Lagos',
        lga: 'Ikeja',
        city: 'Ikeja',
        streetAddress: '123 Main Street',
        postalCode: '100001'
      };

      const result = validateAddressData('NIGERIA', addressData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Nigeria address with missing required fields', () => {
      const addressData = {
        state: 'Lagos',
        // Missing lga, city, streetAddress, postalCode
      };

      const result = validateAddressData('NIGERIA', addressData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Local Government Area (LGA) is required');
      expect(result.errors).toContain('City/Town is required');
      expect(result.errors).toContain('Street Address is required');
      expect(result.errors).toContain('Postal Code is required');
    });

    it('should reject Nigeria address with invalid postal code', () => {
      const addressData = {
        state: 'Lagos',
        lga: 'Ikeja',
        city: 'Ikeja',
        streetAddress: '123 Main Street',
        postalCode: '12345' // Should be 6 digits
      };

      const result = validateAddressData('NIGERIA', addressData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Postal Code format is invalid');
    });

    it('should validate Ghana address without postal code', () => {
      const addressData = {
        region: 'Greater Accra',
        district: 'Accra Metropolitan',
        city: 'Accra',
        streetAddress: '123 Independence Avenue'
        // postalCode is optional for Ghana
      };

      const result = validateAddressData('GHANA', addressData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject address with invalid country', () => {
      const addressData = {
        state: 'California',
        city: 'Los Angeles',
        streetAddress: '123 Main Street'
      };

      const result = validateAddressData('UNITED_STATES', addressData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported country: UNITED_STATES');
    });

    it('should validate Kenya address with correct postal code', () => {
      const addressData = {
        county: 'Nairobi',
        subCounty: 'Westlands',
        city: 'Nairobi',
        streetAddress: '123 Uhuru Highway',
        postalCode: '00100'
      };

      const result = validateAddressData('KENYA', addressData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Kenya address with invalid postal code format', () => {
      const addressData = {
        county: 'Nairobi',
        subCounty: 'Westlands',
        city: 'Nairobi',
        streetAddress: '123 Uhuru Highway',
        postalCode: '001' // Should be 5 digits
      };

      const result = validateAddressData('KENYA', addressData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Postal Code format is invalid');
    });
  });

  describe('formatAddress', () => {
    it('should format Nigeria address correctly', () => {
      const addressData = {
        state: 'Lagos',
        lga: 'Ikeja',
        city: 'Ikeja',
        streetAddress: '123 Main Street',
        postalCode: '100001'
      };

      const formatted = formatAddress('NIGERIA', addressData);
      expect(formatted).toBe('123 Main Street, Ikeja, Ikeja, Lagos, 100001');
    });

    it('should format Ghana address correctly', () => {
      const addressData = {
        region: 'Greater Accra',
        district: 'Accra Metropolitan',
        city: 'Accra',
        streetAddress: '123 Independence Avenue'
      };

      const formatted = formatAddress('GHANA', addressData);
      expect(formatted).toBe('123 Independence Avenue, Accra, Accra Metropolitan, Greater Accra');
    });

    it('should handle missing optional fields', () => {
      const addressData = {
        region: 'Greater Accra',
        district: 'Accra Metropolitan',
        city: 'Accra',
        streetAddress: '123 Independence Avenue',
        postalCode: '' // Empty optional field
      };

      const formatted = formatAddress('GHANA', addressData);
      expect(formatted).toBe('123 Independence Avenue, Accra, Accra Metropolitan, Greater Accra');
    });

    it('should return error message for invalid country', () => {
      const addressData = {
        state: 'California',
        city: 'Los Angeles'
      };

      const formatted = formatAddress('INVALID', addressData);
      expect(formatted).toBe('Invalid address configuration');
    });
  });

  describe('getCountryOptions', () => {
    it('should return all supported countries with correct format', () => {
      const options = getCountryOptions();
      expect(options).toHaveLength(6);

      const nigeriaOption = options.find(opt => opt.label === 'Nigeria');
      expect(nigeriaOption).toEqual({
        value: 'NIGERIA',
        label: 'Nigeria',
        code: 'NG'
      });

      const southAfricaOption = options.find(opt => opt.label === 'South Africa');
      expect(southAfricaOption).toEqual({
        value: 'SOUTH_AFRICA',
        label: 'South Africa',
        code: 'ZA'
      });
    });

    it('should include all required countries', () => {
      const options = getCountryOptions();
      const labels = options.map(opt => opt.label);
      
      expect(labels).toContain('Nigeria');
      expect(labels).toContain('Ghana');
      expect(labels).toContain('Kenya');
      expect(labels).toContain('South Africa');
      expect(labels).toContain('Cameroon');
      expect(labels).toContain('Egypt');
    });
  });

  describe('SUPPORTED_COUNTRIES', () => {
    it('should contain all 6 countries', () => {
      expect(SUPPORTED_COUNTRIES).toHaveLength(6);
      expect(SUPPORTED_COUNTRIES).toContain('NIGERIA');
      expect(SUPPORTED_COUNTRIES).toContain('GHANA');
      expect(SUPPORTED_COUNTRIES).toContain('KENYA');
      expect(SUPPORTED_COUNTRIES).toContain('SOUTH_AFRICA');
      expect(SUPPORTED_COUNTRIES).toContain('CAMEROON');
      expect(SUPPORTED_COUNTRIES).toContain('EGYPT');
    });
  });
});