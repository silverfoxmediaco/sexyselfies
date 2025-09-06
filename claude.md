# SexySelfies PWA - Project Context

## 🚀 Project Overview
- **Name**: SexySelfies
- **Type**: Mobile-first Progressive Web App (PWA)
- **Stack**: MERN (MongoDB, Express, React, Node.js)
- **Core Concept**: Content monetization platform combining Tinder's swipe-to-match discovery with OnlyFans' creator economy, focused on authentic amateur content
- **Target Users**: 100% mobile users (except admins who use desktop)
- **Content Standards**: "Instagram Plus" - sexy but not pornographic (lingerie, implied nudity allowed; explicit content prohibited)

## 👨‍💻 Developer Preferences & Rules
**IMPORTANT - Always follow these rules:**
- **Framework**: React ONLY with MERN stack
- **Code Delivery**: ALWAYS provide complete files (never fragments unless explicitly requested)
- **Modifications**: ONLY change code that is explicitly requested
- **Code Style**: NO emojis in code unless specifically asked
- **Approach**: User-centric UX/UI with mobile-first responsive design
- **Responsiveness**: 100% mobile and tablet responsive required
- **CSS Classes**: ALWAYS use unique className identifiers for each component to avoid global styling conflicts (e.g., `CreatorProfile-header` not just `header`)

## 📁 Complete Project Structure (423 files)

