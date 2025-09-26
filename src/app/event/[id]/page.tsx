"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import posthog from "posthog-js";

interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

interface Invite {
  id: string;
  code: string;
}

export default function EventDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [hasRsvped, setHasRsvped] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
      handleReferralTracking();
    }
  }, [id]);

  useEffect(() => {
    if (user && event) {
      checkRsvpStatus();
    }
  }, [user, event]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
    } else {
      setEvent(data);
      posthog.capture("view_event", {
        event_id: id,
        event_name: data.name,
      });
    }
    setLoading(false);
  };

  const checkRsvpStatus = async () => {
    if (!user || !event) return;

    // Assuming there's an rsvps table, but for now we'll use a simple check
    // In a real implementation, you'd have an rsvps table
    const { data, error } = await supabase
      .from("rsvps")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .single();

    if (data && !error) {
      setHasRsvped(true);
    }
  };

  const handleReferralTracking = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    if (refCode) {
      // Store ref in localStorage for persistence
      localStorage.setItem("referral_code", refCode);

      // Validate invite
      const { data: invite, error } = await supabase
        .from("invites")
        .select("*")
        .eq("code", refCode)
        .single();

      if (invite && !error) {
        // Track click
        await trackReferral(invite.id, "click");

        // Record discovered event for logged-in users
        if (user && id) {
          await supabase.from("discovered_events").upsert({
            user_id: user.id,
            event_id: id,
            discovered_via_invite_id: invite.id,
          });
        }
      }
    }
  };

  const trackReferral = async (inviteId: string, actionType: string) => {
    const { error } = await supabase.from("referrals").insert({
      invite_id: inviteId,
      action_type: actionType,
      user_id: user?.id,
      session_id: getSessionId(),
    });

    if (error) {
      console.error("Error tracking referral:", error);
    }
  };

  const getSessionId = () => {
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("session_id", sessionId);
    }
    return sessionId;
  };

  const handleRsvp = async () => {
    if (!user || !event) return;

    setRsvpLoading(true);

    // Assuming rsvps table exists
    const { error } = await supabase.from("rsvps").insert({
      event_id: event.id,
      user_id: user.id,
    });

    if (error) {
      console.error("Error RSVPing:", error);
    } else {
      setHasRsvped(true);
      posthog.capture("rsvp_event", {
        event_id: event.id,
        event_name: event.name,
      });

      // Track referral if applicable
      const refCode = localStorage.getItem("referral_code");
      if (refCode) {
        const { data: invite } = await supabase
          .from("invites")
          .select("*")
          .eq("code", refCode)
          .single();

        if (invite) {
          await trackReferral(invite.id, "rsvp");
        }
      }
    }

    setRsvpLoading(false);
  };

  if (loading || authLoading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.name}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}
      <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
      <div className="mb-6">
        <p className="text-gray-600 mb-2">
          {new Date(event.date).toLocaleString()}
        </p>
        <p className="text-gray-600 mb-2">{event.location}</p>
        <p className="text-gray-700">{event.description}</p>
      </div>

      {user ? (
        <div>
          {hasRsvped ? (
            <p className="text-green-600 font-semibold">
              You're going to this event!
            </p>
          ) : (
            <button
              onClick={handleRsvp}
              disabled={rsvpLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {rsvpLoading ? "RSVPing..." : "RSVP"}
            </button>
          )}
        </div>
      ) : (
        <p className="text-gray-600">
          Please{" "}
          <a href="/auth" className="text-blue-500 underline">
            sign in
          </a>{" "}
          to RSVP.
        </p>
      )}
    </div>
  );
}
