import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { Ban, ShieldCheck } from "lucide-react";

// Renders as a dropdown menu item. Manages a one-direction block (current → target)
// using the Friend entity's 'blocked' status. If the target has blocked the current
// user, shows a disabled "Blocked" item (can't unblock someone else's block).
export default function BlockButton({ currentUserId, currentUserName, targetUserId, targetUserName }) {
  const [state, setState] = useState("none"); // 'none' | 'iBlocked' | 'theyBlocked'
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, [targetUserId]);

  const load = async () => {
    const [outgoing, incoming] = await Promise.all([
      base44.entities.Friend.filter({ created_by_id: currentUserId, addressee_id: targetUserId }),
      base44.entities.Friend.filter({ created_by_id: targetUserId, addressee_id: currentUserId }),
    ]);
    if (incoming[0]?.status === "blocked") {
      setState("theyBlocked");
      setRecord(incoming[0]);
      return;
    }
    if (outgoing[0]?.status === "blocked") {
      setState("iBlocked");
      setRecord(outgoing[0]);
      return;
    }
    setState("none");
    setRecord(outgoing[0] || null);
  };

  const block = async () => {
    setBusy(true);
    try {
      if (record && record.created_by_id === currentUserId) {
        await base44.entities.Friend.update(record.id, { status: "blocked" });
      } else {
        await base44.entities.Friend.create({
          requester_name: currentUserName,
          addressee_id: targetUserId,
          addressee_name: targetUserName,
          status: "blocked",
        });
      }
      toast({ title: `Blocked ${targetUserName}` });
      load();
    } catch (err) {
      toast({ title: "Failed to block user", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const unblock = async () => {
    setBusy(true);
    try {
      if (record && record.created_by_id === currentUserId) {
        await base44.entities.Friend.update(record.id, { status: "declined" });
      }
      toast({ title: `Unblocked ${targetUserName}` });
      load();
    } catch (err) {
      toast({ title: "Failed to unblock user", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (state === "theyBlocked") {
    return (
      <DropdownMenuItem disabled>
        <Ban className="w-4 h-4" /> Blocked
      </DropdownMenuItem>
    );
  }
  if (state === "iBlocked") {
    return (
      <DropdownMenuItem onClick={unblock} disabled={busy}>
        <ShieldCheck className="w-4 h-4" /> Unblock user
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem onClick={block} disabled={busy} className="text-destructive focus:text-destructive">
      <Ban className="w-4 h-4" /> Block user
    </DropdownMenuItem>
  );
}