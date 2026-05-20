"use client";

import { useState } from "react";

const LOGIN_STATE = {
  INPUT: "input",
  CONFIRMATION: "confirmation",
  ERROR: "error",
} as const;

type LoginState = (typeof LOGIN_STATE)[keyof typeof LOGIN_STATE];

const LOGIN_TITLE = "Log In";
const EMAIL_LABEL = "Email Address";
const PLACEHOLDER_EMAIL = "Input your registered email address...";
const CONFIRM_BUTTON_TEXT = "Confirm";
const CONFIRMATION_HEADING = "Check Your Email";
const CONFIRMATION_MESSAGE_START = "A log-in link has been sent to";
const CONFIRMATION_MESSAGE_END = "Click the link to continue. It will expire in 24 hours.";
const RESEND_LINK_TEXT = "Resend Link";
const TRY_ANOTHER_EMAIL_TEXT = "Wrong email? Try another one.";
const ERROR_HEADING = "Email Not Registered";
const ERROR_MESSAGE =
  "It looks like the email you entered is not registered as a user. If you are a new treekeeper or admin, please contact administration for a sign-up link.";
const ERROR_TRY_ANOTHER_TEXT = "Wrong email? Try another one.";
const GENERIC_ERROR_MESSAGE = "We couldn't send your magic link. Please try again.";

// make sure the email is valid
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export default function LoginPage() {
  const [loginState, setLoginState] = useState<LoginState>(LOGIN_STATE.INPUT);
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(ERROR_MESSAGE);

  const sendMagicLink = async (targetEmail: string): Promise<boolean> => {
    try {
      const response = await fetch("/auth/magiclink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: targetEmail }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setErrorMessage(payload?.message ?? ERROR_MESSAGE);
        return false;
      }

      return true;
    } catch {
      setErrorMessage(GENERIC_ERROR_MESSAGE);
      return false;
    }
  };

  const handleConfirm = async () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) return;

    setIsSubmitting(true);
    const sent = await sendMagicLink(trimmed);
    setIsSubmitting(false);

    if (sent) {
      setSubmittedEmail(trimmed);
      setLoginState(LOGIN_STATE.CONFIRMATION);
      return;
    }

    setLoginState(LOGIN_STATE.ERROR);
  };

  const handleTryAnotherEmail = () => {
    setEmail("");
    setSubmittedEmail("");
    setErrorMessage(ERROR_MESSAGE);
    setLoginState(LOGIN_STATE.INPUT);
  };

  const handleResendLink = async () => {
    if (!submittedEmail) return;

    setIsSubmitting(true);
    const sent = await sendMagicLink(submittedEmail);
    setIsSubmitting(false);

    if (!sent) {
      setLoginState(LOGIN_STATE.ERROR);
    }
  };

  if (loginState === LOGIN_STATE.INPUT) {
    return (
      <div className="flex flex-1 flex-col bg-app-bg" style={{ width: "100vw" }}>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl rounded-xl border border-primary px-12 py-12 shadow-sm bg-card">
            <h1 className="mb-6 text-[44px] font-normal leading-tight text-text font-serif">{LOGIN_TITLE}</h1>
            <label htmlFor="login-email" className="mb-2 block text-[16px] font-bold text-text font-lato">
              {EMAIL_LABEL}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={PLACEHOLDER_EMAIL}
              className="mb-6 w-full rounded-lg border-0 px-4 py-3 text-[16px] text-text placeholder:text-[13px] placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary bg-off-white-2 font-lato"
              aria-label="Email address"
            />
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!email.trim() || !isValidEmail(email.trim()) || isSubmitting}
              className="w-full rounded-full px-4 py-3 text-[16px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 bg-primary font-lato"
            >
              {isSubmitting ? "Sending..." : CONFIRM_BUTTON_TEXT}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loginState === LOGIN_STATE.CONFIRMATION) {
    return (
      <div className="flex flex-1 flex-col bg-app-bg" style={{ width: "100vw" }}>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl rounded-xl border border-primary px-12 py-12 shadow-sm bg-card">
            <h1 className="mb-4 text-center text-[44px] font-normal leading-tight text-text font-serif">
              {CONFIRMATION_HEADING}
            </h1>
            <p className="mb-6 text-center text-[16px] leading-snug text-text font-lato">
              {CONFIRMATION_MESSAGE_START} <strong>{submittedEmail}</strong>. {CONFIRMATION_MESSAGE_END}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResendLink}
                disabled={isSubmitting}
                className="w-full rounded-full px-4 py-3 text-[16px] font-bold text-white transition-colors hover:opacity-90 bg-primary font-lato"
              >
                {isSubmitting ? "Sending..." : RESEND_LINK_TEXT}
              </button>
              <button
                type="button"
                onClick={handleTryAnotherEmail}
                className="text-left text-[14px] underline hover:opacity-80 text-text-muted font-lato"
              >
                {TRY_ANOTHER_EMAIL_TEXT}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="flex flex-1 flex-col bg-app-bg" style={{ width: "100vw" }}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl rounded-xl border border-primary px-12 py-12 shadow-sm bg-card">
          <h1 className="mb-4 text-[44px] font-normal leading-tight text-text font-serif">{ERROR_HEADING}</h1>
          <p className="mb-6 text-[15px] leading-snug text-text font-lato">{errorMessage}</p>
          <button
            type="button"
            onClick={handleTryAnotherEmail}
            className="text-left text-[14px] underline hover:opacity-80 text-text-muted font-lato"
          >
            {ERROR_TRY_ANOTHER_TEXT}
          </button>
        </div>
      </div>
    </div>
  );
}
