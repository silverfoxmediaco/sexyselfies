import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, Download } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainFooter from '../components/MainFooter';
import './CreatorGuidelines.css';

const CreatorGuidelines = () => {
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

  // Last updated date
  const lastUpdated = 'January 15, 2025';

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      // Update active section based on scroll position
      const sections = document.querySelectorAll('.guidelines-section');
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

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setShowTOC(false);

      // Auto-expand the section
      setExpandedSections(prev => ({
        ...prev,
        [sectionId]: true
      }));
    }
  };

  // Copy email to clipboard
  const copyEmail = () => {
    navigator.clipboard.writeText('support@sexyselfies.com');
    alert('Email copied to clipboard!');
  };

  // Table of contents data
  const tableOfContents = [
    { id: 'content-standards', title: '1. Content Standards' },
    { id: 'creator-responsibilities', title: '2. Creator Responsibilities' },
    { id: 'financial-guidelines', title: '3. Financial Guidelines' },
    { id: 'privacy-safety', title: '4. Privacy & Safety' },
    { id: 'community-engagement', title: '5. Community Engagement' },
    { id: 'compliance-enforcement', title: '6. Compliance & Enforcement' },
    { id: 'platform-rights', title: '7. Platform Rights' },
    { id: 'legal-compliance', title: '8. Legal Compliance' },
    { id: 'content-moderation', title: '9. Content Moderation' },
    { id: 'support-resources', title: '10. Support & Resources' }
  ];

  return (
    <div className="creator-guidelines-page">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Header */}
      <header className="guidelines-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Creator Guidelines</h1>
        <div className="header-spacer" />
      </header>

      {/* Main Content */}
      <div className="guidelines-content" ref={contentRef}>
        {/* Hero Section */}
        <div className="guidelines-hero">
          <h2>Welcome to Our Creator Community!</h2>
          <p className="last-updated">Last Updated: {lastUpdated}</p>
          <p className="intro-text">
            These guidelines help ensure a safe, respectful, and engaging experience
            for all users on our platform.
          </p>
        </div>

        {/* Table of Contents */}
        <div className={`toc-container ${showTOC ? 'expanded' : ''}`}>
          <button
            className="toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
          >
            <span>Table of Contents</span>
            {showTOC ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showTOC && (
            <nav className="toc-nav">
              {tableOfContents.map(item => (
                <button
                  key={item.id}
                  className={`toc-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Guidelines Sections */}
        <div className="guidelines-sections">

          {/* Section 1: Content Standards */}
          <section id="content-standards" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('content-standards')}
            >
              <h3>1. Content Standards</h3>
              {expandedSections['content-standards'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['content-standards'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Acceptable Content</h4>
                  <ul>
                    <li><strong>Suggestive Content:</strong> Implied nudity, lingerie, swimwear, artistic nude photography (no explicit nudity)</li>
                    <li><strong>Lifestyle Content:</strong> Behind-the-scenes, personal stories, fashion, fitness</li>
                    <li><strong>Teaser Content:</strong> Preview clips, promotional material</li>
                    <li><strong>Interactive Content:</strong> Q&A sessions, polls, fan engagement</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Prohibited Content</h4>
                  <ul>
                    <li>Explicit sexual content or pornography</li>
                    <li>Full frontal nudity or genitalia</li>
                    <li>Sexual acts or simulated sexual acts</li>
                    <li>Content involving minors (anyone under 18)</li>
                    <li>Non-consensual content or deepfakes</li>
                    <li>Illegal activities or substances</li>
                    <li>Hate speech, harassment, or discrimination</li>
                    <li>Violence or self-harm content</li>
                    <li>Spam or misleading content</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Creator Responsibilities */}
          <section id="creator-responsibilities" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('creator-responsibilities')}
            >
              <h3>2. Creator Responsibilities</h3>
              {expandedSections['creator-responsibilities'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['creator-responsibilities'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Profile & Identity</h4>
                  <ul>
                    <li>Verify your identity through our age verification process</li>
                    <li>Use accurate profile information</li>
                    <li>Maintain current and professional profile photos</li>
                    <li>Update your availability status regularly</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Communication Standards</h4>
                  <ul>
                    <li>Respond to member messages within 48 hours when possible</li>
                    <li>Maintain respectful and professional communication</li>
                    <li>Honor commitments made to members</li>
                    <li>No harassment, bullying, or inappropriate solicitation</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Content Management</h4>
                  <ul>
                    <li>Upload high-quality, original content you have rights to</li>
                    <li>Set fair and consistent pricing</li>
                    <li>Deliver promised content within agreed timeframes</li>
                    <li>Label content accurately (don't mislead members)</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Financial Guidelines */}
          <section id="financial-guidelines" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('financial-guidelines')}
            >
              <h3>3. Financial Guidelines</h3>
              {expandedSections['financial-guidelines'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['financial-guidelines'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Payments & Transactions</h4>
                  <ul>
                    <li>All transactions must occur through our platform</li>
                    <li>Creators earn 80% of all sales (industry-leading)</li>
                    <li>Payouts processed weekly to verified accounts</li>
                    <li>Minimum payout threshold: $50</li>
                    <li>Keep accurate financial records for tax purposes</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Refunds & Disputes</h4>
                  <ul>
                    <li>Content sales are final once unlocked/delivered</li>
                    <li>Refunds may be issued for technical issues or non-delivery</li>
                    <li>Disputes handled through our support team</li>
                    <li>Excessive chargebacks may result in account review</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Privacy & Safety */}
          <section id="privacy-safety" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('privacy-safety')}
            >
              <h3>4. Privacy & Safety</h3>
              {expandedSections['privacy-safety'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['privacy-safety'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Member Privacy</h4>
                  <ul>
                    <li>Never share member personal information</li>
                    <li>Do not screenshot or record private conversations</li>
                    <li>Respect member anonymity preferences</li>
                    <li>Report suspicious or abusive member behavior</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Your Safety</h4>
                  <ul>
                    <li>Never share your personal contact information</li>
                    <li>Use platform messaging only (no off-platform communication)</li>
                    <li>Block and report abusive members immediately</li>
                    <li>Never agree to meet members in person</li>
                    <li>Protect your identity and location in content</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Community Engagement */}
          <section id="community-engagement" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('community-engagement')}
            >
              <h3>5. Community Engagement</h3>
              {expandedSections['community-engagement'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['community-engagement'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Best Practices</h4>
                  <ul>
                    <li>Engage regularly with your member base</li>
                    <li>Post consistently to maintain member interest</li>
                    <li>Use special offers strategically</li>
                    <li>Respond to feedback professionally</li>
                    <li>Build authentic connections with members</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Prohibited Practices</h4>
                  <ul>
                    <li>No fake accounts or impersonation</li>
                    <li>No artificial inflation of metrics</li>
                    <li>No coordinating with other creators to manipulate prices</li>
                    <li>No sharing platform vulnerabilities</li>
                    <li>No recruiting members to other platforms</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 6: Compliance & Enforcement */}
          <section id="compliance-enforcement" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('compliance-enforcement')}
            >
              <h3>6. Compliance & Enforcement</h3>
              {expandedSections['compliance-enforcement'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['compliance-enforcement'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Violations May Result In</h4>
                  <ul>
                    <li><strong>First Offense:</strong> Warning and content removal</li>
                    <li><strong>Second Offense:</strong> Temporary suspension (7-30 days)</li>
                    <li><strong>Third Offense:</strong> Permanent account termination</li>
                    <li><strong>Severe Violations:</strong> Immediate permanent ban</li>
                  </ul>
                  <p className="note">
                    Severe violations include: illegal content, content involving minors,
                    non-consensual content, or repeated harassment.
                  </p>
                </div>

                <div className="subsection">
                  <h4>Appeals Process</h4>
                  <ul>
                    <li>Submit appeals within 14 days of enforcement action</li>
                    <li>Include detailed explanation and evidence</li>
                    <li>Appeals reviewed within 3-5 business days</li>
                    <li>Final decisions are at platform discretion</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 7: Platform Rights */}
          <section id="platform-rights" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('platform-rights')}
            >
              <h3>7. Platform Rights</h3>
              {expandedSections['platform-rights'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['platform-rights'] && (
              <div className="section-content">
                <ul>
                  <li>We reserve the right to remove content that violates guidelines</li>
                  <li>We may suspend or terminate accounts without prior notice for severe violations</li>
                  <li>We can modify these guidelines at any time (creators will be notified)</li>
                  <li>We may use anonymized data for platform improvements</li>
                  <li>Creators retain copyright to their original content</li>
                  <li>Platform has limited license to display creator content for promotional purposes</li>
                </ul>
              </div>
            )}
          </section>

          {/* Section 8: Legal Compliance */}
          <section id="legal-compliance" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('legal-compliance')}
            >
              <h3>8. Legal Compliance</h3>
              {expandedSections['legal-compliance'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['legal-compliance'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Creators Must</h4>
                  <ul>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Report income for tax purposes (you are an independent contractor)</li>
                    <li>Maintain records required by law</li>
                    <li>Respect intellectual property rights</li>
                    <li>Comply with GDPR, CCPA, and other privacy regulations</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Age Requirements</h4>
                  <ul>
                    <li>All creators must be 18 years or older</li>
                    <li>Valid government-issued ID required for verification</li>
                    <li>Re-verification may be required periodically</li>
                    <li>All persons appearing in content must be 18+ and consenting</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 9: Content Moderation */}
          <section id="content-moderation" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('content-moderation')}
            >
              <h3>9. Content Moderation</h3>
              {expandedSections['content-moderation'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['content-moderation'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Review Process</h4>
                  <ul>
                    <li>AI-assisted initial screening of all content</li>
                    <li>Human review for flagged content (24-48 hours)</li>
                    <li>Creators notified of approval or rejection</li>
                    <li>Rejected content includes explanation</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Creator Cooperation</h4>
                  <ul>
                    <li>Respond to moderation inquiries within 72 hours</li>
                    <li>Provide additional verification if requested</li>
                    <li>Accept moderation decisions or submit appeals</li>
                    <li>Do not re-upload rejected content without modifications</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Section 10: Support & Resources */}
          <section id="support-resources" className="guidelines-section">
            <button
              className="section-header"
              onClick={() => toggleSection('support-resources')}
            >
              <h3>10. Support & Resources</h3>
              {expandedSections['support-resources'] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {expandedSections['support-resources'] && (
              <div className="section-content">
                <div className="subsection">
                  <h4>Available Support</h4>
                  <ul>
                    <li>24/7 email support</li>
                    <li>Creator help center and FAQs</li>
                    <li>Video tutorials and guides</li>
                    <li>Monthly creator webinars</li>
                    <li>Community forums</li>
                  </ul>
                </div>

                <div className="subsection">
                  <h4>Success Tools</h4>
                  <ul>
                    <li>Analytics dashboard to track performance</li>
                    <li>Member insights and demographics</li>
                    <li>Content scheduling tools</li>
                    <li>Pricing optimization recommendations</li>
                    <li>Marketing and promotional tools</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

        </div>

        {/* Acknowledgment Section */}
        <div className="acknowledgment-section">
          <h3>Acknowledgment</h3>
          <p>
            By using our platform as a creator, you acknowledge that you have read,
            understood, and agree to comply with these Creator Guidelines. Failure to
            comply may result in content removal, account suspension, or termination.
          </p>
          <p className="emphasis">
            These guidelines are designed to protect both creators and members, ensuring
            a safe and enjoyable experience for everyone.
          </p>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h3>Questions or Concerns?</h3>
          <p>
            If you have questions about these guidelines or need clarification,
            please contact our Creator Support team:
          </p>
          <div className="contact-info">
            <button className="copy-email-btn" onClick={copyEmail}>
              <Mail size={20} />
              <span>support@sexyselfies.com</span>
            </button>
          </div>
          <p className="response-time">
            We typically respond within 24 hours.
          </p>
        </div>

        {/* Desktop Download Option */}
        <div className="desktop-actions">
          <button className="download-btn" onClick={() => window.print()}>
            <Download size={20} />
            <span>Download PDF</span>
          </button>
        </div>

      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation userRole="guest" />}
    </div>
  );
};

export default CreatorGuidelines;
