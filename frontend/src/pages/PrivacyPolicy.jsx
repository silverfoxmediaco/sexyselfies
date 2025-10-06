import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
  Clock,
  CheckCircle,
  Eye,
  Shield,
  FileText
} from 'lucide-react';
import './PrivacyPolicy.css';
import BottomNavigation from '../components/BottomNavigation';

// Privacy Policy content structured
const privacyPolicyContent = {
  version: "1.0.0",
  effectiveDate: "January 1, 2025",
  lastUpdated: "January 1, 2025",
  estimatedReadingTime: "12 minute read",
  sections: [
    {
      id: "introduction",
      title: "1. Introduction",
      content: `SexySelfies ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

By using SexySelfies, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use our platform.`
    },
    {
      id: "information-we-collect",
      title: "2. Information We Collect",
      subsections: [
        {
          id: "direct-information",
          title: "2.1 Information You Provide Directly",
          content: `**Account Information:**
- Email address
- Username
- Date of birth (for age verification)
- Profile information (bio, display name)
- Profile and content photos/videos

**Creator Information (Additional):**
- Legal name
- Government-issued ID
- Tax identification number (SSN/EIN)
- Banking information for payments
- Address for tax purposes

**Payment Information:**
- Processed through CCBill (we do not store card details)
- Transaction history
- Earnings and payout records`
        },
        {
          id: "automatic-information",
          title: "2.2 Information Collected Automatically",
          content: `**Usage Data:**
- IP address
- Browser type and version
- Device information
- Pages visited and time spent
- Click patterns and interactions

**Cookies and Tracking:**
- Session cookies for authentication
- Preference cookies for settings
- Analytics cookies for service improvement`
        },
        {
          id: "content-communications",
          title: "2.3 Content and Communications",
          content: `- Messages between users and creators
- Content uploaded to the platform
- Reports and flags submitted
- Customer support communications`
        }
      ]
    },
    {
      id: "how-we-use-information",
      title: "3. How We Use Your Information",
      subsections: [
        {
          id: "platform-operations",
          title: "3.1 Platform Operations",
          content: `- Provide and maintain our services
- Process transactions and payments
- Verify age and identity
- Communicate about your account`
        },
        {
          id: "safety-security",
          title: "3.2 Safety and Security",
          content: `- Detect and prevent fraud
- Enforce our Terms of Service
- Respond to legal requests
- Protect users and creators`
        },
        {
          id: "improvements-analytics",
          title: "3.3 Improvements and Analytics",
          content: `- Analyze platform usage
- Develop new features
- Optimize user experience
- Send relevant notifications`
        },
        {
          id: "legal-compliance",
          title: "3.4 Legal Compliance",
          content: `- Tax reporting (1099 forms for US creators)
- Age verification requirements
- Law enforcement cooperation when required
- DMCA and content moderation`
        }
      ]
    },
    {
      id: "how-we-share-information",
      title: "4. How We Share Your Information",
      subsections: [
        {
          id: "with-other-users",
          title: "4.1 With Other Users",
          content: `- Profile information you make public
- Content you choose to share
- Username and display information`
        },
        {
          id: "with-service-providers",
          title: "4.2 With Service Providers",
          content: `- **CCBill**: Payment processing
- **Cloudinary**: Content storage and delivery
- **SendGrid**: Email communications
- **AWS**: Infrastructure and hosting`
        },
        {
          id: "legal-requirements",
          title: "4.3 Legal Requirements",
          content: `We may disclose your information if required by:
- Court order or subpoena
- Law enforcement investigation
- Protection of our legal rights
- Prevention of harm or illegal activity`
        },
        {
          id: "business-transfers",
          title: "4.4 Business Transfers",
          content: `If we merge with or are acquired by another company, your information may be transferred to the new owners.

**We NEVER sell your personal information to third parties.**`
        }
      ]
    },
    {
      id: "data-retention",
      title: "5. Data Retention",
      subsections: [
        {
          id: "active-accounts",
          title: "5.1 Active Accounts",
          content: "We retain your information while your account is active and as needed to provide services."
        },
        {
          id: "after-deletion",
          title: "5.2 After Account Deletion",
          content: `- **Transaction records**: 7 years (legal requirement)
- **Tax documents**: 7 years
- **Content**: Deleted within 30 days
- **Messages**: Deleted within 90 days
- **Logs**: Retained for 1 year`
        },
        {
          id: "legal-holds",
          title: "5.3 Legal Holds",
          content: "Information may be retained longer if subject to legal hold or investigation."
        }
      ]
    },
    {
      id: "your-rights",
      title: "6. Your Rights and Choices",
      subsections: [
        {
          id: "access-portability",
          title: "6.1 Access and Portability",
          content: "You can request a copy of your personal data in a portable format."
        },
        {
          id: "correction",
          title: "6.2 Correction",
          content: "You can update your information through account settings or contact support."
        },
        {
          id: "deletion",
          title: "6.3 Deletion",
          content: "You can request account deletion. Some information may be retained as described in Section 5."
        },
        {
          id: "marketing-communications",
          title: "6.4 Marketing Communications",
          content: "You can opt-out of marketing emails through the unsubscribe link or settings."
        },
        {
          id: "cookie-preferences",
          title: "6.5 Cookie Preferences",
          content: "You can manage cookies through your browser settings."
        }
      ]
    },
    {
      id: "california-rights",
      title: "7. California Privacy Rights (CCPA)",
      content: `California residents have additional rights:
- Right to know what information we collect
- Right to delete personal information
- Right to opt-out of data "sales" (we don't sell data)
- Right to non-discrimination

To exercise these rights, contact privacy@sexyselfies.com`
    },
    {
      id: "european-rights",
      title: "8. European Privacy Rights (GDPR)",
      content: `EU residents have additional rights:
- Right to access
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object
- Rights related to automated decision-making

**Legal Basis for Processing:**
- Consent (for marketing)
- Contract performance (for services)
- Legal obligations (tax, age verification)
- Legitimate interests (fraud prevention)`
    },
    {
      id: "data-security",
      title: "9. Data Security",
      subsections: [
        {
          id: "technical-measures",
          title: "9.1 Technical Measures",
          content: `- Encryption in transit (TLS/SSL)
- Encryption at rest for sensitive data
- Regular security audits
- Access controls and authentication`
        },
        {
          id: "organizational-measures",
          title: "9.2 Organizational Measures",
          content: `- Limited employee access
- Confidentiality agreements
- Security training
- Incident response procedures`
        },
        {
          id: "breach-notification",
          title: "9.3 Breach Notification",
          content: "If a breach occurs that may harm you, we will notify you within 72 hours via email and platform notification."
        }
      ]
    },
    {
      id: "childrens-privacy",
      title: "10. Children's Privacy",
      content: "Our platform is strictly for users 18 and older. We do not knowingly collect information from anyone under 18. If we discover underage information, it will be immediately deleted."
    },
    {
      id: "international-transfers",
      title: "11. International Data Transfers",
      content: "Your information may be transferred to and processed in the United States. By using our platform, you consent to this transfer."
    },
    {
      id: "creator-privacy",
      title: "12. Creator-Specific Privacy Terms",
      subsections: [
        {
          id: "public-information",
          title: "12.1 Public Information",
          content: "Creators understand that their stage name, profile, and public content are visible to users."
        },
        {
          id: "financial-information",
          title: "12.2 Financial Information",
          content: "Creator earnings, tax information, and banking details are kept strictly confidential."
        },
        {
          id: "identity-verification",
          title: "12.3 Identity Verification",
          content: "Government ID information is encrypted and only accessed for verification and legal compliance."
        }
      ]
    },
    {
      id: "third-party-links",
      title: "13. Third-Party Links",
      content: "Our platform may contain links to third-party websites. We are not responsible for their privacy practices."
    },
    {
      id: "policy-changes",
      title: "14. Changes to This Policy",
      content: `We may update this policy periodically. We will notify you of material changes via:
- Email notification
- Platform notification
- Prominent notice on our website`
    },
    {
      id: "contact-information",
      title: "15. Contact Information",
      content: `For privacy-related questions or to exercise your rights:

**Email:** privacy@sexyselfies.com
**Data Protection Officer:** dpo@sexyselfies.com
**Address:** [Physical Address Required]

For GDPR inquiries (EU residents):
**EU Representative:** [EU Representative Details Required]`
    },
    {
      id: "cookie-policy",
      title: "16. Cookie Policy",
      subsections: [
        {
          id: "essential-cookies",
          title: "16.1 Essential Cookies",
          content: "Required for platform operation (login, security)"
        },
        {
          id: "functional-cookies",
          title: "16.2 Functional Cookies",
          content: "Remember your preferences and settings"
        },
        {
          id: "analytics-cookies",
          title: "16.3 Analytics Cookies",
          content: "Help us understand platform usage (can be disabled)"
        },
        {
          id: "managing-cookies",
          title: "16.4 Managing Cookies",
          content: "You can control cookies through browser settings, though some features may not work properly without them."
        }
      ]
    },
    {
      id: "do-not-track",
      title: "17. Do Not Track",
      content: "We currently do not respond to Do Not Track signals, but you can manage tracking through cookie settings."
    },
    {
      id: "complaints",
      title: "18. Complaints",
      content: `If you're unsatisfied with our privacy practices:
1. Contact us at support@sexyselfies.com
2. File a complaint with your local data protection authority
3. For US residents: File with the FTC at ftc.gov`
    }
  ]
};

