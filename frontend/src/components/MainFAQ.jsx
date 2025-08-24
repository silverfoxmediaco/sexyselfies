import React, { useState } from 'react';
import './MainFAQ.css';

const MainFAQ = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: "How is this different from OnlyFans?",
      a: "We use a swipe-to-match system like Tinder, no subscriptions required, and we don't allow explicit content. Think Instagram Plus, not porn."
    },
    {
      q: "How much can I earn as a creator?",
      a: "Creators typically earn $2,000-$5,000/month. Top creators make $15,000+. You keep 80% of everything."
    },
    {
      q: "Is this LGBTQ+ friendly?",
      a: "Absolutely! Our advanced filters support all orientations and identities. Everyone is welcome here."
    },
    {
      q: "How do payments work?",
      a: "Users pay $0.99-$3.99 per content unlock. Creators get weekly payouts via bank transfer or PayPal."
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="container">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleFaq(index)}
                aria-expanded={expandedFaq === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span>{faq.q}</span>
                <svg
                  className={`faq-icon ${expandedFaq === index ? 'expanded' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div 
                id={`faq-answer-${index}`}
                className={`faq-answer ${expandedFaq === index ? 'expanded' : ''}`}
              >
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MainFAQ;