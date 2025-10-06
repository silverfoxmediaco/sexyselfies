import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  Printer,
  Menu,
  X
} from 'lucide-react';
import './TOS.css';
import BottomNavigation from '../components/BottomNavigation';

// Terms content
const termsContent = {
  version: "1.0.0",
  effectiveDate: "January 1, 2025",
  lastUpdated: "January 1, 2025",
  sections: [
    {
      id: "notice",
      title: "Important Notice",
      content: "**You must be at least 18 years old to use this platform. This platform contains adult content.**"
    },
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content: `By accessing or using SexySelfies ("Platform", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Platform.`
    },
    {
      id: "age-requirement",
      title: "2. Age Requirement and Verification",
      content: `### 2.1 Minimum Age
You must be at least eighteen (18) years old to use this Platform. By using the Platform, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.

### 2.2 Age Verification
We reserve the right to require age verification at any time. Providing false information regarding your age is grounds for immediate account termination.`
    },
    {
      id: "account-registration",
      title: "3. Account Registration and Security",
      content: `### 3.1 Account Creation
- You must provide accurate, complete, and current information
- One account per person is permitted
- You are responsible for maintaining account security
- You must immediately notify us of any unauthorized use

### 3.2 Creator Accounts
Creators must complete additional verification including:
- Government-issued ID verification
- Tax information (W-9 or equivalent)
- Banking information for payments`
    },
    {
      id: "content-guidelines",
      title: "4. Content Guidelines and Ownership",
      content: `### 4.1 Creator Content Rights
- Creators retain all ownership rights to their content
- Creators grant the Platform a non-exclusive, worldwide license to display, distribute, and promote content
- This license continues only while content remains on the Platform

### 4.2 Prohibited Content
The following content is strictly prohibited:
- Content involving anyone under 18 years old
- Non-consensual content of any kind
- Content that violates any law
- Copyrighted material you don't own
- Revenge pornography
- Extreme violence or illegal activities
- Bestiality
- Incest (real or simulated)

### 4.3 Content Moderation
We reserve the right to remove any content that violates these Terms without prior notice.`
    },
    {
      id: "user-conduct",
      title: "5. User Conduct",
      content: `Users agree NOT to:
- Harass, abuse, or harm other users or creators
- Attempt to circumvent payment systems
- Download, copy, or redistribute creator content
- Share account access with others
- Use automated systems or bots
- Violate any applicable laws
- Impersonate others
- Post spam or malicious links`
    },
    {
      id: "financial-terms",
      title: "6. Financial Terms",
      content: `### 6.1 Creator Payments
- Platform operates on an 80/20 revenue split (80% to creators, 20% to platform)
- Payments processed weekly for amounts over $100
- Creators responsible for their own taxes
- Platform will issue 1099 forms as required by law

### 6.2 User Purchases
- All purchases are final
- No refunds for digital content
- Prices set by creators
- Payment processing handled by third-party processor (CCBill)

### 6.3 Chargebacks
Users who initiate chargebacks may have their accounts terminated. Creators are responsible for chargeback fees on their content.`
    },
    {
      id: "privacy",
      title: "7. Privacy and Data Protection",
      content: "Your use of the Platform is also governed by our Privacy Policy. We comply with applicable data protection laws including GDPR where applicable."
    },
    {
      id: "intellectual-property",
      title: "8. Intellectual Property",
      content: `### 8.1 DMCA Compliance
We respond to valid DMCA takedown notices. To report copyright infringement, contact our DMCA agent at dmca@sexyselfies.com.

### 8.2 Platform Property
The Platform's name, logo, and all related designs are our property and protected by intellectual property laws.`
    },
    {
      id: "third-party",
      title: "9. Third-Party Services",
      content: `### 9.1 Payment Processors
We use CCBill for payment processing. Users agree to CCBill's terms of service.

### 9.2 External Links
We are not responsible for content on external websites linked from the Platform.`
    },
    {
      id: "disclaimers",
      title: "10. Disclaimers and Limitations of Liability",
      content: `### 10.1 "As Is" Service
The Platform is provided "as is" without warranties of any kind.

### 10.2 Limitation of Liability
We are not liable for:
- Actions of users or creators
- Content posted by creators
- Loss of data or content
- Indirect or consequential damages

### 10.3 Maximum Liability
Our total liability shall not exceed the amount you paid us in the past twelve months.`
    },
    {
      id: "indemnification",
      title: "11. Indemnification",
      content: `You agree to indemnify and hold harmless the Platform from any claims arising from:
- Your use of the Platform
- Your content
- Your violation of these Terms
- Your violation of any third-party rights`
    },
    {
      id: "termination",
      title: "12. Account Termination",
      content: `### 12.1 Termination by User
You may terminate your account at any time through account settings.

### 12.2 Termination by Platform
We may terminate or suspend accounts that:
- Violate these Terms
- Engage in fraudulent activity
- Harm other users
- At our sole discretion with notice

### 12.3 Effect of Termination
- Creators will receive final payment for earned revenue
- Users lose access to all purchased content
- Some information may be retained as required by law`
    },
    {
      id: "dispute-resolution",
      title: "13. Dispute Resolution",
      content: `### 13.1 Informal Resolution
We encourage users to contact us first to resolve disputes informally.

### 13.2 Arbitration
Disputes not resolved informally will be settled by binding arbitration.

### 13.3 Class Action Waiver
You waive any right to bring claims as a class action.`
    },
    {
      id: "changes",
      title: "14. Changes to Terms",
      content: "We may modify these Terms at any time. Continued use after changes constitutes acceptance."
    },
    {
      id: "severability",
      title: "15. Severability",
      content: "If any provision of these Terms is found invalid, the remaining provisions continue in full force."
    },
    {
      id: "governing-law",
      title: "16. Governing Law",
      content: "These Terms are governed by the laws of the United States, without regard to conflict of law principles."
    },
    {
      id: "compliance",
      title: "17. 18 U.S.C. 2257 Compliance Notice",
      content: "All performers in content on this Platform were 18 years of age or older at time of creation. Records required by 18 U.S.C. 2257 are kept by individual content creators."
    },
    {
      id: "contact",
      title: "18. Contact Information",
      content: `For questions about these Terms, contact us at:
- Email: support@sexyselfies.com
- Address: 555 Main St, Suite 300, Dallas, TX 75201`
    },
    {
      id: "entire-agreement",
      title: "19. Entire Agreement",
      content: "These Terms constitute the entire agreement between you and the Platform regarding your use of our services."
    }
  ]
};

