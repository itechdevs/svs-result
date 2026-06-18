"use client";

import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoaderVariant =
  | "fullpage" // centred overlay with pulsing logo, progress bar & dots
  | "spinner" // compact ring spinner
  | "skeleton" // card skeleton shimmer
  | "dots" // three-dot bounce
  | "listrow"; // spinner + skeleton text row

interface SanskarLoaderProps {
  variant?: LoaderVariant;
  /** Text shown below the full-page loader */
  message?: string;
  /** Overlay the entire viewport when variant="fullpage" */
  overlay?: boolean;
}

// ─── Keyframe styles (injected once) ─────────────────────────────────────────

const STYLE_ID = "sanskar-loader-styles";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes sl-float-boy {
      0%,100%{transform:translateY(0) rotate(-3deg)}
      50%{transform:translateY(-8px) rotate(3deg)}
    }
    @keyframes sl-float-girl {
      0%,100%{transform:translateY(0) rotate(3deg)}
      50%{transform:translateY(-8px) rotate(-3deg)}
    }
    @keyframes sl-book-open {
      0%,100%{transform:scaleX(1)}
      50%{transform:scaleX(1.05)}
    }
    @keyframes sl-page-l {
      0%,100%{opacity:.5;transform:rotateY(0)}
      50%{opacity:.85;transform:rotateY(-8deg)}
    }
    @keyframes sl-page-r {
      0%,100%{opacity:.5;transform:rotateY(0)}
      50%{opacity:.85;transform:rotateY(8deg)}
    }
    @keyframes sl-pulse-ring {
      0%{transform:scale(.9);opacity:.55}
      70%,100%{transform:scale(1.18);opacity:0}
    }
    @keyframes sl-progress {
      0%{width:0%} 100%{width:100%}
    }
    @keyframes sl-dot {
      0%,80%,100%{transform:scale(.6);opacity:.35}
      40%{transform:scale(1.15);opacity:1}
    }
    @keyframes sl-spin {
      from{transform:rotate(0deg)} to{transform:rotate(360deg)}
    }
    @keyframes sl-skeleton {
      0%{background-position:-300px 0}
      100%{background-position:300px 0}
    }
    @keyframes sl-fadein {
      from{opacity:0;transform:translateY(5px)}
      to{opacity:1;transform:translateY(0)}
    }

    .sl-boy  { animation: sl-float-boy  2s ease-in-out infinite; transform-origin: center bottom; }
    .sl-girl { animation: sl-float-girl 2s ease-in-out infinite .3s; transform-origin: center bottom; }
    .sl-book { animation: sl-book-open  2.4s ease-in-out infinite; transform-origin: center bottom; }
    .sl-page-l { animation: sl-page-l  2.4s ease-in-out infinite; transform-origin: right center; }
    .sl-page-r { animation: sl-page-r  2.4s ease-in-out infinite; transform-origin: left center; }

    .sl-ring1 { animation: sl-pulse-ring 2s ease-out infinite; }
    .sl-ring2 { animation: sl-pulse-ring 2s ease-out infinite .6s; }
    .sl-ring3 { animation: sl-pulse-ring 2s ease-out infinite 1.2s; }

    .sl-progress-bar { animation: sl-progress 2s cubic-bezier(.4,0,.2,1) infinite; }

    .sl-dot1 { animation: sl-dot 1.2s ease-in-out infinite 0s; }
    .sl-dot2 { animation: sl-dot 1.2s ease-in-out infinite .2s; }
    .sl-dot3 { animation: sl-dot 1.2s ease-in-out infinite .4s; }

    .sl-spinner { animation: sl-spin .9s linear infinite; }
    .sl-skeleton-block {
      background: linear-gradient(90deg,#e5e7eb 25%,#d1d5db 50%,#e5e7eb 75%);
      background-size: 600px 100%;
      animation: sl-skeleton 1.5s ease-in-out infinite;
    }
    @media (prefers-color-scheme: dark) {
      .sl-skeleton-block {
        background: linear-gradient(90deg,#374151 25%,#4b5563 50%,#374151 75%);
        background-size: 600px 100%;
      }
    }
    .sl-name { animation: sl-fadein .6s ease both; }
  `;
  document.head.appendChild(el);
}

// ─── Logo SVG ─────────────────────────────────────────────────────────────────

const LogoSVG = () => (
  <svg
    viewBox="0 0 110 110"
    width="82"
    height="82"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    {/* Boy */}
    <g className="sl-boy">
      <circle cx="36" cy="28" r="7" fill="#4A90D9" />
      <polygon points="36,35 20,58 36,52 36,35" fill="#4A90D9" />
      <polygon points="36,35 52,50 36,52 36,35" fill="#4A90D9" />
    </g>
    {/* Girl */}
    <g className="sl-girl">
      <circle cx="74" cy="28" r="7" fill="#3ab87a" />
      <ellipse cx="78" cy="25" rx="4" ry="3" fill="#3ab87a" />
      <polygon points="74,35 58,50 74,52 74,35" fill="#3ab87a" />
      <polygon points="74,35 90,58 74,52 74,35" fill="#3ab87a" />
    </g>
    {/* Book */}
    <g className="sl-book">
      <g className="sl-page-l">
        <polygon points="55,55 15,65 18,95 55,88" fill="#9CA3AF" />
        <polygon points="55,55 15,65 13,67 55,57" fill="#6B7280" />
      </g>
      <g className="sl-page-r">
        <polygon points="55,55 95,65 92,95 55,88" fill="#9CA3AF" />
        <polygon points="55,55 95,65 97,67 55,57" fill="#6B7280" />
      </g>
      <line x1="55" y1="55" x2="55" y2="88" stroke="white" strokeWidth="1.5" />
    </g>
  </svg>
);

// ─── Variants ─────────────────────────────────────────────────────────────────

/** Full-page / overlay loader */
const FullpageLoader = ({
  message = "Loading, please wait…",
  overlay = false,
}: {
  message?: string;
  overlay?: boolean;
}) => {
  const wrapStyle: React.CSSProperties = overlay
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    : {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      };

  return (
    <div
      style={wrapStyle}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Pulsing logo */}
        <div
          style={{
            position: "relative",
            width: 152,
            height: 152,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          {(["sl-ring1", "sl-ring2", "sl-ring3"] as const).map((cls) => (
            <span
              key={cls}
              className={cls}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid #4A90D9",
                pointerEvents: "none",
              }}
            />
          ))}
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: "50%",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              zIndex: 1,
            }}
          >
            <LogoSVG />
          </div>
        </div>

        {/* School name */}
        <p
          className="sl-name"
          style={{
            margin: "0 0 20px",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#2B6CB0",
          }}
        >
          Sanskar Vidhyapith School
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: 200,
            height: 3,
            borderRadius: 99,
            background: "#e5e7eb",
            overflow: "hidden",
            marginBottom: 16,
          }}
          aria-hidden
        >
          <div
            className="sl-progress-bar"
            style={{
              height: "100%",
              borderRadius: 99,
              background: "linear-gradient(90deg,#4A90D9,#3ab87a)",
            }}
          />
        </div>

        {/* Dots */}
        <div
          style={{
            display: "flex",
            gap: 7,
            alignItems: "center",
            marginBottom: 10,
          }}
          aria-hidden
        >
          {(["sl-dot1", "sl-dot2", "sl-dot3"] as const).map((cls, i) => (
            <span
              key={cls}
              className={cls}
              style={{
                display: "block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: i === 1 ? "#3ab87a" : "#4A90D9",
              }}
            />
          ))}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#9ca3af",
            letterSpacing: "0.04em",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
};

/** Compact ring spinner */
const SpinnerLoader = ({ size = 36 }: { size?: number }) => (
  <span
    role="status"
    aria-label="Loading"
    className="sl-spinner"
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${Math.max(2, size / 14)}px solid #e5e7eb`,
      borderTopColor: "#4A90D9",
      borderRightColor: "#3ab87a",
    }}
  />
);

