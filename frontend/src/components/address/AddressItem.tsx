import React, { memo } from 'react';

interface Address {
  id: string;
  country: string;
  region: string;
  subRegion?: string;
  city: string;
  district?: string;
  streetAddress: string;
  postalCode?: string;
  isPrimary: boolean;
}

interface AddressItemProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetPrimary: (addressId: string) => void;
  isDeleting?: boolean;
}

const AddressItem: React.FC<AddressItemProps> = memo(({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
  isDeleting = false
}) => {
  const formatAddress = (address: Address): string => {
    const parts = [
      address.streetAddress,
      address.district,
      address.city,
      address.subRegion,
      address.region,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this address?')) {
      onDelete(address.id);
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Nigeria': '🇳🇬',
      'Ghana': '🇬🇭',
      'Kenya': '🇰🇪',
      'South Africa': '🇿🇦',
      'Cameroon': '🇨🇲',
      'Egypt': '🇪🇬'
    };
    return flags[country] || '🌍';
  };

  return (
    <div
      className={`address-card ${address.isPrimary ? 'primary' : ''}`}
      role="listitem"
      aria-label={`Address in ${address.country}${address.isPrimary ? ' (Primary)' : ''}`}
    >
      {address.isPrimary && (
        <div className="primary-badge">Primary Address</div>
      )}
      
      <div className="address-content">
        <div className="address-country">
          <span className="country-flag" aria-hidden="true">
            {getCountryFlag(address.country)}
          </span>
          <strong>{address.country}</strong>
        </div>
        
        <p className="address-text">{formatAddress(address)}</p>
        
        {address.postalCode && (
          <p className="postal-code">Postal Code: {address.postalCode}</p>
        )}
      </div>

      <div className="address-actions">
        {!address.isPrimary && (
          <button
            className="btn-action btn-set-primary"
            onClick={() => onSetPrimary(address.id)}
            aria-label={`Set ${address.country} address as primary`}
            type="button"
          >
            Set as Primary
          </button>
        )}
        <button
          className="btn-action btn-edit"
          onClick={() => onEdit(address)}
          aria-label={`Edit ${address.country} address`}
          type="button"
        >
          Edit
        </button>
        <button
          className="btn-action btn-delete"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Delete ${address.country} address`}
          type="button"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
});

AddressItem.displayName = 'AddressItem';

export default AddressItem;
export type { Address };