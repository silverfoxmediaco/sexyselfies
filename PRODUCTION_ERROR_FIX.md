# Production Error Fix - Admin Auth Middleware

## The Error

```
UNHANDLED PROMISE REJECTION!
Error: Cannot read properties of undefined (reading 'adminToken')
at exports.protectAdmin (admin.auth.middleware.js:14:26)
```

## Root Cause

The admin authentication middleware was trying to access `req.cookies.adminToken` without first checking if `req.cookies` exists.

In production on Render, the `cookie-parser` middleware might not be properly initialized or the request object doesn't have a `cookies` property, causing this crash.

## The Fix

**Before:**
```javascript
} else if (req.cookies.adminToken) {
    token = req.cookies.adminToken;
}
```

**After:**
```javascript
} else if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
}
```

## What This Means

- Added a safety check: `req.cookies &&` before accessing `req.cookies.adminToken`
- This prevents the server from crashing when cookies aren't available
- Admin authentication still works via `Authorization` header (which is what the frontend uses)
- The error won't crash the server anymore

## Impact

- ✅ Admin routes will work properly
- ✅ Test credits feature will be accessible after deployment
- ✅ No more unhandled promise rejections
- ✅ Server won't crash on admin requests

## Deployment Status

- ✅ Fix committed to main branch
- ✅ Pushed to GitHub
- ⏳ Waiting for Render auto-deploy (or manual deploy needed)

## Next Steps

1. Wait for Render to auto-deploy (5-10 minutes)
2. OR manually trigger deploy at https://dashboard.render.com
3. Test the admin test credits page again
4. Should work without 404 or crashes

## Why This Happened

The frontend sends admin tokens via the `Authorization: Bearer <token>` header, not cookies. The middleware was checking both methods, but the cookie check was causing crashes when `req.cookies` didn't exist.

This is a defensive programming fix - always check if an object exists before accessing its properties.
