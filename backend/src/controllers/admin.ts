import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';

// Get admin dashboard statistics
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    try {
      const totalUsers = await prisma.user.count();
      const activeVendors = await prisma.user.count({
        where: { roles: { contains: 'vendor' } }
      });
      
      const totalOrders = await prisma.order.count().catch(() => 0);
      const totalRevenue = await prisma.order.aggregate({
        _sum: { totalAmount: true }
      }).then(result => result._sum.totalAmount || 0).catch(() => 0);

      const stats = {
        totalUsers,
        totalOrders,
        totalRevenue,
        activeVendors
      };

      logger.info('Admin stats retrieved', { userId, stats });
      res.json({ success: true, data: stats });
    } catch (dbError) {
      logger.warn('Database query failed, using empty stats', { error: dbError });
      res.json({
        success: true,
        data: {
          totalUsers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          activeVendors: 0
        }
      });
    }
  } catch (error) {
    logger.error('Get admin stats error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: { code: 'SYS_001', message: 'Internal server error' }
    });
  }
};