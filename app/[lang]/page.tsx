import { redirect } from "next/navigation";
import Home from "@/components/pages/Home";

export default async function LangHomePage({
  params,
}: {
  params: { lang: string };
}) {
  // Validate language parameter
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") {
    redirect("/cn");
  }

  return <Home />;
}
