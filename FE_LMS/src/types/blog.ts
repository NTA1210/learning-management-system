export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  thumbnailUrl: string;
  authorName: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
}

export interface BlogListResponse {
  data: BlogPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}

export interface BlogDetailResponse {
  data: BlogPost;
  message: string;
}

export interface CreateBlogResponse {
  data: BlogPost;
  message: string;
}

export interface UpdateBlogResponse {
  data: BlogPost;
  message: string;
}

export interface DeleteBlogResponse {
  message: string;
}