const PrivacyPolicy = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [expandedSections, setExpandedSections] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [copyToast, setCopyToast] = useState('');

  // Refs
  const contentRef = useRef(null);
  const sectionsRef = useRef({});
  const searchInputRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize expanded sections for mobile
  useEffect(() => {
    if (isMobile) {
      setExpandedSections([privacyPolicyContent.sections[0].id]);
    } else {
      setExpandedSections(privacyPolicyContent.sections.map(section => section.id));
    }
  }, [isMobile]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const sections = Object.values(sectionsRef.current);
      const scrollTop = contentRef.current.scrollTop + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollTop) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results = [];
    const searchLower = searchTerm.toLowerCase();

    privacyPolicyContent.sections.forEach((section) => {
      // Search in main content
      if (section.content && section.content.toLowerCase().includes(searchLower)) {
        results.push({ sectionId: section.id, type: 'main' });
      }

      // Search in subsections
      if (section.subsections) {
        section.subsections.forEach((subsection) => {
          if (subsection.content.toLowerCase().includes(searchLower)) {
            results.push({ sectionId: section.id, subsectionId: subsection.id, type: 'sub' });
          }
        });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchTerm]);

  // Navigation functions
  const scrollToSection = (sectionId, subsectionId = null) => {
    const targetId = subsectionId || sectionId;
    const section = sectionsRef.current[targetId];
    if (section && contentRef.current) {
      const offsetTop = section.offsetTop - 100;
      contentRef.current.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });

      // Expand section if on mobile
      if (isMobile && !expandedSections.includes(sectionId)) {
        setExpandedSections(prev => [...prev, sectionId]);
      }
    }
    setShowSidebar(false);
  };

  const handleSearch = (direction = 'next') => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    }

    setCurrentSearchIndex(newIndex);
    const result = searchResults[newIndex];
    scrollToSection(result.sectionId, result.subsectionId);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const copyLink = async (sectionId, subsectionId = null) => {
    const targetId = subsectionId || sectionId;
    const url = `${window.location.origin}/privacy#${targetId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopyToast('Link copied!');
      setTimeout(() => setCopyToast(''), 2000);
    } catch (err) {
      console.warn('Could not copy link:', err);
      setCopyToast('Copy failed');
      setTimeout(() => setCopyToast(''), 2000);
    }
  };


  const formatContent = (content) => {
    if (!content) return '';

    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/- (.*)/g, '<li>$1</li>')
      .replace(/(\n|^)(\d+\.\s.*?)(?=\n|$)/g, '<ol><li>$2</li></ol>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    // Highlight search terms
    if (searchTerm.trim()) {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      formatted = formatted.replace(regex, '<mark class="privacy-search-highlight">$1</mark>');
    }

    return formatted;
  };

  const getAllSections = () => {
    const allSections = [];
    privacyPolicyContent.sections.forEach(section => {
      allSections.push(section);
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          allSections.push({ ...subsection, parentId: section.id });
        });
      }
    });
    return allSections;
  };

  if (!privacyPolicyContent) {
    return (
      <div className="privacy-loading">
        <div className="privacy-loading-spinner"></div>
        <p>Loading Privacy Policy...</p>
      </div>
    );
  }

  return (
    <div className="privacy-container">
      {/* Header */}
      <header className="privacy-header">
        <div className="privacy-header-content">
          <button
            className="privacy-back-button"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="privacy-header-info">
            <h1>Privacy Policy</h1>
            <div className="privacy-version-info">
              <Clock size={14} />
              <span>Version {privacyPolicyContent.version} • {privacyPolicyContent.estimatedReadingTime} read</span>
            </div>
          </div>

        </div>

        {/* Search Bar */}
        <div className="privacy-search-container">
          <div className="privacy-search-input-wrapper">
            <Search size={18} className="privacy-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search privacy policy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="privacy-search-input"
            />
            {searchResults.length > 0 && (
              <div className="privacy-search-results-info">
                <span>{currentSearchIndex + 1} of {searchResults.length}</span>
                <button onClick={() => handleSearch('prev')} aria-label="Previous result">
                  <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button onClick={() => handleSearch('next')} aria-label="Next result">
                  <ChevronDown size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      {showSidebar && (
        <div className="privacy-sidebar-overlay" onClick={() => setShowSidebar(false)}>
          <nav className="privacy-sidebar" onClick={e => e.stopPropagation()}>
            <h3>Table of Contents</h3>
            <div className="privacy-sidebar-sections">
              {getAllSections().map((section) => (
                <button
                  key={section.id}
                  className={`privacy-sidebar-item ${
                    activeSection === section.id ? 'active' : ''
                  } ${section.parentId ? 'subsection' : ''}`}
                  onClick={() => scrollToSection(section.parentId || section.id, section.parentId ? section.id : null)}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="privacy-main">
        <div className="privacy-content" ref={contentRef}>
          <div className="privacy-document">
            {/* Document Header */}
            <div className="privacy-document-header">
              <h1>Privacy Policy</h1>
              <div className="privacy-document-meta">
                <p><strong>Effective Date:</strong> {privacyPolicyContent.effectiveDate}</p>
                <p><strong>Last Updated:</strong> {privacyPolicyContent.lastUpdated}</p>
                <p><strong>Reading Time:</strong> {privacyPolicyContent.estimatedReadingTime}</p>
                <p><strong>Version:</strong> {privacyPolicyContent.version}</p>
              </div>
            </div>

            {/* Document Sections */}
            <div className="privacy-sections">
              {privacyPolicyContent.sections.map((section) => (
                <section
                  key={section.id}
                  className={`privacy-section ${isMobile ? 'accordion' : ''} ${
                    expandedSections.includes(section.id) ? 'expanded' : 'collapsed'
                  }`}
                >
                  <div
                    className="privacy-section-header"
                    onClick={isMobile ? () => toggleSection(section.id) : undefined}
                    ref={(el) => {
                      if (el) sectionsRef.current[section.id] = el;
                    }}
                  >
                    <h2>{section.title}</h2>
                    <div className="privacy-section-actions">
                      <button
                        className="privacy-copy-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(section.id);
                        }}
                        aria-label="Copy section link"
                      >
                        <Copy size={16} />
                      </button>
                      {isMobile && (
                        <span className="privacy-accordion-indicator">
                          {expandedSections.includes(section.id) ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="privacy-section-content">
                    {section.content && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatContent(section.content)
                        }}
                      />
                    )}

                    {section.subsections && section.subsections.map((subsection) => (
                      <div
                        key={subsection.id}
                        className="privacy-subsection"
                        ref={(el) => {
                          if (el) sectionsRef.current[subsection.id] = el;
                        }}
                      >
                        <div className="privacy-subsection-header">
                          <h3>{subsection.title}</h3>
                          <button
                            className="privacy-copy-link"
                            onClick={() => copyLink(section.id, subsection.id)}
                            aria-label="Copy subsection link"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div
                          className="privacy-subsection-content"
                          dangerouslySetInnerHTML={{
                            __html: formatContent(subsection.content)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer */}
            <footer className="privacy-footer">
              <div className="privacy-footer-content">
                <p><strong>By using SexySelfies, you acknowledge that you have read and understood this Privacy Policy.</strong></p>

                <div className="privacy-contact-section">
                  <h3>Need Help?</h3>
                  <div className="privacy-contact-options">
                    <div className="privacy-contact-item">
                      <Shield size={20} />
                      <div>
                        <strong>Privacy Questions</strong>
                        <p>privacy@sexyselfies.com</p>
                      </div>
                    </div>
                    <div className="privacy-contact-item">
                      <FileText size={20} />
                      <div>
                        <strong>Data Protection Officer</strong>
                        <p>dpo@sexyselfies.com</p>
                      </div>
                    </div>
                    <div className="privacy-contact-item">
                      <Eye size={20} />
                      <div>
                        <strong>GDPR Inquiries</strong>
                        <p>Available for EU residents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* Copy Toast */}
      {copyToast && (
        <div className="privacy-copy-toast">
          <CheckCircle size={16} />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default PrivacyPolicy;