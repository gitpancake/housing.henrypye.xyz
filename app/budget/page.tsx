"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { BudgetView } from "@/components/budget/budget-view";
import { useCurrentUser } from "@/lib/hooks";

interface BudgetUser {
  id: string;
  displayName: string;
  preferences: {
    annualSalary: number | null;
    budgetMin: number;
    budgetMax: number;
  } | null;
}

export default function BudgetPage() {
  const { userId: currentUserId } = useCurrentUser();
  const [users, setUsers] = useState<BudgetUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/budget")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading budget...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <BudgetView users={users} currentUserId={currentUserId} />
    </PageWrapper>
  );
}
