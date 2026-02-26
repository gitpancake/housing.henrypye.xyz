import { z } from "zod";

const coerceInt = z.coerce.number().int().nullable();

export const listingCreateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().default(""),
    url: z.string().optional().default(""),
    address: z.string().optional().default(""),
    latitude: z.coerce.number().nullable().optional(),
    longitude: z.coerce.number().nullable().optional(),
    price: coerceInt.optional(),
    bedrooms: coerceInt.optional(),
    bathrooms: coerceInt.optional(),
    petFriendly: z.boolean().nullable().optional(),
    squareFeet: coerceInt.optional(),
    contactPhone: z.string().nullable().optional(),
    parking: z.string().nullable().optional(),
    laundry: z.string().nullable().optional(),
    yearBuilt: coerceInt.optional(),
    availableDate: z.string().nullable().optional(),
    neighbourhood: z.string().nullable().optional(),
    photos: z.array(z.string()).optional().default([]),
    scrapedContent: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

export const listingUpdateSchema = z
    .object({
        title: z.string().min(1),
        description: z.string(),
        url: z.string(),
        address: z.string(),
        latitude: z.coerce.number().nullable(),
        longitude: z.coerce.number().nullable(),
        price: coerceInt,
        bedrooms: coerceInt,
        bathrooms: coerceInt,
        petFriendly: z.boolean().nullable(),
        squareFeet: coerceInt,
        contactPhone: z.string().nullable(),
        parking: z.string().nullable(),
        laundry: z.string().nullable(),
        yearBuilt: coerceInt,
        availableDate: z.string().nullable(),
        neighbourhood: z.string().nullable(),
        photos: z.array(z.string()),
        notes: z.string().nullable(),
        status: z.enum(["ACTIVE", "ARCHIVED", "REJECTED", "FAVORITE", "SELECTED"]),
        scrapedContent: z.string().nullable(),
    })
    .partial();

export const preferencesSchema = z
    .object({
        naturalLight: z.boolean(),
        bedroomsMin: z.number().int().min(0),
        bedroomsMax: z.number().int().min(0),
        outdoorsAccess: z.boolean(),
        publicTransport: z.boolean(),
        budgetMin: z.number().int().min(0),
        budgetMax: z.number().int().min(0),
        petFriendly: z.boolean(),
        moveInDateStart: z.string().nullable().optional(),
        moveInDateEnd: z.string().nullable().optional(),
        laundryInUnit: z.boolean(),
        parking: z.boolean(),
        quietNeighbourhood: z.boolean(),
        modernFinishes: z.boolean(),
        storageSpace: z.boolean(),
        gymAmenities: z.boolean(),
        customDesires: z
            .array(z.object({ label: z.string(), enabled: z.boolean() }))
            .optional()
            .default([]),
    })
    .refine((d) => d.budgetMin <= d.budgetMax, {
        message: "budgetMin must be <= budgetMax",
        path: ["budgetMin"],
    })
    .refine((d) => d.bedroomsMin <= d.bedroomsMax, {
        message: "bedroomsMin must be <= bedroomsMax",
        path: ["bedroomsMin"],
    });
