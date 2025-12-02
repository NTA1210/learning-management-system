import { NOT_FOUND } from '@/constants/http';
import { BlogModel } from '@/models';
import appAssert from '@/utils/appAssert';
import { prefixBlogImage } from '@/utils/filePrefix';
import { getKeyFromPublicUrl, removeFile, uploadFile } from '@/utils/uploadFile';
import { CreateBlogParams, GetBlogsParams } from '@/validators/blog.schemas';
import mongoose from 'mongoose';

/**
 * Create a new blog
 * @param  data - The blog data to be created
 * @param  userId - The user ID of the blog author
 * @returns  - The created blog
 * @throws  - If a blog with the same title already exists
 */
export const createBlog = async (
  { title, content, thumbnailUrl, authorName, avatar }: CreateBlogParams,
  userId: mongoose.Types.ObjectId
) => {
  const blog = await BlogModel.findOne({ title });
  appAssert(!blog, NOT_FOUND, 'Blog already exists');

  let thumbnailFile = thumbnailUrl;
  let avatarFile = avatar;
  if (thumbnailUrl) {
    const { publicUrl } = await uploadFile(thumbnailUrl, prefixBlogImage());
    thumbnailFile = publicUrl;
  }

  if (avatar) {
    const { publicUrl } = await uploadFile(avatar, prefixBlogImage());
    avatarFile = publicUrl;
  }

  return await BlogModel.create({
    title,
    content,
    thumbnailUrl: thumbnailFile,
    authorName: authorName,
    avatar: avatarFile,
    userId,
  });
};

/**
 * Retrieve all blogs with optional search and pagination
 * @param  params - The parameters for retrieving blogs
 * @param  params.page - The page number to retrieve (1-indexed)
 * @param  params.limit - The number of blogs to retrieve per page
 * @param  params.search - The search query to filter blogs by title
 * @returns blogs
 */
export const getAllBlogs = async ({ page, limit, search }: GetBlogsParams) => {
  const skip = (page - 1) * limit;
  const query = search ? { title: { $regex: search, $options: 'i' } } : {};
  const [blogs, total] = await Promise.all([
    BlogModel.find(query).skip(skip).limit(limit).lean(),
    BlogModel.countDocuments(query),
  ]);

  // Pagination Metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return { blogs, pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } };
};

/**
 * Retrieve a blog by its slug.
 * @param  slug - The slug of the blog to retrieve
 * @returns  - The retrieved blog
 * @throws  - If the blog is not found
 */
export const getBlogBySlug = async (slug: string) => {
  const blog = await BlogModel.findOne({ slug });
  appAssert(blog, NOT_FOUND, 'Blog not found');
  return blog;
};

/**
 * Deletes a blog by its ID.
 * @param  blogId - The ID of the blog to delete
 * @returns  - The deleted blog
 * @throws  - If the blog is not found
 */
export const deleteBlog = async (blogId: string) => {
  const blog = await BlogModel.findByIdAndDelete(blogId);
  appAssert(blog, NOT_FOUND, 'Blog not found');

  if (blog.thumbnailUrl) {
    await removeFile(getKeyFromPublicUrl(blog.thumbnailUrl));
  }
  if (blog.avatar) {
    await removeFile(getKeyFromPublicUrl(blog.avatar));
  }

  return blog;
};

/**
 * Updates a blog by its ID.
 * @param blogId - The ID of the blog to update
 * @param data - The data to update the blog with
 * @returns The updated blog
 * @throws If the blog is not found
 */
export const updateBlog = async (
  blogId: string,
  { title, content, thumbnailUrl, authorName, avatar }: Partial<CreateBlogParams>
) => {
  const blog = await BlogModel.findById(blogId);
  appAssert(blog, NOT_FOUND, 'Blog not found');

  if (thumbnailUrl) {
    if (blog.thumbnailUrl) {
      await removeFile(getKeyFromPublicUrl(blog.thumbnailUrl));
    }
    const { publicUrl } = await uploadFile(thumbnailUrl, prefixBlogImage());
    blog.thumbnailUrl = publicUrl;
  }

  if (avatar) {
    if (blog.avatar) {
      await removeFile(getKeyFromPublicUrl(blog.avatar));
    }
    const { publicUrl } = await uploadFile(avatar, prefixBlogImage());
    blog.avatar = publicUrl;
  }

  blog.title = title || blog.title;
  blog.content = content || blog.content;
  blog.authorName = authorName || blog.authorName;
  await blog.save();

  return blog;
};
