import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Search, Filter, Grid, List,
  Image, Video, FileText, Calendar, User, Eye,
  X, Check, Clock, TrendingUp
} from 'lucide-react';
import './Library.css';

const Library = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filterType, setFilterType] = useState('all'); // all, photos, videos, messages
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockPurchases = [
        {
          id: 'p1',
          type: 'photo_set',
          title: 'Exclusive Summer Collection',
          creatorName: 'AlexisStyles',
          creatorId: 'creator1',
          price: 49.99,
          purchaseDate: '2024-11-28',
          fileCount: 25,
          fileSize: '125 MB',
          thumbnail: '/src/assets/IMG_5017.jpg',
          downloadUrl: '/download/p1'
        },
        {
          id: 'p2',
          type: 'video',
          title: 'Full Body Workout',
          creatorName: 'FitnessQueen',
          creatorId: 'creator2',
          price: 29.99,
          purchaseDate: '2024-11-25',
          duration: '45:00',
          fileSize: '850 MB',
          thumbnail: '/src/assets/IMG_5019.jpg',
          downloadUrl: '/download/p2'
        },
        {
          id: 'p3',
          type: 'message',
          title: 'Private Message Bundle',
          creatorName: 'TravelDreams',
          creatorId: 'creator3',
          price: 9.99,
          purchaseDate: '2024-11-24',
          fileCount: 5,
          fileSize: '15 MB',
          thumbnail: '/src/assets/IMG_5020.jpg',
          downloadUrl: '/download/p3'
        },
        {
          id: 'p4',
          type: 'photo_set',
          title: 'Autumn Vibes Collection',
          creatorName: 'NatureLover',
          creatorId: 'creator4',
          price: 34.99,
          purchaseDate: '2024-11-20',
          fileCount: 30,
          fileSize: '180 MB',
          thumbnail: '/src/assets/IMG_5021.jpg',
          downloadUrl: '/download/p4'
        },
        {
          id: 'p5',
          type: 'video',
          title: 'Cooking Masterclass',
          creatorName: 'ChefExtraordinaire',
          creatorId: 'creator5',
          price: 39.99,
          purchaseDate: '2024-11-18',
          duration: '60:00',
          fileSize: '1.2 GB',
          thumbnail: '/src/assets/IMG_5023.jpg',
          downloadUrl: '/download/p5'
        },
        {
          id: 'p6',
          type: 'photo_set',
          title: 'Winter Fashion Series',
          creatorName: 'StyleIcon',
          creatorId: 'creator6',
          price: 44.99,
          purchaseDate: '2024-11-15',
          fileCount: 35,
          fileSize: '210 MB',
          thumbnail: '/src/assets/IMG_5027.jpg',
          downloadUrl: '/download/p6'
        },
        {
          id: 'p7',
          type: 'photo_set',
          title: 'Beach Paradise Collection',
          creatorName: 'BeachBabe',
          creatorId: 'creator7',
          price: 39.99,
          purchaseDate: '2024-11-12',
          fileCount: 28,
          fileSize: '165 MB',
          thumbnail: '/src/assets/IMG_5028.jpg',
          downloadUrl: '/download/p7'
        },
        {
          id: 'p8',
          type: 'video',
          title: 'Dance Tutorial Series',
          creatorName: 'DanceQueen',
          creatorId: 'creator8',
          price: 34.99,
          purchaseDate: '2024-11-10',
          duration: '55:00',
          fileSize: '950 MB',
          thumbnail: '/src/assets/IMG_5029.jpg',
          downloadUrl: '/download/p8'
        }
      ];

      setPurchases(mockPurchases);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
      setLoading(false);
    }
  };

  const handleDownload = async (purchase) => {
    try {
      // Implement download logic
      console.log('Downloading:', purchase.title);
      // window.location.href = purchase.downloadUrl;
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      // Implement bulk download logic
      console.log('Bulk downloading:', selectedItems);
    } catch (err) {
      console.error('Bulk download failed:', err);
    }
  };

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'photo_set': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'message': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'photo_set': return 'Photos';
      case 'video': return 'Video';
      case 'message': return 'Message';
      default: return type;
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesType = filterType === 'all' || 
      (filterType === 'photos' && purchase.type === 'photo_set') ||
      (filterType === 'videos' && purchase.type === 'video') ||
      (filterType === 'messages' && purchase.type === 'message');
    
    const matchesSearch = purchase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="lib-container">
        <div className="lib-loading">
          <div className="lib-loading-spinner"></div>
          <p>Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lib-container">
      {/* Header */}
      <header className="lib-header">
        <div className="lib-header-content">
          <button className="lib-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>My Library</h1>
          <div className="lib-header-spacer"></div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="lib-stats-bar">
        <div className="lib-stat">
          <span className="lib-stat-value">{purchases.length}</span>
          <span className="lib-stat-label">Total Items</span>
        </div>
        <div className="lib-stat">
          <span className="lib-stat-value">
            ${purchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
          </span>
          <span className="lib-stat-label">Total Value</span>
        </div>
        <div className="lib-stat">
          <span className="lib-stat-value">
            {purchases.filter(p => p.type === 'photo_set').length + purchases.filter(p => p.type === 'video').length}
          </span>
          <span className="lib-stat-label">Media Files</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="lib-controls">
        <div className="lib-search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="lib-clear-search" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="lib-filter-controls">
          <div className="lib-filter-chips">
            <button 
              className={`lib-chip ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button 
              className={`lib-chip ${filterType === 'photos' ? 'active' : ''}`}
              onClick={() => setFilterType('photos')}
            >
              <Image size={14} />
              Photos
            </button>
            <button 
              className={`lib-chip ${filterType === 'videos' ? 'active' : ''}`}
              onClick={() => setFilterType('videos')}
            >
              <Video size={14} />
              Videos
            </button>
            <button 
              className={`lib-chip ${filterType === 'messages' ? 'active' : ''}`}
              onClick={() => setFilterType('messages')}
            >
              <FileText size={14} />
              Messages
            </button>
          </div>

          <div className="lib-view-toggle">
            <button 
              className={`lib-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
            <button 
              className={`lib-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="lib-bulk-actions">
          <span>{selectedItems.length} selected</span>
          <button className="lib-bulk-download" onClick={handleBulkDownload}>
            <Download size={16} />
            Download Selected
          </button>
          <button className="lib-clear-selection" onClick={() => setSelectedItems([])}>
            Clear
          </button>
        </div>
      )}

      {/* Content Grid/List */}
      <div className={`lib-content ${viewMode}`}>
        {filteredPurchases.length === 0 ? (
          <div className="lib-empty-state">
            <Package size={48} />
            <h3>No items found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className={`lib-items-${viewMode}`}>
            {filteredPurchases.map(purchase => (
              <div key={purchase.id} className={`lib-item ${selectedItems.includes(purchase.id) ? 'selected' : ''}`}>
                <div className="lib-item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(purchase.id)}
                    onChange={() => toggleItemSelection(purchase.id)}
                  />
                </div>

                <div className="lib-item-thumbnail">
                  <img src={purchase.thumbnail} alt={purchase.title} />
                  <div className="lib-item-type">
                    {getTypeIcon(purchase.type)}
                  </div>
                  {purchase.duration && (
                    <div className="lib-item-duration">{purchase.duration}</div>
                  )}
                </div>

                <div className="lib-item-info">
                  <h3>{purchase.title}</h3>
                  <div className="lib-item-meta">
                    <span className="lib-creator">
                      <User size={12} />
                      {purchase.creatorName}
                    </span>
                    <span className="lib-date">
                      <Calendar size={12} />
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="lib-item-details">
                    <span className="lib-type-label">{getTypeLabel(purchase.type)}</span>
                    {purchase.fileCount && (
                      <span className="lib-file-count">{purchase.fileCount} files</span>
                    )}
                    <span className="lib-file-size">{purchase.fileSize}</span>
                  </div>
                </div>

                <div className="lib-item-actions">
                  <button 
                    className="lib-download-btn"
                    onClick={() => handleDownload(purchase)}
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    className="lib-view-btn"
                    title="View"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;