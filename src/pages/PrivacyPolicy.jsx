import React from "react";
import LegalLayout from "@/components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="August 25, 2026">
      <p>
        Ball Up Top ("we," "us," or "our") operates the Ball Up Top mobile application (the "Service").
        This Privacy Policy explains what information we collect, how we use it, and the choices you have.
        By creating an account or using the Service, you agree to the practices described here.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li><strong>Account information:</strong> Your email address, full name, username, nickname, and a password (stored as a salted hash).</li>
        <li><strong>Profile information:</strong> Bio, avatar and banner images, city, favorite team, favorite sport, playing position, and self-rated skill level.</li>
        <li><strong>Sign-in providers:</strong> If you use "Sign in with Apple" or Google, we receive the name and email Apple or Google shares with us.</li>
        <li><strong>User content:</strong> Posts, comments, direct and group messages, challenges, game scores, photos and media you upload, awards, and game statistics.</li>
        <li><strong>Connections:</strong> Friends and challenge participants you interact with, and your messages with them.</li>
        <li><strong>Usage and device information:</strong> Approximate device type, and interaction data such as which screens you open.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To create and maintain your account and profile.</li>
        <li>To display your content to other users according to your privacy settings.</li>
        <li>To operate challenges, record scores, and calculate leaderboards and statistics.</li>
        <li>To deliver direct messages and in-app notifications about activity.</li>
        <li>To communicate with you about your account, safety, and policy matters.</li>
        <li>To enforce our Terms, moderate content, and protect the Service from abuse.</li>
      </ul>

      <h2>How We Share Your Information</h2>
      <ul>
        <li><strong>With other users:</strong> Your username, profile, posts, comments, scores, and activity are visible to others based on your privacy level (public, friends, or private). Direct messages are visible only to thread participants.</li>
        <li><strong>Service providers:</strong> We use Base44 for hosting, authentication, and data storage. These providers process data on our behalf to operate the Service.</li>
        <li><strong>Legal compliance:</strong> We may disclose information when required by law or to protect rights, safety, or property.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Data Retention and Deletion</h2>
      <p>
        We keep your data for as long as your account is active. You can permanently delete your account and
        all associated data at any time in Settings → Delete Account. This removes your posts, comments,
        messages, profile, challenges, and statistics. Some anonymized aggregate data may be retained.
      </p>

      <h2>Your Privacy Choices</h2>
      <ul>
        <li><strong>Access &amp; update:</strong> View and edit your profile and settings anytime.</li>
        <li><strong>Visibility:</strong> Switch your profile to private to limit who can see it.</li>
        <li><strong>Delete:</strong> Remove your account and data as described above.</li>
      </ul>

      <h2>Children</h2>
      <p>The Service is not directed to children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us data, contact us and we will delete it.</p>

      <h2>Security</h2>
      <p>We use reasonable technical and organizational measures to protect your data, but no system is perfectly secure.</p>

      <h2>Third-Party Services</h2>
      <p>Sign in with Apple and Google are governed by their respective privacy policies. We only receive the data those providers choose to share with us.</p>

      <h2>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will reflect the "Last updated" date above. Continued use after changes means you accept the updated policy.</p>

      <h2>Contact</h2>
      <p>Questions about this policy? Contact us at support@ballup.top (replace with your official support email).</p>
    </LegalLayout>
  );
}