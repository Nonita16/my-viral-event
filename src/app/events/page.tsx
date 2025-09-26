"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import posthog from "posthog-js";

interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  user_id: string;
  created_at: string;
}

export default function Events() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState({
    name: "",
    date: "",
    description: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setEvents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("events").insert({
      ...form,
      user_id: user.id,
    });
    if (error) console.error(error);
    else {
      posthog.capture("create_event", {
        event_name: form.name,
        event_date: form.date,
        event_description: form.description,
        event_location: form.location,
      });
      setForm({ name: "", date: "", description: "", location: "" });
      fetchEvents();
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to create and view events.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Events</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Date</label>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </form>
      <h2 className="text-xl font-semibold mb-4">Your Events</h2>
      <ul className="space-y-4">
        {events.map((event) => (
          <li key={event.id} className="border border-gray-200 rounded p-4">
            <h3 className="font-bold">{event.name}</h3>
            <p>{new Date(event.date).toLocaleString()}</p>
            <p>{event.description}</p>
            <p>{event.location}</p>
            <a
              href={`/event/${event.id}`}
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              View Event Details
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
