import { auth } from "@auth";
import { redirect } from "next/navigation";
import { labelService } from "@/server/services/labelService";
import LabelsClient from "./LabelsClient";

export default async function LabelsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const labels = await labelService.getLabels(session.user.email);

  return <LabelsClient initialLabels={labels} />;
}
