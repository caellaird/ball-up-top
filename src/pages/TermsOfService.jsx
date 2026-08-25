import React from "react";
import LegalLayout from "@/components/LegalLayout";

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" updated="August 25, 2026">
      <p>
        Welcome to Ball Up Top. By creating an account or using the Ball Up Top mobile application (the "Service"),
        you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>You must be at least 13 years old to use the Service. By using it, you represent that you meet this requirement and are legally able to enter into these Terms.</p>

      <h2>2. Your Account</h2>
      <ul>
        <li>You are responsible for keeping your account and password secure and for all activity under your account.</li>
        <li>Provide accurate information and keep it updated.</li>
        <li>One account per person. Do not share your account or impersonate anyone.</li>
        <li>You can delete your account anytime in Settings; deletion is permanent.</li>
      </ul>

      <h2>3. Your Content</h2>
      <p>"Content" means anything you post, upload, or send — posts, comments, messages, photos, scores, and profile information.</p>
      <ul>
        <li>You retain ownership of your Content. You grant Ball Up Top a worldwide, non-exclusive, royalty-free license to host, store, display, and use your Content to operate the Service.</li>
        <li>You are responsible for your Content and for ensuring you have the rights to share it.</li>
        <li>Photos and media must not contain content that is unlawful, infringing, or violates others' privacy.</li>
      </ul>

      <h2>4. Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Harass, bully, threaten, or intimidate others, or post hate speech.</li>
        <li>Post unlawful, misleading, fraudulent, or sexually explicit content.</li>
        <li>Impersonate another person or misrepresent your affiliation.</li>
        <li>Spam others or send unsolicited messages.</li>
        <li>Attempt to manipulate scores, stats, or challenges in bad faith.</li>
        <li>Interfere with the Service, reverse-engineer it, or access it through automated means.</li>
      </ul>
      <p>We may remove content or restrict accounts that violate these rules.</p>

      <h2>5. Challenges &amp; Scores</h2>
      <p>Challenges, scores, and statistics are recorded as entered by participants. Enter results accurately and in good faith. Disputes between players should be resolved between yourselves; we do not adjudicate game outcomes.</p>

      <h2>6. Messaging</h2>
      <p>Direct and group messages are visible to thread participants. Do not use messaging to spam, harass, or send unlawful content. You can block or report users who misuse the Service.</p>

      <h2>7. Privacy</h2>
      <p>Our handling of your data is described in our Privacy Policy, which is incorporated here by reference.</p>

      <h2>8. Termination</h2>
      <p>You may delete your account at any time. We may suspend or terminate your access if you violate these Terms or for any other reason at our discretion.</p>

      <h2>9. Disclaimers</h2>
      <p>The Service is provided "as is" and "as available" without warranties of any kind. We do not guarantee the Service will be uninterrupted, error-free, or secure, or that scores or data will always be accurate.</p>

      <h2>10. Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, Ball Up Top is not liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>

      <h2>11. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. The "Last updated" date above reflects the latest version. Continued use after changes means you accept the updated Terms.</p>

      <h2>12. Contact</h2>
      <p>Questions about these Terms? Contact us at support@ballup.top (replace with your official support email).</p>
    </LegalLayout>
  );
}