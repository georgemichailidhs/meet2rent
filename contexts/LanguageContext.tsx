'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'el';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.listings': 'Listings',
    'nav.search': 'Search',
    'nav.account': 'Account',
    'nav.info': 'Info',
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',

    // Homepage
    'home.title': 'Meet 2 Rent',
    'home.subtitle': 'The digital platform revolutionizing long-term rentals in Greece. Find, certify, and rent—completely online, for both landlords and tenants.',

    // Authentication
    'auth.signInTitle': 'Sign In to Meet2Rent',
    'auth.signInWithGoogle': 'Sign in with Google',
    'auth.termsText': 'By signing in, you agree to our Terms of Service and Privacy Policy.',

    // Dashboard - Common
    'dashboard.welcome': 'Welcome back',
    'dashboard.needHelp': 'Need Help?',
    'dashboard.contactSupport': 'Contact Support',
    'dashboard.openChat': 'Open Chat Support',

    // Tenant Dashboard
    'tenant.subtitle': 'Find your perfect rental with Meet2Rent',
    'tenant.searchProperties': 'Search Properties',
    'tenant.searchPropertiesDesc': 'Find your perfect rental',
    'tenant.savedProperties': 'Saved Properties',
    'tenant.savedPropertiesDesc': 'View your favorite listings',
    'tenant.myBookings': 'My Bookings',
    'tenant.myBookingsDesc': 'Scheduled viewings & applications',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.manage': 'Manage',
    'common.contact': 'Contact',
  },
  el: {
    // Navigation
    'nav.home': 'Αρχική',
    'nav.listings': 'Καταχωρήσεις',
    'nav.search': 'Αναζήτηση',
    'nav.account': 'Λογαριασμός',
    'nav.info': 'Πληροφορίες',
    'nav.signIn': 'Σύνδεση',
    'nav.signOut': 'Αποσύνδεση',

    // Homepage
    'home.title': 'Meet 2 Rent',
    'home.subtitle': 'Η ψηφιακή πλατφόρμα που επαναστατεί τις μακροχρόνιες ενοικιάσεις στην Ελλάδα. Βρείτε, πιστοποιηθείτε και νοικιάστε—πλήρως διαδικτυακά.',

    // Authentication
    'auth.signInTitle': 'Σύνδεση στο Meet2Rent',
    'auth.signInWithGoogle': 'Σύνδεση με Google',
    'auth.termsText': 'Συνδεόμενοι, συμφωνείτε με τους Όρους Χρήσης και την Πολιτική Απορρήτου μας.',

    // Dashboard - Common
    'dashboard.welcome': 'Καλώς ήρθατε πίσω',
    'dashboard.needHelp': 'Χρειάζεστε Βοήθεια;',
    'dashboard.contactSupport': 'Επικοινωνία Υποστήριξης',
    'dashboard.openChat': 'Άνοιγμα Chat Υποστήριξης',

    // Tenant Dashboard
    'tenant.subtitle': 'Βρείτε την τέλεια ενοικίαση με το Meet2Rent',
    'tenant.searchProperties': 'Αναζήτηση Ακινήτων',
    'tenant.searchPropertiesDesc': 'Βρείτε την τέλεια ενοικίασή σας',
    'tenant.savedProperties': 'Αποθηκευμένα Ακίνητα',
    'tenant.savedPropertiesDesc': 'Δείτε τις αγαπημένες σας καταχωρήσεις',
    'tenant.myBookings': 'Οι Κρατήσεις μου',
    'tenant.myBookingsDesc': 'Προγραμματισμένες επισκέψεις & αιτήσεις',

    // Common
    'common.loading': 'Φόρτωση...',
    'common.save': 'Αποθήκευση',
    'common.cancel': 'Ακύρωση',
    'common.submit': 'Υποβολή',
    'common.edit': 'Επεξεργασία',
    'common.delete': 'Διαγραφή',
    'common.view': 'Προβολή',
    'common.manage': 'Διαχείριση',
    'common.contact': 'Επικοινωνία',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load saved language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('meet2rent-language') as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'el')) {
        setLanguage(savedLang);
      }
    }
  }, []);

  // Save language preference
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('meet2rent-language', lang);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
