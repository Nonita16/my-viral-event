"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import posthog from "posthog-js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface InviteStats {
  code: string;
  clicks: number;
  signups: number;
  rsvps: number;
  clickToSignupRate: number;
  signupToRsvpRate: number;
}

interface SummaryStats {
  totalInvitesSent: number;
  totalClicks: number;
  totalSignups: number;
  totalRsvps: number;
  overallClickToSignupRate: number;
  overallSignupToRsvpRate: number;
}

export default function Analytics() {
  const { user, loading } = useAuth();
  const [inviteStats, setInviteStats] = useState<InviteStats[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalInvitesSent: 0,
    totalClicks: 0,
    totalSignups: 0,
    totalRsvps: 0,
    overallClickToSignupRate: 0,
    overallSignupToRsvpRate: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAnalytics = async () => {
    setLoadingData(true);
    try {
      // Fetch invites for the user
      const { data: invites, error: invitesError } = await supabase
        .from("invites")
        .select("id, code, email_sent")
        .eq("referrer_id", user!.id);

      if (invitesError) throw invitesError;

      const stats: InviteStats[] = [];
      let totalInvitesSent = 0;
      let totalClicks = 0;
      let totalSignups = 0;
      let totalRsvps = 0;

      for (const invite of invites || []) {
        if (invite.email_sent) totalInvitesSent++;

        // Fetch unique clicks
        const { count: clicks, error: clicksError } = await supabase
          .from("referrals")
          .select("session_id", { count: "exact", head: true })
          .eq("invite_id", invite.id)
          .eq("action_type", "click")
          .not("session_id", "is", null);

        if (clicksError) console.error(clicksError);
        const uniqueClicks = clicks || 0;

        // Fetch signups
        const { count: signups, error: signupsError } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("invite_id", invite.id)
          .eq("action_type", "signup");

        if (signupsError) console.error(signupsError);
        const signupCount = signups || 0;

        // Fetch RSVPs
        const { count: rsvps, error: rsvpsError } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("invite_id", invite.id)
          .eq("action_type", "rsvp");

        if (rsvpsError) console.error(rsvpsError);
        const rsvpCount = rsvps || 0;

        const clickToSignupRate =
          uniqueClicks > 0 ? (signupCount / uniqueClicks) * 100 : 0;
        const signupToRsvpRate =
          signupCount > 0 ? (rsvpCount / signupCount) * 100 : 0;

        stats.push({
          code: invite.code,
          clicks: uniqueClicks,
          signups: signupCount,
          rsvps: rsvpCount,
          clickToSignupRate: Math.round(clickToSignupRate * 100) / 100,
          signupToRsvpRate: Math.round(signupToRsvpRate * 100) / 100,
        });

        totalClicks += uniqueClicks;
        totalSignups += signupCount;
        totalRsvps += rsvpCount;
      }

      setInviteStats(stats);
      setSummaryStats({
        totalInvitesSent,
        totalClicks,
        totalSignups,
        totalRsvps,
        overallClickToSignupRate:
          totalClicks > 0
            ? Math.round((totalSignups / totalClicks) * 10000) / 100
            : 0,
        overallSignupToRsvpRate:
          totalSignups > 0
            ? Math.round((totalRsvps / totalSignups) * 10000) / 100
            : 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoadingData(false);
      posthog.capture("view_analytics");
    }
  };

  if (loading || loadingData) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view analytics.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold">Total Invites Sent</h3>
          <p className="text-2xl">{summaryStats.totalInvitesSent}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold">Total Unique Clicks</h3>
          <p className="text-2xl">{summaryStats.totalClicks}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold">Total Signups</h3>
          <p className="text-2xl">{summaryStats.totalSignups}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-semibold">Total RSVPs</h3>
          <p className="text-2xl">{summaryStats.totalRsvps}</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <h3 className="font-semibold">Click to Signup Rate</h3>
          <p className="text-2xl">{summaryStats.overallClickToSignupRate}%</p>
        </div>
        <div className="bg-indigo-100 p-4 rounded">
          <h3 className="font-semibold">Signup to RSVP Rate</h3>
          <p className="text-2xl">{summaryStats.overallSignupToRsvpRate}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Invite Code Performance</h2>
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Code</th>
              <th className="py-2 px-4 border-b">Clicks</th>
              <th className="py-2 px-4 border-b">Signups</th>
              <th className="py-2 px-4 border-b">RSVPs</th>
              <th className="py-2 px-4 border-b">Click→Signup %</th>
              <th className="py-2 px-4 border-b">Signup→RSVP %</th>
            </tr>
          </thead>
          <tbody>
            {inviteStats.map((stat) => (
              <tr key={stat.code}>
                <td className="py-2 px-4 border-b">{stat.code}</td>
                <td className="py-2 px-4 border-b">{stat.clicks}</td>
                <td className="py-2 px-4 border-b">{stat.signups}</td>
                <td className="py-2 px-4 border-b">{stat.rsvps}</td>
                <td className="py-2 px-4 border-b">
                  {stat.clickToSignupRate}%
                </td>
                <td className="py-2 px-4 border-b">{stat.signupToRsvpRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Performance Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={inviteStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="code" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="clicks" fill="#8884d8" name="Clicks" />
            <Bar dataKey="signups" fill="#82ca9d" name="Signups" />
            <Bar dataKey="rsvps" fill="#ffc658" name="RSVPs" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
