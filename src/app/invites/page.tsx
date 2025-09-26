"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import posthog from "posthog-js";

interface ReferralCode {
  id: string;
  user_id: string;
  referral_code: string;
  created_at: string;
}

interface Referral {
  id: string;
  referral_code: string;
  action_type: string;
  event_id?: string;
  user_id?: string;
  session_id?: string;
  timestamp: string;
}

export default function Invites() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      // Get or create user's referral code
      let { data: codeData, error: codeError } = await supabase
        .from("user_referral_codes")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (codeError && codeError.code === "PGRST116") {
        // No referral code exists, create one
        const newCode = crypto.randomUUID().substring(0, 8);
        const { data: newCodeData, error: createError } = await supabase
          .from("user_referral_codes")
          .insert({
            user_id: user!.id,
            referral_code: newCode,
          })
          .select()
          .single();

        if (createError) throw createError;
        codeData = newCodeData;
      } else if (codeError) {
        throw codeError;
      }

      setReferralCode(codeData);

      // Fetch referrals for this code
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referral_code", codeData.referral_code)
        .order("timestamp", { ascending: false });

      if (referralsError) throw referralsError;
      setReferrals(referralsData || []);
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralCode) {
      const link = `${window.location.origin}/auth?ref=${referralCode.referral_code}`;
      navigator.clipboard.writeText(link);
      // Could add a toast notification here
    }
  };

  const sendEmail = async (email: string) => {
    if (!referralCode) return;

    try {
      // Send email via API route
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          referralCode: referralCode.referral_code,
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      posthog.capture("send_email", {
        recipient_email: email,
        referral_code: referralCode.referral_code,
      });

      // Could add success notification
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Please log in to view your referral code.
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalClicks = referrals.filter((r) => r.action_type === "click").length;
  const totalSignups = referrals.filter(
    (r) => r.action_type === "signup"
  ).length;
  const totalRsvps = referrals.filter((r) => r.action_type === "rsvp").length;
  const conversionRate =
    totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          My Referral Code
        </h1>

        {/* Referral Code Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Referral Link
          </h2>
          <div className="flex items-center space-x-4 mb-4">
            <span className="font-mono text-lg bg-gray-100 px-4 py-2 rounded">
              {referralCode?.referral_code}
            </span>
            <button
              onClick={copyReferralLink}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Copy Referral Link
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Share this link with friends. When they sign up and RSVP to events,
            you'll get credit for the referrals!
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900">Clicks</h3>
            <p className="text-2xl font-bold text-blue-600">{totalClicks}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900">Signups</h3>
            <p className="text-2xl font-bold text-green-600">{totalSignups}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900">RSVPs</h3>
            <p className="text-2xl font-bold text-purple-600">{totalRsvps}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900">Conversion</h3>
            <p className="text-2xl font-bold text-orange-600">
              {conversionRate}%
            </p>
          </div>
        </div>

        {/* Email Invite Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Invite Friends via Email
          </h2>
          <div className="flex items-center space-x-2">
            <input
              type="email"
              placeholder="friend@example.com"
              className="flex-1 border rounded px-3 py-2"
              id="email-input"
            />
            <button
              onClick={() => {
                const email = (
                  document.getElementById("email-input") as HTMLInputElement
                )?.value;
                if (email) {
                  sendEmail(email);
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Send Invite
            </button>
          </div>
        </div>

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Referrals
            </h2>
            <div className="space-y-2">
              {referrals.slice(0, 10).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        referral.action_type === "click"
                          ? "bg-blue-100 text-blue-800"
                          : referral.action_type === "signup"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {referral.action_type.toUpperCase()}
                    </span>
                    <span className="text-gray-600">
                      {new Date(referral.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
