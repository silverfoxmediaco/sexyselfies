import React from 'react';
import ContentItem from './ContentItem';
import './ContentGrid.css';

const ContentGrid = ({ content, onContentClick, purchasedContent = [] }) => {
  if (!content || content.length === 0) {
    return (
      <div className="ContentGrid-empty">
        <p>No content available</p>
      </div>
    );
  }

  return (
    <div className="ContentGrid-container">
      <div className="ContentGrid-grid">
        {content.map((item, index) => (
          <ContentItem
            key={item.id || index}
            content={item}
            onClick={() => onContentClick(item, index)}
            isPurchased={purchasedContent.includes(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ContentGrid;