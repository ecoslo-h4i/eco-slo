import type { CSSProperties } from "react";

export interface EmailTemplateProps {
  redirectTo: string;
  firstName?: string;
}

// Rendered to HTML by Resend (via @react-email/render) and emailed as the
// sign-in link. Email clients ignore <style>/external CSS and don't run
// Tailwind, so everything is inline styles with web-safe fonts. Palette mirrors
// globals.css / TaskEmail so ECOSLO's emails feel like one family.
export function EmailTemplate({ redirectTo, firstName }: EmailTemplateProps) {
  const greetingName = firstName?.trim();

  return (
    <html lang="en">
      {/* eslint-disable-next-line @next/next/no-head-element -- standalone email document rendered by Resend, not a Next.js page */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sign in to ECOSLO</title>
      </head>
      <body style={bodyStyle}>
        {/* Preheader: sets the inbox preview text without showing in the body. */}
        <div style={preheaderStyle}>Your secure sign-in link for ECOSLO is ready.</div>

        <div style={containerStyle}>
          <div style={brandStyle}>🌳 ECOSLO</div>

          <h1 style={headingStyle}>{greetingName ? `Welcome back, ${greetingName}` : "Welcome back"}</h1>
          <p style={textStyle}>Tap the button below to securely sign in to your ECOSLO account — no password needed.</p>

          <div style={buttonWrapStyle}>
            <a href={redirectTo} style={buttonStyle}>
              Sign in to ECOSLO
            </a>
          </div>

          <p style={mutedStyle}>Button not working? Copy and paste this link into your browser:</p>
          <p style={fallbackWrapStyle}>
            <a href={redirectTo} style={fallbackLinkStyle}>
              {redirectTo}
            </a>
          </p>

          <hr style={hrStyle} />

          <p style={noteStyle}>
            For your security, this link can be used once and expires soon. If you did not request it, you can safely
            ignore this email — your account stays protected.
          </p>
          <p style={footerStyle}>Thanks for being part of ECOSLO. 🌱</p>
        </div>
      </body>
    </html>
  );
}

const bodyStyle: CSSProperties = {
  backgroundColor: "#f2f0ed",
  margin: 0,
  padding: 0,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: "#6a5f52",
};

const preheaderStyle: CSSProperties = {
  display: "none",
  overflow: "hidden",
  lineHeight: "1px",
  maxHeight: 0,
  maxWidth: 0,
  opacity: 0,
};

const containerStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  maxWidth: "480px",
  borderRadius: "12px",
  border: "1px solid #dedbd2",
};

const brandStyle: CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.02em",
  color: "#7b8963",
  marginBottom: "28px",
};

const headingStyle: CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "24px",
  fontWeight: 600,
  color: "#000000",
  margin: "0 0 12px",
};

const textStyle: CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#6a5f52",
  margin: "0 0 28px",
};

const buttonWrapStyle: CSSProperties = {
  textAlign: "center",
  margin: "0 0 28px",
};

const buttonStyle: CSSProperties = {
  backgroundColor: "#7b8963",
  color: "#ffffff",
  display: "inline-block",
  padding: "14px 32px",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
};

const mutedStyle: CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#7d7469",
  margin: "0 0 6px",
};

const fallbackWrapStyle: CSSProperties = {
  margin: "0 0 8px",
  wordBreak: "break-all",
};

const fallbackLinkStyle: CSSProperties = {
  fontSize: "13px",
  color: "#697751",
  wordBreak: "break-all",
};

const hrStyle: CSSProperties = {
  border: 0,
  borderTop: "1px solid #dedbd2",
  margin: "28px 0",
};

const noteStyle: CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#7d7469",
  margin: "0 0 14px",
};

const footerStyle: CSSProperties = {
  fontSize: "13px",
  color: "#7d7469",
  margin: 0,
};
