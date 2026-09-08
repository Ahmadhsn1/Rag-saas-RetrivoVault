import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { User } from "../models/User.js";
import { ChatSession } from "../models/ChatSession.js";
import { Notification } from "../models/Notification.js";

describe("Pro trial", () => {
  it("a fresh signup gets a Pro trial reflected in billing + usage", async () => {
    const ctx = await makeUser({ keepTrial: true });
    const billing = await request(app).get("/api/billing").set(auth(ctx.token));
    expect(billing.body.plan.id).toBe("pro");
    expect(billing.body.trial).toBeTruthy();

    const usage = await request(app).get("/api/usage").set(auth(ctx.token));
    expect(usage.body.limits.documents).toBe(500);
  });
});

describe("notifications", () => {
  it("delivers a welcome notification on signup and marks it read", async () => {
    const ctx = await makeUser();
    const list = await request(app)
      .get("/api/notifications")
      .set(auth(ctx.token));
    expect(list.status).toBe(200);
    expect(list.body.items.some((n) => n.type === "welcome")).toBe(true);
    expect(list.body.unread).toBeGreaterThan(0);

    const read = await request(app)
      .post("/api/notifications/read")
      .set(auth(ctx.token))
      .send({});
    expect(read.body.unread).toBe(0);
  });
});

describe("chat feedback + sharing", () => {
  it("stores feedback on an assistant message", async () => {
    const ctx = await makeUser();
    const session = await ChatSession.create({
      userId: ctx.user._id,
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello [1]" },
      ],
    });
    const msgId = session.messages[1]._id;

    const r = await request(app)
      .post(`/api/chat/${session._id}/messages/${msgId}/feedback`)
      .set(auth(ctx.token))
      .send({ rating: "up" });
    expect(r.status).toBe(200);

    const fresh = await ChatSession.findById(session._id);
    expect(fresh.messages[1].feedback).toBe("up");
  });

  it("creates a public share link and serves it without auth", async () => {
    const ctx = await makeUser();
    const session = await ChatSession.create({
      userId: ctx.user._id,
      title: "Shared one",
      messages: [{ role: "assistant", content: "public answer" }],
    });

    const share = await request(app)
      .post(`/api/chat/${session._id}/share`)
      .set(auth(ctx.token))
      .send({});
    expect(share.body.shareId).toBeTruthy();

    const pub = await request(app).get(
      `/api/public/shared-chats/${share.body.shareId}`
    );
    expect(pub.status).toBe(200);
    expect(pub.body.session.title).toBe("Shared one");
    expect(pub.body.session.messages[0].content).toBe("public answer");

    // revoke
    await request(app)
      .post(`/api/chat/${session._id}/share`)
      .set(auth(ctx.token))
      .send({ enabled: false })
      .expect(200);
    const gone = await request(app).get(
      `/api/public/shared-chats/${share.body.shareId}`
    );
    expect(gone.status).toBe(404);
  });

  it("pins and archives sessions", async () => {
    const ctx = await makeUser();
    const s = await ChatSession.create({ userId: ctx.user._id });
    await request(app)
      .patch(`/api/chat/${s._id}`)
      .set(auth(ctx.token))
      .send({ pinned: true, archived: true })
      .expect(200);

    const active = await request(app).get("/api/chat").set(auth(ctx.token));
    expect(active.body.sessions).toHaveLength(0);
    const archived = await request(app)
      .get("/api/chat?archived=true")
      .set(auth(ctx.token));
    expect(archived.body.sessions).toHaveLength(1);
  });
});

describe("collection instructions", () => {
  it("stores per-collection instructions", async () => {
    const ctx = await makeUser();
    const { body } = await request(app)
      .post("/api/collections")
      .set(auth(ctx.token))
      .send({ name: "Legal" });
    const r = await request(app)
      .patch(`/api/collections/${body.collection._id}`)
      .set(auth(ctx.token))
      .send({ instructions: "Answer as a cautious contracts lawyer." });
    expect(r.status).toBe(200);
    expect(r.body.collection.instructions).toMatch(/contracts lawyer/);
  });
});

describe("webhooks", () => {
  it("are Max-only and validate the URL", async () => {
    const ctx = await makeUser();
    const locked = await request(app)
      .post("/api/webhooks")
      .set(auth(ctx.token))
      .send({ url: "https://example.com/hook" });
    expect(locked.status).toBe(403);

    await User.updateOne({ _id: ctx.user._id }, { plan: "max" });

    const badUrl = await request(app)
      .post("/api/webhooks")
      .set(auth(ctx.token))
      .send({ url: "http://insecure.example.com" });
    expect(badUrl.status).toBe(400);

    const ok = await request(app)
      .post("/api/webhooks")
      .set(auth(ctx.token))
      .send({ url: "https://example.com/hook" });
    expect(ok.status).toBe(201);
    expect(ok.body.secret).toMatch(/^whsec_/);
    expect(ok.body.webhook).not.toHaveProperty("secret");
  });
});

describe("account: activity + export", () => {
  it("logs activity and exports all data", async () => {
    const ctx = await makeUser();
    await request(app)
      .patch("/api/account/profile")
      .set(auth(ctx.token))
      .send({ name: "Renamed" });

    // logActivity() is fire-and-forget
    await new Promise((r) => setTimeout(r, 80));

    const activity = await request(app)
      .get("/api/account/activity")
      .set(auth(ctx.token));
    const actions = activity.body.items.map((i) => i.action);
    expect(actions).toContain("auth.signup");
    expect(actions).toContain("account.profile_updated");

    const exp = await request(app)
      .get("/api/account/export")
      .set(auth(ctx.token));
    expect(exp.status).toBe(200);
    expect(exp.headers["content-disposition"]).toMatch(/attachment/);
    expect(exp.body.account.email).toBe(ctx.creds.email);
    expect(Array.isArray(exp.body.documents)).toBe(true);
  });

  it("updates notification preferences", async () => {
    const ctx = await makeUser();
    const r = await request(app)
      .patch("/api/account/notification-prefs")
      .set(auth(ctx.token))
      .send({ weeklyDigest: true, ingestComplete: false });
    expect(r.status).toBe(200);
    expect(r.body.notificationPrefs.weeklyDigest).toBe(true);
    expect(r.body.notificationPrefs.ingestComplete).toBe(false);
  });
});

describe("admin", () => {
  it("is forbidden for regular users and works for an admin", async () => {
    const user = await makeUser();
    const denied = await request(app)
      .get("/api/admin/stats")
      .set(auth(user.token));
    expect(denied.status).toBe(403);

    const admin = await makeUser();
    await User.updateOne({ _id: admin.user._id }, { role: "admin" });

    const stats = await request(app)
      .get("/api/admin/stats")
      .set(auth(admin.token));
    expect(stats.status).toBe(200);
    expect(stats.body.users).toBeGreaterThanOrEqual(2);
    expect(stats.body.planCounts).toBeTruthy();

    const list = await request(app)
      .get("/api/admin/users")
      .set(auth(admin.token));
    expect(list.body.users.length).toBeGreaterThan(0);

    const grant = await request(app)
      .patch(`/api/admin/users/${user.user._id}`)
      .set(auth(admin.token))
      .send({ plan: "max" });
    expect(grant.status).toBe(200);
    expect(grant.body.user.plan).toBe("max");

    // notify() is fire-and-forget
    await new Promise((r) => setTimeout(r, 50));
    expect(
      await Notification.exists({ userId: user.user._id, type: "plan_changed" })
    ).toBeTruthy();
  });
});
