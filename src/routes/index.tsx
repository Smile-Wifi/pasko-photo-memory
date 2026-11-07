import { createFileRoute } from "@tanstack/react-router";
import { HowItWorks, StyleGallery, Faq } from "@/components/sections/Sections";
import { FestiveStudio } from "@/components/sections/FestiveStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pasko Photo Magic – Balik Alaala sa Pasko" },
      { name: "description", content: "Upload one photo and get five magical AI Christmas portraits. ₱99 Basic or ₱149 with music. Pay with GCash or Maya." },
      { property: "og:title", content: "Pasko Photo Magic – Balik Alaala sa Pasko" },
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
      <FestiveStudio />
      <HowItWorks artwork />
      <StyleGallery artwork />
      <Faq />
    </>
  );
}
