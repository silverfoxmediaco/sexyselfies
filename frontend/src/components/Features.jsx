import * as React from "react";
import { Button, Card, CardContent } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LockIcon from "@mui/icons-material/Lock";
import BoltIcon from "@mui/icons-material/Bolt";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedIcon from "@mui/icons-material/Verified";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import "./Features.css";

export default function Features({
  id = "features",
  title = "Features that make it addictive",
  items,
  ctaText,
  onCTAClick,
  secondaryText,
  onSecondary,
}) {
  const data =
    Array.isArray(items) && items.length
      ? items
      : [
          { icon: <FavoriteIcon />, title: "Swipe to Match", desc: "Discover nearby cuties with fast, fluid swipes." },
          { icon: <LockIcon />, title: "Private DMs", desc: "Encrypted chat with preview and unlock flow." },
          { icon: <BoltIcon />, title: "Pay-Per-Unlock", desc: "No subscriptions—support creators on your terms." },
          { icon: <ShieldIcon />, title: "Safety First", desc: "ID + age verification, AI + human moderation." },
          { icon: <VerifiedIcon />, title: "Real People", desc: "Strict guidelines keep the community authentic." },
          { icon: <TrendingUpIcon />, title: "Creator Analytics", desc: "Track earnings, set prices, understand fans." },
        ];

  return (
    <section id={id} className="ftr">
      <div className="ftr-inner">
        <h2 className="ftr-title">{title}</h2>
        <div className="ftr-grid">
          {data.map((f, i) => (
            <Card key={i} className="ftr-card ftr-card-hover">
              <CardContent className="ftr-card-content">
                <div className="ftr-badge">{f.icon}</div>
                <h6 className="ftr-card-title">{f.title}</h6>
                <p className="ftr-card-desc">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {(ctaText || secondaryText) && (
          <div className="ftr-cta">
            {ctaText && (
              <Button size="large" variant="contained" className="btn-primary-cta" onClick={onCTAClick}>
                {ctaText}
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
