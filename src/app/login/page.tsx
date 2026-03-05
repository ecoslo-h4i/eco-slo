"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const LOGIN_STATE = {
  INPUT: "input",
  CONFIRMATION: "confirmation",
  ERROR: "error",
} as const;

type LoginState = (typeof LOGIN_STATE)[keyof typeof LOGIN_STATE];

const HEADER_BG = "#6A7B4F";
const CARD_BG = "#FDFBF7";
const PAGE_BG = "#FFFFFF";
const INPUT_BG = "#F0E9DF";
const CONFIRM_BTN_BG = "#6A7B4F";
const CARD_OUTLINE = "#6A7B4F";

const FONT_SERIF = "var(--font-cardo), Constania, serif";
const FONT_SANS = "var(--font-avenir), system-ui, sans-serif";

const LOGIN_TITLE = "Log In";
const EMAIL_LABEL = "Email Address";
const PLACEHOLDER_EMAIL = "Input your registered email address...";
const CONFIRM_BUTTON_TEXT = "Confirm";
const BACK_TO_MAP_TEXT = "Back to Map";
const BACK_TO_MAP_ICON_SRC = "/icons/map.svg";
const BACK_TO_MAP_ICON_ALT = "Map";
const LOGO_SRC = "/icons/ecoslo-logo.png";
const LOGO_ALT = "Eco SLO - Environmental Center of San Luis Obispo";
const CONFIRMATION_HEADING = "Check Your Email";
const CONFIRMATION_MESSAGE_START = "A log-in link has been sent to";
const CONFIRMATION_MESSAGE_END = "Click the link to continue. It will expire in 24 hours.";
const RESEND_LINK_TEXT = "Resend Link";
const TRY_ANOTHER_EMAIL_TEXT = "Wrong email? Try another one.";
const RESEND_BTN_BG = "#A68B6E";
const TRY_ANOTHER_LINK_COLOR = "#8B7355";
const ERROR_HEADING = "Email Not Registered";
const ERROR_MESSAGE =
  "It looks like the email you entered is not registered as a user. If you are a new treekeeper or admin, please contact administration for a sign-up link.";
const ERROR_TRY_ANOTHER_TEXT = "Wrong email? Try another one.";

// make sure the email is valid
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export default function LoginPage() {
  const [loginState, setLoginState] = useState<LoginState>(LOGIN_STATE.INPUT);
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleConfirm = () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) return;
    setSubmittedEmail(trimmed);
    setLoginState(LOGIN_STATE.CONFIRMATION);
    // TODO: Send magic link via Supabase when auth is wired up
  };

  const handleTryAnotherEmail = () => {
    setEmail("");
    setSubmittedEmail("");
    setLoginState(LOGIN_STATE.INPUT);
  };

  const handleResendLink = () => {
    // TODO: Replace with actual resend logic when Supabase is wired up
    console.log("Resend link clicked for:", submittedEmail);
  };

  // TODO: Remove before final PR - temporary way to test Error state locally
  const handleShowErrorState = () => {
    setLoginState(LOGIN_STATE.ERROR);
  };

  if (loginState === LOGIN_STATE.INPUT) {
    return (
      <div className="flex min-h-screen min-w-full flex-col" style={{ backgroundColor: PAGE_BG, width: "100vw" }}>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div
            className="w-full max-w-xl rounded-xl border px-12 py-12 shadow-sm"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_OUTLINE }}
          >
            <h1
              className="mb-6 text-[44px] font-normal leading-tight text-[#415763]"
              style={{ fontFamily: FONT_SERIF }}
            >
              {LOGIN_TITLE}
            </h1>
            <label
              htmlFor="login-email"
              className="mb-2 block text-[16px] font-bold text-[#415763]"
              style={{ fontFamily: FONT_SANS }}
            >
              {EMAIL_LABEL}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={PLACEHOLDER_EMAIL}
              className="mb-6 w-full rounded-lg border-0 px-4 py-3 text-[16px] text-[#415763] placeholder:text-[13px] placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#758656]"
              style={{ backgroundColor: INPUT_BG, fontFamily: FONT_SANS }}
              aria-label="Email address"
            />
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!email.trim() || !isValidEmail(email.trim())}
              className="w-full rounded-lg px-4 py-3 text-[16px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: CONFIRM_BTN_BG, fontFamily: FONT_SANS }}
            >
              {CONFIRM_BUTTON_TEXT}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loginState === LOGIN_STATE.CONFIRMATION) {
    return (
      <div className="flex min-h-screen min-w-full flex-col" style={{ backgroundColor: PAGE_BG, width: "100vw" }}>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div
            className="w-full max-w-xl rounded-xl border px-12 py-12 shadow-sm"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_OUTLINE }}
          >
            <h1
              className="mb-4 text-center text-[44px] font-normal leading-tight text-[#415763]"
              style={{ fontFamily: FONT_SERIF }}
            >
              {CONFIRMATION_HEADING}
            </h1>
            <p className="mb-6 text-center text-[16px] leading-snug text-[#415763]" style={{ fontFamily: FONT_SANS }}>
              {CONFIRMATION_MESSAGE_START} <strong>{submittedEmail}</strong>. {CONFIRMATION_MESSAGE_END}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResendLink}
                className="w-full rounded-lg px-4 py-3 text-[16px] font-bold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: RESEND_BTN_BG, fontFamily: FONT_SANS }}
              >
                {RESEND_LINK_TEXT}
              </button>
              <button
                type="button"
                onClick={handleTryAnotherEmail}
                className="text-left text-[14px] underline hover:opacity-80"
                style={{ fontFamily: FONT_SANS, color: TRY_ANOTHER_LINK_COLOR }}
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
    <div className="flex min-h-screen min-w-full flex-col" style={{ backgroundColor: PAGE_BG, width: "100vw" }}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-xl rounded-xl border px-12 py-12 shadow-sm"
          style={{ backgroundColor: CARD_BG, borderColor: CARD_OUTLINE }}
        >
          <h1 className="mb-4 text-[44px] font-normal leading-tight text-black" style={{ fontFamily: FONT_SERIF }}>
            {ERROR_HEADING}
          </h1>
          <p className="mb-6 text-[15px] leading-snug text-black" style={{ fontFamily: FONT_SANS }}>
            {ERROR_MESSAGE}
          </p>
          <button
            type="button"
            onClick={handleTryAnotherEmail}
            className="text-left text-[14px] underline hover:opacity-80"
            style={{ fontFamily: FONT_SANS, color: TRY_ANOTHER_LINK_COLOR }}
          >
            {ERROR_TRY_ANOTHER_TEXT}
          </button>
        </div>
      </div>
    </div>
  );
}
