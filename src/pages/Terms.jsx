import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'About the Site',
    items: [
      'Portions of the Services are viewable without registering, but to book appointments, order medicines, or use member features, you must register and agree to our Privacy Policy.',
      'Content on BestechCare is provided to help you locate appropriate medical care. It does not create a doctor-patient relationship and does not constitute medical advice, diagnosis, or treatment.',
      'We make no guarantees regarding the qualifications, expertise, or quality of work of any healthcare provider listed on the platform. You use the Services at your own risk.',
    ],
  },
  {
    title: 'We Do Not Provide Medical Advice',
    items: [
      'Content obtained through BestechCare is for informational, scheduling, and payment purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.',
      'Do not disregard or delay seeking medical advice from a qualified healthcare provider because of something you read on our site.',
      'Do not use BestechCare for emergency medical needs. In a medical emergency, call 1122 or your nearest hospital immediately.',
      'We do not recommend or endorse any specific tests, healthcare providers, procedures, or opinions that may appear through the Services.',
    ],
  },
  {
    title: 'No Doctor-Patient Relationship',
    items: [
      'No licensed medical professional/patient relationship is created by using BestechCare, including through doctor listings, blog posts, emails, or assistance finding a healthcare provider.',
      'We cannot guarantee the availability of any healthcare provider at any particular time and are not liable for cancelled or unfulfilled appointments.',
      'You are advised to verify a provider\'s credentials with PMDC and confirm details directly with the provider\'s office before your appointment.',
    ],
  },
  {
    title: 'Registration & Your Account',
    items: [
      'You must provide accurate information when registering. Keep your login credentials private and notify us immediately at hello@bestechcare.pk if your account is compromised.',
      'You are responsible for all activity under your account, including use by others you have authorized.',
      'You may only use the Site for lawful, non-commercial purposes unless otherwise agreed in writing.',
    ],
  },
  {
    title: 'Appointments & Payments',
    items: [
      'Consultation fees, lab test charges, and medicine prices are set by providers and are your responsibility. BestechCare facilitates booking and payment but is not the healthcare provider.',
      'Payment processing via JazzCash, EasyPaisa, or other methods is subject to the terms of those payment providers.',
      'Disputes regarding medical services must be resolved directly with the healthcare provider.',
    ],
  },
  {
    title: 'Medicine Orders',
    items: [
      'Prescription medicines require a valid prescription. You are responsible for providing accurate delivery information.',
      'BestechCare and partner pharmacies reserve the right to refuse orders that do not meet legal or safety requirements.',
      'Medicine availability and pricing may change without notice.',
    ],
  },
  {
    title: 'Your Responsibilities',
    items: [
      'You may not use the Site in any manner that could damage, disable, or impair our servers or interfere with other users.',
      'You may not attempt unauthorized access to any part of the Services, user accounts, or systems.',
      'You may not scrape, index, or accumulate platform content (including provider listings and pricing) for commercial purposes without written consent.',
    ],
  },
  {
    title: 'Limitation of Liability',
    items: [
      'BestechCare is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from use of the Services.',
      'Our total liability shall not exceed the amount you paid to BestechCare in the twelve months preceding the claim.',
    ],
  },
  {
    title: 'Changes to Terms',
    items: [
      'We may update these Terms at any time. Continued use of the Services after changes constitutes acceptance of the updated Terms.',
      'Last updated: June 12, 2026.',
    ],
  },
];

export default function Terms() {
  return (
    <div className="page">
      <div className="container content-page">
        <div className="page-header">
          <h1>Terms & Conditions</h1>
          <p className="text-muted">
            Please read these terms carefully before using BestechCare.
          </p>
        </div>

        <div className="legal-notice">
          <p>
            By accessing or using <strong>BestechCare</strong>, you agree to be bound by these
            Terms and Conditions. If you do not agree, please do not use our Services.
          </p>
        </div>

        {sections.map((section) => (
          <section key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item.slice(0, 40)}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="legal-section contact-box">
          <h2>Contact</h2>
          <p>
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:hello@bestechcare.pk">hello@bestechcare.pk</a> or call{' '}
            <a href="tel:03114315611">0311-4315611</a>.
          </p>
          <p className="text-muted">375 Airline Housing Society, Lahore</p>
          <Link to="/about" className="btn btn-outline btn-sm">About BestechCare</Link>
        </section>
      </div>
    </div>
  );
}
