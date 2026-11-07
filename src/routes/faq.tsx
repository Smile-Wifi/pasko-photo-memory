import { createFileRoute } from "@tanstack/react-router";
import { Faq } from "@/components/sections/Sections";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ – Pasko Photo Magic" },
      { name: "description", content: "Answers about payments, processing time, photo privacy and the Pasko Photo Magic packages." },
      { property: "og:title", content: "FAQ – Pasko Photo Magic" },
      { property: "og:description", content: "Answers about payments, processing time, photo privacy and the Pasko Photo Magic packages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <Faq />;
}
