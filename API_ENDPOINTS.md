# API Endpoints - SortMyScene

## Authentication (`/api/auth`)

### Register
- **POST** `/api/auth/register`
- **Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Response**: 
  ```json
  {
    "user": { "id": 1, "email": "user@example.com" },
    "message": "Registration successful. Please check your email to verify your account.",
    "emailVerificationRequired": true
  }
  ```

### Login
- **POST** `/api/auth/login`
- **Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Response**: `{ "user": { "id": 1, "email": "user@example.com" } }`

### Logout
- **POST** `/api/auth/logout`
- **Response**: `{ "message": "Logged out successfully" }`

### Get Current User
- **GET** `/api/auth/me` (requires auth)
- **Response**: `{ "id": 1, "email": "user@example.com", "is_admin": false, ... }`

### Get Providers Status
- **GET** `/api/auth/providers`
- **Response**: 
  ```json
  {
    "spotify": { "enabled": true },
    "deezer": { "enabled": true },
    "youtube": { "enabled": true }
  }
  ```

### Google OAuth
- **GET** `/api/auth/google` - Initiate login
- **GET** `/api/auth/google/callback` - Callback endpoint

### Spotify OAuth
- **GET** `/api/auth/spotify` (requires auth) - Link account
- **GET** `/api/auth/spotify/callback` - Callback endpoint

### YouTube OAuth
- **GET** `/api/auth/youtube` (requires auth) - Link account
- **GET** `/api/auth/youtube/callback` - Callback endpoint

### Deezer OAuth
- **GET** `/api/auth/deezer` (requires auth) - Link account
- **GET** `/api/auth/deezer/callback` - Callback endpoint

---

## Email Verification (`/api/verification`)

### Send Verification Code
- **POST** `/api/verification/send-code` (requires auth)
- **Body**: (empty)
- **Response**: 
  ```json
  {
    "message": "Verification email sent successfully",
    "email": "user@example.com"
  }
  ```

### Verify Email Code
- **POST** `/api/verification/verify-code` (requires auth)
- **Body**: `{ "code": "ABC123" }`
- **Response**: `{ "message": "Email verified successfully" }`

### Get Verification Status
- **GET** `/api/verification/status` (requires auth)
- **Response**: 
  ```json
  {
    "email": "user@example.com",
    "verified": true
  }
  ```

---

## Playlists (`/api/playlists`)

### Get Playlists by Provider
- **GET** `/api/playlists/:provider` (requires auth)
- **Parameters**:
  - `provider`: `spotify` | `youtube` | `deezer`
- **Response**: Array of playlists
  ```json
  [
    {
      "id": "playlist123",
      "name": "My Playlist",
      "description": "...",
      "images": [...],
      "tracks": { "total": 50 }
    }
  ]
  ```

### Get Playlist Tracks
- **GET** `/api/playlists/:provider/:playlistId/tracks` (requires auth)
- **Parameters**:
  - `provider`: `spotify` | `youtube` | `deezer`
  - `playlistId`: Playlist ID from the provider
- **Response**: Array of tracks
  ```json
  [
    {
      "id": "track123",
      "name": "Song Name",
      "artists": [...],
      "album": {...},
      "duration_ms": 180000
    }
  ]
  ```

---

## Tracks (`/api/tracks`)

