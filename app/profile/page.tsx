"use client";

import { useEffect, useState } from "react";
import { OnboardingWizard } from "@/components/preferences/onboarding-wizard";
import { PageWrapper } from "@/components/layout/page-wrapper";

export default function ProfilePage() {
    const [initialData, setInitialData] = useState<Record<
        string,
        unknown
    > | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/preferences")
            .then((res) => res.json())
            .then((data) => {
                if (data.preferences) {
                    const p = data.preferences;
                    setInitialData({
                        ...p,
                        moveInDateStart: p.moveInDateStart
                            ? new Date(p.moveInDateStart)
                                  .toISOString()
                                  .split("T")[0]
                            : "",
                        moveInDateEnd: p.moveInDateEnd
                            ? new Date(p.moveInDateEnd)
                                  .toISOString()
                                  .split("T")[0]
                            : "",
                    });
                }
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading preferences...</p>
            </div>
        );
    }

    return (
        <PageWrapper>
            <OnboardingWizard
                initialData={initialData ?? undefined}
                isEditing={true}
            />
        </PageWrapper>
    );
}
