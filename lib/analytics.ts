import { trackUserAction } from '../sentry.client.config';

// Analytics configuration
const config = {
  googleAnalytics: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    enabled: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production',
  },
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  },
  debug: process.env.NODE_ENV === 'development',
};

// Google Analytics 4 (gtag) functions
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export function initializeAnalytics() {
  if (config.googleAnalytics.enabled && typeof window !== 'undefined') {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalytics.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', config.googleAnalytics.measurementId!, {
      page_title: document.title,
      page_location: window.location.href,
      custom_map: {
        custom_parameter_1: 'user_type',
        custom_parameter_2: 'property_type',
      },
    });

    if (config.debug) {
      console.log('Google Analytics initialized');
    }
  }
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (config.googleAnalytics.enabled && typeof window !== 'undefined') {
    window.gtag('config', config.googleAnalytics.measurementId!, {
      page_title: title || document.title,
      page_location: url,
    });
  }

  // Also track in Sentry for debugging
  trackUserAction('page_view', { url, title });

  if (config.debug) {
    console.log('Page view tracked:', { url, title });
  }
}

// Enhanced event tracking for Meet2Rent specific events
export enum AnalyticsEvents {
  // Property events
  PROPERTY_VIEW = 'property_view',
  PROPERTY_SEARCH = 'property_search',
  PROPERTY_FAVORITE = 'property_favorite',
  PROPERTY_CONTACT = 'property_contact',
  PROPERTY_SHARE = 'property_share',

  // Booking events
  BOOKING_REQUEST = 'booking_request',
  BOOKING_CONFIRM = 'booking_confirm',
  BOOKING_CANCEL = 'booking_cancel',
  BOOKING_COMPLETE = 'booking_complete',

  // Payment events
  PAYMENT_INITIATE = 'payment_initiate',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILURE = 'payment_failure',
  SUBSCRIPTION_CREATE = 'subscription_create',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',

  // User events
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_VERIFY = 'user_verify',
  PROFILE_COMPLETE = 'profile_complete',

  // Contract events
  CONTRACT_GENERATE = 'contract_generate',
  CONTRACT_SIGN = 'contract_sign',
  CONTRACT_COMPLETE = 'contract_complete',

  // Communication events
  MESSAGE_SEND = 'message_send',
  MESSAGE_RECEIVE = 'message_receive',
  REVIEW_SUBMIT = 'review_submit',

  // Platform events
  SEARCH_FILTER = 'search_filter',
  MAP_INTERACTION = 'map_interaction',
  HELP_ACCESS = 'help_access',
  ERROR_ENCOUNTER = 'error_encounter',
}

// Track custom events
export function trackEvent(
  event: AnalyticsEvents | string,
  parameters: Record<string, any> = {}
) {
  // Enhanced parameters with context
  const enrichedParams = {
    ...parameters,
    timestamp: new Date().toISOString(),
    user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
    page_url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    page_title: typeof window !== 'undefined' ? document.title : 'unknown',
  };

  // Google Analytics tracking
  if (config.googleAnalytics.enabled && typeof window !== 'undefined') {
    window.gtag('event', event, enrichedParams);
  }

  // Sentry breadcrumb for debugging
  trackUserAction(event, enrichedParams);

  if (config.debug) {
    console.log('Event tracked:', event, enrichedParams);
  }
}

// Property-specific tracking
export function trackPropertyInteraction(
  action: 'view' | 'favorite' | 'contact' | 'share',
  propertyData: {
    id: number;
    title: string;
    price: number;
    location: string;
    type: string;
    bedrooms: number;
  }
) {
  const eventMap = {
    view: AnalyticsEvents.PROPERTY_VIEW,
    favorite: AnalyticsEvents.PROPERTY_FAVORITE,
    contact: AnalyticsEvents.PROPERTY_CONTACT,
    share: AnalyticsEvents.PROPERTY_SHARE,
  };

  trackEvent(eventMap[action], {
    property_id: propertyData.id,
    property_title: propertyData.title,
    property_price: propertyData.price,
    property_location: propertyData.location,
    property_type: propertyData.type,
    property_bedrooms: propertyData.bedrooms,
    currency: 'EUR',
  });
}

// Search tracking with filters
export function trackSearch(
  query: string,
  filters: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  },
  resultsCount: number
) {
  trackEvent(AnalyticsEvents.PROPERTY_SEARCH, {
    search_query: query,
    search_location: filters.location,
    search_min_price: filters.minPrice,
    search_max_price: filters.maxPrice,
    search_property_type: filters.propertyType,
    search_bedrooms: filters.bedrooms,
    search_bathrooms: filters.bathrooms,
    search_results_count: resultsCount,
  });
}

