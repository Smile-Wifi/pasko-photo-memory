import { createFileRoute } from "@tanstack/react-router";
import { Pricing, Faq } from "@/components/sections/Sections";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing – XmasMagic PH" },
      { name: "description", content: "Basic Magic ₱99 or Magic with Music ₱149. Five Christmas photos from one upload." },
      { property: "og:title", content: "Pricing – XmasMagic PH" },
      { property: "og:description", content: "Basic Magic ₱99 or Magic with Music ₱149. Five Christmas photos from one upload." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <><Pricing /><Faq /></>;
}
