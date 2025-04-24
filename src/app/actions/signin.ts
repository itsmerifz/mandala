"use server";
import { redirect } from "next/navigation";
import { signIn } from "@root/auth";
import { AuthError } from "next-auth";

const SignInAction = async () => {
  try {
    await signIn("vatsim");
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`/error?error=${error.message}`);
    }
    throw error;
  }
}

export default SignInAction;