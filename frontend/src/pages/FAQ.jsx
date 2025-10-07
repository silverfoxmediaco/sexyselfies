import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Detect viewport changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleQuestion = questionId => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const faqCategories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General' },
    { id: 'creators', label: 'For Creators' },
    { id: 'members', label: 'For Members' },
    { id: 'payments', label: 'Payments & Billing' },
    { id: 'safety', label: 'Safety & Privacy' },
  ];

  const faqs = [
    // General
    {
      id: 'what-is-sexyselfies',
      category: 'general',
      question: 'What is SexySelfies?',
      answer:
        'SexySelfies is a content monetization platform that combines Tinder\'s swipe-to-connect discovery with OnlyFans\' creator economy. We focus on authentic amateur content with an "Instagram Plus" approach - sexy but not pornographic.',
    },
    {
      id: 'content-standards',
      category: 'general',
      question: 'What content is allowed on SexySelfies?',
      answer:
        'We follow "Instagram Plus" standards. Allowed: lingerie, implied nudity, censored content, artistic/tasteful content. Prohibited: Full nudity, explicit sexual content, illegal content. All content must comply with our Creator Guidelines.',
    },
    {
      id: 'age-requirement',
      category: 'general',
      question: 'What is the minimum age requirement?',
      answer:
        'All users must be 18 years or older. Creators must complete ID verification to prove they are 18+. We have zero tolerance for underage users.',
    },
    {
      id: 'how-it-works',
      category: 'general',
      question: 'How does SexySelfies work?',
      answer:
        'Members swipe through creator profiles Tinder-style. When both parties connect, members can unlock content and message creators. Creators can also browse members and send personalized offers. All transactions are pay-per-unlock with no subscriptions required.',
    },

    // For Creators
    {
      id: 'become-creator',
      category: 'creators',
      question: 'How do I become a creator?',
      answer:
        'Register as a creator, complete ID verification (18+ proof), set up your profile with photos and bio, then start uploading content. Verification typically takes 24-48 hours.',
    },
    {
      id: 'creator-verification',
      category: 'creators',
      question: 'What documents do I need for verification?',
      answer:
        'You need a government-issued photo ID (passport, driver\'s license, or national ID card) and a selfie holding your ID. All information is securely encrypted and used only for age verification.',
    },
    {
      id: 'creator-earnings',
      category: 'creators',
      question: 'How much can I earn as a creator?',
      answer:
        'Creators keep 80% of all earnings (industry-leading split). Earnings depend on content quality, engagement, and activity. Content unlocks range from $0.99 to $3.99, with additional income from tips and special offers.',
    },
    {
      id: 'creator-payouts',
      category: 'creators',
      question: 'When do creators get paid?',
      answer:
        'Creators can request payouts weekly with a minimum balance of $50. Payouts are processed within 3-5 business days via bank transfer or payment processor of your choice.',
    },
    {
      id: 'upload-limits',
      category: 'creators',
      question: 'Are there limits on content uploads?',
      answer:
        'No upload limits. Upload as much content as you want. Each piece is individually priced at $0.99-$3.99. Photos and videos up to 100MB are supported.',
    },
    {
      id: 'creator-privacy',
      category: 'creators',
      question: 'Can I control who sees my content?',
      answer:
        'Yes. You can block specific users, set geographic restrictions, and control content visibility. You also choose which members see your profile through smart filtering.',
    },
    {
      id: 'active-sales',
      category: 'creators',
      question: 'What is the Creator Active Sales System?',
      answer:
        'Our revolutionary feature lets creators browse high-value members and send personalized messages and offers. Think of it as "hunting" for customers rather than waiting to be discovered. Creators can target whales, VIPs, and engaged members.',
    },

    // For Members
    {
      id: 'member-registration',
      category: 'members',
      question: 'How do I join as a member?',
      answer:
        'Simply register with your email, verify your account, and start browsing creators. No ID verification required for members. You can browse for free and only pay when you want to unlock content.',
    },
    {
      id: 'member-privacy',
      category: 'members',
      question: 'Is my identity protected as a member?',
      answer:
        'Yes. Members remain anonymous by default. Your profile shows minimal information, and you control what creators can see. We never share your personal information.',
    },
    {
      id: 'browsing-free',
      category: 'members',
      question: 'Is browsing creators free?',
      answer:
        'Yes! Swiping and browsing creators is 100% free with unlimited swipes. You only pay when you want to unlock specific content ($0.99-$3.99 per piece).',
    },
    {
      id: 'member-connections',
      category: 'members',
      question: 'How do connections work?',
      answer:
        'When you and a creator both swipe right (like each other), you create a connection. This unlocks the ability to message and view that creator\'s content library. Connections are mutual interest-based.',
    },
    {
      id: 'member-filtering',
      category: 'members',
      question: 'Can I filter creators by preference?',
      answer:
        'Yes. Filter by sexual orientation (straight, gay, bisexual, all), gender, body type, location (radius or anywhere), age range, and activity status. Our smart algorithm matches you with creators you\'ll love.',
    },

    // Payments & Billing
    {
      id: 'payment-methods',
      category: 'payments',
      question: 'What payment methods are accepted?',
      answer:
        'We accept all major credit cards (Visa, Mastercard, Amex, Discover) through our secure CCBill payment processor. All transactions are discreet and show as "CCBill.com" on statements.',
    },
    {
      id: 'pricing-model',
      category: 'payments',
      question: 'How does pricing work?',
      answer:
        'No subscriptions! Pay only for what you want. Content unlocks are $0.99-$3.99 per piece. You can also send tips ($1-$50+) and purchase special offers from creators. No hidden fees.',
    },
    {
      id: 'refund-policy',
      category: 'payments',
      question: 'What is your refund policy?',
      answer:
        'All sales are final once content is unlocked. However, if content violates our guidelines or is misrepresented, contact support within 48 hours for a refund review. Fraudulent chargebacks will result in account termination.',
    },
    {
      id: 'transaction-fees',
      category: 'payments',
      question: 'Are there transaction fees for members?',
      answer:
        'No hidden fees for members. The price you see is what you pay. Payment processing fees are included. Creators pay standard payment processing fees on payouts.',
    },
    {
      id: 'billing-discreet',
      category: 'payments',
      question: 'Will charges be discreet on my statement?',
      answer:
        'Yes. All charges appear as "CCBill.com" or similar generic descriptor on your credit card statement. No mention of SexySelfies.',
    },

    // Safety & Privacy
    {
      id: 'data-security',
      category: 'safety',
      question: 'How is my data protected?',
      answer:
        'We use industry-standard encryption (AES-256), secure servers, and GDPR-compliant practices. Payment information is handled by PCI-compliant processors. We never store credit card numbers.',
    },
    {
      id: 'report-content',
      category: 'safety',
      question: 'How do I report inappropriate content?',
      answer:
        'Click the report button on any content or profile. Reports are reviewed within 24 hours. For urgent safety concerns, email support@sexyselfies.com immediately.',
    },
    {
      id: 'block-users',
      category: 'safety',
      question: 'Can I block users?',
      answer:
        'Yes. Both creators and members can block users. Blocked users cannot see your profile, contact you, or view your content. Blocks are permanent unless manually removed.',
    },
    {
      id: 'dmca-protection',
      category: 'safety',
      question: 'How are creators protected from content theft?',
      answer:
        'We have a strict DMCA policy. Report stolen content to dmca@sexyselfies.com with proof of ownership. We respond within 24-48 hours and remove infringing content. Repeat infringers are permanently banned.',
    },
    {
      id: 'account-deletion',
      category: 'safety',
      question: 'Can I delete my account?',
      answer:
        'Yes. Go to Settings > Account > Delete Account. All your data will be permanently removed within 30 days. Creators must withdraw remaining balance before deletion.',
    },
    {
      id: 'screenshot-protection',
      category: 'safety',
      question: 'Is there screenshot protection?',
      answer:
        'We use watermarking and tracking on all content. While we cannot prevent screenshots, we can identify and ban users who share content illegally. Violators face legal action under DMCA.',
    },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory =
      activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="faq-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

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
      <main className="faq-content">
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

        {/* Search Bar */}
        <div className="faq-search-container">
          <div className="faq-search-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="faq-search-input"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="faq-categories">
          {faqCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`faq-category-btn ${
                activeCategory === category.id ? 'active' : ''
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <section className="faq-list">
          {filteredFaqs.length === 0 ? (
            <div className="faq-no-results">
              <p>No questions found matching your search.</p>
            </div>
          ) : (
            filteredFaqs.map(faq => (
              <div key={faq.id} className="faq-item">
                <button
                  onClick={() => toggleQuestion(faq.id)}
                  className="faq-question"
                >
                  <span>{faq.question}</span>
                  {expandedQuestions[faq.id] ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
                {expandedQuestions[faq.id] && (
                  <div className="faq-answer">{faq.answer}</div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Contact Support */}
        <section className="faq-contact">
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
      {isMobile && <BottomNavigation userRole="guest" />}
    </div>
  );
};

export default FAQ;
