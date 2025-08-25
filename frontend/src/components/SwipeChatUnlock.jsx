import * as React from "react";
import Button from "./UI/Button";
import { Card, CardContent } from "./UI/Card";
import { SwipeRightAltIcon, ChatBubbleOutlineIcon, BoltIcon, RocketLaunchIcon } from "./UI/Icons";
import "./SwipeChatUnlock.css";

export default function SwipeChatUnlock({
  id = "swipe-chat-unlock",
  title = "Swipe. Chat. Unlock.",
  subtitle = "Fast discovery, private conversations, and pay-per-unlock content—all in one flow.",
  steps,
  primaryText = "Get Early Access",
  secondaryText = "See How It Works",
  onPrimary,
  onSecondary,
}) {
  const data =
    steps && steps.length === 3
      ? steps
      : [
          {
            icon: <SwipeRightAltIcon />,
            title: "Swipe",
            desc: "Discover nearby cuties with filters that fit your vibe.",
          },
          {
            icon: <ChatBubbleOutlineIcon />,
            title: "Chat",
            desc: "Flirt in private with controls for safety and consent.",
          },
          {
            icon: <BoltIcon />,
            title: "Unlock",
            desc: "Tip or unlock premium photos and videos when you want.",
          },
        ];

  return (
    <section id={id} className="scu">
      <div className="scu-inner">
        <h2 className="scu-title">{title}</h2>
        <p className="scu-sub">{subtitle}</p>

        <div className="scu-grid">
          {data.map((s, i) => (
            <Card key={i} className="scu-card">
              <CardContent className="scu-card-content">
                <div className="scu-badge">{s.icon}</div>
                <h6 className="scu-card-title">{s.title}</h6>
                <p className="scu-card-desc">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="scu-cta">
          <Button
            size="large"
            variant="primary"
            className="btn-primary-cta"
            onClick={onPrimary}
            startIcon={<RocketLaunchIcon />}
          >
            {primaryText}
          </Button>
          <Button
            size="large"
            variant="outlined"
            className="btn-outline"
            onClick={onSecondary}
          >
            {secondaryText}
          </Button>
        </div>
      </div>
    </section>
  );
}
