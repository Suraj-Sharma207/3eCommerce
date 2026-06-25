import addressRepository from '../repositories/addressRepository.js';

class AddressService {
  async getUserAddresses(userId) {
    return await addressRepository.findByUserId(userId);
  }

  async createAddress(userId, data) {
    const existing = await addressRepository.findByUserId(userId);
    
    // Check for exact duplicate
    const isDuplicate = existing.some(addr => 
      addr.street.toLowerCase() === data.street.toLowerCase() &&
      addr.city.toLowerCase() === data.city.toLowerCase() &&
      addr.zipCode === data.zipCode &&
      addr.recipientName.toLowerCase() === data.recipientName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error('Duplicate address found');
    }

    // Auto-set default if it's the first address
    if (existing.length === 0) {
      data.isDefaultShipping = true;
      data.isDefaultBilling = true;
    }

    // If setting as default, unset others first
    await this.handleDefaults(userId, data);
    
    return await addressRepository.create({
      ...data,
      userId
    });
  }

  async updateAddress(userId, addressId, data) {
    const address = await addressRepository.findById(addressId);
    if (!address || address.userId !== userId) {
      throw new Error('Address not found or unauthorized');
    }

    await this.handleDefaults(userId, data, addressId);

    return await addressRepository.update(addressId, data);
  }

  async deleteAddress(userId, addressId) {
    const address = await addressRepository.findById(addressId);
    if (!address || address.userId !== userId) {
      throw new Error('Address not found or unauthorized');
    }

    await addressRepository.delete(addressId);

    // Fallback defaults if we just deleted a default
    if (address.isDefaultShipping || address.isDefaultBilling) {
      const remaining = await addressRepository.findByUserId(userId);
      if (remaining.length > 0) {
        let updateData = {};
        if (address.isDefaultShipping && !remaining.some(a => a.isDefaultShipping)) {
          updateData.isDefaultShipping = true;
        }
        if (address.isDefaultBilling && !remaining.some(a => a.isDefaultBilling)) {
          updateData.isDefaultBilling = true;
        }
        if (Object.keys(updateData).length > 0) {
          await addressRepository.update(remaining[0].id, updateData);
        }
      }
    }

    return { success: true };
  }

  async handleDefaults(userId, data, excludeAddressId = null) {
    if (data.isDefaultShipping || data.isDefaultBilling) {
      const addresses = await addressRepository.findByUserId(userId);
      for (const addr of addresses) {
        if (excludeAddressId && addr.id === excludeAddressId) continue;
        
        let updateData = {};
        if (data.isDefaultShipping && addr.isDefaultShipping) {
          updateData.isDefaultShipping = false;
        }
        if (data.isDefaultBilling && addr.isDefaultBilling) {
          updateData.isDefaultBilling = false;
        }
        
        if (Object.keys(updateData).length > 0) {
          await addressRepository.update(addr.id, updateData);
        }
      }
    }
  }
}

export default new AddressService();
