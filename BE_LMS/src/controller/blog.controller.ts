import { BAD_REQUEST, CREATED, OK } from '@/constants/http';
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
} from '@/services/blog.service';
import appAssert from '@/utils/appAssert';
import { catchErrors } from '@/utils/asyncHandler';
import {
  blogIdSchema,
  createBlogSchema,
  getBlogsSchema,
  slugSchema,
} from '@/validators/blog.schemas';

// POST /blogs - Create a new blog
export const createBlogHandler = catchErrors(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const thumbnailFile = files['thumbnailUrl']?.[0];
  const avatarFile = files['avatar']?.[0];

  if (thumbnailFile) {
    appAssert(
      ['image/jpeg', 'image/png'].includes(thumbnailFile.mimetype), // check file type
      BAD_REQUEST,
      'Only image files are allowed'
    );
  }

  if (avatarFile) {
    appAssert(
      ['image/jpeg', 'image/png'].includes(avatarFile.mimetype), // check file type
      BAD_REQUEST,
      'Only image files are allowed'
    );
  }

  const input = createBlogSchema.parse({
    ...req.body,
    thumbnailUrl: thumbnailFile,
    avatar: avatarFile,
  });
  const userId = req.userId;

  const data = await createBlog(input, userId);

  return res.success(CREATED, {
    data,
    message: 'Blog created successfully',
  });
});

// GET /blogs
export const getAllBlogsHandler = catchErrors(async (req, res) => {
  const input = getBlogsSchema.parse(req.query);
  const { blogs, pagination } = await getAllBlogs(input);
  return res.success(OK, {
    data: blogs,
    pagination,
    message: 'Blogs retrieved successfully',
  });
});

// GET /blogs/:slug
export const getBlogBySlugHandler = catchErrors(async (req, res) => {
  const slug = slugSchema.parse(req.params.slug);
  const blog = await getBlogBySlug(slug);
  return res.success(OK, {
    data: blog,
    message: 'Blog retrieved successfully',
  });
});

// DELETE /blogs/:blogId
export const deleteBlogHandler = catchErrors(async (req, res) => {
  const blogId = blogIdSchema.parse(req.params.blogId);

  await deleteBlog(blogId);
  return res.success(OK, {
    message: 'Blog deleted successfully',
  });
});

// PUT /blogs/:blogId
export const updateBlogHandler = catchErrors(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const thumbnailFile = files['thumbnailUrl']?.[0];
  const avatarFile = files['avatar']?.[0];

  if (thumbnailFile) {
    appAssert(
      ['image/jpeg', 'image/png'].includes(thumbnailFile.mimetype), // check file type
      BAD_REQUEST,
      'Only image files are allowed'
    );
  }

  if (avatarFile) {
    appAssert(
      ['image/jpeg', 'image/png'].includes(avatarFile.mimetype), // check file type
      BAD_REQUEST,
      'Only image files are allowed'
    );
  }

  const blogId = blogIdSchema.parse(req.params.blogId);
  const input = createBlogSchema.parse({
    ...req.body,
    thumbnailUrl: thumbnailFile,
    avatar: avatarFile,
  });

  const data = await updateBlog(blogId, input);

  return res.success(OK, {
    data,
    message: 'Blog updated successfully',
  });
});
