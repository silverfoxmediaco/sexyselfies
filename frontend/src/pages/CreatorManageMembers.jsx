import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Star,
  DollarSign,
  Calendar,
  TrendingUp,
  Award,
  Zap,
  UserPlus,
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import BottomQuickActions from '../components/BottomQuickActions';
import MembersOverview from '../components/MembersOverview';
import MembersFilters from '../components/MembersFilters';
import MembersList from '../components/MembersList';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import api from '../services/api.config';
import './CreatorManageMembers.css';

const CreatorManageMembers = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    avgSpending: 0,
  });
  const [loading, setLoading] = useState(true);

  const filterOptions = [
    { value: 'all', label: 'All Members' },
    { value: 'premium', label: 'Premium' },
    { value: 'active', label: 'Active' },
    { value: 'high-spenders', label: 'High Spenders' },
    { value: 'recent', label: 'Recently Joined' },
  ];

  const sortOptions = [
    { value: 'totalSpent', label: 'Total Spent' },
    { value: 'lastActive', label: 'Last Active' },
    { value: 'joinedDate', label: 'Join Date' },
    { value: 'name', label: 'Name' },
  ];

  useEffect(() => {
    loadMembers();
  }, [sortBy, sortOrder, filterBy]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const isDevelopment =
        import.meta.env.DEV ||
        localStorage.getItem('token') === 'dev-token-12345';

      if (isDevelopment) {
        // Mock data for member management
        const mockStats = {
          totalMembers: 347,
          activeMembers: 89,
          totalRevenue: 12450.75,
          avgSpending: 35.85,
        };

        const mockMembers = [
          {
            id: 1,
            name: 'Sarah Williams',
            avatar: null,
            age: 28,
            location: 'New York, NY',
            joinedDate: '2024-01-15',
            lastActive: '5 min ago',
            isOnline: true,
            isPremium: true,
            totalSpent: 1245.5,
            purchasesCount: 23,
            rating: 5,
            tier: 'VIP',
            favoriteContent: 'Photos',
            lastPurchase: '2 hours ago',
            status: 'active',
          },
          {
            id: 2,
            name: 'Michael Chen',
            avatar: null,
            age: 32,
            location: 'Los Angeles, CA',
            joinedDate: '2024-01-12',
            lastActive: '2 hours ago',
            isOnline: false,
            isPremium: false,
            totalSpent: 567.25,
            purchasesCount: 12,
            rating: 4,
            tier: 'Regular',
            favoriteContent: 'Videos',
            lastPurchase: '1 day ago',
            status: 'active',
          },
          {
            id: 3,
            name: 'Jessica Taylor',
            avatar: null,
            age: 26,
            location: 'Chicago, IL',
            joinedDate: '2024-01-10',
            lastActive: '1 day ago',
            isOnline: false,
            isPremium: true,
            totalSpent: 2340.0,
            purchasesCount: 45,
            rating: 5,
            tier: 'VIP',
            favoriteContent: 'Custom Content',
            lastPurchase: '3 hours ago',
            status: 'active',
          },
          {
            id: 4,
            name: 'David Rodriguez',
            avatar: null,
            age: 35,
            location: 'Miami, FL',
            joinedDate: '2024-01-08',
            lastActive: '3 days ago',
            isOnline: false,
            isPremium: false,
            totalSpent: 89.75,
            purchasesCount: 3,
            rating: 3,
            tier: 'New',
            favoriteContent: 'Messages',
            lastPurchase: '1 week ago',
            status: 'inactive',
          },
          {
            id: 5,
            name: 'Emma Johnson',
            avatar: null,
            age: 29,
            location: 'Seattle, WA',
            joinedDate: '2024-01-05',
            lastActive: '1 hour ago',
            isOnline: true,
            isPremium: true,
            totalSpent: 890.25,
            purchasesCount: 18,
            rating: 5,
            tier: 'Premium',
            favoriteContent: 'Live Shows',
            lastPurchase: '30 min ago',
            status: 'active',
          },
          {
            id: 6,
            name: 'James Wilson',
            avatar: null,
            age: 31,
            location: 'Austin, TX',
            joinedDate: '2024-01-03',
            lastActive: '12 hours ago',
            isOnline: false,
            isPremium: true,
            totalSpent: 1567.5,
            purchasesCount: 31,
            rating: 4,
            tier: 'VIP',
            favoriteContent: 'Photos',
            lastPurchase: '4 hours ago',
            status: 'active',
          },
        ];

        setTimeout(() => {
          setStats(mockStats);
          setMembers(mockMembers);
          setLoading(false);
          console.log('DEV MODE: Using mock members data');
        }, 800);
      } else {
        const response = await api.get('/creator/members');
        setStats(response.stats);
        setMembers(response.members);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setLoading(false);
    }
  };

  const filteredAndSortedMembers = members
    .filter(member => {
      const matchesSearch = member.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterBy === 'all' ||
        (filterBy === 'premium' && member.isPremium) ||
        (filterBy === 'active' && member.status === 'active') ||
        (filterBy === 'high-spenders' && member.totalSpent > 500) ||
        (filterBy === 'recent' &&
          new Date(member.joinedDate) > new Date('2024-01-10'));
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'totalSpent':
          comparison = a.totalSpent - b.totalSpent;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'joinedDate':
          comparison = new Date(a.joinedDate) - new Date(b.joinedDate);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });


  if (loading) {
    return (
      <div className='members-loading'>
        <div className='loading-spinner'></div>
        <p>Loading your members...</p>
      </div>
    );
  }

  return (
    <div className='creator-manage-members'>
      {/* Header */}
      <div className='members-header'>
        <div className='members-header-content'>
          <h1>
            <Users size={24} />
            Manage Members
          </h1>
          <div className='members-header-actions'>
            <button
              className='members-filter-btn'
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <MembersOverview
        stats={{
          totalMembers: stats.totalMembers,
          activeMembers: stats.activeMembers,
          totalRevenue: stats.totalRevenue,
          avgSpending: stats.avgSpending
        }}
        onStatClick={(statType) => {
          console.log('Member stat clicked:', statType);
          // Handle navigation to detailed member analytics
          switch (statType) {
            case 'total':
              // Navigate to all members view
              break;
            case 'active':
              setFilterBy('active');
              break;
            case 'revenue':
              navigate('/creator/earnings');
              break;
            case 'average':
              navigate('/creator/analytics');
              break;
          }
        }}
        loading={loading}
        className="members-overview"
      />

      {/* Controls */}
      <div className='members-controls'>
        <div className='members-search-bar'>
          <Search size={20} />
          <input
            type='text'
            placeholder='Search members...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <MembersFilters
          filterValue={filterBy}
          sortValue={sortBy}
          sortOrder={sortOrder}
          onFilterChange={(value) => setFilterBy(value)}
          onSortChange={(value) => setSortBy(value)}
          onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          className="members-filters"
        />
      </div>

      {/* Members List */}
      <MembersList
        members={filteredAndSortedMembers}
        viewMode="list"
        onMemberClick={(member) => navigate(`/creator/member/${member.id}`)}
        onMemberAction={(action, memberId) => {
          switch (action) {
            case 'message':
              navigate(`/creator/chat/${memberId}`);
              break;
            case 'gift':
              console.log('Send gift to member:', memberId);
              // Handle send offer/gift
              break;
            case 'more':
              console.log('More actions for member:', memberId);
              // Handle more actions menu
              break;
            default:
              console.log('Unknown action:', action, memberId);
          }
        }}
        loading={loading}
        emptyStateConfig={{
          icon: <Users size={64} />,
          title: 'No members found',
          description: 'Start connecting with members to see them here!'
        }}
        className="members-list"
      />

      {/* Quick Actions */}
      <BottomQuickActions
        title="Member Management Actions"
        actions={[
          {
            id: 'analytics',
            icon: <TrendingUp size={24} />,
            label: 'View Analytics',
            description: 'See detailed member insights',
            color: 'blue',
            path: '/creator/analytics'
          },
          {
            id: 'invite',
            icon: <UserPlus size={24} />,
            label: 'Invite Members',
            description: 'Share your profile to attract new members',
            color: 'green',
            path: '/creator/profile'
          },
          {
            id: 'rewards',
            icon: <Award size={24} />,
            label: 'Member Rewards',
            description: 'Create special offers and rewards',
            color: 'purple',
            action: () => {
              console.log('Opening member rewards system...');
              // Handle member rewards functionality
            }
          },
          {
            id: 'boost',
            icon: <Zap size={24} />,
            label: 'Boost Earnings',
            description: 'Optimize your earning strategies',
            color: 'orange',
            path: '/creator/earnings'
          }
        ]}
        onActionClick={(action) => {
          if (action.path) {
            navigate(action.path);
          } else if (action.action) {
            action.action();
          } else {
            console.log('Action clicked:', action.label);
          }
        }}
        showHeader={true}
        loading={false}
      />

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorManageMembers;
