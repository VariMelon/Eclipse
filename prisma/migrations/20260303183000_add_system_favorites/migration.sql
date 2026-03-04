-- Add per-user favorites for systems
CREATE TABLE "SystemFavorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "systemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SystemFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemFavorite_userId_systemId_key" ON "SystemFavorite"("userId", "systemId");

ALTER TABLE "SystemFavorite"
ADD CONSTRAINT "SystemFavorite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemFavorite"
ADD CONSTRAINT "SystemFavorite_systemId_fkey"
FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;
