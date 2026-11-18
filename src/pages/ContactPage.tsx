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
    setSubmitState('sending');
    setStatusMessage('');

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${PERSONAL_INFO.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company || 'Not specified',
          email: formData.email,
          phone: formData.phone || 'Not specified',
          message: formData.details,
          _subject: `Portfolio Inquiry from ${formData.name}${formData.company ? ` (${formData.company})` : ''}`,
          _template: 'table',
          _captcha: 'false',
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && (result.success === 'true' || result.success === true)) {
        setSubmitState('sent');
        setStatusMessage(`Message delivered to ${PERSONAL_INFO.email}! I'll get back to you soon.`);
        setFormData({ name: '', company: '', email: '', phone: '', details: '' });
      } else {
        throw new Error(result.message || 'Email relay requires activation or is unavailable');
      }
    } catch {
      // Seamless fallback: let visitor finish sending immediately via WhatsApp or Email client
      setSubmitState('error');
      setStatusMessage(
        'Could not send automatically right now — tap "Send on WhatsApp" below for instant delivery, or email me directly.'
      );
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
              className="contact-submit contact-submit--whatsapp"
              onClick={handleWhatsAppSend}
              onMouseEnter={() => soundEngine.playHover()}
            >
              SEND ON WHATSAPP ↗
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
