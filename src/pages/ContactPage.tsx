import { FormEvent, useState } from 'react';
import { PERSONAL_INFO } from '../data/portfolio';
import { useLocalTime } from '../hooks/useLocalTime';
import { Footer } from '../components/Footer';
import { soundEngine } from '../utils/sound';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export function ContactPage({ onNavigate }: ContactPageProps) {
  const localTime = useLocalTime();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    details: '',
  });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const buildMailtoUrl = () => {
    const subject = encodeURIComponent(
      `Portfolio Inquiry from ${formData.name || 'Visitor'}${formData.company ? ` (${formData.company})` : ''}`
    );
    const body = encodeURIComponent(
      `Name: ${formData.name || 'N/A'}\n` +
      `Company: ${formData.company || 'N/A'}\n` +
      `Email: ${formData.email || 'N/A'}\n` +
      `Phone: ${formData.phone || 'N/A'}\n\n` +
      `Message / Project Details:\n${formData.details || 'Hi Akshit, I would like to connect with you regarding an opportunity.'}`
    );
    return `mailto:${PERSONAL_INFO.email}?subject=${subject}&body=${body}`;
  };

  const buildWhatsAppUrl = () => {
    const lines = [
      `Hi Akshit! I'm reaching out from your portfolio.`,
      ``,
      `*Name:* ${formData.name || 'Not provided'}`,
      formData.company ? `*Company:* ${formData.company}` : null,
      formData.email ? `*Email:* ${formData.email}` : null,
      formData.phone ? `*Phone:* ${formData.phone}` : null,
      ``,
      `*Message / Project Details:*`,
      formData.details || 'Would love to connect!',
    ].filter((line): line is string => line !== null);

    return `https://wa.me/${PERSONAL_INFO.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();

    if (!formData.name.trim() || !formData.email.trim() || !formData.details.trim()) {
      setSubmitState('error');
      setStatusMessage('Please fill in your Name, Email, and Project Details before sending.');
      return;
    }

    setSubmitState('sending');
    setStatusMessage('');

    try {
      const payload = new URLSearchParams();
      payload.append('name', formData.name);
      payload.append('company', formData.company || 'Not specified');
      payload.append('email', formData.email);
      payload.append('phone', formData.phone || 'Not specified');
      payload.append('message', formData.details);
      payload.append(
        '_subject',
        `Portfolio Inquiry from ${formData.name}${formData.company ? ` (${formData.company})` : ''}`
      );
      payload.append('_template', 'table');
      payload.append('_captcha', 'false');

      const response = await fetch(`https://formsubmit.co/ajax/${PERSONAL_INFO.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: payload.toString(),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && (result.success === 'true' || result.success === true)) {
        setSubmitState('sent');
        setStatusMessage(`✓ Message successfully delivered to ${PERSONAL_INFO.email}! I'll get back to you shortly.`);
        setFormData({ name: '', company: '', email: '', phone: '', details: '' });
      } else {
        throw new Error(result.message || 'Relay returned non-success');
      }
    } catch {
      // Automatic fail-safe: if blocked by ad-blocker or network, open email app with pre-filled message
      setSubmitState('sent');
      setStatusMessage(
        `Opening your email client to send directly to ${PERSONAL_INFO.email}... You can also send via WhatsApp below.`
      );
      window.location.href = buildMailtoUrl();
    }
  };

  const handleWhatsAppSend = () => {
    soundEngine.playClick();
    if (!formData.name.trim() || !formData.details.trim()) {
      setSubmitState('error');
      setStatusMessage('Please enter your name and message before sending via WhatsApp.');
      return;
    }
    window.open(buildWhatsAppUrl(), '_blank', 'noopener,noreferrer');
    setSubmitState('sent');
    setStatusMessage('Opened WhatsApp with your message pre-filled — just hit Send!');
  };

  const handleOpenMailClient = () => {
    soundEngine.playClick();
    window.location.href = buildMailtoUrl();
    setSubmitState('sent');
    setStatusMessage(`Opened your email app with your message pre-filled to ${PERSONAL_INFO.email}!`);
  };

  return (
    <main className="contact-page">
      <section className="contact-main">
        <h1 className="contact-heading">
          Fill this out and I&apos;ll get back to you as soon as I can.
          <br />
          Open to any and all opportunities.
        </h1>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form__row">
            <input
              type="text"
              name="name"
              required
              className="contact-input"
              placeholder="First & Last Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="text"
              name="company"
              className="contact-input"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
            />
          </div>

          <div className="contact-form__row">
            <input
              type="email"
              name="email"
              required
              className="contact-input"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              type="tel"
              name="phone"
              className="contact-input"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <textarea
            name="message"
            required
            className="contact-textarea"
            placeholder="Project details..."
            value={formData.details}
            onChange={(e) => setFormData((prev) => ({ ...prev, details: e.target.value }))}
          />

          <div className="contact-actions">
            <button
              type="submit"
              className="contact-submit"
              disabled={submitState === 'sending'}
              onMouseEnter={() => soundEngine.playHover()}
            >
              {submitState === 'sending' ? 'SENDING...' : 'SEND VIA EMAIL'}
            </button>

            <button
              type="button"
              className="contact-submit contact-submit--secondary"
              onClick={handleWhatsAppSend}
              onMouseEnter={() => soundEngine.playHover()}
            >
              SEND ON WHATSAPP ↗
            </button>

            <button
              type="button"
              className="contact-submit contact-submit--secondary"
              onClick={handleOpenMailClient}
              onMouseEnter={() => soundEngine.playHover()}
              title="Open your email client directly"
            >
              OPEN IN MAIL APP ↗
            </button>
          </div>

          {statusMessage && (
            <p
              className={`contact-feedback ${submitState === 'error' ? 'contact-feedback--error' : ''}`}
              role="status"
            >
              {statusMessage}
            </p>
          )}
        </form>

        <div className="contact-meta-grid">
          <div className="contact-meta-block">
            <a
              href={PERSONAL_INFO.emailHref}
              className="contact-meta-block__primary"
              onMouseEnter={() => soundEngine.playHover()}
            >
              {PERSONAL_INFO.email}
            </a>
            <a
              href={PERSONAL_INFO.phoneHref}
              className="contact-meta-block__primary"
              onMouseEnter={() => soundEngine.playHover()}
            >
              {PERSONAL_INFO.phone}
            </a>
          </div>

          <div className="contact-meta-block">
            <span className="contact-meta-block__primary">Location</span>
            <span className="contact-meta-block__secondary">{PERSONAL_INFO.locationShort}</span>
          </div>

          <div className="contact-meta-block">
            <span className="contact-meta-block__primary">Local Time</span>
            <span className="contact-meta-block__secondary">{localTime}</span>
          </div>

          <div className="contact-meta-block">
            <span className="contact-meta-block__primary">Current Status</span>
            <span className="contact-meta-block__secondary">
              <span className="status-dot" />
              {PERSONAL_INFO.status}
            </span>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </main>
  );
}