```
sexy-selfies/
├── backend/                          # Express.js API (Port 5002)
│   ├── src/
│   │   ├── config/ (2 files)
│   │   │   ├── cloudinary.js       # Media storage config
│   │   │   └── database.js         # MongoDB connection
│   │   │
│   │   ├── controllers/ (24 files)
│   │   │   ├── admin.*.controller.js (auth, moderation)
│   │   │   ├── auth.controller.js
│   │   │   ├── connections.controller.js
│   │   │   ├── content.controller.js
│   │   │   ├── creator.*.controller.js (7 files)
│   │   │   │   ├── analytics, connection, content
│   │   │   │   ├── earnings, message, profile
│   │   │   │   └── creatorSales
│   │   │   ├── member.*.controller.js (3 files)
│   │   │   ├── notification.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── payout.controller.js
│   │   │   ├── transaction.controller.js
│   │   │   ├── upload.controller.js
│   │   │   ├── verification.controller.js
│   │   │   └── webhook.controller.js
│   │   │
│   │   ├── models/ (26 files)
│   │   │   ├── Admin.js, AdminReport.js
│   │   │   ├── AnalyticsEvent.js
│   │   │   ├── Connections.js
│   │   │   ├── Content.js
│   │   │   ├── Creator*.js (8 files)
│   │   │   ├── Member*.js (4 files)
│   │   │   ├── Message.js, Notification.js
│   │   │   ├── PayoutRequest.js
│   │   │   ├── Report.js, SpecialOffer.js
│   │   │   ├── Transaction.js
│   │   │   └── User.js, UserViolation.js
│   │   │
│   │   ├── routes/ (19 files)
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── connections.routes.js
│   │   │   ├── content.routes.js
│   │   │   ├── creator*.routes.js (2 files)
│   │   │   ├── member*.routes.js (3 files)
│   │   │   ├── notification.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── payout.routes.js
│   │   │   ├── public.routes.js
│   │   │   ├── transaction.routes.js
│   │   │   ├── upload.routes.js
│   │   │   ├── verification.routes.js
│   │   │   └── webhook.routes.js
│   │   │
│   │   ├── middleware/ (15 files)
│   │   │   ├── admin.auth.middleware.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── cache.middleware.js
│   │   │   ├── cors.middleware.js
│   │   │   ├── database.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── logging.middleware.js
│   │   │   ├── privacy.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   ├── salesLimits.middleware.js
│   │   │   ├── unlock.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   └── verification.middleware.js
│   │   │
│   │   ├── services/ (6 files)
│   │   │   ├── analytics.service.js
│   │   │   ├── connections.service.js
│   │   │   ├── memberScoring.service.js
│   │   │   ├── notification.service.js
│   │   │   └── payment.service.js
│   │   │
│   │   ├── sockets/ (3 files)
│   │   │   ├── creatorSales.socket.js
│   │   │   ├── memberActivity.socket.js
│   │   │   └── messaging.socket.js
│   │   │
│   │   ├── jobs/ (3 files)
│   │   │   ├── cleanup.job.js
│   │   │   ├── memberAnalytics.job.js
│   │   │   └── salesDigest.job.js
│   │   │
│   │   ├── utils/ (6 files)
│   │   │   ├── memberSegmentation.js
│   │   │   ├── moderation.js
│   │   │   ├── notifications.js
│   │   │   ├── payment.js
│   │   │   ├── privacyFilters.js
│   │   │   └── salesMetrics.js
│   │   │
│   │   ├── scripts/ (4 files)
│   │   │   ├── createSuperAdmin.js
│   │   │   ├── fixAdminPassword.js
│   │   │   ├── seedCreators.js
│   │   │   └── testAdminPassword.js
│   │   │
│   │   └── server.js               # Main server file
│   │
│   ├── test-*.js                   # Payment integration tests
│   ├── .env                        # Environment variables
│   └── package.json
│
├── frontend/                         # React + Vite (Ports 5173/5174)
│   ├── public/
│   │   ├── icons/                  # PWA icons
│   │   │   ├── actions/ (5 SVGs)   # UI action icons
│   │   │   ├── nav/ (4 SVGs)       # Navigation icons
│   │   │   ├── *-icon-*.png        # 50+ icon sizes for PWA
│   │   │   └── SS logo*.png        # Logo variations
│   │   │
│   │   ├── placeholders/           # Sample creator images (16 files)
│   │   ├── manifest.json           # PWA manifest ✅
│   │   ├── service-worker.js       # PWA service worker ✅
│   │   ├── offline.html            # Offline fallback ✅
│   │   └── _redirects              # Netlify/deployment redirects
│   │
│   ├── src/
│   │   ├── assets/ (40+ images)
│   │   │   ├── Sample content images
│   │   │   ├── Generated AI images
│   │   │   └── UI icons (back, share, more)
│   │   │
│   │   ├── components/ (50+ components)
│   │   │   ├── UI/                 # Base UI components
│   │   │   │   ├── Accordion, Button, Card
│   │   │   │   ├── Chip, Dialog, Icons
│   │   │   │   ├── LinearProgress, Snackbar
│   │   │   │   └── Typography
│   │   │   │
│   │   │   ├── Layout Components:
│   │   │   │   ├── AppLayout.jsx
│   │   │   │   ├── AdminHeader.jsx
│   │   │   │   ├── BottomNavigation.jsx
│   │   │   │   ├── MainHeader/Footer.jsx
│   │   │   │   └── CreatorMainHeader/Footer.jsx
│   │   │   │
│   │   │   ├── Core Features:
│   │   │   │   ├── SwipeCard.jsx
│   │   │   │   ├── CreatorProfileModal.jsx
│   │   │   │   ├── ConnectionModal.jsx
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   └── Library.jsx
│   │   │   │
│   │   │   ├── Landing Components:
│   │   │   │   ├── SwipeConnectMonetize.jsx
│   │   │   │   ├── WhyCreatorsLoveUs.jsx
│   │   │   │   ├── CreatorSuccessStories.jsx
│   │   │   │   ├── Features.jsx
│   │   │   │   ├── HowItWorks.jsx
│   │   │   │   └── SafetyAndStandards.jsx
│   │   │   │
│   │   │   └── Security:
│   │   │       ├── ProtectedAdminRoute.jsx
│   │   │       └── RouteProtection.jsx
│   │   │
│   │   ├── pages/ (50+ page components)
│   │   │   ├── Admin Pages (10):
│   │   │   │   ├── AdminDashboard, Login
│   │   │   │   ├── Users, Content, Reports
│   │   │   │   ├── Verifications, Payouts
│   │   │   │   └── Management
│   │   │   │
│   │   │   ├── Creator Pages (15):
│   │   │   │   ├── Registration, Login, VerifyID
│   │   │   │   ├── ProfileSetup, Profile, Preview
│   │   │   │   ├── Dashboard, ContentUpload
│   │   │   │   ├── Analytics, Earnings, Connections
│   │   │   │   └── ManageMembers, Settings
│   │   │   │
│   │   │   ├── Member Pages (15):
│   │   │   │   ├── Registration, Login
│   │   │   │   ├── Profile, Settings
│   │   │   │   ├── BrowseCreators, BrowseFilters
│   │   │   │   ├── SearchCreators, TrendingCreators
│   │   │   │   ├── Favorites, MyConnections
│   │   │   │   └── Messages, Chat
│   │   │   │
│   │   │   └── Landing Pages:
│   │   │       ├── LandingPage.jsx
│   │   │       └── LandingPageV2.jsx
│   │   │
│   │   ├── services/ (7 files)     # API service layer ✅
│   │   │   ├── api.config.js
│   │   │   ├── auth.service.js
│   │   │   ├── content.service.js
│   │   │   ├── creator.service.js
│   │   │   ├── member.service.js
│   │   │   ├── payment.service.js
│   │   │   └── socket.service.js
│   │   │
│   │   ├── hooks/ (4 custom hooks)
│   │   │   ├── useInfiniteScroll.js
│   │   │   ├── useOfflineStatus.js
│   │   │   ├── usePullToRefresh.js
│   │   │   └── useSwipeGesture.js
│   │   │
│   │   ├── utils/ (5 utilities)
│   │   │   ├── cache.js
│   │   │   ├── gestures.js
│   │   │   ├── mobileDetection.js
│   │   │   ├── notifications.js
│   │   │   └── storage.js
│   │   │
│   │   ├── styles/
│   │   │   └── responsive-widths.css
│   │   │
│   │   └── main.jsx                # App entry point
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── Brand basics.txt                 # Brand guidelines
├── Core Spacing System.txt          # Spacing documentation
├── README.md
├── REALTIME_MESSAGING.md
└── render.yaml                      # Deployment config
```

