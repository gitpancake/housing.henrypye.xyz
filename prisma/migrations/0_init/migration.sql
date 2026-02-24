-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "housing";

-- CreateEnum
CREATE TYPE "housing"."listing_status" AS ENUM ('ACTIVE', 'ARCHIVED', 'REJECTED', 'FAVORITE');

-- CreateEnum
CREATE TYPE "housing"."viewing_status" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "housing"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "natural_light" BOOLEAN NOT NULL DEFAULT false,
    "bedrooms_min" INTEGER NOT NULL DEFAULT 1,
    "bedrooms_max" INTEGER NOT NULL DEFAULT 2,
    "outdoors_access" BOOLEAN NOT NULL DEFAULT false,
    "public_transport" BOOLEAN NOT NULL DEFAULT false,
    "budget_min" INTEGER NOT NULL DEFAULT 1500,
    "budget_max" INTEGER NOT NULL DEFAULT 2500,
    "annual_salary" INTEGER,
    "pet_friendly" BOOLEAN NOT NULL DEFAULT false,
    "move_in_date_start" TIMESTAMP(3),
    "move_in_date_end" TIMESTAMP(3),
    "laundry_in_unit" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "quiet_neighbourhood" BOOLEAN NOT NULL DEFAULT false,
    "modern_finishes" BOOLEAN NOT NULL DEFAULT false,
    "storage_space" BOOLEAN NOT NULL DEFAULT false,
    "gym_amenities" BOOLEAN NOT NULL DEFAULT false,
    "custom_desires" JSONB NOT NULL DEFAULT '[]',
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."listings" (
    "id" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "pet_friendly" BOOLEAN,
    "square_feet" INTEGER,
    "contact_phone" TEXT,
    "parking" TEXT,
    "laundry" TEXT,
    "year_built" INTEGER,
    "available_date" TEXT,
    "neighbourhood" TEXT,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "scraped_content" TEXT,
    "status" "housing"."listing_status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."listing_scores" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ai_overall_score" DOUBLE PRECISION,
    "ai_breakdown" JSONB,
    "ai_summary" TEXT,
    "manual_override_score" DOUBLE PRECISION,
    "evaluated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."area_recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "area_name" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "key_highlights" JSONB NOT NULL,
    "average_rent" TEXT,
    "transit_score" TEXT,
    "vibe_description" TEXT,
    "preferences_hash" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."viewings" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "housing"."viewing_status" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."viewing_notes" (
    "id" TEXT NOT NULL,
    "viewing_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."dismissed_areas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "area_name" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dismissed_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."area_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "area_name" TEXT NOT NULL,
    "liked" TEXT,
    "disliked" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing"."todos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 30,
    "location" TEXT,
    "link" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "housing"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "housing"."user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_scores_listing_id_user_id_key" ON "housing"."listing_scores"("listing_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dismissed_areas_user_id_area_name_key" ON "housing"."dismissed_areas"("user_id", "area_name");

-- CreateIndex
CREATE UNIQUE INDEX "area_notes_user_id_area_name_key" ON "housing"."area_notes"("user_id", "area_name");

-- AddForeignKey
ALTER TABLE "housing"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "housing"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."listings" ADD CONSTRAINT "listings_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "housing"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."listing_scores" ADD CONSTRAINT "listing_scores_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "housing"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."listing_scores" ADD CONSTRAINT "listing_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "housing"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."area_recommendations" ADD CONSTRAINT "area_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "housing"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."viewings" ADD CONSTRAINT "viewings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "housing"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."viewings" ADD CONSTRAINT "viewings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "housing"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."viewing_notes" ADD CONSTRAINT "viewing_notes_viewing_id_fkey" FOREIGN KEY ("viewing_id") REFERENCES "housing"."viewings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."dismissed_areas" ADD CONSTRAINT "dismissed_areas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "housing"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."area_notes" ADD CONSTRAINT "area_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "housing"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing"."todos" ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "housing"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

