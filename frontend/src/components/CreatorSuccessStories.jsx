import React, { useState, useEffect } from 'react';
import './CreatorSuccessStories.css';

const CreatorSuccessStories = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Ashley M.',
      role: 'Content Creator',
      rating: 5,
      text: 'Finally a platform where I can be sexy without crossing my boundaries. Making $3k/month!',
    },
    {
      name: 'Jordan K.',
      role: 'Top Creator',
      rating: 5,
      text: 'The matching system is genius! My fans actually want to see my content.',
    },
    {
      name: 'Sam R.',
      role: 'New Creator',
      rating: 5,
      text: 'Started last month and already at $1,200. The DM monetization is amazing!',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className='testimonials-section'>
      <div className='container'>
        <h2>Creator Success Stories</h2>
        <div className='testimonial-carousel'>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`testimonial-card glass-card ${activeTestimonial === index ? 'active' : ''}`}
            >
              <div className='rating'>{'★'.repeat(testimonial.rating)}</div>
              <p className='testimonial-text'>"{testimonial.text}"</p>
              <div className='testimonial-author'>
                <div className='author-avatar'>{testimonial.name[0]}</div>
                <div className='author-info'>
                  <div className='author-name'>{testimonial.name}</div>
                  <div className='author-role'>{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
          <div className='carousel-dots'>
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${activeTestimonial === index ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreatorSuccessStories;
