"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  getRandomEventImage,
  getImageSuggestions,
  ImageResult,
} from "@/lib/imageApi";
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

export default function Events() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [discoveredEvents, setDiscoveredEvents] = useState<Event[]>([]);
  const [imageSuggestions, setImageSuggestions] = useState<ImageResult[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    description: "",
    location: "",
    image_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchDiscoveredEvents();
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

  const fetchDiscoveredEvents = async () => {
    const { data, error } = await supabase
      .from("discovered_events")
      .select(
        `
        event_id,
        events (
          id,
          name,
          date,
          description,
          location,
          image_url,
          user_id,
          created_at
        )
      `
      )
      .eq("user_id", user!.id);
    if (error) console.error(error);
    else {
      const events =
        (data?.map((item: any) => item.events).filter(Boolean) as Event[]) ||
        [];
      setDiscoveredEvents(events);
    }
  };

  const loadImageSuggestions = async () => {
    setLoadingImages(true);
    try {
      const suggestions = await getImageSuggestions(3);
      setImageSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to load image suggestions:", error);
    }
    setLoadingImages(false);
  };

  const selectImage = (imageUrl: string) => {
    setForm({ ...form, image_url: imageUrl });
    setImageSuggestions([]);
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
      setForm({
        name: "",
        date: "",
        description: "",
        location: "",
        image_url: "",
      });
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
        <div className="mb-4">
          <label className="block text-sm font-medium">
            Image URL (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="mt-1 block flex-1 border border-gray-300 rounded-md p-2"
            />
            <button
              type="button"
              onClick={loadImageSuggestions}
              disabled={loadingImages}
              className="mt-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {loadingImages ? "Loading..." : "Get Suggestions"}
            </button>
          </div>
          {imageSuggestions.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {imageSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="cursor-pointer border-2 border-gray-200 rounded hover:border-blue-500"
                  onClick={() => selectImage(suggestion.url)}
                >
                  <img
                    src={suggestion.url}
                    alt={suggestion.alt}
                    className="w-full h-20 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
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

      {discoveredEvents.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 mt-8">
            Events from Invites
          </h2>
          <ul className="space-y-4">
            {discoveredEvents.map((event) => (
              <li key={event.id} className="border border-gray-200 rounded p-4">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.name}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                )}
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
        </>
      )}
    </div>
  );
}
