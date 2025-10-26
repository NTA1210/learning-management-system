import { Role } from "@/types";

export function formatUserResponse(user: any, viewerRole: Role) {
  // base info (ai cũng thấy)
  const base = {
    _id: user._id,
    fullname: user.fullname,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role,
    isEnrolled: user.isEnrolled ?? false,
  };

  if (viewerRole === Role.TEACHER) {
    return {
      ...base,
      email: user.email,
      phone_number: user.phone_number,
    };
  }

  if (viewerRole === Role.ADMIN) {
    const { password, __v, ...rest } = user;
    return rest;
  }

  return base;
}
