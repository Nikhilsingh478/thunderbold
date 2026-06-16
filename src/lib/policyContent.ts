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
        heading: 'Order Confirmation Process',
        text: 'Every order goes through a manual confirmation step before processing. After placing your order, our team will call you to confirm the details. You may cancel at any time before receiving the confirmation call. Once confirmed, the order moves to fulfilment and cannot be cancelled.',
      },
      {
        heading: 'Refund Policy',
        text: 'Refunds for approved returns are processed within 5–7 business days. A ₹50 shipping deduction applies to all approved refunds to cover delivery handling costs. Refunds are issued to the original payment method or as agreed with the customer.',
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
        heading: 'How Every Order Works',
        text: 'After you place an order, our team will call you on the phone number provided to confirm the details. This call is mandatory before any order is processed or shipped. Please keep your phone reachable after placing an order.',
      },
      {
        heading: 'Cancellation — Before Confirmation',
        text: 'You may cancel your order at any time while it is in "Pending" status — before you receive the confirmation call from our team. Simply go to My Orders in the app and tap Cancel. No questions asked.',
        highlight: true,
      },
      {
        heading: 'Cancellation — After Confirmation',
        text: 'Once our team has confirmed your order and the status changes to "Confirmed" or beyond (Shipped, Out for Delivery), cancellation is no longer possible through the app. Please contact us immediately on +91 95611 72681 for urgent cases — we will try to help within our operational limits.',
      },
      {
        heading: 'Delivery Attempts',
        text: 'Our delivery partner makes up to 3 attempts to deliver your order. If delivery fails on all 3 attempts due to unavailability at the address, the package is returned to us. In this case, any loss (return shipping, restocking) is borne by us — you will not be charged. However, please ensure someone is available to receive the order.',
      },
      {
        heading: 'Return Eligibility — After Delivery',
        text: 'Once you receive your order and make the payment, you may raise a return request if:',
        list: [
          'The product has a manufacturing defect',
          'The wrong item was delivered',
          'There is a significant size discrepancy (e.g. received 32 instead of 30)',
          'The product is materially different from its description or images',
        ],
      },
      {
        heading: 'How to Request a Return',
        text: 'Go to My Orders → find the delivered order → tap "Request Return". Select the reason and describe the issue clearly. Our team will review your request and contact you within 2–3 business days. You can track the status of your request directly in the app.',
        highlight: true,
      },
      {
        heading: 'Refund Calculation',
        text: 'Approved refunds are calculated as: Order Total − ₹50 shipping charges. The ₹50 deduction covers the cost of reverse logistics. Example: if your order was ₹1,299, your refund will be ₹1,249. Refunds are processed within 5–7 business days after approval.',
      },
      {
        heading: 'What Is NOT Covered',
        text: 'Returns are not accepted for: change of mind, incorrect size ordered by the customer (size chart is provided), minor colour variations due to screen calibration, or items that have been used, washed, or damaged after delivery.',
      },
    ],
  },
];