const TOS = () => {
  // State management
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Refs
  const contentRef = useRef(null);
  const sectionsRef = useRef({});


  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = Math.min((scrollTop / scrollHeight) * 100, 100);

      setScrollProgress(progress);

      // Update active section
      const sections = Object.values(sectionsRef.current);
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollTop + 100) {
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

  // Navigation functions
  const scrollToSection = (sectionId) => {
    const section = sectionsRef.current[sectionId];
    if (section && contentRef.current) {
      const offsetTop = section.offsetTop - 100; // Account for sticky header
      contentRef.current.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setShowTableOfContents(false);
  };


  const handlePrint = () => {
    window.print();
  };


  const formatContent = (content) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/- (.*)/g, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
  };


  return (
    <div className="tos-container">
      {/* Sticky Header */}
      <header className="tos-header">
        <div className="tos-header-content">
          <button
            className="tos-back-button"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="tos-header-info">
            <h1>Terms of Service</h1>
            <div className="tos-version-info">
              <Clock size={14} />
              <span>Version {termsContent.version} • Updated {termsContent.lastUpdated}</span>
            </div>
          </div>

          <div className="tos-header-actions">
            <button
              className="tos-print-button"
              onClick={handlePrint}
              aria-label="Print terms"
            >
              <Printer size={18} />
            </button>

            <button
              className="tos-menu-button"
              onClick={() => setShowTableOfContents(!showTableOfContents)}
              aria-label="Table of contents"
            >
              {showTableOfContents ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="tos-progress-container">
          <div
            className="tos-progress-bar"
            style={{ width: `${scrollProgress}%` }}
          ></div>
        </div>
      </header>

      {/* Table of Contents Overlay */}
      {showTableOfContents && (
        <div className="tos-table-of-contents-overlay">
          <div className="tos-table-of-contents">
            <h3>Table of Contents</h3>
            <nav>
              {termsContent.sections.map((section) => (
                <button
                  key={section.id}
                  className={`tos-toc-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="tos-main">
        <div
          className="tos-content"
          ref={contentRef}
        >
          <div className="tos-document">
            {/* Document Header */}
            <div className="tos-document-header">
              <h1>Terms of Service</h1>
              <div className="tos-document-meta">
                <p><strong>Effective Date:</strong> {termsContent.effectiveDate}</p>
                <p><strong>Last Updated:</strong> {termsContent.lastUpdated}</p>
                <p><strong>Version:</strong> {termsContent.version}</p>
              </div>
            </div>

            {/* Document Sections */}
            <div className="tos-sections">
              {termsContent.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="tos-section"
                  ref={(el) => {
                    if (el) sectionsRef.current[section.id] = el;
                  }}
                >
                  <h2>{section.title}</h2>
                  <div
                    className="tos-section-content"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(section.content)
                    }}
                  />
                </section>
              ))}
            </div>

            {/* Final Notice */}
            <div className="tos-final-notice">
              <p><strong>By using SexySelfies, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong></p>
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default TOS;