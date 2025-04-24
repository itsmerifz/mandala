"use server";
import { redirect } from "next/navigation";
import { signOut } from "@root/auth";
import { AuthError } from "next-auth";

const SignOutAction = async () => {
  try {
    await signOut();
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`/error?error=${error.message}`);
    }
    throw error;
  }
}

export default SignOutAction;