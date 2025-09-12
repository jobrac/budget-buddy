
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        const token = credential.accessToken;
      }
      // The signed-in user info.
      const user = result.user;
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
       toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-2 text-center">
          <div className="inline-flex justify-center items-center">
            <PiggyBank className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome to BudgetBuddy</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            By signing in, you agree to our{" "}
            <Link href="#" className="underline">
              Terms of Service
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
