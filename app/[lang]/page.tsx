import { redirect } from "next/navigation";
import Home from "@/components/pages/Home";

export default function LangHomePage({ params }: { params: { lang: string } }) {
  // Validate language parameter
  if (params.lang !== "en" && params.lang !== "zh") {
    redirect("/en");
  }

  return <Home />;
}
