import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

// Enhanced email templates with Greek language support
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface NotificationData {
  recipientEmail: string;
  recipientName: string;
  language?: 'en' | 'el';
  [key: string]: any;
}

// Create email transporter with enhanced configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number.parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Enhanced base email template with Greek support
const createEmailTemplate = (
  title: string,
  content: string,
  language: 'en' | 'el' = 'en',
  actionUrl?: string,
  actionText?: string
): string => {
  const translations = {
    en: {
      welcome: 'Your Trusted Rental Platform',
      help: 'Help Center',
      contact: 'Contact Us',
      unsubscribe: 'Unsubscribe',
      footer: '© 2024 Meet2Rent. All rights reserved.',
      poweredBy: 'Powered by Meet2Rent'
    },
    el: {
      welcome: 'Η Αξιόπιστη Πλατφόρμα Ενοικίασης',
      help: 'Κέντρο Βοήθειας',
      contact: 'Επικοινωνία',
      unsubscribe: 'Διαγραφή Συνδρομής',
      footer: '© 2024 Meet2Rent. Όλα τα δικαιώματα διατηρούνται.',
      poweredBy: 'Με την υποστήριξη του Meet2Rent'
    }
  };

  const t = translations[language];

  return `
    <!DOCTYPE html>
    <html lang="${language}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            color: #1f2937;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }

          .container {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }

          .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }

          .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }

          .tagline {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }

          .content {
            padding: 40px 30px;
          }

          .content h1 {
            color: #1f2937;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 20px 0;
            line-height: 1.3;
          }

          .content p {
            margin: 16px 0;
            color: #4b5563;
            font-size: 16px;
          }

          .button {
            display: inline-block;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }

          .button:hover {
            background: linear-gradient(135deg, #1d4ed8, #2563eb);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }

          .highlight {
            background: linear-gradient(135deg, #dbeafe, #eff6ff);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            margin: 24px 0;
          }

          .highlight h3 {
            color: #1e40af;
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
          }

          .property-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 16px 0;
          }

          .amount {
            font-size: 32px;
            font-weight: 700;
            color: #059669;
            margin: 8px 0;
          }

          .footer {
            background: #f1f5f9;
            padding: 30px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }

          .footer a {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 8px;
          }

          .footer a:hover {
            text-decoration: underline;
          }

          .divider {
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
          }

          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-success {
            background: #d1fae5;
            color: #065f46;
          }

          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }

          .social-links {
            margin: 20px 0;
          }

          .social-links a {
            display: inline-block;
            margin: 0 8px;
            padding: 8px;
            border-radius: 8px;
            background: #e2e8f0;
            color: #64748b;
            text-decoration: none;
          }

          @media (max-width: 600px) {
            body {
              padding: 10px;
            }

            .header, .content, .footer {
              padding: 24px 20px;
            }

            .content h1 {
              font-size: 20px;
            }

            .amount {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Meet2Rent</div>
            <div class="tagline">${t.welcome}</div>
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${content}
            ${actionUrl && actionText ? `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${actionUrl}" class="button">${actionText}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <div style="margin-bottom: 16px;">
              <strong>Meet2Rent</strong> - ${t.poweredBy}
            </div>
            <div>${t.footer}</div>
            <div style="margin-top: 16px;">
              <a href="${process.env.NEXTAUTH_URL}/help">${t.help}</a> |
              <a href="${process.env.NEXTAUTH_URL}/contact">${t.contact}</a> |
              <a href="${process.env.NEXTAUTH_URL}/unsubscribe">${t.unsubscribe}</a>
            </div>
            <div class="social-links">
              <a href="https://facebook.com/meet2rent">Facebook</a>
              <a href="https://instagram.com/meet2rent">Instagram</a>
              <a href="https://linkedin.com/company/meet2rent">LinkedIn</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Enhanced notification templates with Greek language support
export const emailTemplates = {
  // Enhanced booking notifications
  bookingRequest: (data: NotificationData & {
    propertyTitle: string;
    requestedDate: string;
    tenantName: string;
    tenantMessage?: string;
    propertyImage?: string;
    viewingTime?: string;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek
      ? `Νέο Αίτημα Προβολής για ${data.propertyTitle}`
      : `New Viewing Request for ${data.propertyTitle}`;

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>
      <p>${isGreek
        ? 'Έχετε λάβει νέο αίτημα προβολής για το ακίνητό σας:'
        : 'You have received a new viewing request for your property:'
      }</p>

      <div class="property-card">
        <h3>${data.propertyTitle}</h3>
        <p><strong>${isGreek ? 'Αιτούντα:' : 'Requested by:'}</strong> ${data.tenantName}</p>
        <p><strong>${isGreek ? 'Ημερομηνία:' : 'Date:'}</strong> ${data.requestedDate}</p>
        ${data.viewingTime ? `<p><strong>${isGreek ? 'Ώρα:' : 'Time:'}</strong> ${data.viewingTime}</p>` : ''}
      </div>

      ${data.tenantMessage ? `
        <div class="highlight">
          <h3>${isGreek ? 'Μήνυμα από τον ενοικιαστή:' : 'Message from tenant:'}</h3>
          <p style="font-style: italic;">"${data.tenantMessage}"</p>
        </div>
      ` : ''}

      <p>${isGreek
        ? 'Παρακαλώ ελέγξτε το αίτημα και απαντήστε το συντομότερο δυνατό.'
        : 'Please review the request and respond as soon as possible.'
      }</p>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Νέο Αίτημα Προβολής' : 'New Viewing Request',
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/dashboard/landlord/bookings`,
        isGreek ? 'Διαχείριση Αιτημάτων' : 'Manage Requests'
      ),
      text: `${subject}. ${isGreek ? 'Αίτημα από' : 'Request from'} ${data.tenantName} ${isGreek ? 'για' : 'for'} ${data.requestedDate}`
    };
  },

  // Enhanced payment notifications
  paymentReceived: (data: NotificationData & {
    amount: number;
    paymentType: string;
    propertyTitle: string;
    paymentId: string;
    receiptUrl?: string;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek
      ? `Πληρωμή Εγκρίθηκε - €${data.amount}`
      : `Payment Confirmed - €${data.amount}`;

    const paymentTypeLabels = {
      en: {
        security_deposit: 'Security Deposit',
        monthly_rent: 'Monthly Rent',
        platform_fee: 'Platform Fee',
        late_fee: 'Late Fee'
      },
      el: {
        security_deposit: 'Εγγύηση',
        monthly_rent: 'Μηνιαίο Ενοίκιο',
        platform_fee: 'Προμήθεια Πλατφόρμας',
        late_fee: 'Πρόστιμο Καθυστέρησης'
      }
    };

    const typeLabel = paymentTypeLabels[data.language || 'en'][data.paymentType as keyof typeof paymentTypeLabels.en] || data.paymentType;

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>
      <p>${isGreek
        ? 'Έχουμε λάβει με επιτυχία την πληρωμή σας.'
        : 'We have successfully received your payment.'
      }</p>

      <div class="highlight">
        <div class="amount">€${data.amount}</div>
        <p><strong>${isGreek ? 'Τύπος Πληρωμής:' : 'Payment Type:'}</strong> ${typeLabel}</p>
        <p><strong>${isGreek ? 'Ακίνητο:' : 'Property:'}</strong> ${data.propertyTitle}</p>
        <p><strong>${isGreek ? 'Κωδικός Πληρωμής:' : 'Payment ID:'}</strong> <code>${data.paymentId}</code></p>
        <span class="status-badge status-success">${isGreek ? 'ΕΠΙΤΥΧΗΣ' : 'COMPLETED'}</span>
      </div>

      <p>${isGreek
        ? 'Η πληρωμή σας έχει επεξεργαστεί με ασφάλεια. Μπορείτε να κατεβάσετε την απόδειξή σας από τον πίνακα ελέγχου σας.'
        : 'Your payment has been processed securely. You can download your receipt from your dashboard.'
      }</p>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Πληρωμή Επιβεβαιώθηκε' : 'Payment Confirmed',
        content,
        data.language,
        data.receiptUrl || `${process.env.NEXTAUTH_URL}/dashboard/tenant/payments`,
        isGreek ? 'Προβολή Απόδειξης' : 'View Receipt'
      ),
      text: `${subject}. ${typeLabel} ${isGreek ? 'για' : 'for'} ${data.propertyTitle}`
    };
  },

  // Enhanced contract notifications
  contractReady: (data: NotificationData & {
    contractId: string;
    propertyTitle: string;
    moveInDate?: string;
    monthlyRent?: number;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek
      ? `Συμβόλαιο Έτοιμο για Υπογραφή - ${data.propertyTitle}`
      : `Contract Ready for Signature - ${data.propertyTitle}`;

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>
      <p>${isGreek
        ? 'Το συμβόλαιο ενοικίασής σας είναι έτοιμο για ψηφιακή υπογραφή.'
        : 'Your rental contract is ready for digital signature.'
      }</p>

      <div class="property-card">
        <h3>${data.propertyTitle}</h3>
        <p><strong>${isGreek ? 'Κωδικός Συμβολαίου:' : 'Contract ID:'}</strong> ${data.contractId}</p>
        ${data.monthlyRent ? `<p><strong>${isGreek ? 'Μηνιαίο Ενοίκιο:' : 'Monthly Rent:'}</strong> €${data.monthlyRent}</p>` : ''}
        ${data.moveInDate ? `<p><strong>${isGreek ? 'Ημερομηνία Εισόδου:' : 'Move-in Date:'}</strong> ${data.moveInDate}</p>` : ''}
      </div>

      <p>${isGreek
        ? 'Παρακαλώ ελέγξτε το συμβόλαιο προσεκτικά και υπογράψτε το ηλεκτρονικά. Το συμβόλαιο είναι νομικά δεσμευτικό αφού υπογράψουν και τα δύο μέρη.'
        : 'Please review the contract carefully and sign it electronically. The contract is legally binding once both parties have signed.'
      }</p>

      <div class="highlight">
        <h3>${isGreek ? '⚖️ Νομική Σημασία' : '⚖️ Legal Notice'}</h3>
        <p>${isGreek
          ? 'Οι ψηφιακές υπογραφές είναι νομικά δεσμευτικές σύμφωνα με το Ελληνικό και Ευρωπαϊκό δίκαιο.'
          : 'Digital signatures are legally binding under Greek and European law.'
        }</p>
      </div>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Συμβόλαιο Έτοιμο για Υπογραφή' : 'Contract Ready for Signature',
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/contracts/${data.contractId}`,
        isGreek ? 'Ελέγξτε & Υπογράψτε' : 'Review & Sign Contract'
      ),
      text: `${subject}. ${isGreek ? 'Κωδικός:' : 'ID:'} ${data.contractId}`
    };
  },

  // Enhanced application status notifications
  applicationAccepted: (data: NotificationData & {
    propertyTitle: string;
    landlordName: string;
    nextSteps: string;
    moveInDate?: string;
    monthlyRent?: number;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek
      ? `Αίτηση Εγκρίθηκε - Καλώς ήρθατε στο ${data.propertyTitle}! 🎉`
      : `Application Accepted - Welcome to ${data.propertyTitle}! 🎉`;

    const content = `
      <p>${isGreek ? `Συγχαρητήρια ${data.recipientName}` : `Congratulations ${data.recipientName}`}! 🎉</p>
      <p>${isGreek
        ? `Η αίτηση ενοικίασής σας έχει εγκριθεί από ${data.landlordName}.`
        : `Your rental application has been accepted by ${data.landlordName}.`
      }</p>

      <div class="property-card">
        <h3>🏠 ${data.propertyTitle}</h3>
        <span class="status-badge status-success">${isGreek ? 'ΕΓΚΡΙΘΗΚΕ' : 'APPROVED'} ✅</span>
        ${data.monthlyRent ? `<p><strong>${isGreek ? 'Μηνιαίο Ενοίκιο:' : 'Monthly Rent:'}</strong> €${data.monthlyRent}</p>` : ''}
        ${data.moveInDate ? `<p><strong>${isGreek ? 'Ημερομηνία Εισόδου:' : 'Move-in Date:'}</strong> ${data.moveInDate}</p>` : ''}
      </div>

      <div class="highlight">
        <h3>${isGreek ? '📋 Επόμενα Βήματα' : '📋 Next Steps'}</h3>
        <p>${data.nextSteps}</p>
      </div>

      <p>${isGreek
        ? 'Θα λάβετε το συμβόλαιό σας και τις οδηγίες πληρωμής σύντομα. Καλώς ήρθατε στο νέο σας σπίτι!'
        : 'You will receive your lease agreement and payment instructions shortly. Welcome to your new home!'
      }</p>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Αίτηση Εγκρίθηκε! 🎉' : 'Application Accepted! 🎉',
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/dashboard/tenant`,
        isGreek ? 'Προβολή Πίνακα Ελέγχου' : 'View Dashboard'
      ),
      text: `${subject} ${isGreek ? 'από' : 'by'} ${data.landlordName}`
    };
  },

  // Application received notification for landlords
  applicationReceived: (data: NotificationData & {
    propertyTitle: string;
    tenantName: string;
    moveInDate: string;
    leaseDuration: number;
    monthlyIncome?: number;
    hasGuarantor: boolean;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek
      ? `Νέα Αίτηση Ενοικίασης για ${data.propertyTitle}`
      : `New Rental Application for ${data.propertyTitle}`;

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>
      <p>${isGreek
        ? 'Έχετε λάβει νέα αίτηση ενοικίασης για το ακίνητό σας:'
        : 'You have received a new rental application for your property:'
      }</p>

      <div class="property-card">
        <h3>${data.propertyTitle}</h3>
        <p><strong>${isGreek ? 'Αιτούντα:' : 'Applicant:'}</strong> ${data.tenantName}</p>
        <p><strong>${isGreek ? 'Επιθυμητή Ημερομηνία Εισόδου:' : 'Desired Move-in Date:'}</strong> ${data.moveInDate}</p>
        <p><strong>${isGreek ? 'Διάρκεια Μίσθωσης:' : 'Lease Duration:'}</strong> ${data.leaseDuration} ${isGreek ? 'μήνες' : 'months'}</p>
        ${data.monthlyIncome ? `<p><strong>${isGreek ? 'Μηνιαίο Εισόδημα:' : 'Monthly Income:'}</strong> €${data.monthlyIncome}</p>` : ''}
        <p><strong>${isGreek ? 'Εγγυητής:' : 'Guarantor:'}</strong> ${data.hasGuarantor ? (isGreek ? 'Ναι' : 'Yes') : (isGreek ? 'Όχι' : 'No')}</p>
      </div>

      <p>${isGreek
        ? 'Παρακαλώ ελέγξτε την αίτηση και απαντήστε το συντομότερο δυνατό.'
        : 'Please review the application and respond as soon as possible.'
      }</p>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Νέα Αίτηση Ενοικίασης' : 'New Rental Application',
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/dashboard/landlord/applications`,
        isGreek ? 'Διαχείριση Αιτήσεων' : 'Manage Applications'
      ),
      text: `${subject}. ${isGreek ? 'Αίτηση από' : 'Application from'} ${data.tenantName} ${isGreek ? 'για' : 'for'} ${data.moveInDate}`
    };
  },

  // Application rejected notification
  applicationRejected: (data: NotificationData & {
    propertyTitle: string;
    landlordName: string;
    rejectionReason: string;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek
      ? `Αίτηση Απορρίφθηκε - ${data.propertyTitle}`
      : `Application Declined - ${data.propertyTitle}`;

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>
      <p>${isGreek
        ? `Δυστυχώς, η αίτηση ενοικίασής σας για το "${data.propertyTitle}" δεν έγινε αποδεκτή.`
        : `Unfortunately, your rental application for "${data.propertyTitle}" has not been accepted.`
      }</p>

      <div class="property-card">
        <h3>${data.propertyTitle}</h3>
        <p><strong>${isGreek ? 'Ιδιοκτήτης:' : 'Landlord:'}</strong> ${data.landlordName}</p>
        <span class="status-badge" style="background: #fee2e2; color: #991b1b;">${isGreek ? 'ΑΠΟΡΡΙΦΘΗΚΕ' : 'DECLINED'}</span>
      </div>

      <div class="highlight" style="background: #fef3c7; border-left-color: #f59e0b;">
        <h3>${isGreek ? '📝 Λόγος Απόρριψης' : '📝 Reason for Decline'}</h3>
        <p>${data.rejectionReason}</p>
      </div>

      <p>${isGreek
        ? 'Μη στενοχωρεστείτε! Υπάρχουν πολλά άλλα υπέροχα ακίνητα διαθέσιμα στην πλατφόρμα μας.'
        : 'Don\'t worry! There are many other great properties available on our platform.'
      }</p>

      <p>${isGreek
        ? 'Συνεχίστε την αναζήτηση και βρείτε το τέλειο σπίτι για εσάς!'
        : 'Continue your search and find the perfect home for you!'
      }</p>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Αίτηση Απορρίφθηκε' : 'Application Declined',
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/search`,
        isGreek ? 'Συνεχίστε την Αναζήτηση' : 'Continue Searching'
      ),
      text: `${subject} ${isGreek ? 'από' : 'by'} ${data.landlordName}. ${isGreek ? 'Λόγος:' : 'Reason:'} ${data.rejectionReason}`
    };
  },

  // Contract signed notification
  contractSigned: (data: NotificationData & {
    contractId: string;
    propertyTitle: string;
    moveInDate?: string;
    signerName?: string;
    waitingFor?: string;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const isFullySigned = !data.waitingFor;

    const subject = isGreek
      ? isFullySigned
        ? `Συμβόλαιο Υπογράφηκε - ${data.propertyTitle} 🎉`
        : `Συμβόλαιο Υπογράφηκε από ${data.signerName} - ${data.propertyTitle}`
      : isFullySigned
        ? `Contract Fully Signed - ${data.propertyTitle} 🎉`
        : `Contract Signed by ${data.signerName} - ${data.propertyTitle}`;

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>

      ${isFullySigned ? `
        <p style="font-size: 18px; color: #059669; font-weight: 600;">${isGreek
          ? '🎉 Συγχαρητήρια! Το συμβόλαιό σας έχει υπογραφεί πλήρως και είναι πλέον νομικά δεσμευτικό.'
          : '🎉 Congratulations! Your rental contract has been fully signed and is now legally binding.'
        }</p>
      ` : `
        <p>${isGreek
          ? `Το συμβόλαιό σας έχει υπογραφεί από ${data.signerName}. Περιμένουμε την υπογραφή σας για να ολοκληρωθεί η διαδικασία.`
          : `Your contract has been signed by ${data.signerName}. We're waiting for your signature to complete the process.`
        }</p>
      `}

      <div class="property-card">
        <h3>🏠 ${data.propertyTitle}</h3>
        <p><strong>${isGreek ? 'Κωδικός Συμβολαίου:' : 'Contract ID:'}</strong> ${data.contractId}</p>
        ${data.moveInDate ? `<p><strong>${isGreek ? 'Ημερομηνία Εισόδου:' : 'Move-in Date:'}</strong> ${data.moveInDate}</p>` : ''}
        <span class="status-badge ${isFullySigned ? 'status-success' : 'status-pending'}">${
          isFullySigned
            ? (isGreek ? 'ΠΛΗΡΩΣ ΥΠΟΓΡΑΜΜΕΝΟ' : 'FULLY SIGNED')
            : (isGreek ? 'ΜΕΡΙΚΩΣ ΥΠΟΓΡΑΜΜΕΝΟ' : 'PARTIALLY SIGNED')
        }</span>
      </div>

      ${isFullySigned ? `
        <div class="highlight">
          <h3>${isGreek ? '🎯 Επόμενα Βήματα' : '🎯 Next Steps'}</h3>
          <ul style="padding-left: 20px; color: #1e40af;">
            <li>${isGreek ? 'Το συμβόλαιό σας είναι πλέον νομικά ισχυρό' : 'Your contract is now legally enforceable'}</li>
            <li>${isGreek ? 'Μπορείτε να κατεβάσετε ένα αντίγραφο από τον πίνακα ελέγχου σας' : 'You can download a copy from your dashboard'}</li>
            <li>${isGreek ? 'Οι οδηγίες πληρωμής θα σας σταλούν σύντομα' : 'Payment instructions will be sent to you shortly'}</li>
            <li>${isGreek ? 'Ετοιμαστείτε για τη μετακόμισή σας!' : 'Prepare for your move-in!'}</li>
          </ul>
        </div>
      ` : `
        <div class="highlight" style="background: #fef3c7; border-left-color: #f59e0b;">
          <h3>${isGreek ? '⏳ Περιμένοντας' : '⏳ Waiting For'}</h3>
          <p>${isGreek
            ? `Περιμένουμε την υπογραφή από τον ${data.waitingFor === 'tenant' ? 'ενοικιαστή' : 'ιδιοκτήτη'} για να ολοκληρωθεί το συμβόλαιο.`
            : `Waiting for signature from the ${data.waitingFor} to complete the contract.`
          }</p>
        </div>
      `}

      <p>${isGreek
        ? 'Μπορείτε να παρακολουθείτε την πρόοδο του συμβολαίου σας από τον πίνακα ελέγχου σας.'
        : 'You can track your contract progress from your dashboard.'
      }</p>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isFullySigned
          ? (isGreek ? 'Συμβόλαιο Ολοκληρώθηκε! 🎉' : 'Contract Completed! 🎉')
          : (isGreek ? 'Συμβόλαιο Υπογράφηκε' : 'Contract Progress'),
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/contracts/${data.contractId}`,
        isGreek ? 'Προβολή Συμβολαίου' : 'View Contract'
      ),
      text: `${subject}. ${isGreek ? 'Κωδικός:' : 'ID:'} ${data.contractId}`
    };
  },

  // Payment failed notification
  paymentFailed: (data: NotificationData & {
    amount: number;
    paymentType: string;
    failureReason: string;
    paymentId: string;
  }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek
      ? `Πληρωμή Απέτυχε - €${data.amount}`
      : `Payment Failed - €${data.amount}`;

    const paymentTypeLabels = {
      en: {
        security_deposit: 'Security Deposit',
        monthly_rent: 'Monthly Rent',
        platform_fee: 'Platform Fee',
        late_fee: 'Late Fee'
      },
      el: {
        security_deposit: 'Εγγύηση',
        monthly_rent: 'Μηνιαίο Ενοίκιο',
        platform_fee: 'Προμήθεια Πλατφόρμας',
        late_fee: 'Πρόστιμο Καθυστέρησης'
      }
    };

    const typeLabel = paymentTypeLabels[data.language || 'en'][data.paymentType as keyof typeof paymentTypeLabels.en] || data.paymentType;

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>
      <p>${isGreek
        ? 'Δυστυχώς, η πληρωμή σας δεν ολοκληρώθηκε επιτυχώς.'
        : 'Unfortunately, your payment was not completed successfully.'
      }</p>

      <div class="highlight" style="background: #fee2e2; border-left-color: #dc2626;">
        <div class="amount" style="color: #dc2626;">€${data.amount}</div>
        <p><strong>${isGreek ? 'Τύπος Πληρωμής:' : 'Payment Type:'}</strong> ${typeLabel}</p>
        <p><strong>${isGreek ? 'Κωδικός Πληρωμής:' : 'Payment ID:'}</strong> <code>${data.paymentId}</code></p>
        <span class="status-badge" style="background: #fee2e2; color: #991b1b;">${isGreek ? 'ΑΠΕΤΥΧΕ' : 'FAILED'}</span>
      </div>

      <div class="property-card">
        <h3>${isGreek ? '❌ Λόγος Αποτυχίας' : '❌ Failure Reason'}</h3>
        <p>${data.failureReason}</p>
      </div>

      <p>${isGreek
        ? 'Παρακαλώ ελέγξτε τα στοιχεία της κάρτας σας και δοκιμάστε ξανά. Εάν το πρόβλημα επιμένει, επικοινωνήστε με την τράπεζά σας.'
        : 'Please check your card details and try again. If the problem persists, contact your bank.'
      }</p>

      <div class="highlight">
        <h3>${isGreek ? '💡 Συμβουλές για Επιτυχή Πληρωμή' : '💡 Tips for Successful Payment'}</h3>
        <ul style="padding-left: 20px; color: #1e40af;">
          <li>${isGreek ? 'Βεβαιωθείτε ότι έχετε επαρκή κεφάλαια' : 'Ensure you have sufficient funds'}</li>
          <li>${isGreek ? 'Ελέγξτε την ημερομηνία λήξης της κάρτας' : 'Check your card expiry date'}</li>
          <li>${isGreek ? 'Βεβαιωθείτε ότι η κάρτα σας υποστηρίζει διαδικτυακές αγορές' : 'Ensure your card supports online purchases'}</li>
          <li>${isGreek ? 'Δοκιμάστε μια διαφορετική κάρτα ή μέθοδο πληρωμής' : 'Try a different card or payment method'}</li>
        </ul>
      </div>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Πληρωμή Απέτυχε' : 'Payment Failed',
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/dashboard/tenant/payments`,
        isGreek ? 'Δοκιμάστε Ξανά' : 'Try Again'
      ),
      text: `${subject}. ${isGreek ? 'Λόγος:' : 'Reason:'} ${data.failureReason}`
    };
  },

  // Welcome emails with enhanced onboarding
  welcomeTenant: (data: NotificationData & { userType?: string }): EmailTemplate => {
    const isGreek = data.language === 'el';
    const subject = isGreek ? 'Καλώς ήρθατε στο Meet2Rent!' : 'Welcome to Meet2Rent!';

    const content = `
      <p>${isGreek ? `Γεια σας ${data.recipientName}` : `Hello ${data.recipientName}`},</p>
      <p>${isGreek
        ? 'Καλώς ήρθατε στο Meet2Rent, την κορυφαία ψηφιακή πλατφόρμα ενοικίασης της Ελλάδας!'
        : 'Welcome to Meet2Rent, Greece\'s premier digital rental platform!'
      }</p>

      <div class="highlight">
        <h3>${isGreek ? '🏠 Ως ενοικιαστής, μπορείτε:' : '🏠 As a tenant, you can:'}</h3>
        <ul style="padding-left: 20px; color: #1e40af;">
          <li>${isGreek ? 'Αναζητήστε και φιλτράρετε ακίνητα που ταιριάζουν στις ανάγκες σας' : 'Search and filter properties that match your needs'}</li>
          <li>${isGreek ? 'Κλείστε προβολές ακινήτων με επαληθευμένους ιδιοκτήτες' : 'Book property viewings with verified landlords'}</li>
          <li>${isGreek ? 'Υποβάλετε αιτήσεις για ενοικιάσεις με πλήρη ψηφιακή διαδικασία' : 'Apply for rentals with a complete digital process'}</li>
          <li>${isGreek ? 'Υπογράφετε συμβόλαια και πραγματοποιείτε πληρωμές με ασφάλεια online' : 'Sign contracts and make payments securely online'}</li>
          <li>${isGreek ? 'Επικοινωνήστε με ιδιοκτήτες μέσω της πλατφόρμας μας' : 'Communicate with landlords through our platform'}</li>
        </ul>
      </div>

      <div class="property-card">
        <h3>${isGreek ? '💡 Συμβουλή Pro' : '💡 Pro Tip'}</h3>
        <p>${isGreek
          ? 'Συμπληρώστε το προφίλ σας και την επαλήθευση για να αυξήσετε τις πιθανότητες έγκρισης!'
          : 'Complete your profile and verification to increase your chances of approval!'
        }</p>
      </div>

      <p>${isGreek
        ? 'Ξεκινήστε σήμερα και βρείτε το τέλειο σπίτι για εσάς!'
        : 'Get started today and find your perfect home!'
      }</p>
    `;

    return {
      subject,
      html: createEmailTemplate(
        isGreek ? 'Καλώς ήρθατε στο Meet2Rent! 🏠' : 'Welcome to Meet2Rent! 🏠',
        content,
        data.language,
        `${process.env.NEXTAUTH_URL}/dashboard/tenant/profile`,
        isGreek ? 'Συμπληρώστε το Προφίλ' : 'Complete Your Profile'
      ),
      text: `${subject} ${isGreek ? 'Συμπληρώστε το προφίλ σας για να ξεκινήσετε.' : 'Complete your tenant profile to get started.'}`
    };
  }
};

// Enhanced email sending with retry logic and tracking
export const sendEmail = async (
  template: EmailTemplate,
  recipientEmail: string,
  options: {
    priority?: 'high' | 'normal' | 'low';
    category?: string;
    retries?: number;
  } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const maxRetries = options.retries || 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transporter = createTransporter();

      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        priority: options.priority || 'normal',
        headers: {
          'X-Category': options.category || 'notification',
          'X-Attempt': attempt.toString()
        }
      });

      // TODO: Log successful email send to database
      console.log(`Email sent successfully on attempt ${attempt}:`, {
        messageId: result.messageId,
        recipient: recipientEmail,
        category: options.category
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      lastError = error;
      console.warn(`Email send attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  console.error('Email sending failed after all retries:', lastError);
  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : 'Unknown error',
  };
};

