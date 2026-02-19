import { auth } from "@auth";
import { redirect } from "next/navigation";
import { taskService } from "@/server/services/taskService";
import TrashClient from "./TrashClient";

export default async function TrashPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const deletedTasks = await taskService.getDeletedTasks(session.user.email);

  return <TrashClient initialTasks={deletedTasks} />;
}
