import { createFileRoute } from "@tanstack/react-router";
import { HowItWorks, Pricing } from "@/components/sections/Sections";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works – XmasMagic PH" },
      { name: "description", content: "Upload one photo, choose a package, and get five AI Christmas photos to download and share." },
      { property: "og:title", content: "How It Works – XmasMagic PH" },
      { property: "og:description", content: "Upload one photo, choose a package, and get five AI Christmas photos to download and share." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <><HowItWorks /><Pricing /></>;
}
