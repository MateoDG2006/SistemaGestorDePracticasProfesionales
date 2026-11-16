import { redirect } from "next/navigation";

// Pure redirect — no UI to validate for instant navigation.
export const instant = false;

export default function Home() {
  redirect("/ingresar");
}
