import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

console.log('🚀 SexySelfies App Starting...');

// Handle redirects from 404.html
function RedirectHandler() {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && redirectPath !== '/') {
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);
  
  return null;
}

// Import Layout
import AppLayout from './components/AppLayout';

// Import Route Protection
import { 
  ProtectedCreatorRoute, 
  ProtectedMemberRoute, 
  ComingSoon
} from './components/RouteProtection';


// Import Admin pages (all exist)
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminVerifications from './pages/AdminVerifications';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminContent from './pages/AdminContent';
import AdminPayouts from './pages/AdminPayouts';
import AdminManagement from './pages/AdminManagement';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

// Import Creator pages (all that exist)
import CreatorRegistration from './pages/CreatorRegistration';
import CreatorVerifyID from './pages/CreatorVerifyID';
import CreatorProfileSetup from './pages/CreatorProfileSetup';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorContentUpload from './pages/CreatorContentUpload';
import CreatorLogin from './pages/CreatorLogin';
import CreatorProfilePreview from './pages/CreatorProfilePreview';
import CreatorProfilePage from './pages/CreatorProfilePage';
import CreatorAnalytics from './pages/CreatorAnalytics';
import CreatorEarnings from './pages/CreatorEarnings';
import CreatorConnections from './pages/CreatorConnections';
import CreatorManageMembers from './pages/CreatorManageMembers';
import CreatorSettingsPage from './pages/CreatorSettingsPage';
import CreatorContentManagement from './pages/CreatorContentManagement';
import BrowseMembers from './pages/BrowseMembers'; 

// Import Member pages
import MemberRegistration from './pages/MemberRegistration';
import MemberLogin from './pages/MemberLogin';
import BrowseCreators from './pages/BrowseCreators';
import CreatorProfile from './pages/CreatorProfile';
import MemberProfilePage from './pages/MemberProfilePage';
import MemberSettingsPage from './pages/MemberSettingsPage';
import MyConnections from './pages/MyConnections';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import BrowseFilters from './pages/BrowseFilters';
import SearchCreators from './pages/SearchCreators';
import TrendingCreators from './pages/TrendingCreators';
import Favorites from './pages/Favorites';

// Import Member Components
import Library from './components/Library';

// Import Landing pages
import LandingPage from './pages/LandingPage';
import LandingPageV2 from './pages/LandingPageV2';

// Import Content View
import ContentView from './pages/ContentView';


