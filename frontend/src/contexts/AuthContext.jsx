import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/auth.service';

// Auth States
const AUTH_STATES = {
  LOADING: 'LOADING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  ERROR: 'ERROR'
};

// User Roles
const USER_ROLES = {
  CREATOR: 'creator',
  MEMBER: 'member',
  ADMIN: 'admin'
};

// Initial State
const initialState = {
  status: AUTH_STATES.LOADING,
  user: null,
  role: null,
  token: null,
  error: null,
  isInitialized: false
};

// Action Types
const actionTypes = {
  AUTH_INITIALIZE: 'AUTH_INITIALIZE',
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_ERROR: 'AUTH_ERROR',
  USER_UPDATE: 'USER_UPDATE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case actionTypes.AUTH_INITIALIZE:
      return {
        ...state,
        status: action.payload.user ? AUTH_STATES.AUTHENTICATED : AUTH_STATES.UNAUTHENTICATED,
        user: action.payload.user,
        role: action.payload.role,
        token: action.payload.token,
        isInitialized: true,
        error: null
      };

    case actionTypes.AUTH_LOGIN_SUCCESS:
      return {
        ...state,
        status: AUTH_STATES.AUTHENTICATED,
        user: action.payload.user,
        role: action.payload.role,
        token: action.payload.token,
        error: null
      };

    case actionTypes.AUTH_LOGOUT:
      return {
        ...state,
        status: AUTH_STATES.UNAUTHENTICATED,
        user: null,
        role: null,
        token: null,
        error: null
      };

    case actionTypes.AUTH_ERROR:
      return {
        ...state,
        status: AUTH_STATES.ERROR,
        error: action.payload.error,
        user: null,
        role: null,
        token: null
      };

    case actionTypes.USER_UPDATE:
      return {
        ...state,
        user: { ...state.user, ...action.payload.updates }
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        status: state.user ? AUTH_STATES.AUTHENTICATED : AUTH_STATES.UNAUTHENTICATED
      };

    default:
      return state;
  }
}

// Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');

      if (!token || !role) {
        dispatch({
          type: actionTypes.AUTH_INITIALIZE,
          payload: { user: null, role: null, token: null }
        });
        return;
      }

      // Validate token and get user data
      let user = null;
      try {
        const response = await authService.getCurrentUser();
        if (response && response.data) {
          user = {
            ...response.data,
            role: role
          };
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      }

      dispatch({
        type: actionTypes.AUTH_INITIALIZE,
        payload: { user, role, token: user ? token : null }
      });
    } catch (error) {
      dispatch({
        type: actionTypes.AUTH_ERROR,
        payload: { error: error.message }
      });
    }
  };

  const login = async (credentials, userRole) => {
    try {
      let response;
      
      if (userRole === USER_ROLES.CREATOR) {
        response = await authService.creatorLogin(credentials.email, credentials.password, credentials.rememberMe);
      } else if (userRole === USER_ROLES.MEMBER) {
        response = await authService.memberLogin(credentials.email, credentials.password, credentials.rememberMe);
      } else if (userRole === USER_ROLES.ADMIN) {
        response = await authService.adminLogin(credentials.email, credentials.password, credentials.twoFactorCode);
      } else {
        throw new Error('Invalid user role');
      }

      if (response && response.token && response.user) {
        // Update state
        dispatch({
          type: actionTypes.AUTH_LOGIN_SUCCESS,
          payload: {
            user: { ...response.user, role: userRole },
            role: userRole,
            token: response.token
          }
        });

        return { success: true, user: response.user };
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      dispatch({
        type: actionTypes.AUTH_ERROR,
        payload: { error: error.message }
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({
        type: actionTypes.AUTH_LOGOUT
      });
    }
  };

  const updateUser = (updates) => {
    dispatch({
      type: actionTypes.USER_UPDATE,
      payload: { updates }
    });
  };

  const clearError = () => {
    dispatch({
      type: actionTypes.CLEAR_ERROR
    });
  };

  // Computed values
  const isAuthenticated = state.status === AUTH_STATES.AUTHENTICATED && state.user;
  const isCreator = state.role === USER_ROLES.CREATOR;
  const isMember = state.role === USER_ROLES.MEMBER;
  const isAdmin = state.role === USER_ROLES.ADMIN;
  const isLoading = state.status === AUTH_STATES.LOADING || !state.isInitialized;

  const value = {
    // State
    user: state.user,
    role: state.role,
    token: state.token,
    error: state.error,
    status: state.status,
    
    // Computed
    isAuthenticated,
    isCreator,
    isMember,
    isAdmin,
    isLoading,
    isInitialized: state.isInitialized,
    
    // Actions
    login,
    logout,
    updateUser,
    clearError,
    
    // Constants
    AUTH_STATES,
    USER_ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;