// Payment tracking
export function trackPayment(
  action: 'initiate' | 'success' | 'failure',
  paymentData: {
    amount: number;
    currency: string;
    paymentType: string;
    propertyId?: number;
    paymentMethodType?: string;
    error?: string;
  }
) {
  const eventMap = {
    initiate: AnalyticsEvents.PAYMENT_INITIATE,
    success: AnalyticsEvents.PAYMENT_SUCCESS,
    failure: AnalyticsEvents.PAYMENT_FAILURE,
  };

  trackEvent(eventMap[action], {
    payment_amount: paymentData.amount,
    payment_currency: paymentData.currency,
    payment_type: paymentData.paymentType,
    property_id: paymentData.propertyId,
    payment_method_type: paymentData.paymentMethodType,
    error_message: paymentData.error,
  });

  // For successful payments, also track as conversion
  if (action === 'success') {
    trackConversion(paymentData.amount, paymentData.currency, paymentData.paymentType);
  }
}

// Conversion tracking (revenue)
export function trackConversion(
  value: number,
  currency: string = 'EUR',
  transactionType: string
) {
  if (config.googleAnalytics.enabled && typeof window !== 'undefined') {
    window.gtag('event', 'purchase', {
      transaction_id: `${Date.now()}-${Math.random()}`,
      value: value,
      currency: currency,
      item_category: transactionType,
    });
  }

  trackEvent('conversion', {
    conversion_value: value,
    conversion_currency: currency,
    conversion_type: transactionType,
  });
}

// User journey tracking
export function trackUserJourney(
  stage: 'registration' | 'verification' | 'first_search' | 'first_contact' | 'first_booking' | 'first_payment',
  metadata: Record<string, any> = {}
) {
  trackEvent(`user_journey_${stage}`, {
    journey_stage: stage,
    ...metadata,
  });
}

// Performance tracking
export function trackPerformance(
  metric: 'page_load' | 'api_response' | 'search_results' | 'image_load',
  duration: number,
  metadata: Record<string, any> = {}
) {
  trackEvent('performance_metric', {
    performance_metric: metric,
    performance_duration: duration,
    ...metadata,
  });

  // Track slow performance as warnings
  const thresholds = {
    page_load: 3000,
    api_response: 1000,
    search_results: 2000,
    image_load: 1000,
  };

  if (duration > thresholds[metric]) {
    trackEvent('performance_warning', {
      performance_metric: metric,
      performance_duration: duration,
      threshold: thresholds[metric],
      ...metadata,
    });
  }
}

// Error tracking
export function trackError(
  errorType: 'javascript' | 'api' | 'payment' | 'upload' | 'auth',
  error: Error | string,
  context: Record<string, any> = {}
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  trackEvent(AnalyticsEvents.ERROR_ENCOUNTER, {
    error_type: errorType,
    error_message: errorMessage,
    error_stack: errorStack,
    ...context,
  });
}

// A/B test tracking
export function trackABTest(
  testName: string,
  variant: string,
  context: Record<string, any> = {}
) {
  trackEvent('ab_test_exposure', {
    test_name: testName,
    test_variant: variant,
    ...context,
  });
}

// Feature usage tracking
export function trackFeatureUsage(
  feature: 'map_view' | 'filters' | 'messaging' | 'reviews' | 'contracts' | 'mobile_app',
  action: 'open' | 'close' | 'interact' | 'complete',
  metadata: Record<string, any> = {}
) {
  trackEvent('feature_usage', {
    feature_name: feature,
    feature_action: action,
    ...metadata,
  });
}

// Session tracking
let sessionStartTime: number;

export function startSession() {
  sessionStartTime = Date.now();
  trackEvent('session_start', {
    session_start_time: sessionStartTime,
  });
}

export function endSession() {
  if (sessionStartTime) {
    const sessionDuration = Date.now() - sessionStartTime;
    trackEvent('session_end', {
      session_duration: sessionDuration,
      session_start_time: sessionStartTime,
    });
  }
}

// Device and browser tracking
export function trackDeviceInfo() {
  if (typeof window === 'undefined') return;

  const deviceInfo = {
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    is_mobile: /Mobi|Android/i.test(navigator.userAgent),
    is_tablet: /Tablet|iPad/i.test(navigator.userAgent),
  };

  trackEvent('device_info', deviceInfo);
}

// Initialize analytics when page loads
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeAnalytics();
      startSession();
      trackDeviceInfo();
    });
  } else {
    initializeAnalytics();
    startSession();
    trackDeviceInfo();
  }

  // Track when user leaves
  window.addEventListener('beforeunload', endSession);
  window.addEventListener('pagehide', endSession);
}

// Export configuration for debugging
export { config as analyticsConfig };
