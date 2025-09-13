// backend/src/services/session.service.js
// Comprehensive session management service

const UserSession = require('../models/UserSession');
const useragent = require('useragent');
const geoip = require('geoip-lite');

class SessionService {
  
  /**
   * Create a new user session
   * @param {ObjectId} userId - User ID
   * @param {String} userType - 'member', 'creator', or 'admin'
   * @param {Object} req - Express request object
   * @param {Number} expirationHours - Session expiration in hours (default: 168 = 7 days)
   * @returns {Object} Session object with sessionId
   */
  static async createSession(userId, userType, req, expirationHours = 168) {
    try {
      console.log(`📱 Creating new session for ${userType} user: ${userId}`);
      
      // Extract device information
      const deviceInfo = this.extractDeviceInfo(req);
      
      // Extract location information
      const location = this.extractLocationInfo(req);
      
      // Create session in database
      const session = await UserSession.createSession(
        userId, 
        userType, 
        deviceInfo, 
        location, 
        expirationHours
      );
      
      console.log(`✅ Session created: ${session.sessionId}`);
      
      // Log initial login activity
      await session.addActivity('login', {
        loginMethod: 'password',
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser
      });
      
      return {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        deviceInfo,
        location: {
          country: location.country,
          city: location.city
        }
      };
      
    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Failed to create session');
    }
  }
  
