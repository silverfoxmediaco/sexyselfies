import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Download } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './TOS.css';

const TOS = () => {
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

      const sections = document.querySelectorAll('.tos-section');
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
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: 'By accessing or using SexySelfies ("Platform", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Platform.',
    },
    {
      id: 'age-requirement',
      title: '2. Age Requirement and Verification',
      content: `You must be at least eighteen (18) years old to use this Platform. By using the Platform, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. We reserve the right to require age verification at any time. Providing false information regarding your age is grounds for immediate account termination.`,
    },
    {
      id: 'account-registration',
      title: '3. Account Registration and Security',
      content: `You must provide accurate, complete, and current information when creating an account. One account per person is permitted. You are responsible for maintaining account security and must immediately notify us of any unauthorized use. Creators must complete additional verification including government-issued ID verification, tax information (W-9 or equivalent), and banking information for payments.`,
    },
    {
      id: 'content-guidelines',
      title: '4. Content Guidelines and Ownership',
      content: `Creators retain all ownership rights to their content but grant the Platform a non-exclusive, worldwide license to display, distribute, and promote content while it remains on the Platform. Prohibited content includes: anyone under 18 years old, non-consensual content, illegal content, copyrighted material you don't own, revenge pornography, extreme violence, bestiality, and incest. We reserve the right to remove any content that violates these Terms without prior notice.`,
    },
    {
      id: 'user-conduct',
      title: '5. User Conduct',
      content: `Users agree NOT to: harass, abuse, or harm other users or creators; attempt to circumvent payment systems; download, copy, or redistribute creator content; share account access with others; use automated systems or bots; violate any applicable laws; impersonate others; or post spam or malicious links.`,
    },
    {
      id: 'financial-terms',
      title: '6. Financial Terms',
      content: `Platform operates on an 80/20 revenue split (80% to creators, 20% to platform). Payments processed weekly for amounts over $100. Creators are responsible for their own taxes. All purchases are final with no refunds for digital content. Prices are set by creators. Payment processing is handled by third-party processor (CCBill). Users who initiate chargebacks may have their accounts terminated.`,
    },
    {
      id: 'privacy',
      title: '7. Privacy and Data Protection',
      content: 'Your use of the Platform is also governed by our Privacy Policy. We comply with applicable data protection laws including GDPR where applicable.',
    },
    {
      id: 'intellectual-property',
      title: '8. Intellectual Property',
      content: `We respond to valid DMCA takedown notices. To report copyright infringement, contact our DMCA agent at dmca@sexyselfies.com. The Platform's name, logo, and all related designs are our property and protected by intellectual property laws.`,
    },
    {
      id: 'third-party',
      title: '9. Third-Party Services',
      content: `We use CCBill for payment processing. Users agree to CCBill's terms of service. We are not responsible for content on external websites linked from the Platform.`,
    },
    {
      id: 'disclaimers',
      title: '10. Disclaimers and Limitations of Liability',
      content: `The Platform is provided "as is" without warranties of any kind. We are not liable for: actions of users or creators, content posted by creators, loss of data or content, or indirect or consequential damages. Our total liability shall not exceed the amount you paid us in the past twelve months.`,
    },
    {
      id: 'indemnification',
      title: '11. Indemnification',
      content: `You agree to indemnify and hold harmless the Platform from any claims arising from: your use of the Platform, your content, your violation of these Terms, or your violation of any third-party rights.`,
    },
    {
      id: 'termination',
      title: '12. Account Termination',
      content: `You may terminate your account at any time through account settings. We may terminate or suspend accounts that violate these Terms, engage in fraudulent activity, harm other users, or at our sole discretion with notice. Upon termination: creators will receive final payment for earned revenue, users lose access to all purchased content, and some information may be retained as required by law.`,
    },
    {
      id: 'dispute-resolution',
      title: '13. Dispute Resolution',
      content: `We encourage users to contact us first to resolve disputes informally. Disputes not resolved informally will be settled by binding arbitration. You waive any right to bring claims as a class action.`,
    },
    {
      id: 'changes',
      title: '14. Changes to Terms',
      content: 'We may modify these Terms at any time. Continued use after changes constitutes acceptance.',
    },
    {
      id: 'severability',
      title: '15. Severability',
      content: 'If any provision of these Terms is found invalid, the remaining provisions continue in full force.',
    },
    {
      id: 'governing-law',
      title: '16. Governing Law',
      content: 'These Terms are governed by the laws of the United States, without regard to conflict of law principles.',
    },
    {
      id: 'compliance',
      title: '17. 18 U.S.C. 2257 Compliance Notice',
      content: 'All performers in content on this Platform were 18 years of age or older at time of creation. Records required by 18 U.S.C. 2257 are kept by individual content creators.',
    },
    {
      id: 'contact',
      title: '18. Contact Information',
      content: 'For questions about these Terms, contact us at: support@sexyselfies.com',
    },
    {
      id: 'entire-agreement',
      title: '19. Entire Agreement',
      content: 'These Terms constitute the entire agreement between you and the Platform regarding your use of our services.',
    },
  ];

  return (
    <div className="tos-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Progress Bar */}
      <div className="tos-progress-bar-container">
        <div
          className="tos-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Header */}
      <header className="tos-header">
        <button onClick={() => navigate(-1)} className="tos-back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Terms of Service</h1>
        <div className="tos-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="tos-content" ref={contentRef}>
        {/* Hero Section */}
        <section className="tos-hero">
          <h2>Terms of Service</h2>
          <p className="tos-last-updated">Last Updated: January 1, 2025</p>
          <p className="tos-intro-text">
            Please read these Terms of Service carefully before using SexySelfies. By
            accessing or using our platform, you agree to be bound by these terms.
          </p>
          <div className="tos-important-notice">
            <strong>⚠️ Important:</strong> You must be at least 18 years old to use
            this platform. This platform contains adult content.
          </div>
        </section>

        {/* Table of Contents */}
        <div className="tos-toc-container">
          <button
            className="tos-toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
          >
            <span>Table of Contents</span>
            {showTOC ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showTOC && (
            <nav className="tos-toc-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`tos-toc-item ${
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
        <div className="tos-sections">
          {sections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="tos-section"
            >
              <button
                className="tos-section-header"
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
                <div className="tos-section-content">
                  <p>{section.content}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Acknowledgment Section */}
        <section className="tos-acknowledgment-section">
          <h3>Acknowledgment</h3>
          <p>
            By using SexySelfies, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Service.
          </p>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:support@sexyselfies.com">support@sexyselfies.com</a>
          </p>
        </section>

        {/* Desktop Actions */}
        <div className="tos-desktop-actions">
          <button onClick={downloadPDF} className="tos-download-btn">
            <Download size={18} />
            Print / Download PDF
          </button>
        </div>
      </main>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation userRole="guest" />}
    </div>
  );
};

export default TOS;
