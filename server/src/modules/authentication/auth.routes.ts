import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { requireAuth, requireRole, SocUserRole } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { validateBody } from '../../middleware/validate.js';
import {
  createUser,
  getPermissionsForRole,
  listUsers,
  loginUser,
  logoutSession,
  updateUserStatus
} from './auth.service.js';

const router = Router();

const RoleEnum = z.enum([
  'Security Administrator',
  'SOC Analyst',
  'Incident Responder',
  'Auditor',
  'Management / Read-only Viewer'
]);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const CreateUserSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: RoleEnum,
  department: z.string().min(2).max(255),
  status: z.enum(['Active', 'Inactive', 'Disabled']).optional()
});

const UpdateUserStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive', 'Disabled'])
});

router.post('/auth/login', authRateLimiter, validateBody(LoginSchema), async (req, res, next) => {
  try {
    const result = await loginUser({
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.cookie(env.sessionCookieName, result.sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookieSecure,
      maxAge: env.sessionTtlHours * 3600 * 1000,
      path: '/'
    });

    res.json({
      user: result.user,
      permissions: result.permissions,
      expiresAt: result.expiresAt,
      sessionToken: result.sessionToken
    });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/logout', requireAuth, async (req, res, next) => {
  try {
    if (req.user) {
      await logoutSession(req.user.sessionId, req.user);
    }
    res.clearCookie(env.sessionCookieName, { path: '/' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: 'Active',
      lastLogin: new Date().toISOString()
    },
    permissions: getPermissionsForRole(user.role as SocUserRole)
  });
});

router.get(
  '/users',
  requireAuth,
  requireRole('Security Administrator', 'SOC Analyst', 'Incident Responder', 'Auditor'),
  async (_req, res, next) => {
    try {
      const users = await listUsers();
      res.json({ users });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/users',
  requireAuth,
  requireRole('Security Administrator'),
  validateBody(CreateUserSchema),
  async (req, res, next) => {
    try {
      const created = await createUser(req.body, req.user!);
      res.status(201).json({ user: created });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/users/:id/status',
  requireAuth,
  requireRole('Security Administrator'),
  validateBody(UpdateUserStatusSchema),
  async (req, res, next) => {
    try {
      const updated = await updateUserStatus(String(req.params.id), req.body.status, req.user!);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