console.log('🎯 Mounting React App to root element...');
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AppLayout>
          <RedirectHandler />
          <Routes>
          {/* Landing Pages */}
          <Route path="/" element={<LandingPageV2 />} />
          <Route path="/landing-v1" element={<LandingPage />} />
          
          {/* Content View - Public route for viewing individual content */}
          <Route path="/content/:id" element={<ContentView />} />
          
          {/* Main App Route - Redirect to home */}
          <Route path="/app" element={<Navigate to="/" replace />} />
          
          {/* Creator Routes */}
          <Route path="/creator">
            {/* Public creator routes */}
            <Route path="register" element={<CreatorRegistration />} />
            <Route path="verify-id" element={<CreatorVerifyID />} />
            <Route path="login" element={<CreatorLogin />} />
            
            {/* BROWSE MEMBERS ROUTE - Creators browse members to target */}
            <Route 
              path="browse-members" 
              element={
                <ProtectedCreatorRoute>
                  <BrowseMembers />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/browse-members" 
              element={
                <ProtectedCreatorRoute>
                  <BrowseMembers />
                </ProtectedCreatorRoute>
              } 
            />
            
            {/* MEMBERS ROUTE - Creators manage their existing members (dashboard) */}
            <Route 
              path="members" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorManageMembers />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/members" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorManageMembers />
                </ProtectedCreatorRoute>
              } 
            />
            
            {/* MESSAGES ROUTE - Creators view all conversations */}
            <Route 
              path="messages" 
              element={
                <ProtectedCreatorRoute>
                  <Messages />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/messages" 
              element={
                <ProtectedCreatorRoute>
                  <Messages />
                </ProtectedCreatorRoute>
              } 
            />
            
            {/* CONNECTIONS ROUTE - Creators manage their connections/matches */}
            <Route 
              path="connections" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorConnections />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/connections" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorConnections />
                </ProtectedCreatorRoute>
              } 
            />
            
            {/* CHAT ROUTE - Creators chat with members */}
            <Route 
              path="chat/:connectionId" 
              element={
<Chat />
              } 
            />
            
            {/* Protected creator routes */}
            <Route 
              path="profile-setup" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorProfileSetup />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/profile-setup" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorProfileSetup />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path="profile-preview" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorProfilePreview />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/profile-preview" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorProfilePreview />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path="dashboard" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorDashboard />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/dashboard" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorDashboard />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path="upload" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorContentUpload />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/upload" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorContentUpload />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path="content" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorContentManagement />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/content" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorContentManagement />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path="earnings" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorEarnings />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/earnings" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorEarnings />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path="analytics" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorAnalytics />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/analytics" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorAnalytics />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/profile/:username" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorProfilePage />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/profile" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorProfilePage />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path="settings" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorSettingsPage />
                </ProtectedCreatorRoute>
              } 
            />
            <Route 
              path=":creatorId/settings" 
              element={
                <ProtectedCreatorRoute>
                  <CreatorSettingsPage />
                </ProtectedCreatorRoute>
              } 
            />
          </Route>
          
          {/* Member Routes */}
          <Route path="/member">
            {/* Public member routes */}
            <Route path="login" element={<MemberLogin />} />
            <Route path="register" element={<MemberRegistration />} />
            
            {/* Protected member routes */}
            {/* BROWSE CREATORS ROUTE - Members browse creators (swipe interface) */}
            <Route 
              path="browse-creators" 
              element={
                <ProtectedMemberRoute>
                  <BrowseCreators />
                </ProtectedMemberRoute>
              } 
            />
            
            {/* DISCOVER ROUTE - Redirect to browse-creators */}
            <Route 
              path="discover" 
              element={<Navigate to="/member/browse-creators" replace />}
            />
            
            {/* BROWSE FILTERS ROUTE - Browse preferences/filters */}
            <Route 
              path="filters" 
              element={
                <ProtectedMemberRoute>
                  <BrowseFilters />
                </ProtectedMemberRoute>
              } 
            />
            
            {/* MY CONNECTIONS ROUTE - Replaces matches */}
            <Route 
              path="connections" 
              element={
                <ProtectedMemberRoute>
                  <MyConnections />
                </ProtectedMemberRoute>
              } 
            />
            
            {/* Legacy matches route - redirect to connections */}
            <Route 
              path="matches" 
              element={<Navigate to="/member/connections" replace />} 
            />
            
            {/* MESSAGES ROUTE - View all conversations */}
            <Route 
              path="messages" 
              element={
                <ProtectedMemberRoute>
                  <Messages />
                </ProtectedMemberRoute>
              } 
            />
            
            {/* CHAT ROUTES - Individual conversation */}
            <Route 
              path="messages/:creatorId" 
              element={
                <ProtectedMemberRoute>
                  <Chat />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="chat/:connectionId" 
              element={
                <ProtectedMemberRoute>
                  <Chat />
                </ProtectedMemberRoute>
              } 
            />
            
            <Route 
              path="profile" 
              element={
                <ProtectedMemberRoute>
                  <MemberProfilePage />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="profile/:username" 
              element={
                <ProtectedMemberRoute>
                  <MemberProfilePage />
                </ProtectedMemberRoute>
              } 
            />
            {/* LIBRARY ROUTE - Members view and download purchased content */}
            <Route 
              path="library" 
              element={
                <ProtectedMemberRoute>
                  <Library />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="purchased" 
              element={
                <ProtectedMemberRoute>
                  <ComingSoon title="Purchased Content" />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="favorites" 
              element={
                <ProtectedMemberRoute>
                  <Favorites />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="search" 
              element={
                <ProtectedMemberRoute>
                  <SearchCreators />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="trending" 
              element={
                <ProtectedMemberRoute>
                  <TrendingCreators />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="billing" 
              element={
                <ProtectedMemberRoute>
                  <ComingSoon title="Billing" />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="settings" 
              element={
                <ProtectedMemberRoute>
                  <MemberSettingsPage />
                </ProtectedMemberRoute>
              } 
            />
            <Route 
              path="help" 
              element={
                <ProtectedMemberRoute>
                  <ComingSoon title="Help Center" />
                </ProtectedMemberRoute>
              } 
            />
          </Route>
          
          {/* Creator Profile Route (Public - for members to view) */}
          {/* THIS MUST COME AFTER ALL /creator/* ROUTES */}
          <Route path="/creator/:creatorId" element={<CreatorProfile />} />
          
          {/* Admin Routes */}
          <Route path="/admin">
            <Route path="login" element={<AdminLogin />} />
            <Route 
              path="dashboard" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="verifications" 
              element={
                <ProtectedAdminRoute>
                  <AdminVerifications />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="reports" 
              element={
                <ProtectedAdminRoute>
                  <AdminReports />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="users" 
              element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="content" 
              element={
                <ProtectedAdminRoute>
                  <AdminContent />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="payouts" 
              element={
                <ProtectedAdminRoute>
                  <AdminPayouts />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="management" 
              element={
                <ProtectedAdminRoute>
                  <AdminManagement />
                </ProtectedAdminRoute>
              } 
            />
            {/* Redirect /admin to dashboard */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Routes>
      </AppLayout>
    </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);