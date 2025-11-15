"use client";

import Link from "next/link";

export const HeroBanner = () => {
  return (
    <section className="surface-card" style={{ padding: "3rem", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: "620px" }}>
        <h1 className="hero-title">Steward encrypted initiatives with verifiable privacy</h1>
        <p className="hero-subtitle">
          Verdant Whisper Accord preserves sensitive environmental advocacy while homomorphic analytics guide funding and
          prioritisation. Unlock data only when governance mandates it.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/dashboard" className="cta-button">
            Explore Initiatives
          </Link>
          <Link href="/submit" className="ghost-button">
            Submit New Initiative
          </Link>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: "-120px",
          top: "-80px",
          width: "420px",
          height: "420px",
          background: "radial-gradient(circle at center, rgba(78, 169, 135, 0.25), transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
};


