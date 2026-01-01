import { Router } from 'express';
import {
  getUserAddresses
} from '../controllers/users';
import {
  createAddress,
  validateCreateAddress,
  updateAddress,
  validateUpdateAddress,
  deleteAddress,
  setPrimaryAddress,
  getAddressRegions
} from '../controllers/addresses';
import { authenticateFromCookie } from '../utils/jwt';

const router = Router();

/**
 * @route GET /api/addresses
 * @desc Get all addresses for current user
 * @access Private
 */
router.get('/', authenticateFromCookie, getUserAddresses);

/**
 * @route POST /api/addresses
 * @desc Create a new address for current user
 * @access Private
 */
router.post('/', authenticateFromCookie, validateCreateAddress, createAddress);

/**
 * @route PUT /api/addresses/:id
 * @desc Update an existing address
 * @access Private
 */
router.put('/:id', authenticateFromCookie, validateUpdateAddress, updateAddress);

/**
 * @route DELETE /api/addresses/:id
 * @desc Delete an existing address
 * @access Private
 */
router.delete('/:id', authenticateFromCookie, deleteAddress);

/**
 * @route PATCH /api/addresses/:id/set-primary
 * @desc Set an address as primary
 * @access Private
 */
router.patch('/:id/set-primary', authenticateFromCookie, setPrimaryAddress);

/**
 * @route GET /api/addresses/regions/:country
 * @desc Get regions/states for a specific country
 * @access Public
 */
router.get('/regions/:country', getAddressRegions);

export default router;