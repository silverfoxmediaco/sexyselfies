import * as React from "react";
import Button from "./UI/Button";
import Chip from "./UI/Chip";
import Typography from "./UI/Typography";
import { VerifiedIcon, ShieldIcon, BoltIcon, LockIcon } from "./UI/Icons";
import "./SexySafeControl.css";

export default function SexySafeControl({
  id = "sexy-safe-control",
  headline = "Sexy, Safe, and In Control.",
  subhead = "Flirty, modern, and built for consent. Match, chat, and support creators on your terms.",
  primaryText = "Join the Waitlist",
  secondaryText = "See How It Works",
  onPrimary,
  onSecondary,
  chips,
}) {
  const defaultChips = [
    { icon: <VerifiedIcon />, label: "18+ verified" },
    { icon: <ShieldIcon />, label: "AI + human moderation" },
    { icon: <LockIcon />, label: "Private messaging" },
    { icon: <BoltIcon />, label: "No subscriptions" },
  ];
  const list = Array.isArray(chips) && chips.length ? chips : defaultChips;

  return (
    <section id={id} className="ssc">
      <div className="ssc-inner">
        <Typography variant="h2" className="ssc-headline">{headline}</Typography>
        <Typography className="ssc-subhead">{subhead}</Typography>
        <div className="ssc-cta">
          <Button size="large" variant="primary" className="btn-primary-cta" onClick={onPrimary}>
            {primaryText}
          </Button>
          <Button size="large" variant="outlined" className="btn-outline" onClick={onSecondary}>
            {secondaryText}
          </Button>
        </div>
        <div className="ssc-chips">
          {list.map((c, i) => (
            <Chip key={i} className="chip-tag" icon={c.icon} label={c.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
