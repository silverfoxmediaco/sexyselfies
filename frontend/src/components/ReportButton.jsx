import React, { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import ReportModal from './ReportModal';
import './ReportButton.css';

const ReportButton = ({
  contentId,
  contentType = 'content',
  reportedUserId,
  variant = 'default',
  size = 'medium',
  showText = true,
  className = '',
  onReportSubmitted = () => {}
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  const handleReportClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowReportModal(true);
  };

  const handleReportSuccess = (reportData) => {
    setShowReportModal(false);
    onReportSubmitted(reportData);
  };

  const getButtonClasses = () => {
    const baseClasses = ['ReportButton-button'];
    baseClasses.push(`ReportButton-button--${variant}`);
    baseClasses.push(`ReportButton-button--${size}`);
    if (className) baseClasses.push(className);
    return baseClasses.join(' ');
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 20;
      default: return 16;
    }
  };

  const renderIcon = () => {
    if (variant === 'danger') {
      return <AlertTriangle size={getIconSize()} />;
    }
    return <Flag size={getIconSize()} />;
  };

  return (
    <>
      <button
        type="button"
        className={getButtonClasses()}
        onClick={handleReportClick}
        aria-label="Report this content"
        title="Report this content"
      >
        {renderIcon()}
        {showText && (
          <span className="ReportButton-text">
            Report
          </span>
        )}
      </button>

      {showReportModal && (
        <ReportModal
          contentId={contentId}
          contentType={contentType}
          reportedUserId={reportedUserId}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </>
  );
};

export default ReportButton;