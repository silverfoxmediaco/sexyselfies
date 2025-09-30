# Connections Components

A complete set of React components for managing user connections in a mobile-first PWA application.

## Components Overview

### ConnectionsList
Main container component that manages the entire connections interface.

**Props:**
- `connections` (Array): Array of connection objects
- `onDeleteConnection` (Function): Callback for deleting individual connection
- `onBulkDelete` (Function): Callback for bulk deletion
- `onRefresh` (Function): Callback for refreshing connections
- `loading` (Boolean): Loading state
- `error` (Object): Error object
- `className` (String): Additional CSS classes

### ConnectionCard
Individual connection card component that displays connection data and handles interactions.

**Props:**
- `connection` (Object): Connection data object
- `isSelected` (Boolean): Whether card is selected
- `onSelect` (Function): Callback for selection change
- `onDelete` (Function): Callback for delete action
- `showCheckbox` (Boolean): Whether to show selection checkbox

### ConnectionAvatar
Avatar component with connection type badge and online status.

**Props:**
- `avatar` (String): Avatar image URL
- `name` (String): User's name for alt text
- `connectionType` (String): Connection type (S, M, C, etc.)
- `connectionTypeColor` (String): Badge background color
- `size` (String): Avatar size (small, medium, large)
- `showBadge` (Boolean): Whether to show the connection type badge
- `onClick` (Function): Optional click handler

### ConnectionsFilter
Filter and bulk action controls for the connections list.

**Props:**
- `filterText` (String): Current filter text
- `onFilterChange` (Function): Filter text change handler
- `sortBy` (String): Current sort option
- `onSortChange` (Function): Sort change handler
- `selectedCount` (Number): Number of selected items
- `totalCount` (Number): Total number of items
- `allSelected` (Boolean): Whether all items are selected
- `onSelectAll` (Function): Select all handler
- `onBulkDelete` (Function): Bulk delete handler

### DeleteConfirmationModal
Confirmation dialog for deleting connections.

**Props:**
- `isOpen` (Boolean): Whether modal is open
- `onConfirm` (Function): Confirm deletion callback
- `onCancel` (Function): Cancel deletion callback
- `connection` (Object): Single connection to delete
- `bulkCount` (Number): Number of connections for bulk delete

### ConnectionsSkeleton
Loading skeleton component for connections list.

**Props:**
- `count` (Number): Number of skeleton items to show
- `showFilter` (Boolean): Whether to show filter skeleton

## Data Structure

### Connection Object
```javascript
{
  id: String,                    // Unique identifier
  avatar: String,                // Avatar image URL (optional)
  name: String,                  // Display name
  username: String,              // Username (optional)
  connectionType: String,        // Connection type (S, M, C, F, P)
  connectionTypeColor: String,   // Badge color (hex)
  lastMessage: String,           // Last message text
  messageTime: String,           // ISO date string
  isConnected: Boolean          // Connection status
}
```