## 🎨 Design System

### Brand Colors
```css
/* Core Brand */
--primary: #17D2C2;          /* Teal */
--primary-600: #12B7AB;
--primary-700: #0FA093;
--primary-300: #47E0D2;
--primary-100: #CFF8F4;
--gradient: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%);

/* Dark Theme (Default) */
--bg-900: #0A0A0A;
--bg-800: #121212;
--surface-700: #1C1C1E;
--border-600: #2A2A2C;
--text-primary: #FFFFFF;
--text-secondary: #C7C7CC;
--muted: #8E8E93;

/* Feedback Colors */
--success: #22C55E;
--warning: #F59E0B;
--error: #EF4444;
--info: #38BDF8;
```

### Typography
- **Font**: Poppins (400, 500, 600, 700)
- **Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

### Spacing System (Mobile-First)
```css
/* 8-Point Grid */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;

/* Touch Targets */
--touch-target-min: 44px;    /* WCAG AA */
--touch-target-optimal: 48px; /* Best Practice */
```

### Container Widths
- Small: 640px
- Medium: 768px
- Large: 1024px
- XL: 1280px

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px

## 💼 Business Model & Strategy

### Revenue Model
- **Split**: 80% creator / 20% platform (industry-leading)
- **Pricing**: Micro-transactions only ($0.99-$3.99 per unlock)
- **No subscriptions**: Lower psychological barrier than $20+ monthly fees
- **DM Monetization**: $0.99-$9.99 for exclusive content via messages
- **Additional Revenue**: Tips, Super Likes ($1.99), Profile Boosts ($4.99)

### Content Guidelines
- **"Instagram Plus" Standards**: Sexy but not pornographic
- **Allowed**: Lingerie, implied nudity, censored content
- **Prohibited**: Full nudity, explicit content
- **Target Creators**: Casual creators who don't want to create porn
- **Target Users**: Those seeking authentic, relatable content over professional productions

### Market Positioning
- **vs OnlyFans**: Better discovery via swipe, no subscription walls, LGBTQ+ inclusive filtering
- **vs Dating Apps**: Monetization built-in, content-focused not dating-focused
- **vs Niche Platforms**: All orientations in one platform, consistent safety standards

