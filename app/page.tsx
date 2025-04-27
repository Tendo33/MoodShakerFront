import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to the English version by default
  redirect("/cn");
}
