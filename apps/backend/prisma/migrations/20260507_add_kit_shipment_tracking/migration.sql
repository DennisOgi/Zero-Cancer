-- CreateTable: KitShipment for tracking kit deliveries
CREATE TABLE IF NOT EXISTS "KitShipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batchNumber" TEXT,
    "shippedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP,
    "estimatedDelivery" TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SHIPPED',
    "trackingNumber" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KitShipment_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KitShipment_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: InventoryAlert for low stock notifications
CREATE TABLE IF NOT EXISTS "InventoryAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "threshold" INTEGER,
    "currentStock" INTEGER NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryAlert_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryAlert_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: RestockRequest for centers to request more kits
CREATE TABLE IF NOT EXISTS "RestockRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP,
    "reviewNotes" TEXT,
    "shipmentId" TEXT,
    CONSTRAINT "RestockRequest_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RestockRequest_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RestockRequest_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "KitShipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "KitShipment_centerId_idx" ON "KitShipment"("centerId");
CREATE INDEX "KitShipment_status_idx" ON "KitShipment"("status");
CREATE INDEX "KitShipment_shippedAt_idx" ON "KitShipment"("shippedAt");

CREATE INDEX "InventoryAlert_centerId_idx" ON "InventoryAlert"("centerId");
CREATE INDEX "InventoryAlert_resolved_idx" ON "InventoryAlert"("resolved");
CREATE INDEX "InventoryAlert_createdAt_idx" ON "InventoryAlert"("createdAt");

CREATE INDEX "RestockRequest_centerId_idx" ON "RestockRequest"("centerId");
CREATE INDEX "RestockRequest_status_idx" ON "RestockRequest"("status");
CREATE INDEX "RestockRequest_requestedAt_idx" ON "RestockRequest"("requestedAt");
