"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import posthog from "posthog-js";

export const dynamic = "force-dynamic";

interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  user_id: string;
  created_at: string;
}

interface Invite {
  id: string;
  event_id: string;
  referrer_id: string;
  code: string;
  email_sent: boolean;
  created_at: string;
}

function InvitesContent() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [invites, setInvites] = useState<Record<string, Invite[]>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else {
      setEvents(data || []);
      // Fetch invites for each event
      const invitesMap: Record<string, Invite[]> = {};
      for (const event of data || []) {
        const { data: inviteData, error: inviteError } = await supabase
          .from("invites")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false });
        if (inviteError) console.error(inviteError);
        else invitesMap[event.id] = inviteData || [];
      }
      setInvites(invitesMap);
    }
  };

  const generateInvite = async (eventId: string) => {
    if (!user) return;
    setGenerating(eventId);
    const code = crypto.randomUUID().substring(0, 8); // Short code
    const { error } = await supabase.from("invites").insert({
      event_id: eventId,
      referrer_id: user.id,
      code,
      email_sent: false,
    });
    if (error) console.error(error);
    else {
      posthog.capture("generate_invite", {
        event_id: eventId,
        invite_code: code,
      });
      fetchEvents(); // Refresh
    }
    setGenerating(null);
  };

  const copyLink = (eventId: string, code: string) => {
    const link = `${window.location.origin}/event/${eventId}?ref=${code}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  const sendEmail = async (inviteId: string, email: string) => {
    if (!email) return;
    setSending(inviteId);
    const invite = Object.values(invites)
      .flat()
      .find((i) => i.id === inviteId);
    if (!invite) return;
    const event = events.find((e) => e.id === invite.event_id);
    if (!event) return;
    const link = `${window.location.origin}/event/${invite.event_id}?ref=${invite.code}`;
    try {
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          eventName: event.name,
          inviteLink: link,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }
      posthog.capture("send_email", {
        invite_id: inviteId,
        event_id: invite.event_id,
        recipient_email: email,
        invite_code: invite.code,
      });
      // Update email_sent
      await supabase
        .from("invites")
        .update({ email_sent: true })
        .eq("id", inviteId);
      fetchEvents(); // Refresh
    } catch (error) {
      console.error(error);
    }
    setSending(null);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to manage invites.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Invites</h1>
      {events.map((event) => (
        <div key={event.id} className="mb-8 border border-gray-200 rounded p-4">
          <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
          <button
            onClick={() => generateInvite(event.id)}
            disabled={generating === event.id}
            className="bg-green-500 text-white px-4 py-2 rounded mb-4"
          >
            {generating === event.id ? "Generating..." : "Generate Invite Code"}
          </button>
          <h3 className="text-lg font-medium mb-2">Invites</h3>
          <ul className="space-y-2">
            {(invites[event.id] || []).map((invite) => (
              <li
                key={invite.id}
                className="flex items-center space-x-4 border border-gray-100 rounded p-2"
              >
                <span>Code: {invite.code}</span>
                <button
                  onClick={() => copyLink(event.id, invite.code)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                >
                  Copy Link
                </button>
                <input
                  type="email"
                  placeholder="Email"
                  value={emailInputs[invite.id] || ""}
                  onChange={(e) =>
                    setEmailInputs({
                      ...emailInputs,
                      [invite.id]: e.target.value,
                    })
                  }
                  className="border border-gray-300 rounded px-2 py-1"
                />
                <button
                  onClick={() =>
                    sendEmail(invite.id, emailInputs[invite.id] || "")
                  }
                  disabled={sending === invite.id || invite.email_sent}
                  className="bg-purple-500 text-white px-2 py-1 rounded text-sm disabled:bg-gray-400"
                >
                  {sending === invite.id
                    ? "Sending..."
                    : invite.email_sent
                      ? "Sent"
                      : "Send Email"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function Invites() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvitesContent />
    </Suspense>
  );
}
