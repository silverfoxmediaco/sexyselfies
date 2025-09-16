import * as React from "react";
import Button from "./UI/Button";
import { Card, CardContent } from "./UI/Card";
import "./HowItWorks.css";

export default function HowItWorks({
  id = "how",
  title = "How it works",
  steps,
  primaryText = "Get Early Access",
  secondaryText = "Creator Sign-Up",
  onPrimary,
  onSecondary,
}) {
  const data =
    Array.isArray(steps) && steps.length
      ? steps
      : [
          { n: 1, title: "Create your profile", desc: "Set your vibe, filters, and preferences." },
          { n: 2, title: "Connect & chat", desc: "Flirt safely with tools to control your experience." },
          { n: 3, title: "Unlock premium", desc: "Tip creators or unlock photos and videos when you want." },
        ];

  return (
    <section id={id} className="hiw">
      <div className="hiw-inner">
        <h2 className="hiw-title">{title}</h2>
        <div className="hiw-grid">
          {data.map((s) => (
            <Card key={s.n} className="hiw-card">
              <CardContent className="hiw-card-content">
                <div className="hiw-step-pill">{s.n}</div>
                <h6 className="hiw-card-title">{s.title}</h6>
                <p className="hiw-card-desc">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {(primaryText || secondaryText) && (
          <div className="hiw-cta">
            {primaryText && (
              <Button size="large" variant="primary" className="btn-primary-cta" onClick={onPrimary}>
                {primaryText}
              </Button>
            )}
            {secondaryText && (
              <Button size="large" variant="outlined" className="btn-outline" onClick={onSecondary}>
                {secondaryText}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
