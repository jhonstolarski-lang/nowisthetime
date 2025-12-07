import { eq, and, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptions, InsertSubscription, content, InsertContent } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values(user);
  const insertId = Number(result[0].insertId);
  
  // Fetch and return the created user
  const createdUser = await getUserById(insertId);
  if (!createdUser) {
    throw new Error("Failed to fetch created user");
  }
  
  return createdUser;
}

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create subscription: database not available");
    throw new Error("Database not available");
  }

  const result = await db.insert(subscriptions).values(subscription);
  const insertId = Number(result[0].insertId);
  
  // Fetch and return the created subscription
  const created = await db.select().from(subscriptions).where(eq(subscriptions.id, insertId)).limit(1);
  if (created.length === 0) {
    throw new Error("Failed to fetch created subscription");
  }
  
  return created[0];
}

export async function getSubscriptionByPaymentId(paymentId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscription: database not available");
    return undefined;
  }

  const result = await db.select().from(subscriptions).where(eq(subscriptions.paymentId, paymentId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscriptionStatus(id: number, status: "pending" | "active" | "expired" | "cancelled") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update subscription: database not available");
    return;
  }

  await db.update(subscriptions).set({ status, updatedAt: new Date() }).where(eq(subscriptions.id, id));
}

export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscription: database not available");
    return undefined;
  }

  const result = await db.select().from(subscriptions).where(
    and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active"),
      gte(subscriptions.expiresAt, new Date())
    )
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllContent() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get content: database not available");
    return [];
  }

  return await db.select().from(content);
}

export async function getPublicContent() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get content: database not available");
    return [];
  }

  return await db.select().from(content).where(eq(content.isPublic, true));
}

export async function createContent(newContent: InsertContent) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create content: database not available");
    return undefined;
  }

  const result = await db.insert(content).values(newContent);
  return Number(result[0].insertId);
}

export async function getContentById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get content: database not available");
    return undefined;
  }

  const result = await db.select().from(content).where(eq(content.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContent(id: number, data: Partial<InsertContent>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update content: database not available");
    return;
  }

  await db.update(content).set(data).where(eq(content.id, id));
}

export async function deleteContent(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete content: database not available");
    return;
  }

  await db.delete(content).where(eq(content.id, id));
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscription: database not available");
    return undefined;
  }

  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt)
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscriptionByPaymentId(paymentId: string, status: "pending" | "active" | "expired" | "cancelled") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update subscription: database not available");
    return;
  }

  await db.update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.paymentId, paymentId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

export async function getAllSubscriptions() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscriptions: database not available");
    return [];
  }

  return await db.select().from(subscriptions);
}
