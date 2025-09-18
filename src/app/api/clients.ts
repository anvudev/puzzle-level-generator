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
  const app = await getApp();
  const user = app.currentUser ?? (await loginAnonymous());
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
  await coll.updateOne(
    { "value.id": key },
    {
      $set: {
        ownerId: user.id,
        "value.id": key,
        "value.name": value.name,
        "value.updatedAt": new Date(),
      },
    },
    { upsert: true }
  );
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
  await coll.deleteOne({ "value.id": key });
}

// DEL: xoá all key
export async function kvDelAll(collection: string) {
  const coll = await getCollection(collection);
  await coll.deleteMany({});
}
