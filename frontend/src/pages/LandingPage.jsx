import * as React from "react";
import Button from "../components/UI/Button";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "../components/UI/Dialog";
import { Snackbar, Alert } from "../components/UI/Snackbar";
import Chip from "../components/UI/Chip";
import LinearProgress from "../components/UI/LinearProgress";
import { PeopleIcon, ScheduleIcon, TrendingUpIcon, RocketLaunchIcon } from "../components/UI/Icons";

import SexySafeControl from "../components/SexySafeControl.jsx";
import SwipeChatUnlock from "../components/SwipeChatUnlock.jsx";
import Features from "../components/Features.jsx";
import HowItWorks from "../components/HowItWorks.jsx";
import SafetyAndStandards from "../components/SafetyAndStandards.jsx";
import CreatorsKeepControl from "../components/CreatorsKeepControl.jsx";
import FAQ from "../components/FAQ.jsx";

import "./LandingPage.css";


export default function LandingPage({ logoSrc, onJoinWaitlist }) {
  const [spotsLeft, setSpotsLeft] = React.useState(1200);
  const [liveOnline, setLiveOnline] = React.useState(387);
  const launchDate = React.useMemo(() => new Date("2025-09-15T17:00:00-05:00"), []);
  const [countdown, setCountdown] = React.useState(getCountdown(launchDate));
  const [progress, setProgress] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [snack, setSnack] = React.useState({ open: false, msg: "", severity: "success" });

  React.useEffect(() => {
    const t = setInterval(() => {
      setCountdown(getCountdown(launchDate));
      setLiveOnline((v) => clamp(v + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3), 320, 520));
    }, 1000);
    return () => clearInterval(t);
  }, [launchDate]);

  React.useEffect(() => {
    const s = setInterval(() => setSpotsLeft((v) => Math.max(100, v - Math.floor(Math.random() * 3))), 4500);
    return () => clearInterval(s);
  }, []);

  React.useEffect(() => {
    const cap = 2000;
    setProgress(Math.min(99, Math.round(((cap - spotsLeft) / cap) * 100)));
  }, [spotsLeft]);

  React.useEffect(() => {
    const open = () => setModalOpen(true);
    window.addEventListener("openWaitlist", open);
    return () => window.removeEventListener("openWaitlist", open);
  }, []);

  const handleJoin = async () => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) return setEmailError("Please enter a valid email address.");
    setEmailError("");
    try {
      if (onJoinWaitlist) await Promise.resolve(onJoinWaitlist(email.trim()));
      setModalOpen(false);
      setSnack({ open: true, msg: "You’re on the waitlist! We’ll email launch updates.", severity: "success" });
    } catch {
      setSnack({ open: true, msg: "Something went wrong. Please try again.", severity: "error" });
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
      <div className="page hero-gradient-bg">
        <div className="container">
          <div className="glass-bar">
            <div className="bar-left">
              <Chip className="chip-soft" size="small"><PeopleIcon /> {liveOnline.toLocaleString()} browsing now</Chip>
              <Chip className="chip-soft" size="small"><TrendingUpIcon /> {progress}% spots claimed</Chip>
            </div>
            <div className="bar-right">
              <ScheduleIcon fontSize="small" />
              <span className="bar-count">
                Launch in {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
              </span>
            </div>
          </div>
        </div>

        <SexySafeControl
          onPrimary={() => setModalOpen(true)}
          onSecondary={() => scrollTo("how")}
        />

        <div className="container">
          <div className="progress-wrap">
            <LinearProgress variant="determinate" value={progress} className="progress" />
            <div className="progress-meta">
              <span>{progress}% claimed</span>
              <span>Only {spotsLeft.toLocaleString()} spots left</span>
            </div>
          </div>
        </div>

        <SwipeChatUnlock
          onPrimary={() => setModalOpen(true)}
          onSecondary={() => scrollTo("how")}
        />

        <Features />

        <HowItWorks
          onPrimary={() => setModalOpen(true)}
          onSecondary={() => scrollTo("creators")}
        />

        <SafetyAndStandards ctaHref="#" />

        <CreatorsKeepControl
          onPrimary={() => setModalOpen(true)}
        />

        <FAQ />

        <div className="sticky-cta">
          <div className="container">
            <Button
              fullWidth
              size="large"
              variant="primary"
              className="btn-primary-cta"
              onClick={() => setModalOpen(true)}
              startIcon={<RocketLaunchIcon />}
            >
              Only {spotsLeft.toLocaleString()} early-access spots left — Join now
            </Button>
          </div>
        </div>

        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Join the SexySelfies Waitlist</DialogTitle>
          <DialogContent dividers>
            <p className="muted">Be first in line. We’ll email launch updates only—no spam.</p>
            <input
              type="email"
              className="input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError ? <div className="input-help error">{emailError}</div> : <div className="input-help">&nbsp;</div>}
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="btn-primary-cta" onClick={handleJoin}>
              Get Early Access
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snack.severity} variant="filled">
            {snack.msg}
          </Alert>
        </Snackbar>
      </div>
  );
}

function getCountdown(target) {
  const now = new Date().getTime();
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
