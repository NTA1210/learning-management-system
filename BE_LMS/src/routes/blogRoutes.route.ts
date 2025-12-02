import upload from '@/config/multer';
import {
  createBlogHandler,
  deleteBlogHandler,
  getAllBlogsHandler,
  getBlogBySlugHandler,
  updateBlogHandler,
} from '@/controller/blog.controller';
import { authenticate, authorize } from '@/middleware';
import { Role } from '@/types';
import { Router } from 'express';

// prefix: /blogs
const blogRoutes = Router();

blogRoutes.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  upload.fields([
    { name: 'thumbnailUrl', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ]),
  createBlogHandler
);

blogRoutes.get('/', getAllBlogsHandler);
blogRoutes.get('/:slug', getBlogBySlugHandler);
blogRoutes.delete('/:blogId', authenticate, authorize(Role.ADMIN), deleteBlogHandler);
blogRoutes.put(
  '/:blogId',
  authenticate,
  authorize(Role.ADMIN),
  upload.fields([
    { name: 'thumbnailUrl', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ]),
  updateBlogHandler
);

export default blogRoutes;
