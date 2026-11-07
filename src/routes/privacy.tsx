import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy – Pasko Photo Magic" },
      { name: "description", content: "How Pasko Photo Magic collects, protects and deletes your photos and personal information." },
      { property: "og:title", content: "Privacy Policy – Pasko Photo Magic" },
      { property: "og:description", content: "How we protect and delete your photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      sections={[
        { h: "What we collect", p: "Your name, mobile number, optional email, payment reference number, and the one photo you upload. We use these only to process and deliver your order." },
        { h: "How photos are stored", p: "Photos are kept in private storage. They can only be viewed through your secret order link or by authorized Pasko Photo Magic staff for processing." },
        { h: "AI processing", p: "Your photo is sent securely from our server to our AI image provider only to create your Christmas photos. It is not used for advertising." },
        { h: "Retention and deletion", p: "Uploaded and generated photos, together with the order details, are automatically deleted after the retention period (30 days by default). You can ask us to delete them sooner." },
        { h: "Your rights", p: "In line with the Philippine Data Privacy Act of 2012 (RA 10173), you may request access, correction or deletion of your data by contacting us." },
      ]}
    />
  ),
});