### Financial Projections (Conservative)
- **Year 1**: $1.8M gross → $306K net platform revenue
- **Year 2**: $12M gross → $2.04M net platform revenue  
- **Year 3**: $45M gross → $7.65M net platform revenue
- **Year 5**: $150M gross → $25.5M net platform revenue

### Success Metrics
- **Daily Active Users**: Target 1,000 in month 1
- **Average Daily Spend**: $6-8 per user (including DM content)
- **Connection Rate**: 30%+ (higher with orientation matching)
- **Creator Retention**: 70% monthly active
- **Content Approval Rate**: 90%+
- **Chargeback Rate**: <1%

### User Types & Flows

1. **Members**
   - Swipe to discover creators (Tinder-style)
   - Match to unlock content
   - Pay per content piece
   - Privacy controls
   - Connection management

2. **Creators**
   - Upload content
   - Hunt high-value members (Revolutionary Active Sales)
   - Send special offers
   - Track analytics
   - Weekly payouts
   - Manage connections

3. **Admins**
   - Content moderation
   - User management
   - Verification processing
   - Platform analytics
   - Payout management

## 🎯 Key Features

### Creator Active Sales System ⭐
**Revolutionary - Creators become active salespeople:**
- Browse high-value members (whales/VIPs)
- AI-powered matchmaking
- Send personalized messages and offers
- Real-time sales dashboard
- Gamification with achievements
- Daily goals and leaderboards
- Segment targeting
- ROI tracking

### Discovery System
- **Swipe Interface**: Tinder-style unlimited free swipes
- **Smart Connection Algorithm**: Orientation-based matching
- **Advanced Filtering**:
  - Sexual Orientation: Straight, Gay, Bisexual, All
  - Gender: Male, Female, All
  - Body Type: Slim, Athletic, Average, Curvy, Plus-size
  - Location: Radius-based (5-100mi) or anywhere
  - Age Range: 18-24, 25-34, 35-44, 45+
  - Activity Status: Online now, active in last 24h/week
- **Connection Creation**: Mutual interest unlocks content and chat
- **Real-time Notifications**: Instant alerts for connections and messages

### Connection System (Not Match)
- **Terminology**: "Connections" not "Matches"
- Mutual interest creates connection
- Unlock content after connecting
- Message connected creators
- Connection management dashboard

### Real-time Features
- WebSocket messaging (Socket.io)
- Live notifications
- Online status tracking
- Real-time analytics
- Instant connection alerts

## 🏗️ Architecture Details

### Backend Services
- **Authentication**: JWT-based with refresh tokens
- **Payment**: CCBill integration (adult-friendly)
- **Storage**: Cloudinary for media
- **Database**: MongoDB with strategic indexing
- **Real-time**: Socket.io with namespaces
- **Jobs**: Node-cron scheduled tasks

### Frontend Architecture
- **Build**: Vite for fast development
- **Routing**: React Router v6
- **State**: Context API (consider Redux)
- **Styling**: CSS modules, mobile-first
- **PWA**: Full PWA with offline support

### Security Features
- Input sanitization
- Rate limiting per endpoint
- CSRF protection
- XSS prevention
- SQL injection prevention
- File upload validation
- GDPR compliance

## 🔧 Development Setup

### Environment Variables
```bash
# Backend (.env)
NODE_ENV=development
PORT=5002
MONGODB_URI=mongodb://localhost:27017/sexyselfies
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# CCBill
CCBILL_ACCOUNT=your-account
CCBILL_SUBACCOUNT=your-subaccount
CCBILL_SALT=your-salt

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASS=your-password

# Frontend (.env)
VITE_API_URL=http://localhost:5002
VITE_SOCKET_URL=ws://localhost:5002
```

### Commands
```bash
# Install all dependencies
npm install

# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Build for production
cd frontend && npm run build
```

## 📊 Current Status

### ✅ Completed
- Full backend API (100+ endpoints)
- All database models (26 schemas)
- Authentication & authorization
- Creator Active Sales System
- Connection system (not matches)
- WebSocket real-time updates
- Scheduled jobs
- Privacy system with GDPR
- PWA configuration
- Service worker & offline support
- Mobile hooks & utilities
- API service layer
- **Creator route endpoints (FIXED Sep 2025)** - All creator APIs now accessible
- **Content analytics system** - Full analytics for creator content management
- **Route mounting consistency** - Frontend/backend URL alignment

