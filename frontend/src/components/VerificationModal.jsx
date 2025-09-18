import React, { useState, useEffect } from 'react';
import './VerificationModal.css';

const VerificationModal = ({
  verification,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleKeyPress = e => {
      if (!isOpen) return;

      switch (e.key.toLowerCase()) {
        case 'a':
          if (!showRejectForm) handleApprove();
          break;
        case 'r':
          if (!showRejectForm) setShowRejectForm(true);
          break;
        case 'escape':
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, showRejectForm]);

  const handleApprove = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      await onApprove(verification.userId);
      handleClose();
    } catch (error) {
      console.error('Error approving verification:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (processing || !rejectionReason.trim()) return;
    setProcessing(true);

    try {
      await onReject(verification.userId, rejectionReason);
      handleClose();
    } catch (error) {
      console.error('Error rejecting verification:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedDocument(null);
    setRejectionReason('');
    setShowRejectForm(false);
    setProcessing(false);
    onClose();
  };

  const openDocumentViewer = doc => {
    setSelectedDocument(doc);
  };

  const closeDocumentViewer = () => {
    setSelectedDocument(null);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen || !verification) return null;

  return (
    <>
      <div className='VerificationModal-overlay' onClick={handleClose}>
        <div
          className='VerificationModal-content'
          onClick={e => e.stopPropagation()}
        >
          <div className='VerificationModal-header'>
            <h2>Verification Details</h2>
            <button
              className='VerificationModal-closeBtn'
              onClick={handleClose}
            >
              ✕
            </button>
          </div>

          <div className='VerificationModal-body'>
            <div className='VerificationModal-section'>
              <h3>Creator Information</h3>
              <div className='VerificationModal-infoGrid'>
                <div className='VerificationModal-infoItem'>
                  <label>Display Name</label>
                  <p>{verification.displayName || 'Not provided'}</p>
                </div>
                <div className='VerificationModal-infoItem'>
                  <label>Email</label>
                  <p>{verification.email}</p>
                </div>
                <div className='VerificationModal-infoItem'>
                  <label>Registration Date</label>
                  <p>{formatDate(verification.registrationDate)}</p>
                </div>
                <div className='VerificationModal-infoItem'>
                  <label>Submission Date</label>
                  <p>{formatDate(verification.submissionDate)}</p>
                </div>
                <div className='VerificationModal-infoItem'>
                  <label>User ID</label>
                  <p className='VerificationModal-userId'>
                    {verification.userId}
                  </p>
                </div>
              </div>
            </div>

            <div className='VerificationModal-section'>
              <h3>Verification Documents</h3>
              <div className='VerificationModal-documentsGrid'>
                {verification.documents?.map((doc, index) => (
                  <div key={index} className='VerificationModal-documentItem'>
                    <div
                      className='VerificationModal-documentPreview'
                      onClick={() => openDocumentViewer(doc)}
                    >
                      <img src={doc.url} alt={doc.type} />
                      <div className='VerificationModal-documentOverlay'>
                        <svg
                          width='24'
                          height='24'
                          viewBox='0 0 24 24'
                          fill='currentColor'
                        >
                          <path d='M15 3v4a3 3 0 003 3h4m-8-7H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V8l-6-5z'></path>
                        </svg>
                        <span>Click to view</span>
                      </div>
                    </div>
                    <div className='VerificationModal-documentInfo'>
                      <span className='VerificationModal-documentType'>
                        {doc.type}
                      </span>
                      <span className='VerificationModal-documentLabel'>
                        Document {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!showRejectForm && (
              <div className='VerificationModal-actions'>
                <button
                  className='VerificationModal-actionBtn VerificationModal-approve'
                  onClick={handleApprove}
                  disabled={processing}
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'></path>
                  </svg>
                  {processing ? 'Approving...' : 'Approve Creator'}
                </button>
                <button
                  className='VerificationModal-actionBtn VerificationModal-reject'
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'></path>
                  </svg>
                  Reject
                </button>
              </div>
            )}

            {showRejectForm && (
              <div className='VerificationModal-rejectForm'>
                <h4>Rejection Reason</h4>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder='Please provide a reason for rejection...'
                  rows={4}
                />
                <div className='VerificationModal-rejectActions'>
                  <button
                    className='VerificationModal-actionBtn VerificationModal-cancel'
                    onClick={() => setShowRejectForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className='VerificationModal-actionBtn VerificationModal-reject'
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                  >
                    {processing ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            <div className='VerificationModal-keyboardHints'>
              {!showRejectForm && (
                <>
                  <span>
                    <kbd>A</kbd> Approve
                  </span>
                  <span>
                    <kbd>R</kbd> Reject
                  </span>
                </>
              )}
              <span>
                <kbd>ESC</kbd> Close
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div
          className='VerificationModal-documentViewer'
          onClick={closeDocumentViewer}
        >
          <div
            className='VerificationModal-documentViewerContent'
            onClick={e => e.stopPropagation()}
          >
            <button
              className='VerificationModal-documentClose'
              onClick={closeDocumentViewer}
            >
              ✕
            </button>
            <img src={selectedDocument.url} alt={selectedDocument.type} />
            <div className='VerificationModal-documentTitle'>
              {selectedDocument.type}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VerificationModal;
