// localhost:3000/demo

"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function DemoPage() {


  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const handleBlocking = async () => {

    setLoading(true);
    const output = await fetch("/api/demo/blocking", { method: 'POST' });
    setLoading(false);

  };

  const userId = useAuth();


  const handleBackground = async () => {
    setLoading2(true);
    await fetch("api/demo/background", { method: 'POST' });
    setLoading2(false);
  }

  const handleClientError = () => {
    Sentry.logger.info(`user ${userId.userId} tried clicking on client function`);
    throw new Error('client error');
  }

  const handleApiError = async () => {
    await fetch("/api/demo/error", { method: 'POST' });
  }

  const handleInngestError = async () => {
    await fetch("/api/demo/inngest-error", { method: 'POST' });
  }

  return (
    <div className="p-8 space-x-4">
      <Button onClick={handleBlocking} disabled={loading}>
        {loading ? "Loading..." : "Blocking"}
      </Button>

      <Button onClick={handleBackground} disabled={loading2}>
        {loading2 ? "Loading..." : "Background"}
      </Button>

      <Button variant="destructive" onClick={handleClientError}>
        Client error
      </Button>

      <Button variant="destructive" onClick={handleApiError}>
        api error
      </Button>
      <Button variant="destructive" onClick={handleInngestError}>
        inngest error
      </Button>



    </div>
  );
}
