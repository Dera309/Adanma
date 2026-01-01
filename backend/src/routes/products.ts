import express from 'express';
import { searchProducts, getProducts } from '../controllers/products';

const router = express.Router();

router.get('/search', searchProducts);
router.get('/', getProducts);

export default router;