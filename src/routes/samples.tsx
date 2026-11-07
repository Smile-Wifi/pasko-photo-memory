import { createFileRoute } from "@tanstack/react-router";
import { StyleGallery } from "@/components/sections/Sections";

export const Route = createFileRoute("/samples")({
  head: () => ({
    meta: [
      { title: "Sample Christmas Photos – Pasko Photo Magic" },
      { name: "description", content: "Explore Simbang Gabi, Snow, Pajama, Street Celebration, and Traditional / Spanish / Barong Christmas portraits." },
      { property: "og:title", content: "Sample Christmas Photos – Pasko Photo Magic" },
      { property: "og:description", content: "Explore Simbang Gabi, Snow, Pajama, Street Celebration, and Traditional / Spanish / Barong Christmas portraits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <StyleGallery />;
}
