import { useState, useEffect, FormEvent } from 'react';
import { Input, Select, Button, FormError } from '../Form';
import './DynamicAddressForm.css';

interface AddressFormData {
  country: string;
  region: string;
  subRegion: string;
  city: string;
  district: string;
  streetAddress: string;
  postalCode: string;
  isPrimary: boolean;
}

interface CountryConfig {
  name: string;
  flag: string;
  fields: {
    region: { label: string; required: boolean };
    subRegion?: { label: string; required: boolean };
    city: { label: string; required: boolean };
    district?: { label: string; required: boolean };
    streetAddress: { label: string; required: boolean };
    postalCode: { label: string; required: boolean };
  };
}

const countryConfigs: Record<string, CountryConfig> = {
  Nigeria: {
    name: 'Nigeria',
    flag: '🇳🇬',
    fields: {
      region: { label: 'State', required: true },
      subRegion: { label: 'LGA (Local Government Area)', required: true },
      city: { label: 'City', required: true },
      streetAddress: { label: 'Street Address', required: true },
      postalCode: { label: 'Postal Code', required: false }
    }
  },
  Ghana: {
    name: 'Ghana',
    flag: '🇬🇭',
    fields: {
      region: { label: 'Region', required: true },
      district: { label: 'District', required: true },
      city: { label: 'City', required: true },
      streetAddress: { label: 'Street Address', required: true },
      postalCode: { label: 'Postal Code', required: false }
    }
  },
  Kenya: {
    name: 'Kenya',
    flag: '🇰🇪',
    fields: {
      region: { label: 'County', required: true },
      subRegion: { label: 'Sub-County', required: true },
      city: { label: 'City', required: true },
      streetAddress: { label: 'Street Address', required: true },
      postalCode: { label: 'Postal Code', required: false }
    }
  },
  'South Africa': {
    name: 'South Africa',
    flag: '🇿🇦',
    fields: {
      region: { label: 'Province', required: true },
      district: { label: 'Municipality', required: true },
      city: { label: 'City', required: true },
      streetAddress: { label: 'Street Address', required: true },
      postalCode: { label: 'Postal Code', required: true }
    }
  },
  Cameroon: {
    name: 'Cameroon',
    flag: '🇨🇲',
    fields: {
      region: { label: 'Region', required: true },
      district: { label: 'Division', required: true },
      city: { label: 'City', required: true },
      streetAddress: { label: 'Street Address', required: true },
      postalCode: { label: 'Postal Code', required: false }
    }
  },
  Egypt: {
    name: 'Egypt',
    flag: '🇪🇬',
    fields: {
      region: { label: 'Governorate', required: true },
      city: { label: 'City', required: true },
      district: { label: 'District', required: true },
      streetAddress: { label: 'Street Address', required: true },
      postalCode: { label: 'Postal Code', required: false }
    }
  }
};

interface DynamicAddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const DynamicAddressForm: React.FC<DynamicAddressFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Address'
}) => {
  const [formData, setFormData] = useState<AddressFormData>({
    country: initialData?.country || '',
    region: initialData?.region || '',
    subRegion: initialData?.subRegion || '',
    city: initialData?.city || '',
    district: initialData?.district || '',
    streetAddress: initialData?.streetAddress || '',
    postalCode: initialData?.postalCode || '',
    isPrimary: initialData?.isPrimary || false
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentConfig = formData.country ? countryConfigs[formData.country] : null;

  useEffect(() => {
    // Clear fields when country changes (except country itself)
    if (initialData?.country !== formData.country) {
      setFormData(prev => ({
        ...prev,
        region: '',
        subRegion: '',
        city: '',
        district: '',
        streetAddress: '',
        postalCode: ''
      }));
    }
  }, [formData.country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.country) {
      setError('Please select a country');
      return false;
    }

    if (!currentConfig) return false;

    const fields = currentConfig.fields;

    if (fields.region.required && !formData.region.trim()) {
      setError(`${fields.region.label} is required`);
      return false;
    }

    if (fields.subRegion?.required && !formData.subRegion.trim()) {
      setError(`${fields.subRegion.label} is required`);
      return false;
    }

    if (fields.city.required && !formData.city.trim()) {
      setError(`${fields.city.label} is required`);
      return false;
    }

    if (fields.district?.required && !formData.district.trim()) {
      setError(`${fields.district.label} is required`);
      return false;
    }

    if (fields.streetAddress.required && !formData.streetAddress.trim()) {
      setError(`${fields.streetAddress.label} is required`);
      return false;
    }

    if (fields.postalCode.required && !formData.postalCode.trim()) {
      setError(`${fields.postalCode.label} is required`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="dynamic-address-form"
      aria-label="Address form"
      noValidate
    >
      {error && <FormError message={error} />}

      <Select
        label="Country"
        name="country"
        value={formData.country}
        onChange={handleChange}
        required
        disabled={isSubmitting}
        placeholder="Select a country"
        options={Object.values(countryConfigs).map((config) => ({
          value: config.name,
          label: `${config.flag} ${config.name}`
        }))}
      />

      {currentConfig && (
        <>
          <Input
            label={currentConfig.fields.region.label}
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            required={currentConfig.fields.region.required}
            disabled={isSubmitting}
            placeholder={`Enter ${currentConfig.fields.region.label.toLowerCase()}`}
          />

          {currentConfig.fields.subRegion && (
            <Input
              label={currentConfig.fields.subRegion.label}
              type="text"
              name="subRegion"
              value={formData.subRegion}
              onChange={handleChange}
              required={currentConfig.fields.subRegion.required}
              disabled={isSubmitting}
              placeholder={`Enter ${currentConfig.fields.subRegion.label.toLowerCase()}`}
            />
          )}

          <Input
            label={currentConfig.fields.city.label}
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required={currentConfig.fields.city.required}
            disabled={isSubmitting}
            placeholder={`Enter ${currentConfig.fields.city.label.toLowerCase()}`}
          />

          {currentConfig.fields.district && (
            <Input
              label={currentConfig.fields.district.label}
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              required={currentConfig.fields.district.required}
              disabled={isSubmitting}
              placeholder={`Enter ${currentConfig.fields.district.label.toLowerCase()}`}
            />
          )}

          <Input
            label={currentConfig.fields.streetAddress.label}
            type="text"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleChange}
            required={currentConfig.fields.streetAddress.required}
            disabled={isSubmitting}
            placeholder="Enter street address"
          />

          <Input
            label={currentConfig.fields.postalCode.label}
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required={currentConfig.fields.postalCode.required}
            disabled={isSubmitting}
            placeholder="Enter postal code"
          />

          <div className="checkbox-field">
            <label>
              <input
                type="checkbox"
                name="isPrimary"
                checked={formData.isPrimary}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-describedby="primary-address-help"
              />
              <span>Set as primary address</span>
            </label>
            <div id="primary-address-help" className="form-helper-text">
              Your primary address will be used as the default for orders and deliveries
            </div>
          </div>
        </>
      )}

      <div className="form-actions">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting || !formData.country}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default DynamicAddressForm;
export type { AddressFormData };
