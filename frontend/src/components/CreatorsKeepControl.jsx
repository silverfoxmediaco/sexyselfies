import * as React from "react";
import Button from "./UI/Button";
import { Card, CardContent } from "./UI/Card";
import { TrendingUpIcon, ScheduleIcon, PeopleIcon } from "./UI/Icons";
import "./CreatorsKeepControl.css";

export default function CreatorsKeepControl({
  id = "creators",
  title = "Creators: keep control, boost earnings",
  stats,
  primaryText = "Creator Sign-Up",
  secondaryText,
  onPrimary,
  onSecondary,
}) {
  const data = Array.isArray(stats) && stats.length
    ? stats
    : [
        { icon: <TrendingUpIcon />, k: "Avg Unlock", v: "$2.99–$9.99" },
        { icon: <ScheduleIcon />, k: "Payouts", v: "Weekly" },
        { icon: <PeopleIcon />, k: "Fans", v: "Audience tools" },
      ];

  return (
    <section id={id} className="ckc">
      <div className="ckc-inner">
        <h2 className="ckc-title">{title}</h2>

        <div className="ckc-grid">
          {data.map((s, i) => (
            <Card key={i} className="ckc-card">
              <CardContent className="ckc-card-content">
                <div className="ckc-badge">{s.icon}</div>
                <div className="ckc-kpi">
                  <span className="ckc-k">{s.k}</span>
                  <span className="ckc-v">{s.v}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(primaryText || secondaryText) && (
          <div className="ckc-cta">
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
