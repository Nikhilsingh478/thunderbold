/**
 * Shared policy content used by both the footer modal and the dedicated
 * Policies page. Update here to keep all policy surfaces in sync.
 */

export interface PolicySection {
  heading: string;
  text: string;
  list?: string[];
  highlight?: boolean;
}

export interface PolicyData {
  id: 'privacy' | 'terms' | 'returns';
  title: string;
  subtitle: string;
  sections: PolicySection[];
}

export const policyData: PolicyData[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your data',
    sections: [
      {
        heading: 'Information We Collect',
        text: 'When you shop with us, we collect information you provide directly — such as your name, email address, phone number, and delivery address. We also collect basic usage data to improve your experience. Session preferences may be stored locally on your device using browser storage (localStorage / sessionStorage) to enhance your browsing experience.',
      },
      {
        heading: 'Authentication & Account Security',
        text: 'Thunderbold uses Firebase Authentication — a secure, industry-standard service by Google — to manage your login and sessions. Your credentials are handled directly by Firebase and are never stored on our servers in plain text. All authentication sessions are encrypted and securely managed.',
      },
      {
        heading: 'How We Use Your Data',
        text: 'Your information is used solely to process orders, communicate order updates, and improve our services. We do not sell, trade, or rent your personal information to any third parties under any circumstances.',
      },
      {
        heading: 'Third-Party Infrastructure',
        text: 'To operate Thunderbold securely and reliably, we use trusted third-party infrastructure providers including Google Firebase (authentication), MongoDB Atlas (database), and Cloudinary (media delivery). These services process data strictly to support platform operations and are bound by their own privacy and security standards.',
      },
      {
        heading: 'Data Security',
        text: 'We take data security seriously. Your information is stored securely and transmitted over encrypted connections. We implement industry-standard practices to protect against unauthorized access.',
      },
      {
        heading: 'Your Rights & Account Deletion',
        text: 'You have the right to access, correct, or delete any personal data we hold. This includes the right to permanently delete your Thunderbold account and all associated data at any time — directly from the Profile section of the app. Deletion requests are processed immediately upon confirmation. For other data requests, we respond within 7 business days.',
      },
      {
        heading: 'Contact for Privacy Queries',
        text: 'For any privacy-related questions or requests, write to us at adminthunderbold@gmail.com and we\'ll respond promptly.',
        highlight: true,
      },
    ],
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    subtitle: 'Please read these terms carefully before placing an order',
    sections: [
      {
        heading: 'Acceptance of Terms',
        text: 'By accessing and placing an order through Thunderbold, you confirm that you are in agreement with and bound by these terms. If you do not agree, please refrain from using our services.',
      },
      {
        heading: 'Product Accuracy',
        text: 'We make every effort to display product colours, sizes, and descriptions as accurately as possible. Minor variations in colour due to screen settings are not grounds for return unless the product is materially different from its listing.',
      },
      {
        heading: 'Pricing',
        text: 'All prices listed are in Indian Rupees (₹) and are inclusive of applicable taxes. We reserve the right to modify pricing at any time without prior notice. Prices at the time of order confirmation are final.',
      },
      {
        heading: 'Order Processing & Refunds',
        text: 'Every order goes through a manual confirmation step before processing. Refunds, where applicable, are processed within 5–7 business days of approval. A nominal ₹50 handling fee applies to accepted returns or post-confirmation cancellations, deducted from the refund amount. Refunds are issued to the original payment method or as agreed store credit.',
      },
      {
        heading: 'Governing Law',
        text: 'These terms are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of courts in New Delhi.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Cancellation',
    subtitle: 'Our commitment to a fair and transparent process',
    sections: [
      {
        heading: 'Order Confirmation',
        text: 'Every order placed on Thunderbold goes through a manual verification step. Our team will reach out to you via a confirmation call before your order is processed. This gives you one final opportunity to review or amend your order.',
      },
      {
        heading: 'Cancellation Before Confirmation',
        text: 'You may cancel your order at any time before you receive the confirmation call from our team. Once the order has been confirmed and moved to processing or shipping, cancellations are no longer accepted.',
      },
      {
        heading: 'Returns After Delivery',
        text: 'If you\'ve received your order and have a valid concern — such as a manufacturing defect, incorrect item, or significant sizing discrepancy — you may raise a return request within 24 hours of delivery.',
        list: ['Manufacturing defects', 'Wrong item delivered', 'Significant difference from product listing'],
      },
      {
        heading: 'Refund Processing',
        text: 'Once your return is approved, refunds are processed within 5–7 business days. A nominal ₹50 processing fee applies to all accepted returns or post-confirmation cancellations, covering handling and restocking costs, deducted from the refund amount.',
      },
      {
        heading: 'How to Raise a Request',
        text: 'Contact us at adminthunderbold@gmail.com or call +91 95611 72681. Please have your order ID ready when reaching out.',
        highlight: true,
      },
    ],
  },
];