### Get All Tracks (with sorting and filtering)
- **GET** `/api/tracks` (requires auth)
- **Query Parameters**:
  - `sceneId`: Scene ID (optional, if not provided gets all user scenes)
  - `sortBy`: `popularity` | `alphabetical` | `duration_asc` | `duration_desc` | `artist` | `recent`
  - `minDuration`: Minimum duration in ms (optional)
  - `maxDuration`: Maximum duration in ms (optional)
  - `minPopularity`: Minimum popularity 0-100 (optional)
  - `artist`: Artist name search (optional)
  - `title`: Track title search (optional)
  - `provider`: `spotify` | `youtube` | `deezer` (optional)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "scene_id": 1,
        "provider": "spotify",
        "platform_id": "track123",
        "title": "Song Name",
        "artist": "Artist Name",
        "duration_ms": 180000,
        "popularity": 75,
        "album_art": "...",
        "metadata": {}
      }
    ],
    "stats": {
      "total": 42,
      "averageDuration": 210000,
      "averagePopularity": 68,
      "totalDuration": 8820000,
      "minDuration": 120000,
      "maxDuration": 420000
    },
    "sortBy": "popularity",
    "filters": {}
  }
  ```

### Get Track by ID
- **GET** `/api/tracks/:id` (requires auth)
- **Response**: Single track object

### Create Track
- **POST** `/api/tracks` (requires auth)
- **Body**:
  ```json
  {
    "scene_id": 1,
    "platform_id": "spotify_123",
    "title": "Song Name",
    "artist": "Artist Name",
    "provider": "spotify",
    "duration_ms": 180000,
    "popularity": 75,
    "album_art": "...",
    "metadata": {}
  }
  ```

### Update Track
- **PUT** `/api/tracks/:id` (requires auth)
- **Body**: Same as create

### Delete Track
- **DELETE** `/api/tracks/:id` (requires auth)
- **Response**: 204 No Content

---

## Scenes (`/api/scenes`)

### Get All Scenes
- **GET** `/api/scenes` (requires auth)
- **Response**: Array of scenes

### Get Scene by ID
- **GET** `/api/scenes/:id` (requires auth)
- **Response**: Single scene object

### Create Scene
- **POST** `/api/scenes` (requires auth)
- **Body**:
  ```json
  {
    "name": "Scene Name",
    "description": "Scene description",
    "seed_tracks": [...],
    "sort_criteria": "popularity"
  }
  ```

### Update Scene
- **PUT** `/api/scenes/:id` (requires auth)
- **Body**: Same as create

### Delete Scene
- **DELETE** `/api/scenes/:id` (requires auth)
- **Response**: 204 No Content

---

## Users (`/api/users`)

### Get Current User Profile
- **GET** `/api/users/me` (requires auth)
- **Response**: Complete user object

### Update User Profile
- **PUT** `/api/users/me` (requires auth)
- **Body**:
  ```json
  {
    "theme": "dark",
    "language": "en"
  }
  ```

---

## OAuth Tokens (`/api/tokens`)

### Get Token by Provider
- **GET** `/api/tokens/:provider` (requires auth)
- **Parameters**:
  - `provider`: `spotify` | `youtube` | `deezer`
- **Response**: Token object or null
  ```json
  {
    "id": 1,
    "user_id": 1,
    "provider": "spotify",
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
  ```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "message": "Error description",
  "error": "error_code"
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **204**: No Content (success, no response body)
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict (e.g., email already exists)
- **500**: Internal Server Error
- **503**: Service Unavailable

---

## Authentication

All endpoints marked with **(requires auth)** require:
- Either a valid JWT token in the `Authorization` header: `Bearer <token>`
- Or a valid auth cookie set by the server

The auth token is automatically set as a cookie on login/register.

---

## Rate Limiting

- **Deezer API**: 50 requests per 5 seconds (built-in rate limiter)
- **Spotify API**: Subject to Spotify's rate limits
- **YouTube API**: Subject to YouTube's rate limits

---

## Example Usage (JavaScript/Fetch)

```javascript
// Login
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});

// Get playlists
const playlistsRes = await fetch('/api/playlists/spotify', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
});

// Get tracks with sorting
const tracksRes = await fetch('/api/tracks?sceneId=1&sortBy=popularity&minPopularity=50', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
});

// Verify email
const verifyRes = await fetch('/api/verification/verify-code', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'ABC123' })
});
```

---

## Health Checks

### API Health
- **GET** `/api/health`
- **Response**: `{ "status": "ok" }`

### Database Health
- **GET** `/api/health/db`
- **Response**: `{ "status": "ok", "database": "up" }`
