import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Download } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTOC, setShowTOC] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const contentRef = useRef(null);

  // Detect viewport changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll progress and active section
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      const sections = document.querySelectorAll('.privacy-section');
      let currentSection = '';

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = sectionId => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const scrollToSection = sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerOffset = 80;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      if (!expandedSections[sectionId]) {
        setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
      }
    }
    setShowTOC(false);
  };

  const downloadPDF = () => {
    window.print();
  };

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: 'SexySelfies is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using SexySelfies, you consent to the data practices described in this policy.',
    },
    {
      id: 'information-collect',
      title: '2. Information We Collect',
      content: 'We collect: Account information (email, username, date of birth for age verification), profile information, photos/videos. For creators: legal name, government ID, tax ID, banking information. Payment information processed through CCBill (we do not store card details). Usage data: IP address, browser type, device information, pages visited. Cookies for authentication, preferences, and analytics.',
    },
    {
      id: 'how-we-use',
      title: '3. How We Use Your Information',
      content: 'We use your information to: provide and maintain services, process transactions and payments, verify age and identity, communicate about your account, detect and prevent fraud, enforce our Terms of Service, respond to legal requests, analyze platform usage, develop new features, optimize user experience, send relevant notifications, and comply with legal requirements including tax reporting and age verification.',
    },
    {
      id: 'how-we-share',
      title: '4. How We Share Your Information',
      content: 'We share information with: Other users (profile information you make public, content you choose to share). Service providers (CCBill for payment processing, Cloudinary for content storage, SendGrid for email, AWS for hosting). Legal authorities when required by court order, subpoena, or law enforcement investigation. We NEVER sell your personal information to third parties.',
    },
    {
      id: 'data-retention',
      title: '5. Data Retention',
      content: 'We retain your information while your account is active. After account deletion: Transaction records and tax documents retained for 7 years (legal requirement), content deleted within 30 days, messages deleted within 90 days, logs retained for 1 year. Information may be retained longer if subject to legal hold or investigation.',
    },
    {
      id: 'your-rights',
      title: '6. Your Rights and Choices',
      content: 'You can: request a copy of your personal data in a portable format, update your information through account settings, request account deletion (some information may be retained per Section 5), opt-out of marketing emails through the unsubscribe link or settings, and manage cookies through your browser settings.',
    },
    {
      id: 'california-rights',
      title: '7. California Privacy Rights (CCPA)',
      content: 'California residents have additional rights: right to know what information we collect, right to delete personal information, right to opt-out of data "sales" (we don\'t sell data), and right to non-discrimination. To exercise these rights, contact privacy@sexyselfies.com',
    },
    {
      id: 'european-rights',
      title: '8. European Privacy Rights (GDPR)',
      content: 'EU residents have additional rights: right to access, rectification, erasure ("right to be forgotten"), restrict processing, data portability, object, and rights related to automated decision-making. Legal basis for processing: consent (for marketing), contract performance (for services), legal obligations (tax, age verification), and legitimate interests (fraud prevention).',
    },
    {
      id: 'data-security',
      title: '9. Data Security',
      content: 'We implement: encryption in transit (TLS/SSL), encryption at rest for sensitive data, regular security audits, access controls and authentication, limited employee access, confidentiality agreements, security training, and incident response procedures. If a breach occurs that may harm you, we will notify you within 72 hours via email and platform notification.',
    },
    {
      id: 'childrens-privacy',
      title: '10. Children\'s Privacy',
      content: 'Our platform is strictly for users 18 and older. We do not knowingly collect information from anyone under 18. If we discover underage information, it will be immediately deleted.',
    },
    {
      id: 'international-transfers',
      title: '11. International Data Transfers',
      content: 'Your information may be transferred to and processed in the United States. By using our platform, you consent to this transfer.',
    },
    {
      id: 'creator-privacy',
      title: '12. Creator-Specific Privacy Terms',
      content: 'Creators understand that their stage name, profile, and public content are visible to users. Creator earnings, tax information, and banking details are kept strictly confidential. Government ID information is encrypted and only accessed for verification and legal compliance.',
    },
    {
      id: 'member-privacy',
      title: '13. Member Privacy Protection',
      content: 'Members remain anonymous by default. Creators cannot see member real names, email addresses, or payment information. Members control what information is visible on their profiles.',
    },
    {
      id: 'cookies',
      title: '14. Cookies and Tracking',
      content: 'We use: Essential cookies (required for authentication and security), Functional cookies (remember preferences), Analytics cookies (understand usage patterns). You can control cookies through browser settings, but disabling essential cookies may prevent platform functionality.',
    },
    {
      id: 'third-party',
      title: '15. Third-Party Links',
      content: 'Our platform may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing information.',
    },
    {
      id: 'changes',
      title: '16. Changes to Privacy Policy',
      content: 'We may update this Privacy Policy periodically. Material changes will be notified via email and platform notification 30 days before taking effect. Continued use after changes constitutes acceptance.',
    },
    {
      id: 'contact',
      title: '17. Contact Us',
      content: 'For privacy-related questions or to exercise your rights, contact us at: privacy@sexyselfies.com. For general inquiries: support@sexyselfies.com',
    },
  ];

  return (
    <div className="privacy-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Progress Bar */}
      <div className="privacy-progress-bar-container">
        <div
          className="privacy-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Header */}
      <header className="privacy-header">
        <button onClick={() => navigate(-1)} className="privacy-back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Privacy Policy</h1>
        <div className="privacy-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="privacy-content" ref={contentRef}>
        {/* Hero Section */}
        <section className="privacy-hero">
          <h2>Privacy Policy</h2>
          <p className="privacy-last-updated">Last Updated: January 1, 2025</p>
          <p className="privacy-intro-text">
            Your privacy is important to us. This Privacy Policy explains how we
            collect, use, disclose, and protect your personal information.
          </p>
          <div className="privacy-important-notice">
            <strong>🔒 We Never Sell Your Data:</strong> We do not and will never
            sell your personal information to third parties.
          </div>
        </section>

        {/* Table of Contents */}
        <div className="privacy-toc-container">
          <button
            className="privacy-toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
          >
            <span>Table of Contents</span>
            {showTOC ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showTOC && (
            <nav className="privacy-toc-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`privacy-toc-item ${
                    activeSection === section.id ? 'active' : ''
                  }`}
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Sections */}
        <div className="privacy-sections">
          {sections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="privacy-section"
            >
              <button
                className="privacy-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <h3>{section.title}</h3>
                {expandedSections[section.id] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {expandedSections[section.id] && (
                <div className="privacy-section-content">
                  <p>{section.content}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Contact Section */}
        <section className="privacy-contact-section">
          <h3>Questions About Your Privacy?</h3>
          <p>
            If you have any questions about this Privacy Policy or how we handle
            your data, please contact us.
          </p>
          <p>
            <strong>Privacy Inquiries:</strong>{' '}
            <a href="mailto:privacy@sexyselfies.com">privacy@sexyselfies.com</a>
          </p>
          <p>
            <strong>General Support:</strong>{' '}
            <a href="mailto:support@sexyselfies.com">support@sexyselfies.com</a>
          </p>
        </section>

        {/* Desktop Actions */}
        <div className="privacy-desktop-actions">
          <button onClick={downloadPDF} className="privacy-download-btn">
            <Download size={18} />
            Print / Download PDF
          </button>
        </div>
      </main>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default PrivacyPolicy;
