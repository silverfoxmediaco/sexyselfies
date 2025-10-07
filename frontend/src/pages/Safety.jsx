import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Shield, AlertTriangle, Lock, Eye, UserX, Flag } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './Safety.css';

const Safety = () => {
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

      const sections = document.querySelectorAll('.safety-section');
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

  const sections = [
    {
      id: 'our-commitment',
      title: '1. Our Commitment to Safety',
      icon: <Shield size={24} />,
      content: 'Your safety is our top priority. SexySelfies is committed to providing a secure, respectful, and consensual environment for all users. We implement industry-leading safety measures, maintain strict content standards, and provide comprehensive tools to protect your privacy and wellbeing.',
    },
    {
      id: 'age-verification',
      title: '2. Age Verification & Compliance',
      icon: <Lock size={24} />,
      content: 'All users must be 18 years or older. Creators undergo mandatory ID verification to confirm legal age. We comply with 18 U.S.C. 2257 record-keeping requirements. Zero tolerance policy for underage users - immediate account termination and reporting to authorities. Age verification is conducted through secure, encrypted systems.',
    },
    {
      id: 'content-standards',
      title: '3. Content Standards & Moderation',
      icon: <Eye size={24} />,
      content: 'We maintain "Instagram Plus" content standards - sexy but not pornographic. Prohibited: full nudity, explicit sexual content, non-consensual content, content involving minors, illegal activities, revenge porn, bestiality, incest. All content reviewed by AI moderation and human moderators. Reports reviewed within 24 hours. Violating content removed immediately.',
    },
    {
      id: 'consent-respect',
      title: '4. Consent & Respect',
      icon: <Shield size={24} />,
      content: 'All content must be created and shared consensually. Creators have full control over what they share and with whom. Members must respect creator boundaries and stated limits. Harassment, stalking, threats, and abusive behavior result in immediate account termination. No solicitation for content outside platform guidelines.',
    },
    {
      id: 'privacy-protection',
      title: '5. Privacy Protection',
      icon: <Lock size={24} />,
      content: 'Members remain anonymous by default - creators cannot see real names or email addresses. Creators control visibility of their profiles and content. Location data is never shared with other users. Payment information is securely processed and never visible to other users. Optional privacy settings allow users to hide profiles from specific locations or users.',
    },
    {
      id: 'blocking-reporting',
      title: '6. Blocking & Reporting Tools',
      icon: <UserX size={24} />,
      content: 'One-click blocking prevents users from contacting you or viewing your profile. Blocks are permanent unless manually removed. Report button available on all content and profiles. Report categories: harassment, inappropriate content, impersonation, spam, underage concerns, non-consensual content. All reports reviewed by our safety team within 24 hours. Anonymous reporting protects your identity.',
    },
    {
      id: 'data-security',
      title: '7. Data Security & Encryption',
      icon: <Lock size={24} />,
      content: 'All data encrypted in transit (TLS/SSL) and at rest. Payment processing through PCI-compliant CCBill - we never store credit card numbers. Government IDs encrypted and only accessed for verification. Regular security audits and penetration testing. Two-factor authentication available for all accounts. Secure password requirements enforced.',
    },
    {
      id: 'content-protection',
      title: '8. Content Protection & Copyright',
      icon: <Shield size={24} />,
      content: 'All content watermarked with user information to deter theft and unauthorized sharing. Screenshot tracking helps identify content leaks. DMCA protection for creators - report stolen content to dmca@sexyselfies.com. Legal action taken against users who share content without permission. Content download prohibited - violators permanently banned.',
    },
    {
      id: 'payment-safety',
      title: '9. Payment Safety',
      icon: <Lock size={24} />,
      content: 'Secure payment processing through CCBill (adult industry leader). Charges appear discreetly on statements as "CCBill.com". No payment information shared between users. Creators paid weekly via secure bank transfer. Fraud detection systems monitor for suspicious transactions. Chargeback protection for legitimate creators.',
    },
    {
      id: 'member-safety',
      title: '10. Member Safety Tips',
      icon: <Shield size={24} />,
      content: 'Never share personal information (real name, address, phone number) with creators. Use platform messaging only - never take conversations off-platform. Report suspicious behavior immediately. Review privacy settings regularly. Use strong, unique passwords. Enable two-factor authentication. Be cautious of requests for money or gifts outside the platform. Trust your instincts - if something feels wrong, block and report.',
    },
    {
      id: 'creator-safety',
      title: '11. Creator Safety Tips',
      icon: <Shield size={24} />,
      content: 'Use a stage name - never reveal your real identity. Consider using a VPN to hide your actual location. Watermark all content with your username. Set geographic blocks if concerned about local discovery. Screen shot requests before accepting - trust your judgment. Block aggressive or disrespectful members immediately. Never meet members in person. Keep all transactions on-platform for your protection. Review member profiles before connecting.',
    },
    {
      id: 'recognizing-abuse',
      title: '12. Recognizing Abuse & Red Flags',
      icon: <AlertTriangle size={24} />,
      content: 'Warning signs: Requests to move conversation off-platform. Excessive personal questions about your location or identity. Pressure to create specific content against your comfort level. Threats or blackmail. Requests for free content or "favors". Attempts to befriend or manipulate you. Aggressive behavior when you set boundaries. Claims of special relationship or promises of money outside the platform. If you see these signs, block immediately and report to our safety team.',
    },
    {
      id: 'emergency-response',
      title: '13. Emergency Response',
      icon: <AlertTriangle size={24} />,
      content: 'For immediate safety threats, contact local law enforcement first (911 in US). Report urgent safety concerns to support@sexyselfies.com with subject "URGENT SAFETY". We respond to urgent reports within 1 hour during business hours. Emergency account suspension available for serious threats. We cooperate fully with law enforcement investigations. Crisis resources: National Suicide Prevention Lifeline (988), National Domestic Violence Hotline (1-800-799-7233), RAINN Sexual Assault Hotline (1-800-656-4673).',
    },
    {
      id: 'ban-enforcement',
      title: '14. Violation & Ban Enforcement',
      icon: <Flag size={24} />,
      content: 'First violation: Warning and content removal. Second violation: 30-day account suspension. Third violation: Permanent account termination. Severe violations (illegal content, threats, harassment of minors) result in immediate permanent ban and law enforcement notification. Banned users cannot create new accounts - IP and device tracking enforced. Appeals reviewed within 7 business days.',
    },
    {
      id: 'mental-health',
      title: '15. Mental Health & Wellbeing',
      icon: <Shield size={24} />,
      content: 'Creating adult content can be emotionally challenging. Take breaks when needed - your mental health matters. Set boundaries and stick to them. You are never obligated to create content you\'re uncomfortable with. Seek support from friends, family, or professionals. Consider therapy if experiencing stress, anxiety, or depression. Remember: you are in control. Resources available at mentalhealthamerica.net and nami.org.',
    },
  ];

  return (
    <div className="safety-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Progress Bar */}
      <div className="safety-progress-bar-container">
        <div
          className="safety-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Header */}
      <header className="safety-header">
        <button onClick={() => navigate(-1)} className="safety-back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Safety Center</h1>
        <div className="safety-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="safety-content" ref={contentRef}>
        {/* Hero Section */}
        <section className="safety-hero">
          <div className="safety-hero-icon">
            <Shield size={48} />
          </div>
          <h2>Safety & Trust Center</h2>
          <p className="safety-intro-text">
            Your safety is our top priority. Learn about our safety measures, tools,
            and best practices to protect yourself on SexySelfies.
          </p>
          <div className="safety-emergency-notice">
            <AlertTriangle size={20} />
            <div>
              <strong>Emergency?</strong> If you're in immediate danger, call 911 or
              your local emergency services first.
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="safety-quick-actions">
          <h3>Quick Actions</h3>
          <div className="safety-actions-grid">
            <button className="safety-action-card" onClick={() => scrollToSection('blocking-reporting')}>
              <Flag size={24} />
              <span>Report Content</span>
            </button>
            <button className="safety-action-card" onClick={() => scrollToSection('blocking-reporting')}>
              <UserX size={24} />
              <span>Block User</span>
            </button>
            <button className="safety-action-card" onClick={() => scrollToSection('emergency-response')}>
              <AlertTriangle size={24} />
              <span>Emergency Help</span>
            </button>
            <button className="safety-action-card" onClick={() => navigate('/contact')}>
              <Shield size={24} />
              <span>Contact Support</span>
            </button>
          </div>
        </section>

        {/* Table of Contents */}
        <div className="safety-toc-container">
          <button
            className="safety-toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
          >
            <span>Table of Contents</span>
            {showTOC ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showTOC && (
            <nav className="safety-toc-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`safety-toc-item ${
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
        <div className="safety-sections">
          {sections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="safety-section"
            >
              <button
                className="safety-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <div className="safety-section-title">
                  <div className="safety-section-icon">{section.icon}</div>
                  <h3>{section.title}</h3>
                </div>
                {expandedSections[section.id] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {expandedSections[section.id] && (
                <div className="safety-section-content">
                  <p>{section.content}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Emergency Contact Section */}
        <section className="safety-emergency-section">
          <h3>Need Help Now?</h3>
          <p>
            If you're experiencing a safety issue on our platform, we're here to help.
          </p>
          <div className="safety-emergency-contacts">
            <div className="safety-emergency-card">
              <h4>Safety Concerns</h4>
              <p>support@sexyselfies.com</p>
              <p className="safety-response-time">Response within 24 hours</p>
            </div>
            <div className="safety-emergency-card">
              <h4>Urgent Safety Issues</h4>
              <p>Subject: "URGENT SAFETY"</p>
              <p className="safety-response-time">Response within 1 hour</p>
            </div>
          </div>
          <div className="safety-crisis-resources">
            <h4>Crisis Resources (24/7)</h4>
            <p>National Suicide Prevention: <strong>988</strong></p>
            <p>Domestic Violence Hotline: <strong>1-800-799-7233</strong></p>
            <p>Sexual Assault Hotline: <strong>1-800-656-4673</strong></p>
          </div>
        </section>
      </main>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation userRole="guest" />}
    </div>
  );
};

export default Safety;
