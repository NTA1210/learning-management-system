import {Router} from "express";
import {
    listForumsHandler,
    getForumByIdHandler,
    createForumHandler,
    updateForumByIdHandler,
    deleteForumByIdHandler,
    listForumPostsHandler,
    getForumPostByIdHandler,
    createForumPostHandler,
    updateForumPostByIdHandler,
    deleteForumPostByIdHandler,
    listForumRepliesHandler,
    getForumReplyByIdHandler,
    createForumReplyHandler,
    updateForumReplyByIdHandler,
    deleteForumReplyByIdHandler,
} from "../controller/forum.controller";

const forumPublicRoutes = Router();
const forumProtectedRoutes = Router();

// prefix: /forums

// ============= FORUM ROUTES =============

// Public routes (read-only)
// GET /forums?courseId=xxx - List all forums in a course
forumPublicRoutes.get("/", listForumsHandler);

// GET /forums/:id - Get forum detail by ID
forumPublicRoutes.get("/:id", getForumByIdHandler);

// Protected routes (authenticated users)
// POST /forums - Create a new forum (teachers/admins only)
forumProtectedRoutes.post("/", createForumHandler);

// PATCH /forums/:id - Update forum by ID (teachers/admins only)
forumProtectedRoutes.patch("/:id", updateForumByIdHandler);

// DELETE /forums/:id - Delete forum by ID (teachers/admins only)
forumProtectedRoutes.delete("/:id", deleteForumByIdHandler);

// ============= FORUM POST ROUTES =============

// GET /forums/:forumId/posts - List all posts in a forum
forumPublicRoutes.get("/:forumId/posts", listForumPostsHandler);

// GET /forums/:forumId/posts/:id - Get post detail by ID
forumPublicRoutes.get("/:forumId/posts/:id", getForumPostByIdHandler);

// POST /forums/:forumId/posts - Create a new post (authenticated users)
forumProtectedRoutes.post("/:forumId/posts", createForumPostHandler);

// PATCH /forums/:forumId/posts/:id - Update post by ID (post author only)
forumProtectedRoutes.patch("/:forumId/posts/:id", updateForumPostByIdHandler);

// DELETE /forums/:forumId/posts/:id - Delete post by ID (post author only)
forumProtectedRoutes.delete("/:forumId/posts/:id", deleteForumPostByIdHandler);

// ============= FORUM REPLY ROUTES =============

// GET /forums/:forumId/posts/:postId/replies - List all replies in a post
forumPublicRoutes.get("/:forumId/posts/:postId/replies", listForumRepliesHandler);

// GET /forums/:forumId/posts/:postId/replies/:id - Get reply detail by ID
forumPublicRoutes.get("/:forumId/posts/:postId/replies/:id", getForumReplyByIdHandler);

// POST /forums/:forumId/posts/:postId/replies - Create a new reply (authenticated users)
forumProtectedRoutes.post("/:forumId/posts/:postId/replies", createForumReplyHandler);

// PATCH /forums/:forumId/posts/:postId/replies/:id - Update reply by ID (reply author only)
forumProtectedRoutes.patch("/:forumId/posts/:postId/replies/:id", updateForumReplyByIdHandler);

// DELETE /forums/:forumId/posts/:postId/replies/:id - Delete reply by ID (reply author only)
forumProtectedRoutes.delete("/:forumId/posts/:postId/replies/:id", deleteForumReplyByIdHandler);

export {forumPublicRoutes, forumProtectedRoutes};