/** Three-dot bouncing loader */
const DotsLoader = () => (
  <div
    role="status"
    aria-label="Loading"
    style={{ display: "flex", gap: 7, alignItems: "center" }}
  >
    {(["sl-dot1", "sl-dot2", "sl-dot3"] as const).map((cls, i) => (
      <span
        key={cls}
        className={cls}
        style={{
          display: "block",
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: i === 1 ? "#3ab87a" : "#4A90D9",
        }}
      />
    ))}
  </div>
);

/** Card skeleton shimmer */
const SkeletonLoader = ({ lines = 2 }: { lines?: number }) => (
  <div
    role="status"
    aria-label="Loading content"
    style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}
  >
    <div
      className="sl-skeleton-block"
      style={{ width: "100%", height: 160, borderRadius: 12 }}
    />
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="sl-skeleton-block"
        style={{
          width: i === lines - 1 ? "55%" : "80%",
          height: 10,
          borderRadius: 6,
        }}
      />
    ))}
    <span
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
      }}
    >
      Loading…
    </span>
  </div>
);

/** Spinner + skeleton text row */
const ListRowLoader = () => (
  <div
    role="status"
    aria-label="Loading"
    style={{ display: "flex", alignItems: "center", gap: 12 }}
  >
    <SpinnerLoader size={28} />
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <div
        className="sl-skeleton-block"
        style={{ width: "60%", height: 10, borderRadius: 6 }}
      />
      <div
        className="sl-skeleton-block"
        style={{ width: "40%", height: 8, borderRadius: 6 }}
      />
    </div>
    <span
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
      }}
    >
      Loading…
    </span>
  </div>
);

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * SanskarLoader — branded loading component for Sanskar Vidhyapith School.
 *
 * Usage:
 *   <SanskarLoader />                            // full-page centered
 *   <SanskarLoader overlay />                    // fixed overlay
 *   <SanskarLoader variant="spinner" />          // inline spinner
 *   <SanskarLoader variant="dots" />             // dot bounce
 *   <SanskarLoader variant="skeleton" />         // card shimmer
 *   <SanskarLoader variant="listrow" />          // list-row shimmer
 */
export default function SanskarLoader({
  variant = "fullpage",
  message,
  overlay = false,
}: SanskarLoaderProps) {
  // Inject keyframes once on mount (client-only)
  React.useEffect(() => {
    injectStyles();
  }, []);

  if (variant === "fullpage") {
    return <FullpageLoader message={message} overlay={overlay} />;
  }
  if (variant === "spinner") return <SpinnerLoader />;
  if (variant === "dots") return <DotsLoader />;
  if (variant === "skeleton") return <SkeletonLoader />;
  if (variant === "listrow") return <ListRowLoader />;

  return null;
}
