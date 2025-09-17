import * as React from 'react';
import { Accordion, AccordionSummary, AccordionDetails } from './UI/Accordion';
import Typography from './UI/Typography';
import Button from './UI/Button';
import { ExpandMoreIcon } from './UI/Icons';
import './FAQ.css';

export default function FAQ({
  id = 'faq',
  title = 'FAQ',
  items,
  ctaText,
  onCTAClick,
  ctaHref,
}) {
  const data =
    Array.isArray(items) && items.length
      ? items
      : [
          {
            q: 'Is SexySelfies explicit?',
            a: 'No. Flirty and suggestive content is allowed; explicit or pornographic content is not.',
          },
          {
            q: 'How do payments work?',
            a: 'Pay per unlock or tip—no subscriptions. We process payments via a third-party provider.',
          },
          {
            q: 'Is my age verified?',
            a: 'Yes, we require ID and age verification (18+).',
          },
          {
            q: 'Do you allow creators?',
            a: 'Yes. Set your own prices and receive regular payouts.',
          },
        ];

  const CTA = () => {
    if (!ctaText) return null;
    if (ctaHref) {
      return (
        <Button variant='outlined' className='btn-outline' href={ctaHref}>
          {ctaText}
        </Button>
      );
    }
    return (
      <Button variant='outlined' className='btn-outline' onClick={onCTAClick}>
        {ctaText}
      </Button>
    );
  };

  return (
    <section id={id} className='faqc'>
      <div className='faqc-inner'>
        <h2 className='faqc-title'>{title}</h2>
        <div className='faqc-list'>
          {data.map((item, i) => (
            <Accordion
              key={i}
              defaultExpanded={i === 0 || item.defaultExpanded === true}
              className='faqc-accordion'
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography className='faqc-q'>{item.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography className='faqc-a'>{item.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
        {ctaText && (
          <div className='faqc-cta'>
            <CTA />
          </div>
        )}
      </div>
    </section>
  );
}
