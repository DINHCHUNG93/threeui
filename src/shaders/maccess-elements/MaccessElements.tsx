import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

import "./maccess-elements.css";

const bento13 = new URL("./assets/bento-13.svg", import.meta.url).href;
const bentoQr = new URL("./assets/bento-11-qr.svg", import.meta.url).href;
const bento14 = new URL("./assets/bento-14-control.svg", import.meta.url).href;
const testimonialIllustration = new URL("./assets/testimonials-illustration.svg", import.meta.url).href;
const testimonialKeyboard = new URL("./assets/testimonials-keyboard.svg", import.meta.url).href;
const testimonialDots = new URL("./assets/testimonials-dots.svg", import.meta.url).href;

export type SectionCompositionProps = {
  className?: string;
  style?: CSSProperties;
};

function classNames(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

function GlassPill({ children }: { children: ReactNode }) {
  return (
    <span className="maccess-label">
      <span className="maccess-label__title">{children}</span>
      <span className="maccess-label__circle" aria-hidden="true" />
    </span>
  );
}

function MaccessButton({ children = "Sign up", className = "", type = "button" }: { children?: ReactNode; className?: string; type?: "button" | "submit" }) {
  return (
    <button className={`maccess-button ${className}`.trim()} type={type}>
      <span className="maccess-button__title">{children}</span>
      <span className="maccess-button__circle" aria-hidden="true" />
    </button>
  );
}

export function MaccessGlassButton({ className, style }: SectionCompositionProps) {
  return (
    <div className={classNames("maccess-element maccess-element--glass-button", className)} style={style}>
      <MaccessButton />
    </div>
  );
}

const orbitIcons = [
  <path key="phone" d="M14.25 2A3.75 3.75 0 0 1 18 5.75v12.5A3.75 3.75 0 0 1 14.25 22h-4.5A3.75 3.75 0 0 1 6 18.25V5.75A3.75 3.75 0 0 1 9.75 2h4.5zm0 1.5h-4.5A2.25 2.25 0 0 0 7.5 5.75v12.5a2.25 2.25 0 0 0 2.25 2.25h4.5a2.25 2.25 0 0 0 2.25-2.25V5.75a2.25 2.25 0 0 0-2.25-2.25zM13.5 17.5a.75.75 0 1 1 0 1.5h-3a.75.75 0 1 1 0-1.5h3z" />,
  <path key="laptop" d="M16.25 3.5A3.75 3.75 0 0 1 20 7.25v6.5a3.75 3.75 0 0 1-3.75 3.75h-8.5A3.75 3.75 0 0 1 4 13.75v-6.5A3.75 3.75 0 0 1 7.75 3.5h8.5zm0 1.5h-8.5A2.25 2.25 0 0 0 5.5 7.25v6.5a2.25 2.25 0 0 0 2.25 2.25h8.5a2.25 2.25 0 0 0 2.25-2.25v-6.5A2.25 2.25 0 0 0 16.25 5zm5 14.25a.75.75 0 1 1 0 1.5H2.75a.75.75 0 1 1 0-1.5h18.5z" />,
  <path key="wifi" d="M5.11 10.61a9.75 9.75 0 0 1 13.78 0l-1.06 1.06a8.25 8.25 0 0 0-11.66 0l-1.06-1.06zm2.47 2.47a6.25 6.25 0 0 1 8.84 0l-1.06 1.06a4.75 4.75 0 0 0-6.72 0l-1.06-1.06zM12 15.75a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 1 1 0-3.5z" />,
  <path key="lock" d="M12 2a5 5 0 0 1 5 5v2.75h-1.5V7A3.5 3.5 0 0 0 12 3.5 3.5 3.5 0 0 0 8.5 7v2.75H7V7a5 5 0 0 1 5-5zm4.25 7.25A3.75 3.75 0 0 1 20 13v4.25A3.75 3.75 0 0 1 16.25 21h-8.5A3.75 3.75 0 0 1 4 17.25V13a3.75 3.75 0 0 1 3.75-3.75h8.5zm0 1.5h-8.5A2.25 2.25 0 0 0 5.5 13v4.25a2.25 2.25 0 0 0 2.25 2.25h8.5a2.25 2.25 0 0 0 2.25-2.25V13a2.25 2.25 0 0 0-2.25-2.25zM12 13.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 1 1 0-3.5z" />,
  <path key="scan" d="M8.75 3a.75.75 0 0 1 0 1.5H7A2.5 2.5 0 0 0 4.5 7v1.75a.75.75 0 0 1-1.5 0V7A4 4 0 0 1 7 3h1.75zm6.5 0H17a4 4 0 0 1 4 4v1.75a.75.75 0 1 1-1.5 0V7A2.5 2.5 0 0 0 17 4.5h-1.75a.75.75 0 1 1 0-1.5zM3.75 14.5a.75.75 0 0 1 .75.75V17A2.5 2.5 0 0 0 7 19.5h1.75a.75.75 0 1 1 0 1.5H7a4 4 0 0 1-4-4v-1.75a.75.75 0 0 1 .75-.75zm16.5 0a.75.75 0 0 1 .75.75V17a4 4 0 0 1-4 4h-1.75a.75.75 0 1 1 0-1.5H17a2.5 2.5 0 0 0 2.5-2.5v-1.75a.75.75 0 0 1 .75-.75zM13 9.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2A1.5 1.5 0 0 1 9.5 13v-2A1.5 1.5 0 0 1 11 9.5h2z" />,
  <path key="check" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17zm2.42 5.525a.75.75 0 1 1 1.161.95l-4.5 5.5a.75.75 0 0 1-1.111.055l-2-2A.75.75 0 0 1 9.03 12.47l1.414 1.413 3.976-4.858z" />,
];

function PairingIllustration() {
  const angles = [-120, -60, 180, 0, 120, 60];
  return (
    <div className="maccess-pairing">
      <div className="maccess-pairing__stage">
        <div className="maccess-pairing__orbit">
          {orbitIcons.map((icon, index) => (
            <span
              className="maccess-pairing__social"
              key={angles[index]}
              style={{ "--angle": `${angles[index]}deg` } as CSSProperties}
            >
              <span className="maccess-pairing__social-inner">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
              </span>
            </span>
          ))}
        </div>
        <span className="maccess-pairing__plus">
          <span className="maccess-pairing__inner" />
          <span className="maccess-pairing__qr-ring" aria-hidden="true" />
          <img src={bentoQr} alt="" width="30" height="30" />
        </span>
      </div>
      <span className="maccess-pairing__circle maccess-pairing__circle--top" aria-hidden="true" />
      <span className="maccess-pairing__circle maccess-pairing__circle--bottom" aria-hidden="true" />
    </div>
  );
}

const workflowSteps = [
  {
    title: "Choose your setup",
    copy: "Start with the desktop and mobile tools you already use.",
    illustration: <img className="maccess-workflow__keyboard" src={bento13} alt="" width="524" height="336" />,
  },
  {
    title: "Link your devices",
    copy: "Use a secure code or scan to bring nearby screens together.",
    illustration: <PairingIllustration />,
  },
  {
    title: "Keep work in reach",
    copy: "Move between notes, files, controls, and shared views from anywhere.",
    illustration: <img className="maccess-workflow__control" src={bento14} alt="" width="414" height="390" />,
  },
];

export function WorkflowSection({ className, style }: SectionCompositionProps) {
  return (
    <section className={classNames("maccess-element maccess-element--workflow", className)} style={style} aria-labelledby="maccess-workflow-title">
      <header className="maccess-workflow__head">
        <GlassPill>Getting started</GlassPill>
        <h2 id="maccess-workflow-title">Build your connected<br />workspace</h2>
      </header>
      <div className="maccess-workflow__body">
        <div className="maccess-workflow__branches" aria-hidden="true"><i /><i /></div>
        <div className="maccess-workflow__list">
          {workflowSteps.map((step, index) => (
            <article className="maccess-workflow__card" key={step.title}>
              <div className="maccess-workflow__card-inner">
                <span className="maccess-workflow__number">{index + 1}</span>
                <div className={`maccess-workflow__preview maccess-workflow__preview--${index + 1}`} aria-hidden="true">
                  {step.illustration}
                </div>
                <div className="maccess-workflow__details">
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EditorialIntroSection({ className, style }: SectionCompositionProps) {
  return (
    <section className={classNames("maccess-element maccess-element--testimonial-intro", className)} style={style} aria-labelledby="maccess-testimonial-title">
      <div className="maccess-testimonial-intro__graphic" aria-hidden="true">
        <img className="maccess-testimonial-intro__dots" src={testimonialDots} alt="" width="368" height="368" />
        <div className="maccess-testimonial-intro__device">
          <img src={testimonialIllustration} alt="" width="368" height="368" />
          <img className="maccess-testimonial-intro__keyboard" src={testimonialKeyboard} alt="" width="148" height="17" />
        </div>
      </div>
      <div className="maccess-testimonial-intro__copy">
        <GlassPill>Made for momentum</GlassPill>
        <h2 id="maccess-testimonial-title">Ideas, in motion.</h2>
        <p>A focused interface keeps every action clear and every handoff moving.</p>
      </div>
    </section>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 9.55v4.9c0 1.56 0 2.34-.3 2.94a2.75 2.75 0 0 1-1.21 1.21c-.6.3-1.38.3-2.94.3h-8.1c-1.56 0-2.34 0-2.94-.3a2.75 2.75 0 0 1-1.21-1.21c-.3-.6-.3-1.38-.3-2.94v-4.9c0-1.56 0-2.34.3-2.94A2.75 2.75 0 0 1 5.01 5.4c.6-.3 1.38-.3 2.94-.3h8.1c1.56 0 2.34 0 2.94.3a2.75 2.75 0 0 1 1.21 1.21c.3.6.3 1.38.3 2.94Z" />
      <path d="m3.55 6 6.61 5.14a3 3 0 0 0 3.68 0L20.45 6" fill="none" />
    </svg>
  );
}

export function NewsletterFooterSection({ className, style }: SectionCompositionProps) {
  const [subscribed, setSubscribed] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscribed(true);
  };

  return (
    <footer className={classNames("maccess-element maccess-element--newsletter-footer", className)} style={style}>
      <div className="maccess-newsletter-footer__row">
        <div className="maccess-newsletter-footer__brand">
          <span className="maccess-newsletter-footer__mark" aria-label="Section marker"><span>01</span></span>
          <p>A monthly edit of thoughtful interfaces,<br />practical patterns, and new experiments.</p>
        </div>
        <form className={`maccess-newsletter-footer__form${subscribed ? " is-success" : ""}`} aria-label="Join the monthly design notes" onSubmit={submit}>
          <EnvelopeIcon />
          <input aria-label="Email address" type="email" placeholder="Email for monthly notes" required />
          <MaccessButton className="maccess-newsletter-footer__button" type="submit">{subscribed ? "You're subscribed" : "Join the list"}</MaccessButton>
          <span className="maccess-newsletter-footer__ring" aria-hidden="true" />
        </form>
      </div>
      <div className="maccess-newsletter-footer__wordmark" aria-label="Stay curious">STAY CURIOUS</div>
      <div className="maccess-newsletter-footer__legal">
        <span>© 2026. Built for thoughtful work.</span>
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="#contact">Contact</a>
      </div>
    </footer>
  );
}
