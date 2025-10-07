# Deploy Test Credits Feature to Production

## Overview
The Test Credits Management feature for admin panel has been developed but needs to be deployed to production.

## Files Added/Modified

### Backend Files:
- ✅ `backend/src/controllers/admin.testCredits.controller.js` - New controller with all test credit operations
- ✅ `backend/src/routes/admin.testCredits.routes.js` - New routes file (not used, routes in admin.routes.js)
- ✅ `backend/src/routes/admin.routes.js` - Added test credits routes (lines 678-735)

### Frontend Files:
- ✅ `frontend/src/services/admin.service.js` - New service with 8 test credit methods
- ✅ `frontend/src/pages/AdminTestCredits.jsx` - New admin page component
- ✅ `frontend/src/pages/AdminTestCredits.css` - Styling for test credits page
- ✅ `frontend/src/main.jsx` - Added route
- ✅ `frontend/src/components/AdminHeader.jsx` - Added navigation link

## Deployment Steps

### 1. Push Backend Changes
```bash
cd /Users/jamesmcewen/Documents/sexy-selfies
git status
git add backend/src/controllers/admin.testCredits.controller.js
git add backend/src/routes/admin.routes.js
git commit -m "Add test credits management backend routes and controller"
git push origin main
```

### 2. Push Frontend Changes (Already Committed)
```bash
# Already committed in previous commits:
# - "Add AdminHeader, MainFooter, and BottomNavigation to AdminTestCredits page"
# - "Fix AdminTestCredits styling - Complete rewrite with proper class naming convention"
# - "Improve AdminTestCredits grant credits error handling and success messages"

# Just need to push
git push origin main
```

### 3. Trigger Render Redeploy

**Option A: Automatic Deploy (if auto-deploy enabled)**
- Render will automatically detect the push and redeploy both services
- Wait 5-10 minutes for deployment

**Option B: Manual Deploy**
1. Go to https://dashboard.render.com
2. Find `sexyselfies-api` service (backend)
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for backend to finish
5. Find `sexyselfies-frontend` service
6. Click "Manual Deploy" → "Deploy latest commit"
7. Wait for frontend to finish

### 4. Verify Deployment

Test the endpoints after deployment:

```bash
# Test backend health
curl https://sexyselfies-api.onrender.com/api/v1/health

# Test admin routes (should return 401 without auth)
curl https://sexyselfies-api.onrender.com/api/v1/admin/test-credits/members
```

### 5. Test in Production

1. Go to https://sexyselfies-frontend.onrender.com/admin/login
2. Login as admin
3. Navigate to Test Credits page from menu
4. Try granting test credits to a member
5. Verify success message appears
6. Check member list updates with new balance

## API Endpoints Added

All require admin authentication:

```
POST   /api/v1/admin/test-credits/grant         - Grant credits to member
POST   /api/v1/admin/test-credits/deduct        - Deduct credits from member
POST   /api/v1/admin/test-credits/set           - Set exact balance
POST   /api/v1/admin/test-credits/bulk-grant    - Grant to multiple members
POST   /api/v1/admin/test-credits/reset-all     - Reset all test credits
GET    /api/v1/admin/test-credits/balance/:id   - Get member balance
GET    /api/v1/admin/test-credits/members       - List members with test credits
GET    /api/v1/admin/test-credits/transactions  - Get test transaction history
```

## Troubleshooting

### 404 Errors
- Backend not deployed with new routes
- Check Render logs for deployment errors
- Verify routes are mounted in server.js

### 408 Timeout
- Render free tier service might be sleeping
- First request can take 30-60 seconds to wake up
- Try again after initial wake-up

### No Success Message
- Check browser console for errors
- Verify API response structure
- Check network tab in DevTools

## Current Status

- ✅ Backend code ready
- ✅ Frontend code ready
- ✅ Local testing complete
- ❌ Production deployment pending
- ❌ Production testing pending

## Next Steps

1. Push all changes to GitHub
2. Wait for Render auto-deploy or trigger manual deploy
3. Test in production
4. Monitor for any errors in Render logs