  /**
   * Validate and refresh session
   * @param {String} sessionId - Session ID from JWT
   * @param {ObjectId} userId - User ID from JWT
   * @param {Object} req - Express request object
   * @returns {Object} Session validation result
   */
  static async validateSession(sessionId, userId, req) {
    try {
      const session = await UserSession.findOne({
        sessionId,
        user: userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
      
      if (!session) {
        console.log(`❌ Session validation failed: ${sessionId}`);
        return { 
          valid: false, 
          reason: 'session_not_found',
          requiresReauth: true 
        };
      }
      
      // Check for IP changes (security)
      const currentIp = this.getClientIp(req);
      if (session.location.ipAddress !== currentIp) {
        console.log(`🚨 IP change detected for session ${sessionId}: ${session.location.ipAddress} → ${currentIp}`);
        
        await session.security.ipChanges.push({
          fromIp: session.location.ipAddress,
          toIp: currentIp,
          timestamp: new Date(),
          flagged: this.shouldFlagIpChange(session.location.ipAddress, currentIp)
        });
        
        // Update current IP
        session.location.ipAddress = currentIp;
        
        // Update location if IP changed significantly
        const newLocation = this.extractLocationInfo(req);
        if (newLocation.country && newLocation.country !== session.location.country) {
          session.location = { ...session.location, ...newLocation };
          
          await session.flagSuspiciousActivity(
            'location_change', 
            `Location changed from ${session.location.country} to ${newLocation.country}`,
            'medium'
          );
        }
      }
      
      // Check for inactivity
      const inactiveMinutes = session.inactiveMinutes;
      if (inactiveMinutes > 30) { // 30 minutes inactivity threshold
        console.log(`⏰ Session ${sessionId} was inactive for ${inactiveMinutes} minutes`);
      }
      
      // Update last active time
      await session.updateLastActive();
      
      console.log(`✅ Session validated: ${sessionId} (${session.userType})`);
      
      return {
        valid: true,
        session: {
          id: session._id,
          sessionId: session.sessionId,
          userType: session.userType,
          deviceType: session.deviceInfo.deviceType,
          lastActiveAt: session.lastActiveAt,
          riskScore: session.security.riskScore
        }
      };
      
    } catch (error) {
      console.error('Session validation error:', error);
      return { 
        valid: false, 
        reason: 'validation_error',
        requiresReauth: true 
      };
    }
  }
  
  /**
   * Track user activity within a session
   * @param {String} sessionId - Session ID
   * @param {String} activityType - Type of activity
   * @param {Object} metadata - Additional activity data
   */
  static async trackActivity(sessionId, activityType, metadata = {}) {
    try {
      const session = await UserSession.findOne({ 
        sessionId, 
        isActive: true 
      });
      
      if (!session) {
        console.log(`❌ Cannot track activity - session not found: ${sessionId}`);
        return false;
      }
      
      await session.addActivity(activityType, metadata);
      
      console.log(`📊 Activity tracked: ${activityType} for session ${sessionId}`);
      return true;
      
    } catch (error) {
      console.error('Activity tracking error:', error);
      return false;
    }
  }
  
  /**
   * End a user session
   * @param {String} sessionId - Session ID
   * @param {String} reason - Reason for ending session
   */
  static async endSession(sessionId, reason = 'manual') {
    try {
      const session = await UserSession.findOne({ sessionId, isActive: true });
      
      if (!session) {
        console.log(`❌ Cannot end session - not found: ${sessionId}`);
        return false;
      }
      
      await session.addActivity('logout', { reason });
      await session.endSession(reason);
      
      console.log(`👋 Session ended: ${sessionId} (${reason})`);
      return true;
      
    } catch (error) {
      console.error('Session end error:', error);
      return false;
    }
  }
  
  /**
   * Get user's active sessions
   * @param {ObjectId} userId - User ID
   * @returns {Array} List of active sessions
   */
  static async getUserActiveSessions(userId) {
    try {
      const sessions = await UserSession.getActiveSessions(userId);
      
      return sessions.map(session => ({
        sessionId: session.sessionId,
        deviceType: session.deviceInfo.deviceType,
        browser: session.deviceInfo.browser,
        location: `${session.location.city || 'Unknown'}, ${session.location.country || 'Unknown'}`,
        lastActive: session.lastActiveAt,
        duration: session.duration,
        activities: session.metrics.totalActivities,
        riskScore: session.security.riskScore
      }));
      
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }
  
  /**
   * End all sessions for a user (security purposes)
   * @param {ObjectId} userId - User ID
   * @param {String} reason - Reason for ending sessions
   */
  static async endAllUserSessions(userId, reason = 'security') {
    try {
      const result = await UserSession.endAllUserSessions(userId, reason);
      console.log(`🔒 Ended ${result.modifiedCount} sessions for user ${userId}`);
      return result.modifiedCount;
    } catch (error) {
      console.error('End all sessions error:', error);
      return 0;
    }
  }
  
  /**
   * Get session analytics for platform insights
   * @param {Number} days - Number of days to analyze (default: 30)
   * @returns {Object} Analytics data
   */
  static async getSessionAnalytics(days = 30) {
    try {
      const analytics = await UserSession.getSessionAnalytics(days);
      
      // Get additional insights
      const additionalData = await this.getExtendedAnalytics(days);
      
      return {
        ...analytics,
        ...additionalData,
        period: `${days} days`,
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Session analytics error:', error);
      return {};
    }
  }
  
  /**
   * Get extended analytics data
   * @param {Number} days - Number of days to analyze
   * @returns {Object} Extended analytics
   */
  static async getExtendedAnalytics(days) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const results = await UserSession.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $facet: {
            // Device type breakdown
            deviceTypes: [
              {
                $group: {
                  _id: '$deviceInfo.deviceType',
                  count: { $sum: 1 },
                  avgDuration: { $avg: '$duration' },
                  totalActivities: { $sum: '$metrics.totalActivities' }
                }
              },
              { $sort: { count: -1 } }
            ],
            
            // User type breakdown
            userTypes: [
              {
                $group: {
                  _id: '$userType',
                  count: { $sum: 1 },
                  avgDuration: { $avg: '$duration' },
                  totalRevenue: { $sum: '$metrics.sessionRevenue' }
                }
              }
            ],
            
            // Peak hours analysis
            peakHours: [
              {
                $group: {
                  _id: { $hour: '$createdAt' },
                  sessions: { $sum: 1 },
                  avgDuration: { $avg: '$duration' }
                }
              },
              { $sort: { sessions: -1 } }
            ],
            
            // Security insights
            security: [
              {
                $group: {
                  _id: null,
                  totalSuspiciousActivities: { 
                    $sum: { $size: '$security.suspiciousActivity' }
                  },
                  avgRiskScore: { $avg: '$security.riskScore' },
                  ipChanges: { 
                    $sum: { $size: '$security.ipChanges' }
                  }
                }
              }
            ]
          }
        }
      ]);
      
      const data = results[0];
      
      return {
        deviceBreakdown: data.deviceTypes,
        userTypeBreakdown: data.userTypes,
        peakHours: data.peakHours.slice(0, 5), // Top 5 peak hours
        security: data.security[0] || {}
      };
      
    } catch (error) {
      console.error('Extended analytics error:', error);
      return {};
    }
  }
  
  /**
   * Cleanup expired sessions (called by cron job)
   */
  static async cleanupExpiredSessions() {
    try {
      console.log('🧹 Starting session cleanup...');
      
      const result = await UserSession.cleanupExpiredSessions();
      
      console.log(`✅ Session cleanup complete: ${result.modifiedCount} sessions marked as expired`);
      return result.modifiedCount;
      
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  }
  
  // Helper methods
  
  /**
   * Extract device information from request
   * @param {Object} req - Express request object
   * @returns {Object} Device information
   */
  static extractDeviceInfo(req) {
    const userAgentString = req.headers['user-agent'] || '';
    const agent = useragent.parse(userAgentString);
    
    // Determine device type
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgentString)) deviceType = 'mobile';
    else if (/tablet/i.test(userAgentString)) deviceType = 'tablet';
    
    return {
      userAgent: userAgentString,
      deviceType,
      browser: `${agent.family} ${agent.major}`,
      os: `${agent.os.family} ${agent.os.major}`,
      deviceModel: agent.device.family !== 'Other' ? agent.device.family : null,
      screenResolution: req.headers['screen-resolution'] || null
    };
  }
  
  /**
   * Extract location information from request
   * @param {Object} req - Express request object
   * @returns {Object} Location information
   */
  static extractLocationInfo(req) {
    const ip = this.getClientIp(req);
    const geo = geoip.lookup(ip);
    
    return {
      ipAddress: ip,
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      timezone: geo?.timezone || null,
      isp: null // Could be enhanced with ISP detection
    };
  }
  
  /**
   * Get client IP address
   * @param {Object} req - Express request object
   * @returns {String} Client IP address
   */
  static getClientIp(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           '127.0.0.1';
  }
  
  /**
   * Determine if IP change should be flagged
   * @param {String} oldIp - Previous IP address
   * @param {String} newIp - New IP address
   * @returns {Boolean} Should flag this change
   */
  static shouldFlagIpChange(oldIp, newIp) {
    if (!oldIp || !newIp) return false;
    
    // Flag if IPs are from different countries
    const oldGeo = geoip.lookup(oldIp);
    const newGeo = geoip.lookup(newIp);
    
    return oldGeo?.country !== newGeo?.country;
  }
}

module.exports = SessionService;