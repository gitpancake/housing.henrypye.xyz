export const ACTIVE_STATUSES = ["ACTIVE", "FAVORITE", "SELECTED"] as const;

export function isActiveListing(status: string): boolean {
    return (ACTIVE_STATUSES as readonly string[]).includes(status);
}
