import * as React from "react";
import Button from "./UI/Button";
import { Card, CardContent } from "./UI/Card";
import { ShieldIcon } from "./UI/Icons";
import "./SafetyAndStandards.css";

export default function SafetyAndStandards({
  id = "safety",
  title = "Safety & Standards",
  bullets,
  ctaText = "Read our Community Guidelines",
  ctaHref,
  onCTAClick,
  secondaryText,
  onSecondary,
}) {
  const items = Array.isArray(bullets) && bullets.length
    ? bullets
    : [
        "18+ only (ID & age verification)",
        "AI + human moderation",
        "Zero tolerance for explicit/illegal content",
        "Block & report tools",
        "Transparent community guidelines",
      ];

  const CTA = () => {
    if (!ctaText) return null;
    if (ctaHref) {
      return (
        <Button variant="outlined" className="btn-outline" href={ctaHref}>
          {ctaText}
        </Button>
      );
    }
    return (
      <Button variant="outlined" className="btn-outline" onClick={onCTAClick}>
        {ctaText}
      </Button>
    );
  };

  return (
    <section id={id} className="sas">
      <div className="sas-inner">
        <h2 className="sas-title">{title}</h2>

        <div className="sas-grid">
          {items.map((txt, i) => (
            <Card key={i} className="sas-card">
              <CardContent className="sas-card-content row">
                <span className="sas-shield"><ShieldIcon /></span>
                <span className="sas-text">{txt}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {(ctaText || secondaryText) && (
          <div className="sas-cta">
            <CTA />
            {secondaryText && (
              <Button variant="primary" className="btn-primary-cta" onClick={onSecondary}>
                {secondaryText}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
