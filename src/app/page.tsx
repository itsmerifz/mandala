import { Button } from "@/components/ui/button";
import { signIn } from "@root/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-24">
      <div className="dark:border-white *:border-black border p-48 w-[800px] flex flex-col items-center justify-center rounded-3xl gap-3">
        <h1 className="text-6xl font-thin">Mandala</h1>
        <form action={
          async () => {
            "use server";
            try {
              await signIn("vatsim");
            }
            catch (error) {
              if (error instanceof AuthError) {
                return redirect(`/error?error=${error.message}`);
              }
              throw error;
            }
          }
        }>
          <Button className="mt-4 hover:cursor-pointer">Sign In with VATSIM SSO</Button>
        </form>
      </div>
    </div>
  );
}
