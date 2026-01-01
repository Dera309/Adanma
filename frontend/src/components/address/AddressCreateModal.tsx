import { useState } from 'react';
import Modal from '../Modal/Modal';
import DynamicAddressForm, { AddressFormData } from './DynamicAddressForm';
import { useToast } from '../Toast';
import axios from 'axios';

interface AddressCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddressCreateModal: React.FC<AddressCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showSuccess } = useToast();

  const handleSubmit = async (formData: AddressFormData) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/addresses`,
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
        showSuccess('Address Created', 'Your new address has been saved successfully!');
        onClose();
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create address';
      throw new Error(errorMessage);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Address"
      size="medium"
    >
      <DynamicAddressForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Create Address"
      />
    </Modal>
  );
};

export default AddressCreateModal;