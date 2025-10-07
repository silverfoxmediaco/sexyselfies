import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, Download } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './DMCA.css';

const DMCA = () => {
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
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      const sections = document.querySelectorAll('.dmca-section');
      let currentSection = '';

      sections.forEach(section => {
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

  const copyEmail = () => {
    navigator.clipboard.writeText('dmca@sexyselfies.com');
    alert('Email copied to clipboard!');
  };

  const downloadPDF = () => {
    window.print();
  };

  const sections = [
    {
      id: 'overview',
      title: 'DMCA Overview',
      content: (
        <div className="dmca-subsection">
          <p>
            SexySelfies respects the intellectual property rights of others and
            expects our users to do the same. In accordance with the Digital
            Millennium Copyright Act of 1998 (DMCA), we will respond promptly to
            claims of copyright infringement committed using our platform.
          </p>
          <p>
            This policy outlines the information required for filing a DMCA
            takedown notice, our response procedures, and the counter-notice
            process for users who believe their content was removed in error.
          </p>
          <p className="dmca-note">
            <strong>Legal Reference:</strong> This policy is implemented under 17
            U.S.C. § 512(c)(3)(A) of the Digital Millennium Copyright Act.
          </p>
        </div>
      ),
    },
    {
      id: 'copyright-policy',
      title: 'Copyright Policy',
      content: (
        <div className="dmca-subsection">
          <h4>Our Commitment</h4>
          <ul>
            <li>
              <strong>Safe Harbor Compliance:</strong> We maintain compliance with
              DMCA safe harbor provisions to protect both copyright holders and our
              platform.
            </li>
            <li>
              <strong>Prompt Response:</strong> We respond to valid DMCA notices
              within 24-48 hours of receipt.
            </li>
            <li>
              <strong>Content Removal:</strong> Infringing content is removed or
              disabled promptly upon receipt of valid notice.
            </li>
            <li>
              <strong>User Notification:</strong> Users are notified when their
              content is removed due to a copyright claim.
            </li>
          </ul>

          <h4>User Responsibilities</h4>
          <ul>
            <li>
              Users must own or have rights to all content they upload to
              SexySelfies
            </li>
            <li>
              Uploading copyrighted material without permission is strictly
              prohibited
            </li>
            <li>
              Users who repeatedly infringe copyright will have their accounts
              terminated
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'filing-notice',
      title: 'Filing a DMCA Takedown Notice',
      content: (
        <div className="dmca-subsection">
          <p>
            If you believe that content on SexySelfies infringes your copyright,
            you may submit a DMCA takedown notice. To be valid, your notice must
            include ALL of the following elements as required by 17 U.S.C. §
            512(c)(3)(A):
          </p>

          <h4>Required Elements</h4>
          <ul>
            <li>
              <strong>Physical or Electronic Signature:</strong> A physical or
              electronic signature of the copyright owner or person authorized to
              act on their behalf.
            </li>
            <li>
              <strong>Identification of Copyrighted Work:</strong> Identification
              of the copyrighted work claimed to have been infringed. If multiple
              works are claimed, provide a representative list.
            </li>
            <li>
              <strong>Identification of Infringing Material:</strong> Identification
              of the material claimed to be infringing, including URLs or specific
              location information to allow us to locate the content.
            </li>
            <li>
              <strong>Contact Information:</strong> Your contact information
              including name, address, telephone number, and email address.
            </li>
            <li>
              <strong>Good Faith Statement:</strong> A statement that you have a
              good faith belief that use of the material is not authorized by the
              copyright owner, its agent, or the law.
            </li>
            <li>
              <strong>Accuracy Statement:</strong> A statement that the information
              in the notification is accurate, and under penalty of perjury, that
              you are authorized to act on behalf of the copyright owner.
            </li>
          </ul>

          <p className="dmca-note">
            <strong>Important:</strong> Incomplete notices will not be processed.
            False or fraudulent DMCA claims may result in legal liability under 17
            U.S.C. § 512(f).
          </p>
        </div>
      ),
    },
    {
      id: 'where-to-send',
      title: 'Where to Send DMCA Notices',
      content: (
        <div className="dmca-subsection">
          <p>
            All DMCA takedown notices must be sent to our designated DMCA agent:
          </p>

          <div className="dmca-agent-info">
            <h4>Designated DMCA Agent</h4>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:dmca@sexyselfies.com">dmca@sexyselfies.com</a>
            </p>
            <p>
              <strong>Subject Line:</strong> DMCA Takedown Notice
            </p>
          </div>

          <p className="dmca-note">
            <strong>Email is Preferred:</strong> For fastest processing, please
            send notices via email with all required documentation attached.
          </p>

          <h4>What to Include in Email</h4>
          <ul>
            <li>Subject line: "DMCA Takedown Notice"</li>
            <li>All six required elements listed in "Filing a DMCA Notice"</li>
            <li>Direct URLs to infringing content on our platform</li>
            <li>Evidence of your copyright ownership (registration, proof of creation)</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'response-timeline',
      title: 'Our Response Timeline',
      content: (
        <div className="dmca-subsection">
          <h4>Upon Receipt of Valid Notice</h4>
          <ul>
            <li>
              <strong>Initial Review:</strong> We review the notice for completeness
              within 24 hours.
            </li>
            <li>
              <strong>Content Removal:</strong> If valid, we remove or disable
              access to the allegedly infringing content within 24-48 hours.
            </li>
            <li>
              <strong>User Notification:</strong> We notify the user who posted the
              content that it has been removed due to a DMCA claim.
            </li>
            <li>
              <strong>Counter-Notice Period:</strong> The user has 10-14 business
              days to file a counter-notice.
            </li>
            <li>
              <strong>Restoration:</strong> If no counter-notice is received, the
              content remains removed. If a valid counter-notice is filed, we may
              restore the content after 10-14 business days.
            </li>
          </ul>

          <p className="dmca-note">
            <strong>Repeat Infringers:</strong> Users who receive multiple valid
            DMCA notices will have their accounts reviewed and may be permanently
            banned.
          </p>
        </div>
      ),
    },
    {
      id: 'counter-notice',
      title: 'Counter-Notice Process',
      content: (
        <div className="dmca-subsection">
          <p>
            If you believe your content was removed in error or that you have the
            right to use the material, you may file a DMCA counter-notice.
          </p>

          <h4>Required Elements for Counter-Notice</h4>
          <ul>
            <li>
              <strong>Your Signature:</strong> Physical or electronic signature.
            </li>
            <li>
              <strong>Identification of Material:</strong> Identification of the
              content that was removed and its previous location.
            </li>
            <li>
              <strong>Good Faith Statement:</strong> A statement under penalty of
              perjury that you have a good faith belief the content was removed due
              to mistake or misidentification.
            </li>
            <li>
              <strong>Consent to Jurisdiction:</strong> Your name, address, phone
              number, and statement of consent to the jurisdiction of the Federal
              District Court.
            </li>
            <li>
              <strong>Service of Process:</strong> Statement that you will accept
              service of process from the person who filed the original DMCA notice.
            </li>
          </ul>

          <h4>Counter-Notice Timeline</h4>
          <ul>
            <li>
              You have <strong>10-14 business days</strong> from the date of removal
              to file a counter-notice
            </li>
            <li>
              We forward your counter-notice to the original complainant within 2-3
              business days
            </li>
            <li>
              The complainant has <strong>10-14 business days</strong> to file a
              court action
            </li>
            <li>
              If no court action is filed, we may restore your content after the
              waiting period
            </li>
          </ul>

          <p className="dmca-note">
            <strong>Send Counter-Notices To:</strong>{' '}
            <a href="mailto:dmca@sexyselfies.com">dmca@sexyselfies.com</a> with
            subject line "DMCA Counter-Notice"
          </p>
        </div>
      ),
    },
    {
      id: 'repeat-infringer',
      title: 'Repeat Infringer Policy',
      content: (
        <div className="dmca-subsection">
          <p>
            In accordance with the DMCA and other applicable laws, SexySelfies has
            adopted a policy of terminating accounts of users who are repeat
            infringers.
          </p>

          <h4>What Constitutes a Repeat Infringer</h4>
          <ul>
            <li>
              A user who has received <strong>two or more valid DMCA notices</strong>{' '}
              for different instances of infringement
            </li>
            <li>
              A user who repeatedly uploads content after being notified of
              infringement
            </li>
            <li>
              A user who files fraudulent or bad faith counter-notices
            </li>
          </ul>

          <h4>Consequences</h4>
          <ul>
            <li>
              <strong>First Violation:</strong> Content removed, warning issued
            </li>
            <li>
              <strong>Second Violation:</strong> Content removed, account suspended
              for 30 days
            </li>
            <li>
              <strong>Third Violation:</strong> Account permanently terminated, all
              content removed
            </li>
          </ul>

          <p className="dmca-note">
            <strong>Appeal Process:</strong> Users may appeal account termination by
            providing evidence that the DMCA claims were invalid or fraudulent.
          </p>
        </div>
      ),
    },
    {
      id: 'good-faith',
      title: 'Good Faith Requirements',
      content: (
        <div className="dmca-subsection">
          <p>
            Both DMCA notices and counter-notices must be filed in good faith. False
            or fraudulent claims may result in legal consequences.
          </p>

          <h4>For Copyright Holders</h4>
          <ul>
            <li>
              <strong>Verify Ownership:</strong> Ensure you own or represent the
              copyright holder before filing
            </li>
            <li>
              <strong>Accurate Information:</strong> Provide truthful and accurate
              information in your notice
            </li>
            <li>
              <strong>Specific Claims:</strong> Only claim infringement for content
              you actually own
            </li>
            <li>
              <strong>Legal Liability:</strong> Under 17 U.S.C. § 512(f), you may be
              liable for damages if you knowingly misrepresent that content is
              infringing
            </li>
          </ul>

          <h4>For Users Filing Counter-Notices</h4>
          <ul>
            <li>
              <strong>Legitimate Basis:</strong> Only file a counter-notice if you
              genuinely believe the content was removed in error
            </li>
            <li>
              <strong>Legal Rights:</strong> Ensure you have the legal right to use
              the content
            </li>
            <li>
              <strong>Consequences:</strong> Filing a false counter-notice may result
              in legal action and account termination
            </li>
          </ul>

          <p className="dmca-note">
            <strong>Perjury Warning:</strong> Both DMCA notices and counter-notices
            are made under penalty of perjury. False statements may result in
            criminal prosecution.
          </p>
        </div>
      ),
    },
    {
      id: 'platform-liability',
      title: 'Platform Liability & Safe Harbor',
      content: (
        <div className="dmca-subsection">
          <p>
            SexySelfies operates as a service provider under the DMCA's safe harbor
            provisions. We are not liable for copyright infringement by our users,
            provided we comply with DMCA requirements.
          </p>

          <h4>Safe Harbor Compliance</h4>
          <ul>
            <li>
              We do not have actual knowledge of infringing activity until notified
            </li>
            <li>We respond promptly to valid DMCA notices</li>
            <li>We terminate repeat infringers</li>
            <li>We designate an agent to receive DMCA notices</li>
          </ul>

          <h4>No Obligation to Monitor</h4>
          <ul>
            <li>
              We are <strong>not required</strong> to actively monitor content for
              copyright infringement
            </li>
            <li>
              We rely on copyright holders to identify and report infringing content
            </li>
            <li>
              We do not review content for copyright compliance before publication
            </li>
          </ul>

          <h4>User Responsibility</h4>
          <ul>
            <li>
              Users are solely responsible for ensuring they have rights to uploaded
              content
            </li>
            <li>
              SexySelfies is not liable for user-uploaded infringing content
            </li>
            <li>
              Users indemnify SexySelfies against copyright claims arising from their
              content
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'modifications',
      title: 'Modifications to This Policy',
      content: (
        <div className="dmca-subsection">
          <p>
            SexySelfies reserves the right to modify this DMCA policy at any time to
            reflect changes in law, platform operations, or industry best practices.
          </p>

          <h4>How We Notify You</h4>
          <ul>
            <li>
              <strong>Last Updated Date:</strong> This policy displays the last
              updated date at the top
            </li>
            <li>
              <strong>Material Changes:</strong> We will notify users of material
              changes via email or platform notification
            </li>
            <li>
              <strong>Continued Use:</strong> Continued use of the platform after
              changes constitutes acceptance
            </li>
          </ul>

          <h4>Review Regularly</h4>
          <ul>
            <li>Check this page periodically for updates</li>
            <li>Contact us if you have questions about policy changes</li>
            <li>We recommend reviewing this policy annually</li>
          </ul>

          <p className="dmca-note">
            <strong>Effective Date:</strong> This policy is effective immediately upon
            posting. Previous versions are superseded.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="dmca-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Progress Bar */}
      <div className="dmca-progress-bar-container">
        <div
          className="dmca-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky Header */}
      <header className="dmca-header">
        <button onClick={() => navigate(-1)} className="dmca-back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>DMCA Policy</h1>
        <div className="dmca-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="dmca-content" ref={contentRef}>
        {/* Hero Section */}
        <section className="dmca-hero">
          <h2>Digital Millennium Copyright Act Policy</h2>
          <p className="dmca-last-updated">Last Updated: January 2025</p>
          <p className="dmca-intro-text">
            This policy outlines how SexySelfies responds to copyright infringement
            claims under the Digital Millennium Copyright Act (DMCA). We respect
            intellectual property rights and provide clear procedures for filing
            takedown notices and counter-notices.
          </p>
        </section>

        {/* Table of Contents */}
        <div className="dmca-toc-container">
          <button
            className="dmca-toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
          >
            <span>Table of Contents</span>
            {showTOC ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showTOC && (
            <nav className="dmca-toc-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`dmca-toc-item ${
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
        <div className="dmca-sections">
          {sections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="dmca-section"
            >
              <button
                className="dmca-section-header"
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
                <div className="dmca-section-content">{section.content}</div>
              )}
            </section>
          ))}
        </div>

        {/* Contact Section */}
        <section className="dmca-contact-section">
          <h3>Submit a DMCA Notice</h3>
          <p>
            If you believe content on SexySelfies infringes your copyright, please
            submit a complete DMCA takedown notice to our designated agent.
          </p>
          <div className="dmca-contact-info">
            <button onClick={copyEmail} className="dmca-copy-email-btn">
              <Mail size={20} />
              dmca@sexyselfies.com
            </button>
          </div>
          <p className="dmca-response-time">
            We typically respond to valid DMCA notices within 24-48 hours.
          </p>
        </section>

        {/* Desktop Actions */}
        <div className="dmca-desktop-actions">
          <button onClick={downloadPDF} className="dmca-download-btn">
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

export default DMCA;
