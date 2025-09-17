// backend/src/controllers/session.controller.js
// Session analytics and management controller

const SessionService = require('../services/session.service');

// ============================================
// SESSION ANALYTICS
// ============================================

/**
 * Get platform session analytics
 * @route GET /api/admin/sessions/analytics
 * @access Private (Admin only)
 */
exports.getSessionAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    console.log(`📊 Fetching session analytics for last ${days} days`);

    const analytics = await SessionService.getSessionAnalytics(parseInt(days));

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Session analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session analytics',
    });
  }
};

/**
 * Get current user's active sessions
 * @route GET /api/sessions/my-sessions
 * @access Private (Any authenticated user)
 */
exports.getMyActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🔍 Fetching active sessions for user: ${userId}`);

    const sessions = await SessionService.getUserActiveSessions(userId);

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
};

/**
 * End a specific session
 * @route DELETE /api/sessions/:sessionId
 * @access Private (Session owner only)
 */
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    console.log(`🛑 Ending session: ${sessionId} for user: ${userId}`);

    // Verify session ownership (basic security check)
    const userSessions = await SessionService.getUserActiveSessions(userId);
    const sessionExists = userSessions.some(s => s.sessionId === sessionId);

    if (!sessionExists) {
      return res.status(403).json({
        success: false,
        error: 'Session not found or not owned by user',
      });
    }

    const success = await SessionService.endSession(sessionId, 'manual');

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Session ended successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to end session',
      });
    }
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
    });
  }
};

/**
 * End all sessions for current user (except current)
 * @route DELETE /api/sessions/end-all-others
 * @access Private (Any authenticated user)
 */
exports.endAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.session?.sessionId;

    console.log(
      `🔒 Ending all other sessions for user: ${userId} (keeping: ${currentSessionId})`
    );

    // Get all user sessions
    const userSessions = await SessionService.getUserActiveSessions(userId);

    // End all sessions except current one
    let endedCount = 0;
    for (const session of userSessions) {
      if (session.sessionId !== currentSessionId) {
        const success = await SessionService.endSession(
          session.sessionId,
          'security'
        );
        if (success) endedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Ended ${endedCount} other sessions`,
      endedSessions: endedCount,
    });
  } catch (error) {
    console.error('End all sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end other sessions',
    });
  }
};

// Note: User-facing analytics removed - keeping session tracking admin-only for privacy and simplicity

// ============================================
// SESSION CLEANUP (Admin)
// ============================================

/**
 * Clean up expired sessions
 * @route POST /api/admin/sessions/cleanup
 * @access Private (Admin only)
 */
exports.cleanupExpiredSessions = async (req, res) => {
  try {
    console.log('🧹 Starting manual session cleanup...');

    const cleanedCount = await SessionService.cleanupExpiredSessions();

    res.status(200).json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired sessions`,
      cleanedSessions: cleanedCount,
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup sessions',
    });
  }
};

module.exports = exports;
