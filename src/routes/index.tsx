import { createFileRoute } from "@tanstack/react-router";
import { Hero, HowItWorks, StyleGallery, Pricing, Faq } from "@/components/sections/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "XmasMagic PH – Old Photo. Magical Christmas!" },
      { name: "description", content: "Upload one photo and get five magical AI Christmas portraits. ₱99 Basic or ₱149 with music. Pay with GCash or Maya." },
      { property: "og:title", content: "XmasMagic PH – Old Photo. Magical Christmas!" },
      { property: "og:description", content: "One upload. Five magical Christmas photos. Made for Filipino families." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <StyleGallery />
      <Pricing />
      <Faq />
    </>
  );
}
