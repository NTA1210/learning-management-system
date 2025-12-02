import http from "../utils/http";
import type {
  BlogListResponse,
  BlogDetailResponse,
  CreateBlogResponse,
  UpdateBlogResponse,
  DeleteBlogResponse,
} from "../types/blog";

export const getBlogs = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<BlogListResponse> => {
  const response = await http.get("/blogs", { params });
  return response as unknown as BlogListResponse;
};

export const getBlogBySlug = async (slug: string): Promise<BlogDetailResponse> => {
  const response = await http.get(`/blogs/${slug}`);
  return response as unknown as BlogDetailResponse;
};

export const createBlog = async (formData: FormData): Promise<CreateBlogResponse> => {
  const response = await http.post("/blogs", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response as unknown as CreateBlogResponse;
};

export const updateBlog = async (
  blogId: string,
  formData: FormData
): Promise<UpdateBlogResponse> => {
  const response = await http.put(`/blogs/${blogId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response as unknown as UpdateBlogResponse;
};

export const deleteBlog = async (blogId: string): Promise<DeleteBlogResponse> => {
  const response = await http.del(`/blogs/${blogId}`);
  return response as unknown as DeleteBlogResponse;
};
