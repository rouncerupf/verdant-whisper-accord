"use client";

import { HeroBanner } from "../components/HeroBanner";
import { WelcomeTimeline } from "../components/WelcomeTimeline";
import { MetricsOverview } from "../components/MetricsOverview";

export default function HomePage() {
  return (
    <div className="stack">
      <HeroBanner />
      <MetricsOverview />
      <WelcomeTimeline />
    </div>
  );
}


