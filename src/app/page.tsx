"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            My Viral Event
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create events that spread like wildfire. Track referrals, send
            invites, and watch your events go viral with powerful analytics.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {user ? (
            /* Authenticated User Dashboard */
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Welcome back, {user.email}!
              </h2>
              <p className="text-gray-600 mb-8">
                Ready to make your next event go viral?
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  href="/events"
                  className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📅 Events
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Create and manage your events
                  </p>
                </Link>

                <Link
                  href="/invites"
                  className="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    📧 Invites
                  </h3>
                  <p className="text-green-700 text-sm">
                    Generate referral codes and send invites
                  </p>
                </Link>

                <Link
                  href="/analytics"
                  className="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    📊 Analytics
                  </h3>
                  <p className="text-purple-700 text-sm">
                    Track referral performance and conversions
                  </p>
                </Link>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🚀 Viral Power
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Your events are ready to spread
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Unauthenticated Landing Page */
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Start Creating Viral Events
                </h2>
                <p className="text-gray-600 mb-8">
                  Join thousands of event organizers who use My Viral Event to
                  create events that spread organically through referrals.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/auth"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Smart Referrals
                  </h3>
                  <p className="text-gray-600">
                    Track every click, signup, and RSVP with unique referral
                    codes
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Analytics Dashboard
                  </h3>
                  <p className="text-gray-600">
                    Monitor conversion rates and see which referrals perform
                    best
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-4">📧</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Email Invites
                  </h3>
                  <p className="text-gray-600">
                    Send beautiful email invites with one click
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
