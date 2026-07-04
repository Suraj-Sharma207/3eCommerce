import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import prisma from '../lib/prisma.js';
import securitySettingsService from '../services/securitySettingsService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import crypto from 'crypto';

const router = express.Router();

// Middleware to ensure admin/super_admin
router.use(protect);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await securitySettingsService.getSettings();
    return successResponse(res, 'Security settings retrieved', settings, 200);
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const oldSettings = await securitySettingsService.getSettings();
    const updatedSettings = await securitySettingsService.updateSettings(req.body);
    
    // Log the change in AuditLog
    await prisma.auditLog.create({
      data: {
        adminName: req.user.name,
        section: 'SECURITY_SETTINGS',
        oldValue: oldSettings,
        newValue: updatedSettings,
        ipAddress: req.ip
      }
    });

    // Also log the change in SecurityLog to ensure it displays in the Admin Security Audit Logs UI
    await prisma.securityLog.create({
      data: {
        userId: req.user.id,
        action: 'SECURITY_SETTINGS_UPDATED',
        ipAddress: req.ip,
        details: {
          adminName: req.user.name,
          oldValue: oldSettings,
          newValue: updatedSettings
        }
      }
    });

    return successResponse(res, 'Security settings updated', updatedSettings, 200);
  } catch (error) {
    next(error);
  }
});

router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { lastActivity: 'desc' }
    });
    return successResponse(res, 'Active sessions retrieved', sessions, 200);
  } catch (error) {
    next(error);
  }
});

router.delete('/sessions/:id', async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!session) {
      return errorResponse(res, 'Session not found', [], 404);
    }

    await prisma.session.delete({ where: { id: req.params.id } });

    await prisma.securityLog.create({
      data: {
        userId: session.userId,
        action: 'SESSION_TERMINATED_BY_ADMIN',
        ipAddress: req.ip,
        details: { adminId: req.user.id }
      }
    });

    return successResponse(res, 'Session terminated successfully', {}, 200);
  } catch (error) {
    next(error);
  }
});

router.post('/logout-all', async (req, res, next) => {
  try {
    // Increment tokenVersion for all users to invalidate their JWTs
    await prisma.user.updateMany({
      data: { tokenVersion: { increment: 1 } }
    });

    // Delete all sessions
    await prisma.session.deleteMany({});

    await prisma.securityLog.create({
      data: {
        // H-2 FIX: Include userId at top level for proper log attribution
        userId: req.user.id,
        action: 'FORCE_LOGOUT_ALL',
        ipAddress: req.ip,
        details: { adminId: req.user.id }
      }
    });

    return successResponse(res, 'All users have been logged out', {}, 200);
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Safe integer clamping
    let take = parseInt(limit, 10);
    if (!Number.isFinite(take) || take < 1) take = 10;
    // H-7 FIX: Capped at 200 to prevent DoS against the database
    if (take > 200) take = 200;

    let currentPage = parseInt(page, 10);
    if (!Number.isFinite(currentPage) || currentPage < 1) currentPage = 1;

    // totalItems = filteredItems (audit logs have no additional filters)
    const totalItems = await prisma.securityLog.count();
    const totalPages = Math.max(1, Math.ceil(totalItems / take));
    if (currentPage > totalPages) currentPage = totalPages;

    const skip = (currentPage - 1) * take;

    const logs = await prisma.securityLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });

    return successResponse(res, 'Audit logs retrieved', {
      logs,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        filteredItems: totalItems,
        itemsPerPage: take,
        pageSize: take,
      }
    }, 200);
  } catch (error) {
    next(error);
  }
});

export default router;
