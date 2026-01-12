import Modal from '../Modal/Modal';
import DynamicAddressForm, { AddressFormData } from './DynamicAddressForm';
import { useToast } from '../Toast';
import { Address } from './AddressItem';
import axios from 'axios';

interface AddressEditModalProps {
  isOpen: boolean;
  address: Address | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddressEditModal: React.FC<AddressEditModalProps> = ({
  isOpen,
  address,
  onClose,
  onSuccess
}) => {
  const { showSuccess } = useToast();

  const handleSubmit = async (formData: AddressFormData) => {
    if (!address) return;

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/addresses/${address.id}`,
        {
          country: formData.country,
          region: formData.region,
          subRegion: formData.subRegion || undefined,
          city: formData.city,
          district: formData.district || undefined,
          streetAddress: formData.streetAddress,
          postalCode: formData.postalCode || undefined,
          isPrimary: formData.isPrimary
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        showSuccess('Address Updated', 'Your address has been updated successfully!');
        onClose();
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update address';
      throw new Error(errorMessage);
    }
  };

  // Convert Address to AddressFormData
  const getInitialData = (): Partial<AddressFormData> | undefined => {
    if (!address) return undefined;

    return {
      country: address.country,
      region: address.region,
      subRegion: address.subRegion || '',
      city: address.city,
      district: address.district || '',
      streetAddress: address.streetAddress,
      postalCode: address.postalCode || '',
      isPrimary: address.isPrimary
    };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Address"
      size="medium"
    >
      {address ? (
        <DynamicAddressForm
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Update Address"
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p>No address selected for editing.</p>
        </div>
      )}
    </Modal>
  );
};

export default AddressEditModal;