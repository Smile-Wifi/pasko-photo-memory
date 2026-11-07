import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us – XmasMagic PH" },
      { name: "description", content: "Questions about your Christmas photo order? Contact the XmasMagic PH team." },
      { property: "og:title", content: "Contact Us – XmasMagic PH" },
      { property: "og:description", content: "Get help with your XmasMagic PH order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const items = [
    { icon: Mail, label: "Email", value: "hello@xmasmagic.ph", href: "mailto:hello@xmasmagic.ph" },
    { icon: MessageCircle, label: "Facebook Messenger", value: "m.me/xmasmagicph", href: "https://m.me/xmasmagicph" },
    { icon: Clock, label: "Support hours", value: "Mon–Sun, 9AM–9PM (PH time)", href: null },
  ];
  return (
    <section className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-center text-4xl font-bold text-pine">Contact Us</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Please include your order reference. You can also <Link to="/track" className="text-primary underline">track your order</Link>.
      </p>
      <div className="mt-10 space-y-3">
        {items.map((i) => (
          <div key={i.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary"><i.icon className="h-5 w-5 text-primary" /></span>
            <div>
              <p className="text-sm text-muted-foreground">{i.label}</p>
              {i.href ? <a href={i.href} className="font-semibold text-pine hover:text-primary">{i.value}</a> : <p className="font-semibold text-pine">{i.value}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
