import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, DollarSign, TrendingUp, MessageCircle,
  Shield, Heart, HelpCircle, Mail, 
  Twitter, Instagram, Facebook, Youtube
} from 'lucide-react';
import './CreatorMainFooter.css';
import logo from '../assets/sexysselfies_logo.png';

const CreatorMainFooter = () => {
  const currentYear = new Date().getFullYear();

  const creatorFooterLinks = {
    dashboard: [
      { label: 'Content Studio', href: '/creator/content', icon: Camera },
      { label: 'Analytics', href: '/creator/analytics', icon: TrendingUp },
      { label: 'Earnings', href: '/creator/earnings', icon: DollarSign },
      { label: 'Messages', href: '/creator/messages', icon: MessageCircle }
    ],
    resources: [
      { label: 'Creator Guide', href: '/creator/guide', icon: HelpCircle },
      { label: 'Best Practices', href: '/creator/best-practices' },
      { label: 'Tax Resources', href: '/creator/tax-resources' },
      { label: 'Creator Community', href: '/creator/community', icon: Heart }
    ],
    support: [
      { label: 'Help Center', href: '/creator/help' },
      { label: 'Contact Support', href: '/creator/support', icon: Mail },
      { label: 'Verification Help', href: '/creator/verification-help', icon: Shield },
      { label: 'Report Issue', href: '/creator/report' }
    ],
    legal: [
      { label: 'Creator Terms', href: '/creator/terms' },
      { label: 'Content Policy', href: '/creator/content-policy' },
      { label: 'Privacy Policy', href: '/creator/privacy' },
      { label: 'DMCA Policy', href: '/creator/dmca' }
    ]
  };

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'YouTube', href: '#', icon: Youtube }
  ];

  return (
    <footer className="creator-main-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="SexySelfies Creator Hub" />
            </div>
            <p className="brand-description">
              Empowering creators to build their brand, connect with fans, and monetize their content.
            </p>
            <div className="creator-stats">
              <div className="stat-item">
                <strong>10,000+</strong>
                <span>Active Creators</span>
              </div>
              <div className="stat-item">
                <strong>$2M+</strong>
                <span>Paid to Creators</span>
              </div>
            </div>
            <div className="social-links">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label={social.name}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          <div className="footer-links">
            <div className="footer-section">
              <h3>Creator Tools</h3>
              <ul>
                {creatorFooterLinks.dashboard.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link to={link.href}>
                        {Icon && <Icon size={16} />}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="footer-section">
              <h3>Resources</h3>
              <ul>
                {creatorFooterLinks.resources.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link to={link.href}>
                        {Icon && <Icon size={16} />}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="footer-section">
              <h3>Support</h3>
              <ul>
                {creatorFooterLinks.support.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link to={link.href}>
                        {Icon && <Icon size={16} />}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="footer-section">
              <h3>Legal</h3>
              <ul>
                {creatorFooterLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>


        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; {currentYear} SexySelfies Creator Hub. All rights reserved.</p>
            </div>
            <div className="footer-bottom-links">
              <Link to="/creator/terms">Terms</Link>
              <Link to="/creator/privacy">Privacy</Link>
              <Link to="/creator/cookies">Cookies</Link>
              <Link to="/creator/accessibility">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CreatorMainFooter;