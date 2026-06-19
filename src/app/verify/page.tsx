"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { useAuth } from "@/lib/challenge/useAuth";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const { refresh } = useAuth();
  // Lazy init handles the no-token case without a synchronous setState in the effect.
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "No verification token in the link.");

  useEffect(() => {
    if (!token) return; // nothing to do; initial state already reflects this
    let active = true;
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!active) return;
        if (r.ok) {
          setState("ok");
          setMessage(`@${j.handle} is verified. You can now redeem rewards.`);
          refresh();
        } else {
          setState("error");
          setMessage(j.error ?? "Verification failed.");
        }
      })
      .catch(() => {
        if (active) {
          setState("error");
          setMessage("Network error verifying your email.");
        }
      });
    return () => {
      active = false;
    };
  }, [token, refresh]);

  return (
    <div className="flex-1 grid place-items-center px-6 py-24">
      <Card className="max-w-md text-center">
        <CardBody className="py-10">
          {state === "loading" && (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-ink-4 mx-auto" />
              <p className="mt-4 text-[14px] text-ink-3">Verifying your email…</p>
            </>
          )}
          {state === "ok" && (
            <>
              <div className="h-12 w-12 rounded-full bg-brand text-white grid place-items-center mx-auto">
                <Check className="h-6 w-6" strokeWidth={3} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
                Email verified
              </h2>
              <p className="mt-2 text-[14px] text-ink-3">{message}</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link href="/challenge" className="h-11 px-6 inline-flex items-center rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-2">
                  Back to challenge
                </Link>
                <Link href="/rewards" className="h-11 px-6 inline-flex items-center rounded-full border border-line-strong text-ink text-[14px] font-medium hover:bg-paper-2">
                  Rewards
                </Link>
              </div>
            </>
          )}
          {state === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-rose text-white grid place-items-center mx-auto">
                <X className="h-6 w-6" strokeWidth={3} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
                Couldn&apos;t verify
              </h2>
              <p className="mt-2 text-[14px] text-ink-3">{message}</p>
              <Link href="/challenge" className="mt-6 h-11 px-6 inline-flex items-center rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-2">
                Back to challenge
              </Link>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex-1 grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-ink-4" /></div>}>
      <VerifyInner />
    </Suspense>
  );
}
