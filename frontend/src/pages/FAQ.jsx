import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, Search, MessageCircle, DollarSign, Shield, Users } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './FAQ.css';

const FAQ = () => {
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

      const sections = document.querySelectorAll('.faq-section');
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
    // General
    {
      id: 'what-is-sexyselfies',
      title: 'What is SexySelfies?',
      icon: <HelpCircle size={24} />,
      content: 'SexySelfies is a content monetization platform that combines Tinder\'s swipe-to-connect discovery with OnlyFans\' creator economy. We focus on authentic amateur content with an "Instagram Plus" approach - sexy but not pornographic.',
    },
    {
      id: 'content-standards',
      title: 'What content is allowed on SexySelfies?',
      icon: <Shield size={24} />,
      content: 'We follow "Instagram Plus" standards. Allowed: lingerie, implied nudity, censored content, artistic/tasteful content. Prohibited: Full nudity, explicit sexual content, illegal content. All content must comply with our Creator Guidelines.',
    },
    {
      id: 'age-requirement',
      title: 'What is the minimum age requirement?',
      icon: <Shield size={24} />,
      content: 'All users must be 18 years or older. Creators must complete ID verification to prove they are 18+. We have zero tolerance for underage users.',
    },
    {
      id: 'how-it-works',
      title: 'How does SexySelfies work?',
      icon: <HelpCircle size={24} />,
      content: 'Members swipe through creator profiles Tinder-style. When both parties connect, members can unlock content and message creators. Creators can also browse members and send personalized offers. All transactions are pay-per-unlock with no subscriptions required.',
    },

    // For Creators
    {
      id: 'become-creator',
      title: 'How do I become a creator?',
      icon: <Users size={24} />,
      content: 'Register as a creator, complete ID verification (18+ proof), set up your profile with photos and bio, then start uploading content. Verification typically takes 24-48 hours.',
    },
    {
      id: 'creator-verification',
      title: 'What documents do I need for verification?',
      icon: <Shield size={24} />,
      content: 'You need a government-issued photo ID (passport, driver\'s license, or national ID card) and a selfie holding your ID. All information is securely encrypted and used only for age verification.',
    },
    {
      id: 'creator-earnings',
      title: 'How much can I earn as a creator?',
      icon: <DollarSign size={24} />,
      content: 'Creators keep 80% of all earnings (industry-leading split). Earnings depend on content quality, engagement, and activity. Content unlocks range from $0.99 to $3.99, with additional income from tips and special offers.',
    },
    {
      id: 'creator-payouts',
      title: 'When do creators get paid?',
      icon: <DollarSign size={24} />,
      content: 'Creators can request payouts weekly with a minimum balance of $50. Payouts are processed within 3-5 business days via bank transfer or payment processor of your choice.',
    },
    {
      id: 'upload-limits',
      title: 'Are there limits on content uploads?',
      icon: <Users size={24} />,
      content: 'No upload limits. Upload as much content as you want. Each piece is individually priced at $0.99-$3.99. Photos and videos up to 100MB are supported.',
    },
    {
      id: 'creator-privacy',
      title: 'Can I control who sees my content?',
      icon: <Shield size={24} />,
      content: 'Yes. You can block specific users, set geographic restrictions, and control content visibility. You also choose which members see your profile through smart filtering.',
    },
    {
      id: 'active-sales',
      title: 'What is the Creator Active Sales System?',
      icon: <Users size={24} />,
      content: 'Our revolutionary feature lets creators browse high-value members and send personalized messages and offers. Think of it as "hunting" for customers rather than waiting to be discovered. Creators can target whales, VIPs, and engaged members.',
    },

    // For Members
    {
      id: 'member-registration',
      title: 'How do I join as a member?',
      icon: <Users size={24} />,
      content: 'Simply register with your email, verify your account, and start browsing creators. No ID verification required for members. You can browse for free and only pay when you want to unlock content.',
    },
    {
      id: 'member-privacy',
      title: 'Is my identity protected as a member?',
      icon: <Shield size={24} />,
      content: 'Yes. Members remain anonymous by default. Your profile shows minimal information, and you control what creators can see. We never share your personal information.',
    },
    {
      id: 'browsing-free',
      title: 'Is browsing creators free?',
      icon: <Search size={24} />,
      content: 'Yes! Swiping and browsing creators is 100% free with unlimited swipes. You only pay when you want to unlock specific content ($0.99-$3.99 per piece).',
    },
    {
      id: 'member-connections',
      title: 'How do connections work?',
      icon: <MessageCircle size={24} />,
      content: 'When you and a creator both swipe right (like each other), you create a connection. This unlocks the ability to message and view that creator\'s content library. Connections are mutual interest-based.',
    },
    {
      id: 'member-filtering',
      title: 'Can I filter creators by preference?',
      icon: <Search size={24} />,
      content: 'Yes. Filter by sexual orientation (straight, gay, bisexual, all), gender, body type, location (radius or anywhere), age range, and activity status. Our smart algorithm matches you with creators you\'ll love.',
    },

    // Payments & Billing
    {
      id: 'payment-methods',
      title: 'What payment methods are accepted?',
      icon: <DollarSign size={24} />,
      content: 'We accept all major credit cards (Visa, Mastercard, Amex, Discover) through our secure CCBill payment processor. All transactions are discreet and show as "CCBill.com" on statements.',
    },
    {
      id: 'pricing-model',
      title: 'How does pricing work?',
      icon: <DollarSign size={24} />,
      content: 'No subscriptions! Pay only for what you want. Content unlocks are $0.99-$3.99 per piece. You can also send tips ($1-$50+) and purchase special offers from creators. No hidden fees.',
    },
    {
      id: 'refund-policy',
      title: 'What is your refund policy?',
      icon: <DollarSign size={24} />,
      content: 'All sales are final once content is unlocked. However, if content violates our guidelines or is misrepresented, contact support within 48 hours for a refund review. Fraudulent chargebacks will result in account termination.',
    },
    {
      id: 'transaction-fees',
      title: 'Are there transaction fees for members?',
      icon: <DollarSign size={24} />,
      content: 'No hidden fees for members. The price you see is what you pay. Payment processing fees are included. Creators pay standard payment processing fees on payouts.',
    },
    {
      id: 'billing-discreet',
      title: 'Will charges be discreet on my statement?',
      icon: <Shield size={24} />,
      content: 'Yes. All charges appear as "CCBill.com" or similar generic descriptor on your credit card statement. No mention of SexySelfies.',
    },

    // Safety & Privacy
    {
      id: 'data-security',
      title: 'How is my data protected?',
      icon: <Shield size={24} />,
      content: 'We use industry-standard encryption (AES-256), secure servers, and GDPR-compliant practices. Payment information is handled by PCI-compliant processors. We never store credit card numbers.',
    },
    {
      id: 'report-content',
      title: 'How do I report inappropriate content?',
      icon: <Shield size={24} />,
      content: 'Click the report button on any content or profile. Reports are reviewed within 24 hours. For urgent safety concerns, email support@sexyselfies.com immediately.',
    },
    {
      id: 'block-users',
      title: 'Can I block users?',
      icon: <Shield size={24} />,
      content: 'Yes. Both creators and members can block users. Blocked users cannot see your profile, contact you, or view your content. Blocks are permanent unless manually removed.',
    },
    {
      id: 'dmca-protection',
      title: 'How are creators protected from content theft?',
      icon: <Shield size={24} />,
      content: 'We have a strict DMCA policy. Report stolen content to dmca@sexyselfies.com with proof of ownership. We respond within 24-48 hours and remove infringing content. Repeat infringers are permanently banned.',
    },
    {
      id: 'account-deletion',
      title: 'Can I delete my account?',
      icon: <Shield size={24} />,
      content: 'Yes. Go to Settings > Account > Delete Account. All your data will be permanently removed within 30 days. Creators must withdraw remaining balance before deletion.',
    },
    {
      id: 'screenshot-protection',
      title: 'Is there screenshot protection?',
      icon: <Shield size={24} />,
      content: 'We use watermarking and tracking on all content. While we cannot prevent screenshots, we can identify and ban users who share content illegally. Violators face legal action under DMCA.',
    },
  ];

  return (
    <div className="faq-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Progress Bar */}
      <div className="faq-progress-bar-container">
        <div
          className="faq-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Header */}
      <header className="faq-header">
        <button onClick={() => navigate(-1)} className="faq-back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>FAQ</h1>
        <div className="faq-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="faq-content" ref={contentRef}>
        {/* Hero Section */}
        <section className="faq-hero">
          <div className="faq-hero-icon">
            <HelpCircle size={48} />
          </div>
          <h2>Frequently Asked Questions</h2>
          <p className="faq-intro-text">
            Find answers to common questions about SexySelfies. Can't find what
            you're looking for? Contact our support team.
          </p>
        </section>

        {/* Table of Contents */}
        <div className="faq-toc-container">
          <button
            className="faq-toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
          >
            <span>Table of Contents</span>
            {showTOC ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showTOC && (
            <nav className="faq-toc-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`faq-toc-item ${
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
        <div className="faq-sections">
          {sections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="faq-section"
            >
              <button
                className="faq-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <div className="faq-section-title">
                  <div className="faq-section-icon">{section.icon}</div>
                  <h3>{section.title}</h3>
                </div>
                {expandedSections[section.id] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {expandedSections[section.id] && (
                <div className="faq-section-content">
                  <p>{section.content}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Contact Support Section */}
        <section className="faq-contact-section">
          <h3>Still Have Questions?</h3>
          <p>
            Our support team is here to help. Reach out and we'll respond within
            24-48 hours.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="faq-contact-btn"
          >
            Contact Support
          </button>
        </section>
      </main>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default FAQ;
