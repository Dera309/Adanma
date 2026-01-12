import { useState, useEffect } from 'react';
import AddressList from '../components/address/AddressList';
import { Address } from '../components/address/AddressItem';
import AddressCreateModal from '../components/address/AddressCreateModal';
import AddressEditModal from '../components/address/AddressEditModal';
import ConfirmDialog from '../components/Modal/ConfirmDialog';
import { FormError } from '../components/Form';
import { useToast } from '../components/Toast';
import SkeletonLoader from '../components/Loading/SkeletonLoader';
import axios from 'axios';
import './AddressManagementPage.css';

const AddressManagementPage = () => {
  const { showSuccess } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Deletion states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setError('');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/addresses`,
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.data) {
        setAddresses(response.data.data.addresses || []);
      }
    } catch (err: any) {
      setError('Failed to load addresses');
      console.error('Failed to fetch addresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsEditModalOpen(true);
  };

  const handleDelete = (addressId: string) => {
    const address = addresses.find(a => a.id === addressId);
    if (address) {
      setDeletingAddress(address);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAddress) return;

    setIsDeleting(true);
    setError('');

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/addresses/${deletingAddress.id}`,
        { withCredentials: true }
      );

      showSuccess('Address Deleted', 'The address has been removed from your account.');
      setAddresses(prev => prev.filter(a => a.id !== deletingAddress.id));
      setIsDeleteDialogOpen(false);
      setDeletingAddress(null);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete address');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeletingAddress(null);
  };

  const handleSetPrimary = async (addressId: string) => {
    try {
      setError('');
      // Success handled by showSuccess from useToast
      
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/addresses/${addressId}/set-primary`,
        {},
        { withCredentials: true }
      );

      showSuccess('Primary Address Updated', 'Your primary address has been changed.');
      fetchAddresses(); // Refresh the list
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to set primary address');
      }
    }
  };

  const handleModalSuccess = () => {
    fetchAddresses(); // Refresh the list
  };

  const getDeleteMessage = (): string => {
    if (!deletingAddress) return '';
    
    if (deletingAddress.isPrimary && addresses.length > 1) {
      return `This is your primary address. Deleting it will require you to set a new primary address from your remaining addresses. Are you sure you want to continue?`;
    }
    
    return `Are you sure you want to delete this address? This action cannot be undone.`;
  };

  if (isLoading) {
    return (
      <div className="address-management-page">
        <div className="page-header">
          <SkeletonLoader variant="text" width="300px" height="32px" />
          <SkeletonLoader variant="text" width="400px" height="16px" />
        </div>
        <div className="addresses-skeleton">
          <SkeletonLoader variant="card" height="120px" />
          <SkeletonLoader variant="card" height="120px" />
          <SkeletonLoader variant="card" height="120px" />
        </div>
      </div>
    );
  }

  return (
    <div className="address-management-page">
      <div className="page-header">
        <h1>Address Management</h1>
        <p>Manage your saved addresses for faster checkout</p>
      </div>

      {error && <FormError message={error} onClose={() => setError('')} />}

      <AddressList
        addresses={addresses}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetPrimary={handleSetPrimary}
      />

      {/* Create Address Modal */}
      <AddressCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Address Modal */}
      <AddressEditModal
        isOpen={isEditModalOpen}
        address={editingAddress}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAddress(null);
        }}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Address"
        message={getDeleteMessage()}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AddressManagementPage;