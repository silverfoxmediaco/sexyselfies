# Test Test Credits Feature Locally

## Quick Setup

### 1. Update Frontend to Use Local Backend

Edit `frontend/.env.local` (already set):
```env
VITE_API_URL=http://localhost:5002/api/v1
```

### 2. Start Backend (Already Running)
```bash
cd backend
npm run dev
# Running on http://localhost:5002
```

### 3. Start Frontend in Local Mode
```bash
cd frontend
npm run dev -- --mode local
```

OR just use the already running dev server at http://localhost:5173

### 4. Access Local Admin
http://localhost:5173/admin/login

### 5. Grant Test Credits
1. Login as admin
2. Go to Test Credits page
3. Enter a member ID
4. Grant credits
5. Should see success message immediately

## Get a Member ID

### Method 1: Check Database
```javascript
// In MongoDB Compass or Atlas
db.members.findOne({}, {_id: 1, username: 1, email: 1})
```

### Method 2: Create Test Member via API
```bash
# Register a test member
curl -X POST http://localhost:5002/api/v1/auth/member/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testmember@test.com",
    "password": "Test123!",
    "username": "testuser",
    "gender": "male"
  }'
```

The response will include the member ID.

### Method 3: Check Admin Users Page
1. Go to http://localhost:5173/admin/users
2. Find a member
3. Copy their ID from the table

## Testing Flow

1. **Grant Credits**: Admin grants $10 test credits to member
2. **Check Member**: View member in admin panel - should show $10 test credits
3. **Use Credits**: Login as that member, purchase content
4. **Verify**:
   - Member's test credits reduced
   - Content unlocked
   - Transaction created with `isTestTransaction: true`
   - Shows in Test Transactions tab

## Production Testing (After Deploy)

Once deployed to Render:
1. Go to https://sexyselfies-frontend.onrender.com/admin/login
2. Same flow as above
3. First request might take 30-60 seconds (Render cold start)
