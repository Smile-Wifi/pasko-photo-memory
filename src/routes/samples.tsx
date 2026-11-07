import { createFileRoute } from "@tanstack/react-router";
import { StyleGallery } from "@/components/sections/Sections";

export const Route = createFileRoute("/samples")({
  head: () => ({
    meta: [
      { title: "Sample Christmas Photos – XmasMagic PH" },
      { name: "description", content: "See the five magical Christmas styles: Santa, family portrait, winter wonderland, lights and Christmas fashion." },
      { property: "og:title", content: "Sample Christmas Photos – XmasMagic PH" },
      { property: "og:description", content: "See the five magical Christmas styles: Santa, family portrait, winter wonderland, lights and Christmas fashion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <StyleGallery />;
}
