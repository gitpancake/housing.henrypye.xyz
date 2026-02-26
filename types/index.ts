export interface ScoreBreakdown {
    category: string;
    score: number;
    reasoning: string;
}

export interface Score {
    id: string;
    aiOverallScore: number | null;
    aiBreakdown?: ScoreBreakdown[] | unknown;
    aiSummary?: string | null;
    manualOverrideScore: number | null;
    user: { id: string; username?: string; displayName: string };
}

export interface Listing {
    id: string;
    title: string;
    description?: string;
    url?: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    price: number | null;
    bedrooms: number | null;
    bathrooms?: number | null;
    petFriendly?: boolean | null;
    squareFeet?: number | null;
    contactPhone?: string | null;
    parking?: string | null;
    laundry?: string | null;
    neighbourhood?: string | null;
    photos: unknown;
    status: string;
    notes?: string | null;
    addedByUser: { id?: string; displayName: string };
    scores: Score[];
    viewings?: Viewing[];
    createdAt: string | Date;
}

export interface ViewingNote {
    id: string;
    viewingId?: string;
    title: string;
    notes: string | null;
    photos: unknown;
    createdAt?: string | Date;
}

export interface Viewing {
    id: string;
    listingId?: string;
    scheduledAt: string | Date;
    notes: string | null;
    status: string;
    listing?: Partial<Listing>;
    viewingNotes?: ViewingNote[];
    user: { id: string; displayName: string };
}
