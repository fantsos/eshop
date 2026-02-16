"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "el";
  const prefix = locale === "en" ? "/en" : "";
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg(locale === "en" ? "Missing verification token" : "Λείπει το token επαλήθευσης");
      return;
    }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          const data = await res.json();
          setStatus("error");
          setErrorMsg(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error");
      });
  }, [token, locale]);

  return (
    <div className="container flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {locale === "en" ? "Email Verification" : "Επαλήθευση Email"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {locale === "en" ? "Verifying your email..." : "Επαλήθευση email..."}
              </p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium">
                {locale === "en" ? "Email verified successfully!" : "Το email επαληθεύτηκε επιτυχώς!"}
              </p>
              <Link href={`${prefix}/auth/login`}>
                <Button>{locale === "en" ? "Go to Login" : "Σύνδεση"}</Button>
              </Link>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="font-medium text-destructive">{errorMsg}</p>
              <Link href={`${prefix}/auth/login`}>
                <Button variant="outline">{locale === "en" ? "Go to Login" : "Σύνδεση"}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
