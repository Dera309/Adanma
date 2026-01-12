import express from 'express';

const router = express.Router();

// Mock products data
const mockProducts = [
  {
    id: '1',
    name: 'African Print Dress',
    price: 45.99,
    description: 'Beautiful traditional African print dress',
    image: '/api/placeholder/300/300',
    category: 'Clothing',
    vendor: 'Lagos Fashion Store',
    rating: 4.5,
    reviews: 23
  },
  {
    id: '2',
    name: 'Handmade Beaded Necklace',
    price: 25.99,
    description: 'Authentic African beaded necklace',
    image: '/api/placeholder/300/300',
    category: 'Jewelry',
    vendor: 'Nairobi Crafts',
    rating: 4.8,
    reviews: 15
  }
];

// Get all products
router.get('/', (req: express.Request, res: express.Response) => {
  const { search, category } = req.query;

  let products = mockProducts;

  if (search) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(search.toString().toLowerCase()) ||
      p.description.toLowerCase().includes(search.toString().toLowerCase())
    );
  }

  if (category) {
    products = products.filter(p => p.category === category);
  }

  res.json({
    success: true,
    data: { products, total: products.length },
    message: 'Products retrieved successfully'
  });
});

// Get product by ID
router.get('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'PRODUCT_001', message: 'Product not found' }
    });
  }

  res.json({
    success: true,
    data: product,
    message: 'Product retrieved successfully'
  });
});

export default router;