// realmClient.ts
import { REALM } from "@/config/game-constants";
import * as Realm from "realm-web";

const APP_ID = REALM.APP_ID; // vd: "myapp-abcde"
const DB_NAME = REALM.DB_NAME;
// Collection names are provided by callers via function arguments

let app: Realm.App | null = null;

async function getApp() {
  if (!app) app = new Realm.App({ id: APP_ID });
  return app;
}

export async function loginAnonymous() {
  const app = await getApp();
  if (app.currentUser) return app.currentUser;
  const user = await app.logIn(Realm.Credentials.anonymous());
  return user;
}

async function getCollection(collection: string) {
  const app = await getApp();
  const user = app.currentUser ?? (await loginAnonymous());
  // "mongodb-atlas" là tên Service mặc định khi link cluster
  const mongo = user.mongoClient("mongodb-atlas");
  return mongo.db(DB_NAME).collection(collection);
}

// GET: lấy 1 key
export async function kvGet(collection: string, key: string) {
  const app = await getApp();
  const user = app.currentUser ?? (await loginAnonymous());
  const coll = await getCollection(collection);
  const doc = await coll.findOne({ ownerId: user.id, key });
  return doc?.value ?? null;
}

export async function kvGetAll(collection: string) {
  const coll = await getCollection(collection);
  const docs = await coll.find({});
  return docs.map((d) => d.value);
}
// SET: upsert key/value
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function kvSet(collection: string, key: string, value: any) {
  const app = await getApp();
  const user = app.currentUser ?? (await loginAnonymous());
  const coll = await getCollection(collection);

  // First, check if document exists - try different patterns
  const existingDoc1 = await coll.findOne({ key: key });
  const existingDoc2 = await coll.findOne({ "value.id": key });
  const existingDoc3 = await coll.findOne({ "value.level.id": key });
  console.log(
    "Existing document by key:",
    existingDoc1 ? "FOUND" : "NOT FOUND",
    key
  );
  console.log(
    "Existing document by value.id:",
    existingDoc2 ? "FOUND" : "NOT FOUND",
    key
  );
  console.log(
    "Existing document by value.level.id:",
    existingDoc3 ? "FOUND" : "NOT FOUND",
    key
  );

  // Build update object dynamically based on what's provided
  const updateFields: any = {
    ownerId: user.id,
    "value.id": key,
    "value.updatedAt": new Date(),
  };

  // Add name if provided
  if (value.name !== undefined) {
    updateFields["value.name"] = value.name;
  }

  // Add level if provided
  if (value.level !== undefined) {
    updateFields["value.level"] = value.level;
  }
  console.log(
    "updateFields",
    { key: key },
    { $set: updateFields },
    { upsert: true }
  );

  const result = await coll.updateOne(
    { key: key },
    { $set: updateFields },
    { upsert: true }
  );

  console.log("Update result:", result);
}

export async function kvUpdate(collection: string, key: string, value: any) {
  const coll = await getCollection(collection);

  // For level updates, we need to find by value.id (savedLevel.id) instead of value.level.id
  const query = { "value.level.id": key };

  // Build update object
  const updateFields: any = {
    "value.updatedAt": new Date(),
  };

  // Add name if provided
  if (value.name !== undefined) {
    updateFields["value.name"] = value.name;
  }

  // Add level if provided
  if (value.level !== undefined) {
    updateFields["value.level"] = value.level;
  }

  await coll.updateOne(query, { $set: updateFields });
}

//update IMPORT CONFIG
export async function kvUpdateImportConfig(
  collection: string,
  key: string,
  value: any
) {
  const coll = await getCollection(collection);
  await coll.updateOne({ "value.id": key }, { $set: { value: value } });
}

//CREATE: tạo 1 key/value
export async function kvCreate<T extends { id: string }>(
  collection: string,
  key: string,
  value: T
) {
  const coll = await getCollection(collection);
  await coll.insertOne({ key, value, updatedAt: new Date() });
  return value;
}

// LIST: liệt kê tất cả key của user
export async function kvListKeys(collection: string) {
  const coll = await getCollection(collection);
  const docs = await coll.find({ projection: { key: 1 } });
  return docs.map((d) => d.key);
}

// DEL: xoá 1 key
export async function kvDel(collection: string, key: string) {
  const coll = await getCollection(collection);
  // For level deletion, we need to find by value.level.id since key is "history"
  await coll.deleteOne({ "value.id": key });
}

// DEL: xoá all key
export async function kvDelAll(collection: string) {
  const coll = await getCollection(collection);
  await coll.deleteMany({});
}
