-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT,
    "profile_image_url" TEXT,
    "is_initial_admin" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT,
    "created_by" TEXT,
    CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "repeat_type" TEXT NOT NULL,
    "repeat_day" INTEGER,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "last_processed_date" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    CONSTRAINT "recurring_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitation_tokens" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "created_by" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
    "expires_at" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "used_at" TEXT,
    CONSTRAINT "invitation_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "expenses_created_by_idx" ON "expenses"("created_by");

-- CreateIndex
CREATE INDEX "recurring_expenses_created_by_idx" ON "recurring_expenses"("created_by");
