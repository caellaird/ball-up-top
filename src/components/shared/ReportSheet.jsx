import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate", label: "Hate speech" },
  { value: "nudity", label: "Nudity" },
  { value: "violence", label: "Violence" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export default function ReportSheet({ open, onOpenChange, targetType, targetId, targetOwnerName }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await base44.auth.me();
      await base44.entities.Report.create({
        reporter_name: user.full_name,
        target_type: targetType,
        target_id: targetId,
        target_owner_name: targetOwnerName,
        reason,
        details,
      });
      onOpenChange(false);
      setReason("");
      setDetails("");
      toast({ title: "Report submitted", description: "Thanks — our team will review it." });
    } catch (err) {
      setError(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const noun = targetType === "user" ? "user" : "post";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
        <SheetHeader>
          <SheetTitle className="font-heading">Report {noun}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Why are you reporting this?</p>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`text-sm rounded-full px-3 py-2 border transition-colors ${
                    reason === r.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Add details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
          <Button onClick={submit} disabled={loading} className="w-full rounded-full h-12">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit report"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}