// Enhanced notification types
export enum NotificationType {
  // Booking notifications
  BOOKING_REQUEST = 'booking_request',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',

  // Application notifications
  APPLICATION_RECEIVED = 'application_received',
  APPLICATION_ACCEPTED = 'application_accepted',
  APPLICATION_REJECTED = 'application_rejected',
  APPLICATION_WITHDRAWN = 'application_withdrawn',

  // Payment notifications
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_OVERDUE = 'payment_overdue',

  // Contract notifications
  CONTRACT_READY = 'contract_ready',
  CONTRACT_SIGNED = 'contract_signed',
  CONTRACT_COMPLETED = 'contract_completed',
  CONTRACT_EXPIRING = 'contract_expiring',

  // Communication notifications
  NEW_MESSAGE = 'new_message',
  MESSAGE_REMINDER = 'message_reminder',

  // Review notifications
  REVIEW_REMINDER = 'review_reminder',
  REVIEW_RECEIVED = 'review_received',

  // System notifications
  WELCOME_TENANT = 'welcome_tenant',
  WELCOME_LANDLORD = 'welcome_landlord',
  ACCOUNT_VERIFIED = 'account_verified',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled'
}

// Enhanced email queue with priority and batch processing
export const queueEmail = async (
  type: NotificationType,
  recipientEmail: string,
  recipientName: string,
  data: Record<string, any>,
  options: {
    priority?: 'high' | 'normal' | 'low';
    language?: 'en' | 'el';
    delay?: number; // in milliseconds
  } = {}
): Promise<void> => {
  const notificationData = {
    recipientEmail,
    recipientName,
    language: options.language || 'en',
    ...data
  };

  let template: EmailTemplate;

  try {
    switch (type) {
      case NotificationType.BOOKING_REQUEST:
        template = emailTemplates.bookingRequest(notificationData);
        break;
      case NotificationType.PAYMENT_RECEIVED:
        template = emailTemplates.paymentReceived(notificationData);
        break;
      case NotificationType.CONTRACT_READY:
        template = emailTemplates.contractReady(notificationData);
        break;
      case NotificationType.APPLICATION_ACCEPTED:
        template = emailTemplates.applicationAccepted(notificationData);
        break;
      case NotificationType.APPLICATION_RECEIVED:
        template = emailTemplates.applicationReceived(notificationData);
        break;
      case NotificationType.APPLICATION_REJECTED:
        template = emailTemplates.applicationRejected(notificationData);
        break;
      case NotificationType.CONTRACT_SIGNED:
        template = emailTemplates.contractSigned(notificationData);
        break;
      case NotificationType.PAYMENT_FAILED:
        template = emailTemplates.paymentFailed(notificationData);
        break;
      case NotificationType.WELCOME_TENANT:
        template = emailTemplates.welcomeTenant(notificationData);
        break;
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }

    // Add delay if specified
    if (options.delay && options.delay > 0) {
      setTimeout(async () => {
        await sendEmail(template, recipientEmail, {
          priority: options.priority,
          category: type
        });
      }, options.delay);
    } else {
      // Send immediately
      await sendEmail(template, recipientEmail, {
        priority: options.priority,
        category: type
      });
    }

    // TODO: Save notification record to database
    console.log('Email notification queued:', {
      type,
      recipientEmail,
      priority: options.priority || 'normal',
      language: options.language || 'en'
    });

  } catch (error) {
    console.error('Failed to queue email notification:', error);
    throw error;
  }
};

// Bulk email processing for mass notifications
export const queueBulkEmails = async (
  notifications: Array<{
    type: NotificationType;
    recipientEmail: string;
    recipientName: string;
    data: Record<string, any>;
    options?: {
      priority?: 'high' | 'normal' | 'low';
      language?: 'en' | 'el';
    };
  }>
): Promise<{ queued: number; failed: number; errors: string[] }> => {
  let queued = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in batches to avoid overwhelming the email service
  const batchSize = 10;
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (notification) => {
        try {
          await queueEmail(
            notification.type,
            notification.recipientEmail,
            notification.recipientName,
            notification.data,
            notification.options
          );
          queued++;
        } catch (error) {
          failed++;
          errors.push(`${notification.recipientEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })
    );

    // Add delay between batches
    if (i + batchSize < notifications.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { queued, failed, errors };
};
