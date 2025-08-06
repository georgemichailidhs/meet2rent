'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  Search,
  MessageSquare,
  Calendar,
  User,
  CreditCard,
  Star,
  Settings,
  LogOut,
  Bell,
  Heart,
  Plus,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileNavigationProps {
  userType?: 'tenant' | 'landlord';
  notificationCount?: number;
}

export default function MobileNavigation({ userType, notificationCount = 0 }: MobileNavigationProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const tenantNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/booking', label: 'My Bookings', icon: Calendar },
    { href: '/dashboard/tenant/payments', label: 'Payments', icon: CreditCard },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/reviews', label: 'Reviews', icon: Star },
    { href: '/dashboard/tenant/saved', label: 'Saved', icon: Heart },
    { href: '/dashboard/tenant/profile', label: 'Profile', icon: User },
  ];

  const landlordNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard/landlord/properties', label: 'My Properties', icon: Building },
    { href: '/dashboard/landlord/add-property', label: 'Add Property', icon: Plus },
    { href: '/dashboard/landlord/bookings', label: 'Bookings', icon: Calendar },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/reviews', label: 'Reviews', icon: Star },
    { href: '/dashboard/landlord', label: 'Dashboard', icon: User },
  ];

  const navItems = userType === 'landlord' ? landlordNavItems : tenantNavItems;

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 safe-area-padding">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Meet2Rent</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            {session && (
              <button className="relative p-2 text-gray-600 hover:text-gray-900 touch-target">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </button>
            )}

            {/* Menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 touch-target"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-nav-menu md:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className={`mobile-nav-content ${isMenuOpen ? 'open' : ''}`}>
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                {session ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {session.user?.name || 'User'}
                      </div>
                      <div className="text-blue-100 text-sm">
                        {userType === 'landlord' ? 'Landlord' : 'Tenant'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-white font-semibold mb-2">Welcome to Meet2Rent</div>
                    <Link href="/auth/signin">
                      <Button variant="secondary" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto">
                <div className="py-4">
                  {session && navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-6 py-4 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors touch-feedback ${
                          isActive(item.href) ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                        {item.label === 'Messages' && notificationCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white">
                            {notificationCount}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}

                  {/* Additional Links */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <Link
                      href="/settings"
                      className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors touch-feedback"
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      <span className="font-medium">Settings</span>
                    </Link>

                    <Link
                      href="/help"
                      className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors touch-feedback"
                    >
                      <MessageSquare className="h-5 w-5 mr-3" />
                      <span className="font-medium">Help & Support</span>
                    </Link>
                  </div>
                </div>
              </nav>

              {/* Menu Footer */}
              {session && (
                <div className="border-t border-gray-200 p-6">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-feedback"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Alternative mobile nav) */}
      {session && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-padding z-30">
          <div className="flex justify-around items-center py-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center px-2 py-2 min-w-0 flex-1 touch-target ${
                    isActive(item.href) ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {item.label === 'Messages' && notificationCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-xs mt-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile spacing for bottom nav */}
      {session && <div className="md:hidden h-16" />}
    </>
  );
}
