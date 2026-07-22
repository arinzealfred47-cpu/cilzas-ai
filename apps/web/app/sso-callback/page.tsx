"use client";

import { useRouter } from "next/navigation";
import { HandleSSOCallback } from "@clerk/react";

export default function SSOCallbackPage() {
  const router = useRouter();

  return (
    <HandleSSOCallback
      navigateToApp={({ decorateUrl }) => {
        router.push(decorateUrl("/dashboard"));
      }}
      navigateToSignIn={() => router.replace("/sign-in")}
      navigateToSignUp={() => router.replace("/sign-up")}
    />
  );
}
