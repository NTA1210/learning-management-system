export interface Subject {
  _id: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  credits?: number;
  specialistIds?: string[];
  isActive?: boolean;
  prerequisites?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}


