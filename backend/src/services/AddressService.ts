import { Address } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export class AddressService {
  private addresses: Map<string, Address> = new Map();

  async createAddress(userId: string, addressData: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    const address: Address = {
      id: uuidv4(),
      userId,
      ...addressData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.addresses.set(address.id, address);
    return address;
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(addr => addr.userId === userId);
  }

  async updateAddress(addressId: string, updates: Partial<Address>): Promise<Address> {
    const address = this.addresses.get(addressId);
    if (!address) throw new Error('Address not found');

    Object.assign(address, updates, { updatedAt: new Date() });
    return address;
  }

  async deleteAddress(addressId: string): Promise<void> {
    this.addresses.delete(addressId);
  }

  async setPrimaryAddress(userId: string, addressId: string): Promise<void> {
    const userAddresses = await this.getUserAddresses(userId);
    
    // Remove primary flag from all addresses
    userAddresses.forEach(addr => {
      addr.isPrimary = false;
    });

    // Set new primary address
    const address = this.addresses.get(addressId);
    if (address && address.userId === userId) {
      address.isPrimary = true;
    }
  }

  validateAddressForCountry(country: string, addressData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common required fields
    if (!addressData.city) errors.push('City is required');
    if (!addressData.streetAddress) errors.push('Street address is required');

    // Country-specific validation
    switch (country) {
      case 'Nigeria':
        if (!addressData.state) errors.push('State is required for Nigeria');
        if (!addressData.lga) errors.push('LGA is required for Nigeria');
        break;
      case 'Ghana':
        if (!addressData.region) errors.push('Region is required for Ghana');
        if (!addressData.district) errors.push('District is required for Ghana');
        break;
      case 'Kenya':
        if (!addressData.county) errors.push('County is required for Kenya');
        if (!addressData.subCounty) errors.push('Sub-County is required for Kenya');
        break;
      case 'South Africa':
        if (!addressData.province) errors.push('Province is required for South Africa');
        if (!addressData.municipality) errors.push('Municipality is required for South Africa');
        break;
      case 'Cameroon':
        if (!addressData.region) errors.push('Region is required for Cameroon');
        if (!addressData.division) errors.push('Division is required for Cameroon');
        break;
      case 'Egypt':
        if (!addressData.governorate) errors.push('Governorate is required for Egypt');
        break;
      default:
        errors.push('Unsupported country');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const addressService = new AddressService();