import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Home from "@/components/pages/Home";

export const metadata: Metadata = {
  title: "MoodShaker - Find Your Perfect Cocktail",
  description:
    "Answer a few simple questions and let us recommend the perfect cocktail for you",
  icons: {
    icon: "logo.png",
  },
};

export default async function LangHomePage({
  params,
}: {
  params: { lang: string };
}) {
  // Validate language parameter
  const { lang } = await params;
  if (lang !== "en" && lang !== "cn") {
    redirect("/cn");
  }

  return <Home />;
}
