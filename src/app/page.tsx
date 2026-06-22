import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { TryItDemo } from "@/components/landing/TryItDemo";
import { Departments } from "@/components/landing/Departments";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Teasers } from "@/components/landing/Teasers";
import { JoinSection } from "@/components/landing/JoinSection";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Cloud Readiness Challenge — is your company cloud-ready?",
  description:
    "A playful, all-departments challenge that makes the move to SAP S/4HANA Cloud fun. Try a question right now — no login needed.",
};

export default function HomePage() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <TryItDemo />
      <Departments />
      <HowItWorks />
      <Teasers />
      <JoinSection />
      <Footer />
    </main>
  );
}
