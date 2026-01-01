import { useState, memo, useCallback } from 'react';
import AddressItem, { Address } from './AddressItem';
import './AddressList.css';

// Address interface is now imported from AddressItem

interface AddressListProps {
  addresses: Address[];
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetPrimary: (addressId: string) => void;
  onAddNew: () => void;
}

const AddressList: React.FC<AddressListProps> = memo(({
  addresses,
  onEdit,
  onDelete,
  onSetPrimary,
  onAddNew
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback((addressId: string) => {
    setDeletingId(addressId);
    onDelete(addressId);
  }, [onDelete]);

  const handleEdit = useCallback((address: Address) => {
    onEdit(address);
  }, [onEdit]);

  const handleSetPrimary = useCallback((addressId: string) => {
    onSetPrimary(addressId);
  }, [onSetPrimary]);



  return (
    <div className="address-list">
      <div className="address-list-header">
        <h2 id="addresses-heading">Saved Addresses</h2>
        <button 
          className="btn btn-primary" 
          onClick={onAddNew}
          aria-describedby="addresses-heading"
        >
          + Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <h3>No addresses saved yet</h3>
          <p>Add your first address to make checkout faster</p>
          <button className="btn btn-primary" onClick={onAddNew}>
            Add Address
          </button>
        </div>
      ) : (
        <div 
          className="addresses-grid"
          role="list"
          aria-labelledby="addresses-heading"
        >
          {addresses.map((address) => (
            <AddressItem
              key={address.id}
              address={address}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              isDeleting={deletingId === address.id}
            />
          ))}
        </div>
      )}
    </div>
  );
});

AddressList.displayName = 'AddressList';

export default AddressList;
