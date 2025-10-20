# Course API Documentation

## List Courses

Get a paginated list of courses with optional filtering and search.

### Endpoint
```
GET /courses
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (must be > 0) |
| `limit` | number | No | 10 | Items per page (1-100) |
| `search` | string | No | - | Search in title or description |
| `category` | string | No | - | Filter by category ID |
| `isPublished` | boolean | No | - | Filter by published status |
| `sortBy` | string | No | createdAt | Sort field: `createdAt`, `title`, `updatedAt` |
| `sortOrder` | string | No | desc | Sort order: `asc` or `desc` |

### Response Format

```json
{
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "course_id",
      "title": "Course Title",
      "code": "CS101",
      "description": "Course description",
      "category": {
        "_id": "category_id",
        "name": "Category Name",
        "slug": "category-slug",
        "description": "Category description"
      },
      "teachers": [
        {
          "_id": "teacher_id",
          "username": "teacher_username",
          "email": "teacher@example.com",
          "fullname": "Teacher Name",
          "avatar_url": "https://..."
        }
      ],
      "isPublished": true,
      "capacity": 30,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Example Requests

#### Get first page with default settings
```bash
GET /courses
```

#### Search for courses
```bash
GET /courses?search=javascript&page=1&limit=20
```

#### Filter by category and published status
```bash
GET /courses?category=64abc123def456&isPublished=true
```

#### Sort by title ascending
```bash
GET /courses?sortBy=title&sortOrder=asc
```

#### Combine multiple filters
```bash
GET /courses?search=web&category=64abc123def&isPublished=true&page=2&limit=15&sortBy=createdAt&sortOrder=desc
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 500 | Internal Server Error |

### Notes

- This endpoint is **public** (no authentication required)
- Teachers and category information are automatically populated
- Search is case-insensitive and searches both title and description
- Maximum limit is 100 items per page

