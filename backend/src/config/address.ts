/**
 * Address Configuration for African Countries
 * 
 * This configuration defines the address field structure for each supported country.
 * Each country has specific administrative divisions that need to be captured
 * for accurate address representation and delivery purposes.
 */

export interface AddressField {
  name: string;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface CountryAddressConfig {
  country: string;
  countryCode: string;
  fields: AddressField[];
  addressFormat: string[];
  postalCodeRequired: boolean;
  postalCodePattern?: string;
}

/**
 * Nigeria Address Configuration
 * Administrative structure: State > LGA > City/Town > Street
 */
const NIGERIA_CONFIG: CountryAddressConfig = {
  country: 'Nigeria',
  countryCode: 'NG',
  postalCodeRequired: true,
  postalCodePattern: '^\\d{6}$',
  addressFormat: ['streetAddress', 'city', 'lga', 'state', 'postalCode'],
  fields: [
    {
      name: 'state',
      label: 'State',
      type: 'select',
      required: true,
      options: [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
        'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
        'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
        'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
        'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
        'Yobe', 'Zamfara'
      ]
    },
    {
      name: 'lga',
      label: 'Local Government Area (LGA)',
      type: 'text',
      required: true,
      placeholder: 'Enter LGA name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'city',
      label: 'City/Town',
      type: 'text',
      required: true,
      placeholder: 'Enter city or town name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'streetAddress',
      label: 'Street Address',
      type: 'text',
      required: true,
      placeholder: 'Enter street address',
      validation: {
        minLength: 5,
        maxLength: 100
      }
    },
    {
      name: 'postalCode',
      label: 'Postal Code',
      type: 'text',
      required: true,
      placeholder: '123456',
      validation: {
        pattern: '^\\d{6}$',
        minLength: 6,
        maxLength: 6
      }
    }
  ]
};

/**
 * Ghana Address Configuration
 * Administrative structure: Region > District > City/Town > Street
 */
const GHANA_CONFIG: CountryAddressConfig = {
  country: 'Ghana',
  countryCode: 'GH',
  postalCodeRequired: false,
  addressFormat: ['streetAddress', 'city', 'district', 'region'],
  fields: [
    {
      name: 'region',
      label: 'Region',
      type: 'select',
      required: true,
      options: [
        'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
        'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
        'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
      ]
    },
    {
      name: 'district',
      label: 'District',
      type: 'text',
      required: true,
      placeholder: 'Enter district name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'city',
      label: 'City/Town',
      type: 'text',
      required: true,
      placeholder: 'Enter city or town name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'streetAddress',
      label: 'Street Address',
      type: 'text',
      required: true,
      placeholder: 'Enter street address',
      validation: {
        minLength: 5,
        maxLength: 100
      }
    },
    {
      name: 'postalCode',
      label: 'Postal Code (Optional)',
      type: 'text',
      required: false,
      placeholder: 'Enter postal code if available',
      validation: {
        maxLength: 10
      }
    }
  ]
};

/**
 * Kenya Address Configuration
 * Administrative structure: County > Sub-County > City/Town > Street
 */
const KENYA_CONFIG: CountryAddressConfig = {
  country: 'Kenya',
  countryCode: 'KE',
  postalCodeRequired: true,
  postalCodePattern: '^\\d{5}$',
  addressFormat: ['streetAddress', 'city', 'subCounty', 'county', 'postalCode'],
  fields: [
    {
      name: 'county',
      label: 'County',
      type: 'select',
      required: true,
      options: [
        'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
        'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
        'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale',
        'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
        'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru',
        'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu',
        'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
        'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
      ]
    },
    {
      name: 'subCounty',
      label: 'Sub-County',
      type: 'text',
      required: true,
      placeholder: 'Enter sub-county name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'city',
      label: 'City/Town',
      type: 'text',
      required: true,
      placeholder: 'Enter city or town name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'streetAddress',
      label: 'Street Address',
      type: 'text',
      required: true,
      placeholder: 'Enter street address',
      validation: {
        minLength: 5,
        maxLength: 100
      }
    },
    {
      name: 'postalCode',
      label: 'Postal Code',
      type: 'text',
      required: true,
      placeholder: '12345',
      validation: {
        pattern: '^\\d{5}$',
        minLength: 5,
        maxLength: 5
      }
    }
  ]
};

/**
 * South Africa Address Configuration
 * Administrative structure: Province > Municipality > City/Town > Street
 */
const SOUTH_AFRICA_CONFIG: CountryAddressConfig = {
  country: 'South Africa',
  countryCode: 'ZA',
  postalCodeRequired: true,
  postalCodePattern: '^\\d{4}$',
  addressFormat: ['streetAddress', 'city', 'municipality', 'province', 'postalCode'],
  fields: [
    {
      name: 'province',
      label: 'Province',
      type: 'select',
      required: true,
      options: [
        'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
        'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
      ]
    },
    {
      name: 'municipality',
      label: 'Municipality',
      type: 'text',
      required: true,
      placeholder: 'Enter municipality name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'city',
      label: 'City/Town',
      type: 'text',
      required: true,
      placeholder: 'Enter city or town name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'streetAddress',
      label: 'Street Address',
      type: 'text',
      required: true,
      placeholder: 'Enter street address',
      validation: {
        minLength: 5,
        maxLength: 100
      }
    },
    {
      name: 'postalCode',
      label: 'Postal Code',
      type: 'text',
      required: true,
      placeholder: '1234',
      validation: {
        pattern: '^\\d{4}$',
        minLength: 4,
        maxLength: 4
      }
    }
  ]
};

/**
 * Cameroon Address Configuration
 * Administrative structure: Region > Division > City/Town > Street
 */
const CAMEROON_CONFIG: CountryAddressConfig = {
  country: 'Cameroon',
  countryCode: 'CM',
  postalCodeRequired: false,
  addressFormat: ['streetAddress', 'city', 'division', 'region'],
  fields: [
    {
      name: 'region',
      label: 'Region',
      type: 'select',
      required: true,
      options: [
        'Adamawa', 'Centre', 'East', 'Far North', 'Littoral', 'North',
        'Northwest', 'South', 'Southwest', 'West'
      ]
    },
    {
      name: 'division',
      label: 'Division',
      type: 'text',
      required: true,
      placeholder: 'Enter division name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'city',
      label: 'City/Town',
      type: 'text',
      required: true,
      placeholder: 'Enter city or town name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'streetAddress',
      label: 'Street Address',
      type: 'text',
      required: true,
      placeholder: 'Enter street address',
      validation: {
        minLength: 5,
        maxLength: 100
      }
    },
    {
      name: 'postalCode',
      label: 'Postal Code (Optional)',
      type: 'text',
      required: false,
      placeholder: 'Enter postal code if available',
      validation: {
        maxLength: 10
      }
    }
  ]
};

/**
 * Egypt Address Configuration
 * Administrative structure: Governorate > City > District > Street
 */
const EGYPT_CONFIG: CountryAddressConfig = {
  country: 'Egypt',
  countryCode: 'EG',
  postalCodeRequired: true,
  postalCodePattern: '^\\d{5}$',
  addressFormat: ['streetAddress', 'district', 'city', 'governorate', 'postalCode'],
  fields: [
    {
      name: 'governorate',
      label: 'Governorate',
      type: 'select',
      required: true,
      options: [
        'Alexandria', 'Aswan', 'Asyut', 'Beheira', 'Beni Suef', 'Cairo',
        'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Ismailia',
        'Kafr el-Sheikh', 'Luxor', 'Matrouh', 'Minya', 'Monufia', 'New Valley',
        'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharqia',
        'Sohag', 'South Sinai', 'Suez'
      ]
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      required: true,
      placeholder: 'Enter city name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'district',
      label: 'District',
      type: 'text',
      required: true,
      placeholder: 'Enter district name',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: 'streetAddress',
      label: 'Street Address',
      type: 'text',
      required: true,
      placeholder: 'Enter street address',
      validation: {
        minLength: 5,
        maxLength: 100
      }
    },
    {
      name: 'postalCode',
      label: 'Postal Code',
      type: 'text',
      required: true,
      placeholder: '12345',
      validation: {
        pattern: '^\\d{5}$',
        minLength: 5,
        maxLength: 5
      }
    }
  ]
};

/**
 * Address Configuration Registry
 */
export const ADDRESS_CONFIGS: Record<string, CountryAddressConfig> = {
  'NIGERIA': NIGERIA_CONFIG,
  'GHANA': GHANA_CONFIG,
  'KENYA': KENYA_CONFIG,
  'SOUTH_AFRICA': SOUTH_AFRICA_CONFIG,
  'CAMEROON': CAMEROON_CONFIG,
  'EGYPT': EGYPT_CONFIG
};

/**
 * Supported Countries List
 */
export const SUPPORTED_COUNTRIES = Object.keys(ADDRESS_CONFIGS);

/**
 * Get address configuration for a specific country
 */
export function getAddressConfig(country: string): CountryAddressConfig | null {
  const normalizedCountry = country.toUpperCase().replace(/\s+/g, '_');
  return ADDRESS_CONFIGS[normalizedCountry] || null;
}

/**
 * Validate address data against country configuration
 */
export function validateAddressData(country: string, addressData: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} {
  const config = getAddressConfig(country);
  if (!config) {
    return {
      isValid: false,
      errors: [`Unsupported country: ${country}`]
    };
  }

  const errors: string[] = [];

  for (const field of config.fields) {
    const value = addressData[field.name];

    // Check required fields
    if (field.required && (!value || value.trim() === '')) {
      errors.push(`${field.label} is required`);
      continue;
    }

    // Skip validation for empty optional fields
    if (!field.required && (!value || value.trim() === '')) {
      continue;
    }

    // Validate field constraints
    if (field.validation) {
      const { pattern, minLength, maxLength } = field.validation;

      if (pattern && !new RegExp(pattern).test(value)) {
        errors.push(`${field.label} format is invalid`);
      }

      if (minLength && value.length < minLength) {
        errors.push(`${field.label} must be at least ${minLength} characters`);
      }

      if (maxLength && value.length > maxLength) {
        errors.push(`${field.label} must not exceed ${maxLength} characters`);
      }
    }

    // Validate select field options
    if (field.type === 'select' && field.options && !field.options.includes(value)) {
      errors.push(`${field.label} must be one of: ${field.options.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format address for display
 */
export function formatAddress(country: string, addressData: Record<string, any>): string {
  const config = getAddressConfig(country);
  if (!config) {
    return 'Invalid address configuration';
  }

  const addressParts: string[] = [];
  
  for (const fieldName of config.addressFormat) {
    const value = addressData[fieldName];
    if (value && value.trim()) {
      addressParts.push(value.trim());
    }
  }

  return addressParts.join(', ');
}

/**
 * Get country list for UI dropdowns
 */
export function getCountryOptions(): Array<{ value: string; label: string; code: string }> {
  return Object.values(ADDRESS_CONFIGS).map(config => ({
    value: config.country.toUpperCase().replace(/\s+/g, '_'),
    label: config.country,
    code: config.countryCode
  }));
}