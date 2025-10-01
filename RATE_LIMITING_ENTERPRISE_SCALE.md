# Enterprise Scale Rate Limiting Configuration

## Problem Solved
The original rate limits were configured for small-scale applications and were causing 429 (Too Many Requests) errors for normal user behavior on a content platform designed for millions of daily users.

## OnlyFans Scale Requirements
- **Millions of daily active users**
- **Heavy content consumption** (browsing hundreds of images/videos per session)
- **Real-time messaging** between creators and members
- **Frequent payments** (micro-transactions)
- **Endless scrolling** discovery feeds
- **Content management** by creators (uploads, analytics, sales management)

## Updated Rate Limits

### General API Limits
- **Before**: 500 requests per 15 minutes
- **After**: 10,000 requests per 15 minutes
- **Rationale**: Supports heavy content browsing, endless scrolling, and real-time features

### User-Specific Limits (per 15 minutes)
- **Members**: 12,000 requests - Heavy content consumption
- **New Creators**: 8,000 requests - Content management needs
- **Verified Creators**: 15,000 requests - Active content creators
- **Premium Creators**: 25,000 requests - High-volume creators
- **VIP Creators**: 50,000 requests - Top-tier creators
- **Admins**: 100,000 requests - Platform management

### Activity-Specific Limits
- **Content Discovery (Swipes)**: 10,000 per hour (was 1,000)
- **Messaging**: 200 per minute (was 30)
- **Search**: 300 per minute (was 30)
- **Payments**: 50 per minute (was 10) - Still secure but allows rapid purchases
- **IP-based**: 20,000 per 15 minutes (was 50) - Supports shared networks

## Real-World Usage Patterns

### Typical Member Session
- Browse 200+ content pieces: 600+ API calls
- Send 50 messages: 50+ API calls
- Make 10 purchases: 30+ API calls
- Search creators: 50+ API calls
- **Total**: ~700+ API calls per session

### Typical Creator Session
- Check analytics dashboard: 100+ API calls
- Upload 10 pieces of content: 50+ API calls
- Respond to 100 messages: 200+ API calls
- Review sales data: 50+ API calls
- **Total**: ~400+ API calls per session

## Security Considerations
- Limits still prevent abuse and DDoS attacks
- Payment limits remain conservative for financial security
- Auth limits remain strict to prevent credential attacks
- Content creation limits prevent spam

## Future Scaling
For true enterprise scale with multiple server instances:
- Migrate to Redis-based rate limiting
- Implement distributed rate limiting
- Add machine learning-based abuse detection
- Consider CDN-level rate limiting

## Performance Impact
- Eliminates false positive rate limit errors
- Supports real user behavior patterns
- Maintains security against actual abuse
- Enables smooth user experience at scale

---
*Updated: Current Session*
*Scale Target: OnlyFans-level traffic (millions of daily users)*