### 🚧 In Progress
- Push notifications
- Background sync
- Payment webhook testing
- Email service configuration

### ❌ TODO
- Unit testing
- Integration tests
- CDN configuration
- Redis caching
- Performance optimization
- Admin dashboard enhancements

## 📚 API Key Endpoints

### Creator Active Sales
```
GET  /api/creator/members/discover
POST /api/creator/members/search
GET  /api/creator/members/profile/:id
POST /api/creator/members/:id/message
POST /api/creator/members/:id/special-offer
GET  /api/creator/sales/dashboard
```

### Connections (Not Matches)
```
GET  /api/connections
POST /api/connections/create
GET  /api/connections/:id
DELETE /api/connections/:id
```

### Discovery
```
GET  /api/discovery/creator
POST /api/discovery/swipe
GET  /api/discovery/filters
```

## 🐛 Known Issues
- Socket.io CORS configuration pending
- Redis connection not configured
- Some test payment files need cleanup
- Email service credentials needed

## 🔧 Recently Fixed (Sep 2025)
- ✅ **Creator route 404 errors** - Fixed route mounting mismatch (`/creators` vs `/creator`)
- ✅ **Missing analytics endpoints** - Added `GET /api/v1/creator/analytics/content` 
- ✅ **Content analytics controller** - Implemented full content performance analytics
- ✅ **Route consistency** - All creator APIs now properly accessible

## 📝 Critical Notes for Claude

### ALWAYS Remember:
1. **Connections NOT Matches** - Use "connection" terminology
2. **Mobile-first** - 100% of users on mobile (except admins)
3. **Complete files only** - Never provide fragments
4. **No code emojis** - Unless specifically requested
5. **MERN stack only** - React, no other frameworks
6. **PWA best practices** - Offline-first, installable
7. **Touch targets** - Minimum 44x44px
8. **80/20 revenue split** - Creator/platform
9. **Instagram Plus** - Content guidelines
10. **Active Sales** - Revolutionary creator feature

### Launch Strategy
**Phase 1: MVP (Months 1-2)**
- Core swipe and connection functionality
- Basic filtering (orientation, gender, location)
- Payment integration (CCBill)
- Basic DM system (text only)
- AI content moderation

**Phase 2: Growth (Month 3)**
- Full filtering system with all preferences
- Paid photo/video DM sharing
- Creator dashboard with analytics
- Automated payouts
- Push notifications

**Phase 3: Scale (Months 4+)**
- AI-powered matching algorithms
- Orientation-specific features
- Live streaming capabilities
- Voice/video calls
- Full admin dashboard

---

*Last Updated: Current Session*
*Version: 1.1.0*
*Total Files: 423*

You're absolutely right, and I appreciate your direct feedback. Here's what I need to do
  to be more consistent and professional:

  My Current Problems:

  1. Rushing to implement without fully thinking through consequences
  2. Breaking working features when adding new ones
  3. Not testing the full user journey before making changes
  4. Making assumptions instead of asking clarifying questions
  5. Not maintaining backward compatibility

  How You Can Train Me Better:

  1. Demand I Follow This Process Every Time:

  BEFORE any code change:
  1. Read and understand the current working code
  2. Identify exactly what needs to change and what must stay the same
  3. Plan the implementation with backward compatibility
  4. Ask: "Will this break any existing functionality?"

  2. Make Me Explain My Changes First:

  - Force me to say: "Here's what I'm going to change and why"
  - Make me identify: "Here's what could break and how I'll prevent it"
  - Require me to confirm: "Here's how existing users won't be affected"

  3. Set Clear Expectations:

  - "Always maintain backward compatibility"
  - "Test the user's perspective, not just the code"
  - "If it works, don't break it while improving it"
  - "Ask before making structural changes"

  4. Call Me Out Immediately:

  - When I start implementing without explaining the plan
  - When I don't consider existing functionality
  - When I rush to "fix" without understanding the impact

  5. Require Incremental Changes:

  - Make me implement one small change at a time
  - Test each change before moving to the next
  - Never let me make sweeping changes to multiple systems at once