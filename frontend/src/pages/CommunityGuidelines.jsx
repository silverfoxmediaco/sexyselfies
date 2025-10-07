import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Download, Heart, Users, MessageCircle, Shield, Ban, CheckCircle } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './CommunityGuidelines.css';

const CommunityGuidelines = () => {
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

      const sections = document.querySelectorAll('.community-section');
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
      id: 'welcome',
      title: '1. Welcome to SexySelfies',
      icon: <Heart size={24} />,
      content: 'SexySelfies is a community built on respect, consent, and authentic connections. These Community Guidelines help create a safe, positive environment where creators can thrive and members can enjoy content responsibly. By using our platform, you agree to follow these guidelines and contribute to a respectful community.',
    },
    {
      id: 'core-values',
      title: '2. Our Core Values',
      icon: <CheckCircle size={24} />,
      content: 'Respect: Treat all users with dignity and kindness. Consent: All content and interactions must be consensual. Authenticity: Be genuine and honest in your profile and interactions. Safety: Prioritize the wellbeing of yourself and others. Inclusivity: Welcome users of all backgrounds, orientations, and identities. Privacy: Respect the privacy and boundaries of all users.',
    },
    {
      id: 'respectful-communication',
      title: '3. Respectful Communication',
      icon: <MessageCircle size={24} />,
      content: 'Be polite and courteous in all messages and interactions. No harassment, bullying, intimidation, or threatening language. Respect when someone says "no" or sets a boundary. No unsolicited explicit messages or requests. No pressuring creators for free content or special treatment. Keep conversations on-platform for everyone\'s safety. Respect creator response times - they are not obligated to reply immediately.',
    },
    {
      id: 'prohibited-content',
      title: '4. Prohibited Content',
      icon: <Ban size={24} />,
      content: 'The following content is strictly prohibited: Content involving anyone under 18 years old. Non-consensual content of any kind (revenge porn, hidden camera, etc.). Content depicting illegal activities. Extreme violence, gore, or cruelty. Hate speech, discriminatory content, or symbols. Content promoting self-harm or suicide. Copyrighted material you do not own. Content that violates our "Instagram Plus" standards (no full nudity or explicit sexual acts).',
    },
    {
      id: 'prohibited-behavior',
      title: '5. Prohibited Behaviors',
      icon: <Ban size={24} />,
      content: 'Harassment, stalking, or doxxing (revealing personal information). Impersonation of another person or entity. Spam, scams, phishing, or fraudulent activity. Soliciting or advertising other platforms or services. Attempting to circumvent payment systems. Creating multiple accounts to evade bans. Manipulation or coercion of any kind. Discriminatory behavior based on race, religion, gender, orientation, disability, or other protected characteristics. Threatening or intimidating behavior.',
    },
    {
      id: 'consent-boundaries',
      title: '6. Consent & Boundaries',
      icon: <Shield size={24} />,
      content: 'Always respect stated boundaries and limits. "No" means no - never pressure someone to change their mind. Creators have the right to refuse any request for any reason. Members must respect creators\' content and pricing decisions. Never share or redistribute content without explicit permission. Respect privacy settings and visibility preferences. Do not attempt to contact users outside the platform without their consent.',
    },
    {
      id: 'member-guidelines',
      title: '7. Guidelines for Members',
      icon: <Users size={24} />,
      content: 'Pay creators fairly for their content - do not request free content. Respect creators\' pricing and content decisions. Be patient if creators don\'t respond immediately. Never screenshot, record, or share creator content. Tip generously if you enjoy someone\'s content. Provide constructive, respectful feedback only when requested. Remember creators are real people - treat them with dignity. Report content that violates guidelines instead of engaging.',
    },
    {
      id: 'creator-guidelines',
      title: '8. Guidelines for Creators',
      icon: <Users size={24} />,
      content: 'Only upload content you have rights to use. Honor your pricing and promises to members. Respond to messages professionally and respectfully. Deliver purchased content within 48 hours or as promised. Be transparent about what content includes. Respect member privacy - never share their information. Set clear boundaries about what you will and won\'t do. Block members who are disrespectful or violate boundaries. See our Creator Guidelines page for detailed content standards.',
    },
    {
      id: 'positive-interactions',
      title: '9. Promoting Positive Interactions',
      icon: <Heart size={24} />,
      content: 'Express appreciation for content you enjoy through tips and positive messages. Provide constructive feedback when requested. Support creators whose work you value. Welcome new users and help them learn the platform. Report violations to help keep the community safe. Resolve conflicts maturely through communication or blocking. Celebrate diversity and different types of content. Contribute to a positive, supportive atmosphere.',
    },
    {
      id: 'reporting-violations',
      title: '10. Reporting Violations',
      icon: <Shield size={24} />,
      content: 'Use the report button on any content or profile that violates these guidelines. Report categories: Harassment, Inappropriate content, Underage concerns, Non-consensual content, Spam or scams, Impersonation, Copyright violation, Other safety concerns. All reports are reviewed within 24 hours. Anonymous reporting protects your identity. False reports may result in account consequences. For urgent safety issues, email support@sexyselfies.com with subject "URGENT SAFETY".',
    },
    {
      id: 'consequences',
      title: '11. Consequences for Violations',
      icon: <Ban size={24} />,
      content: 'Minor violations: Warning and content removal. Repeated violations: Temporary suspension (7-30 days). Serious violations: Permanent account termination. Severe violations (illegal content, threats, minors): Immediate permanent ban and law enforcement notification. Violators may be IP and device banned to prevent new accounts. Appeals can be submitted within 7 days to support@sexyselfies.com.',
    },
    {
      id: 'age-requirements',
      title: '12. Age Requirements',
      icon: <CheckCircle size={24} />,
      content: 'All users must be 18 years or older. Creators must complete ID verification proving legal age. Any content involving or appealing to minors is strictly prohibited. If you suspect underage users, report immediately. We cooperate fully with law enforcement on underage concerns. Zero tolerance policy - immediate permanent ban for any underage involvement.',
    },
    {
      id: 'intellectual-property',
      title: '13. Intellectual Property & Copyright',
      icon: <Shield size={24} />,
      content: 'Only upload content you own or have rights to use. Creators retain copyright to their original content. Platform receives license to display and distribute your content. Do not upload copyrighted music, videos, or images without permission. Report copyright violations via DMCA notice to dmca@sexyselfies.com. Members: Do not screenshot, record, or redistribute creator content. Watermarking helps protect creator content from theft.',
    },
    {
      id: 'privacy-respect',
      title: '14. Privacy & Personal Information',
      icon: <Shield size={24} />,
      content: 'Never share another user\'s personal information (doxxing). Do not reveal your own sensitive information publicly. Use stage names and protect your real identity. Respect privacy settings and blocked user lists. Do not attempt to identify or locate users in real life. Keep all conversations on-platform for safety. Never pressure someone to share personal contact information.',
    },
    {
      id: 'inclusivity',
      title: '15. Inclusivity & Diversity',
      icon: <Heart size={24} />,
      content: 'SexySelfies welcomes users of all backgrounds, races, religions, genders, sexual orientations, body types, and abilities. Discrimination, hate speech, and bigotry are not tolerated. Respect pronouns and gender identities. Celebrate the diversity of our community. Content is available for all orientations - straight, gay, bisexual, and more. Zero tolerance for racism, sexism, homophobia, transphobia, or other discrimination.',
    },
    {
      id: 'platform-integrity',
      title: '16. Platform Integrity',
      icon: <CheckCircle size={24} />,
      content: 'Do not attempt to hack, exploit, or manipulate the platform. Do not use bots, automation, or fake accounts. One account per person - multiple accounts not permitted. Do not attempt to circumvent bans or restrictions. Report bugs and vulnerabilities to support@sexyselfies.com. Do not abuse report or block features. Respect rate limits and platform restrictions.',
    },
    {
      id: 'off-platform',
      title: '17. Off-Platform Conduct',
      icon: <Shield size={24} />,
      content: 'Do not share SexySelfies content on other platforms without permission. Do not attempt to solicit users to other platforms. Do not harass users you met on SexySelfies outside the platform. Respect that connections on SexySelfies should remain on SexySelfies. We may take action for off-platform behavior that affects platform safety. Report off-platform harassment to both platforms and local authorities.',
    },
    {
      id: 'updates',
      title: '18. Updates to Guidelines',
      icon: <CheckCircle size={24} />,
      content: 'These Community Guidelines may be updated periodically to reflect community needs and legal requirements. Material changes will be announced via email and platform notification. Continued use after updates constitutes acceptance. Review these guidelines regularly to stay informed. Last updated: January 1, 2025.',
    },
  ];

  return (
    <div className="community-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Progress Bar */}
      <div className="community-progress-bar-container">
        <div
          className="community-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Header */}
      <header className="community-header">
        <button onClick={() => navigate(-1)} className="community-back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Community Guidelines</h1>
        <div className="community-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="community-content" ref={contentRef}>
        {/* Hero Section */}
        <section className="community-hero">
          <div className="community-hero-icon">
            <Users size={48} />
          </div>
          <h2>Community Guidelines</h2>
          <p className="community-last-updated">Last Updated: January 1, 2025</p>
          <p className="community-intro-text">
            Our Community Guidelines help create a safe, respectful, and positive
            environment for all users. By following these guidelines, you contribute
            to a community built on consent, respect, and authentic connections.
          </p>
        </section>

        {/* Table of Contents */}
        <div className="community-toc-container">
          <button
            className="community-toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
          >
            <span>Table of Contents</span>
            {showTOC ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showTOC && (
            <nav className="community-toc-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`community-toc-item ${
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
        <div className="community-sections">
          {sections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="community-section"
            >
              <button
                className="community-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <div className="community-section-title">
                  <div className="community-section-icon">{section.icon}</div>
                  <h3>{section.title}</h3>
                </div>
                {expandedSections[section.id] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {expandedSections[section.id] && (
                <div className="community-section-content">
                  <p>{section.content}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Call to Action Section */}
        <section className="community-cta-section">
          <h3>Help Us Build a Better Community</h3>
          <p>
            Everyone plays a role in keeping SexySelfies safe and welcoming. Report
            violations, support positive interactions, and treat others with respect.
          </p>
          <p>
            Questions about these guidelines? Contact us at{' '}
            <a href="mailto:support@sexyselfies.com">support@sexyselfies.com</a>
          </p>
        </section>

        {/* Desktop Actions */}
        <div className="community-desktop-actions">
          <button onClick={downloadPDF} className="community-download-btn">
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

export default CommunityGuidelines;
