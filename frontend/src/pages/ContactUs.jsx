import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Send, CheckCircle } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './ContactUs.css';

const ContactUs = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'member',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detect viewport changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          userType: 'member',
        });
      }, 3000);
    }, 1500);
  };

  const copyEmail = email => {
    navigator.clipboard.writeText(email);
    alert('Email copied to clipboard!');
  };

  return (
    <div className="contactus-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Sticky Header */}
      <header className="contactus-header">
        <button onClick={() => navigate(-1)} className="contactus-back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Contact Us</h1>
        <div className="contactus-header-spacer" />
      </header>

      {/* Main Content */}
      <main className="contactus-content">
        {/* Hero Section */}
        <section className="contactus-hero">
          <h2>Get in Touch</h2>
          <p className="contactus-intro-text">
            Have a question, concern, or feedback? We're here to help. Choose your
            preferred method of contact below.
          </p>
        </section>

        {/* Contact Methods */}
        <section className="contactus-methods">
          <div className="contactus-method-card">
            <div className="contactus-method-icon">
              <Mail size={32} />
            </div>
            <h3>Email Support</h3>
            <p>For general inquiries and support</p>
            <button
              onClick={() => copyEmail('support@sexyselfies.com')}
              className="contactus-copy-btn"
            >
              support@sexyselfies.com
            </button>
          </div>

          <div className="contactus-method-card">
            <div className="contactus-method-icon">
              <Mail size={32} />
            </div>
            <h3>DMCA Notices</h3>
            <p>For copyright infringement claims</p>
            <button
              onClick={() => copyEmail('dmca@sexyselfies.com')}
              className="contactus-copy-btn"
            >
              dmca@sexyselfies.com
            </button>
          </div>

          <div className="contactus-method-card">
            <div className="contactus-method-icon">
              <MessageCircle size={32} />
            </div>
            <h3>Response Time</h3>
            <p>We typically respond within 24-48 hours</p>
            <span className="contactus-badge">Fast Support</span>
          </div>
        </section>

        {/* Contact Form */}
        <section className="contactus-form-section">
          <div className="contactus-form-header">
            <h3>Send Us a Message</h3>
            <p>Fill out the form below and we'll get back to you soon</p>
          </div>

          {submitted ? (
            <div className="contactus-success">
              <CheckCircle size={48} />
              <h4>Message Sent Successfully!</h4>
              <p>
                Thank you for contacting us. We've received your message and will
                respond within 24-48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contactus-form">
              <div className="contactus-form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="contactus-form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="contactus-form-group">
                <label htmlFor="userType">I am a *</label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                >
                  <option value="member">Member</option>
                  <option value="creator">Creator</option>
                  <option value="prospective">Prospective User</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="contactus-form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your inquiry"
                />
              </div>

              <div className="contactus-form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                className="contactus-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="contactus-spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* FAQ Section */}
        <section className="contactus-faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="contactus-faq-grid">
            <div className="contactus-faq-card">
              <h4>How long does verification take?</h4>
              <p>
                Creator verification typically takes 24-48 hours. You'll receive an
                email notification once your verification is complete.
              </p>
            </div>

            <div className="contactus-faq-card">
              <h4>When do creators get paid?</h4>
              <p>
                Creators can request payouts weekly, with a minimum balance of $50.
                Payouts are processed within 3-5 business days.
              </p>
            </div>

            <div className="contactus-faq-card">
              <h4>How do I report content?</h4>
              <p>
                Use the report button on any content or profile. For copyright
                claims, submit a DMCA notice to dmca@sexyselfies.com.
              </p>
            </div>

            <div className="contactus-faq-card">
              <h4>Can I delete my account?</h4>
              <p>
                Yes, you can delete your account from Settings. All your data will be
                permanently removed within 30 days.
              </p>
            </div>
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

export default ContactUs;