### Connection Types
- **S** - Subscriber (#8e8e93)
- **M** - Member (#3b82f6)
- **C** - Connection (#10b981)
- **F** - Fan (#f59e0b)
- **P** - Premium (#8b5cf6)

## Basic Usage

```jsx
import React, { useState, useEffect } from 'react';
import { ConnectionsList } from '../components/Connections';

const MyConnectionsPage = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteConnection = async (connectionId) => {
    try {
      await api.delete(`/connections/${connectionId}`);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBulkDelete = async (connectionIds) => {
    try {
      await api.post('/connections/bulk-delete', { connectionIds });
      setConnections(prev => prev.filter(c => !connectionIds.includes(c.id)));
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/connections');
      setConnections(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return (
    <ConnectionsList
      connections={connections}
      onDeleteConnection={handleDeleteConnection}
      onBulkDelete={handleBulkDelete}
      onRefresh={fetchConnections}
      loading={loading}
      error={error}
    />
  );
};
```

## Advanced Usage

### Custom Avatar Sizes
```jsx
<ConnectionAvatar
  avatar="/path/to/avatar.jpg"
  name="User Name"
  connectionType="M"
  connectionTypeColor="#3b82f6"
  size="large"
  onClick={() => console.log('Avatar clicked')}
/>
```

### Custom Skeleton Loading
```jsx
<ConnectionsSkeleton
  count={8}
  showFilter={true}
/>
```

### Individual Components
```jsx
import {
  ConnectionCard,
  ConnectionAvatar,
  ConnectionsFilter,
  DeleteConfirmationModal
} from '../components/Connections';

// Use individual components as needed
```

## API Integration

### Required API Endpoints

```javascript
// Fetch connections
GET /api/connections
Response: { data: Connection[], total: number }

// Delete connection
DELETE /api/connections/:id
Response: { success: boolean }

// Bulk delete connections
POST /api/connections/bulk-delete
Body: { connectionIds: string[] }
Response: { success: boolean, deleted: number }
```

### Example API Service
```javascript
// services/connections.service.js
class ConnectionsService {
  async getConnections(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/connections?${params}`);
    return response.data;
  }

  async deleteConnection(connectionId) {
    const response = await api.delete(`/connections/${connectionId}`);
    return response.data;
  }

  async bulkDeleteConnections(connectionIds) {
    const response = await api.post('/connections/bulk-delete', {
      connectionIds
    });
    return response.data;
  }
}

export default new ConnectionsService();
```

## Styling and Theming

### CSS Custom Properties
The components use CSS custom properties for theming:

```css
:root {
  --primary: #17d2c2;
  --bg-dark: #0a0a0a;
  --surface: #1c1c1e;
  --border: #2a2a2c;
  --text-primary: #ffffff;
  --text-secondary: #c7c7cc;
  --text-muted: #8e8e93;
  --error: #ef4444;
  --success: #22c55e;
  --warning: #f59e0b;
}
```

### Responsive Design
All components are mobile-first and responsive:
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px

### Touch Targets
All interactive elements meet WCAG AA guidelines:
- Minimum 44x44px touch targets
- Proper spacing between elements
- Clear visual feedback

## Accessibility Features

- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Logical focus order and visual indicators
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Supports `prefers-contrast: high`
- **Semantic HTML**: Proper heading hierarchy and landmarks

## Performance Optimizations

- **React.memo**: All components are memoized
- **Lazy Loading**: Images load lazily with intersection observer
- **Virtual Scrolling**: Supports large lists (100+ items)
- **Optimistic Updates**: Immediate UI feedback
- **Debounced Search**: Search input is debounced

## Testing

### Unit Tests (Jest + React Testing Library)
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionCard } from '../Connections';

test('renders connection card with data', () => {
  const connection = {
    id: '1',
    name: 'Test User',
    lastMessage: 'Hello world',
    messageTime: '2025-09-22T15:30:00Z'
  };

  render(
    <ConnectionCard
      connection={connection}
      onSelect={jest.fn()}
      onDelete={jest.fn()}
    />
  );

  expect(screen.getByText('Test User')).toBeInTheDocument();
  expect(screen.getByText('Hello world')).toBeInTheDocument();
});
```

### Integration Tests
```javascript
test('deletes connection when delete button clicked', async () => {
  const mockDelete = jest.fn();
  const connections = [{ id: '1', name: 'Test User' }];

  render(
    <ConnectionsList
      connections={connections}
      onDeleteConnection={mockDelete}
      onBulkDelete={jest.fn()}
    />
  );

  fireEvent.click(screen.getByLabelText('Delete connection with Test User'));
  fireEvent.click(screen.getByText('Delete Connection'));

  await waitFor(() => {
    expect(mockDelete).toHaveBeenCalledWith('1');
  });
});
```

## Required Dependencies

Add these to your package.json:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.290.0",
    "prop-types": "^15.8.0"
  },
  "devDependencies": {
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.16.0",
    "@testing-library/user-event": "^14.0.0"
  }
}
```

## File Structure

```
components/
  Connections/
    ConnectionsList.jsx
    ConnectionsList.css
    ConnectionCard.jsx
    ConnectionCard.css
    ConnectionAvatar.jsx
    ConnectionAvatar.css
    ConnectionsFilter.jsx
    ConnectionsFilter.css
    DeleteConfirmationModal.jsx
    DeleteConfirmationModal.css
    ConnectionsSkeleton.jsx
    ConnectionsSkeleton.css
    ConnectionsExample.jsx
    ConnectionsExample.css
    index.js
    README.md
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

Part of the SexySelfies PWA project.