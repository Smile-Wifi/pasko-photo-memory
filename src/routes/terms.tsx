import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions – XmasMagic PH" },
      { name: "description", content: "Terms for ordering AI Christmas photos from XmasMagic PH." },
      { property: "og:title", content: "Terms and Conditions – XmasMagic PH" },
      { property: "og:description", content: "Terms for ordering AI Christmas photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage
      title="Terms and Conditions"
      sections={[
        { h: "Orders", p: "Each order covers one uploaded photo and five generated Christmas photos in the styles shown. You must own the photo or have permission from the people in it." },
        { h: "Payment", p: "Prices are in Philippine Peso. Orders are processed only after your GCash, Maya or bank transfer payment is verified." },
        { h: "AI results", p: "Results are created by AI. We aim to keep each person's appearance consistent, but exact likeness cannot be guaranteed. If a result fails, contact us for a re-generation." },
        { h: "Prohibited content", p: "Do not upload photos that are illegal, offensive, or of people who have not consented. We may cancel such orders." },
        { h: "Downloads", p: "Download your photos before the retention period ends; after that they are permanently deleted." },
      ]}
    />
  ),
});
