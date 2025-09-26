// Image API utilities for fetching pre-established images
// Uses free APIs like Pexels or Lorem Picsum for demo purposes

export interface ImageResult {
  url: string;
  alt: string;
  source: string;
}

// Free image APIs (no API key required)
const IMAGE_APIS = {
  // Lorem Picsum - Random images
  picsum: (width: number = 800, height: number = 400) =>
    `https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`,

  // Unsplash Source API (limited, no key required)
  unsplash: (query: string = "event") =>
    `https://source.unsplash.com/featured/?${query}`,

  // Pexels API would require an API key, so we'll use alternatives
};

// Get a consistent event image based on event ID
export async function getEventImage(eventId: string): Promise<ImageResult> {
  // Create a consistent seed from the event ID
  const seed =
    eventId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;

  // Use Lorem Picsum with seed for consistency
  const imageUrl = `https://picsum.photos/800/400?random=${seed}`;

  return {
    url: imageUrl,
    alt: "Event image",
    source: "Lorem Picsum",
  };
}

// Get a random event-related image
export async function getRandomEventImage(): Promise<ImageResult> {
  // Use Lorem Picsum for consistent results
  const imageUrl = IMAGE_APIS.picsum(800, 400);

  return {
    url: imageUrl,
    alt: "Event image",
    source: "Lorem Picsum",
  };
}

// Get an image based on event type/category
export async function getEventImageByType(
  eventType: string = "general"
): Promise<ImageResult> {
  const typeMap: Record<string, string> = {
    party: "party",
    wedding: "wedding",
    birthday: "birthday",
    conference: "conference",
    meeting: "meeting",
    concert: "concert",
    sports: "sports",
    general: "event",
  };

  const keyword = typeMap[eventType.toLowerCase()] || "event";

  // For demo, we'll use Lorem Picsum with seeded randomness based on type
  const seed = keyword.charCodeAt(0) + keyword.length;
  const imageUrl = `https://picsum.photos/800/400?random=${seed}`;

  return {
    url: imageUrl,
    alt: `${keyword} event image`,
    source: "Lorem Picsum",
  };
}

// Get multiple image suggestions
export async function getImageSuggestions(
  count: number = 3
): Promise<ImageResult[]> {
  const suggestions: ImageResult[] = [];

  for (let i = 0; i < count; i++) {
    const imageUrl = IMAGE_APIS.picsum(400, 200);
    suggestions.push({
      url: imageUrl,
      alt: `Event image suggestion ${i + 1}`,
      source: "Lorem Picsum",
    });
  }

  return suggestions;
}

// For production, you might want to integrate with:
// - Unsplash API (requires API key)
// - Pexels API (requires API key)
// - Pixabay API (requires API key)
// - Or use a service like Cloudinary with your own uploaded images
