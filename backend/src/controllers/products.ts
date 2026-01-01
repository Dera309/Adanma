import { Request, Response } from 'express';

const mockProducts = [
  { id: '1', name: 'African Print Dress', price: 89.99, category: 'Clothing', image: 'https://picsum.photos/300/300?random=1' },
  { id: '2', name: 'Kente Cloth Bag', price: 78.25, category: 'Accessories', image: 'https://picsum.photos/300/300?random=2' },
  { id: '3', name: 'Wooden Bracelet', price: 12.75, category: 'Jewelry', image: 'https://picsum.photos/300/300?random=3' },
  { id: '4', name: 'African Print Shirt', price: 45.99, category: 'Clothing', image: 'https://picsum.photos/300/300?random=4' },
  { id: '5', name: 'Dashiki Top', price: 65.50, category: 'Clothing', image: 'https://picsum.photos/300/300?random=5' },
  { id: '6', name: 'Beaded Necklace', price: 34.99, category: 'Jewelry', image: 'https://picsum.photos/300/300?random=6' },
  { id: '7', name: 'Ankara Headwrap', price: 18.75, category: 'Accessories', image: 'https://picsum.photos/300/300?random=7' },
  { id: '8', name: 'Traditional Sandals', price: 55.00, category: 'Footwear', image: 'https://picsum.photos/300/300?random=8' }
];

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    let results = [...mockProducts];

    // Search by query
    if (q && typeof q === 'string') {
      const query = q.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category && typeof category === 'string') {
      results = results.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by price range
    if (minPrice && typeof minPrice === 'string') {
      const min = parseFloat(minPrice);
      results = results.filter(product => product.price >= min);
    }

    if (maxPrice && typeof maxPrice === 'string') {
      const max = parseFloat(maxPrice);
      results = results.filter(product => product.price <= max);
    }

    res.json({
      success: true,
      data: { products: results, total: results.length }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Failed to search products' }
    });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: { products: mockProducts, total: mockProducts.length }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PRODUCTS_ERROR', message: 'Failed to fetch products' }
    });
  }
};