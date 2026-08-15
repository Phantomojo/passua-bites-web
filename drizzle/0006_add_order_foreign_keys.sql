DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "orderItems" oi LEFT JOIN "orders" o ON o."id" = oi."orderId" WHERE o."id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot add orderItems.orderId foreign key: orphan order items exist';
  END IF;
  IF EXISTS (SELECT 1 FROM "orderItems" oi LEFT JOIN "menuItems" mi ON mi."id" = oi."menuItemId" WHERE mi."id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot add orderItems.menuItemId foreign key: orphan menu item references exist';
  END IF;
  IF EXISTS (SELECT 1 FROM "mpesaTransactions" mt LEFT JOIN "orders" o ON o."id" = mt."orderId" WHERE o."id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot add mpesaTransactions.orderId foreign key: orphan payment transactions exist';
  END IF;
  IF EXISTS (SELECT 1 FROM "orders" o LEFT JOIN "users" u ON u."id" = o."userId" WHERE o."userId" IS NOT NULL AND u."id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot add orders.userId foreign key: orphan user references exist';
  END IF;
END $$;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_userId_users_id_fk"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "orderItems"
  ADD CONSTRAINT "orderItems_orderId_orders_id_fk"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE;

ALTER TABLE "orderItems"
  ADD CONSTRAINT "orderItems_menuItemId_menuItems_id_fk"
  FOREIGN KEY ("menuItemId") REFERENCES "menuItems"("id") ON DELETE RESTRICT;

ALTER TABLE "mpesaTransactions"
  ADD CONSTRAINT "mpesaTransactions_orderId_orders_id_fk"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE;
--> statement-breakpoint
