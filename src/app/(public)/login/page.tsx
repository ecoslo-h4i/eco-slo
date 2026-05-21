"use client";

import { AppButton, TextField } from "@/components/ui/form-controls";
import { type ReactNode, useState } from "react";

const LOGIN_STATE = {
  INPUT: "input",
  CONFIRMATION: "confirmation",
  ERROR: "error",
} as const;

type LoginState = (typeof LOGIN_STATE)[keyof typeof LOGIN_STATE];

const LOGIN_TITLE = "Log In";
const EMAIL_LABEL = "Email Address";
const PLACEHOLDER_EMAIL = "admin@ecoslo.org";
const CONFIRM_BUTTON_TEXT = "Send Magic Link";
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

function LoginShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full flex-1 items-center justify-center bg-off-white px-6 py-10">
      {children}
    </main>
  );
}

function LoginCard({ children }: { children: ReactNode }) {
  return <section className="w-full max-w-[430px] rounded-[16px] bg-card px-8 py-7 shadow-soft">{children}</section>;
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
      <LoginShell>
        <LoginCard>
          <h1 className="mb-5 text-center font-serif text-[24px] font-normal leading-tight text-text">{LOGIN_TITLE}</h1>
          <label htmlFor="login-email" className="mb-2 block font-mulish text-[12px] font-bold text-text">
            {EMAIL_LABEL}
          </label>
          <TextField
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={PLACEHOLDER_EMAIL}
            className="mb-5 bg-off-white"
            aria-label="Email address"
          />
          <AppButton
            type="button"
            onClick={handleConfirm}
            disabled={!email.trim() || !isValidEmail(email.trim()) || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Sending..." : CONFIRM_BUTTON_TEXT}
          </AppButton>
          <AppButton
            type="button"
            className="mx-auto mt-4"
            size="sm"
            variant="ghost"
            onClick={() => {
              window.location.href = "/map";
            }}
          >
            Back to Public Map
          </AppButton>
        </LoginCard>
      </LoginShell>
    );
  }

  if (loginState === LOGIN_STATE.CONFIRMATION) {
    return (
      <LoginShell>
        <LoginCard>
          <h1 className="mb-4 text-center font-serif text-[24px] font-normal leading-tight text-text">
            {CONFIRMATION_HEADING}
          </h1>
          <p className="mb-5 text-center font-mulish text-[12px] leading-snug text-text">
            {CONFIRMATION_MESSAGE_START} <strong>{submittedEmail}</strong>. {CONFIRMATION_MESSAGE_END}
          </p>
          <div className="flex flex-col gap-3">
            <AppButton type="button" onClick={handleResendLink} disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? "Sending..." : RESEND_LINK_TEXT}
            </AppButton>
            <AppButton type="button" onClick={handleTryAnotherEmail} className="mx-auto" size="sm" variant="ghost">
              {TRY_ANOTHER_EMAIL_TEXT}
            </AppButton>
          </div>
        </LoginCard>
      </LoginShell>
    );
  }

  // Error state
  return (
    <LoginShell>
      <LoginCard>
        <h1 className="mb-4 text-center font-serif text-[24px] font-normal leading-tight text-text">{ERROR_HEADING}</h1>
        <p className="mb-5 text-center font-mulish text-[12px] leading-snug text-text">{errorMessage}</p>
        <AppButton type="button" onClick={handleTryAnotherEmail} className="mx-auto" size="sm" variant="ghost">
          {ERROR_TRY_ANOTHER_TEXT}
        </AppButton>
      </LoginCard>
    </LoginShell>
  );
}
