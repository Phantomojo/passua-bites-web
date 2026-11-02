import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

const DB_URL = "postgresql://postgres:test@127.0.0.1:5432/passua_test";

describe("DB-backed payment coordination", () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ connectionString: DB_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("rejects duplicate active mpesa transactions for one order", async () => {
    await client.query("INSERT INTO \"orders\" (\"customerName\",\"customerPhone\",\"totalPrice\") VALUES ('Test','254700000000','100') RETURNING \"id\"");
    const { rows } = await client.query("SELECT \"id\" FROM \"orders\" ORDER BY \"id\" DESC LIMIT 1");
    const orderId = rows[0].id;

    const k1 = `CHK-${Math.random()}`;
    const k2 = `CHK-${Math.random()}`;

    await client.query(
      `INSERT INTO "mpesaTransactions" ("orderId","checkoutRequestID","phoneNumber","amount","accountReference","status")
       VALUES ($1,$2,'254700000000','100','PB1','pending')`,
      [orderId, k1]
    );

    let threw = false;
    try {
      await client.query(
        `INSERT INTO "mpesaTransactions" ("orderId","checkoutRequestID","phoneNumber","amount","accountReference","status")
         VALUES ($1,$2,'254700000000','100','PB1','initiating')`,
        [orderId, k2]
      );
    } catch (e: any) {
      threw = true;
      expect(e.code).toBe("23505");
    }
    expect(threw).toBe(true);
  });

  it("prevents cash markPaid while an active mpesa attempt exists", async () => {
    await client.query("INSERT INTO \"orders\" (\"customerName\",\"customerPhone\",\"totalPrice\") VALUES ('Test','254700000000','100') RETURNING \"id\"");
    const { rows } = await client.query("SELECT \"id\" FROM \"orders\" ORDER BY \"id\" DESC LIMIT 1");
    const orderId = rows[0].id;

    const k = `CHK-${Math.random()}`;
    await client.query(
      `INSERT INTO "mpesaTransactions" ("orderId","checkoutRequestID","phoneNumber","amount","accountReference","status")
       VALUES ($1,$2,'254700000000','100','PB1','unknown')`,
      [orderId, k]
    );

    const upd = await client.query(
      `UPDATE "orders" SET "paymentStatus"='completed'
       WHERE "id"=$1 AND "paymentStatus" IN ('pending','failed')
       AND NOT EXISTS (SELECT 1 FROM "mpesaTransactions" WHERE "orderId"=$1 AND "status" IN ('initiating','pending','unknown'))`,
      [orderId]
    );
    expect(upd.rowCount).toBe(0);
  });
});
