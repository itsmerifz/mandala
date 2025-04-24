import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { auth } from "@root/auth";
import SignInAction from "./actions/signin";

export default async function Home() {
  const session = await auth();

  if (session?.user) redirect("/main");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-24">
      <div className="dark:border-white *:border-black border p-48 w-[800px] flex flex-col items-center justify-center rounded-3xl gap-3">
        <h1 className="text-6xl font-thin">Mandala</h1>
        <form action={ SignInAction }>
          <Button className="mt-4 hover:cursor-pointer">Sign In with VATSIM SSO</Button>
        </form>
      </div>
    </div>
  );
}
