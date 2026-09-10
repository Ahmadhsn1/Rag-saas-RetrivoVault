import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { User } from "../models/User.js";
import { UserSession } from "../models/UserSession.js";
import { Notification } from "../models/Notification.js";
import { AdminAudit } from "../models/AdminAudit.js";
import { Token } from "../models/Token.js";

async function makeAdmin({ root = false } = {}) {
  const ctx = await makeUser();
  await User.updateOne(
    { _id: ctx.user._id },
    { role: "admin", isRootAdmin: root, adminSince: new Date() }
  );
  return ctx;
}

const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));

describe("admin console — presence & sessions", () => {
  it("opens a UserSession on login and lists it for the admin", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();

    const sessions = await UserSession.find({ userId: u.user._id });
    expect(sessions.length).toBe(1);
    expect(sessions[0].endedAt).toBeNull();

    const res = await request(app)
      .get(`/api/admin/sessions?userId=${u.user._id}`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.items[0].online).toBe(true);
    expect(res.body.items[0].userId).toBe(String(u.user._id));
  });

  it("heartbeat keeps a user in the online list; admin/presence sees them", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();

    const ping = await request(app)
      .post("/api/presence/ping")
      .set(auth(u.token));
    expect(ping.status).toBe(200);

    const presence = await request(app)
      .get("/api/admin/presence")
      .set(auth(admin.token));
    expect(presence.status).toBe(200);
    expect(presence.body.count).toBeGreaterThanOrEqual(1);
    expect(presence.body.online.some((o) => o.email === u.creds.email)).toBe(true);
  });

  it("logout ends the session", async () => {
    await makeAdmin();
    const u = await makeUser();
    await request(app)
      .post("/api/auth/logout")
      .set(auth(u.token))
      .set("Cookie", u.cookie);
    const s = await UserSession.findOne({ userId: u.user._id });
    expect(s.endedAt).not.toBeNull();
    expect(s.endReason).toBe("logout");
  });

  it("a user can see and revoke their own sessions", async () => {
    const u = await makeUser();
    // a second device
    await request(app).post("/api/auth/login").send({
      email: u.creds.email,
      password: u.creds.password,
    });

    const list = await request(app)
      .get("/api/account/sessions")
      .set(auth(u.token));
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBe(2);

    const other = list.body.items.find((s) => !s.current);
    const del = await request(app)
      .delete(`/api/account/sessions/${other.family}`)
      .set(auth(u.token));
    expect(del.status).toBe(204);

    const after = await UserSession.findOne({ family: other.family });
    expect(after.endedAt).not.toBeNull();
  });
});

describe("admin console — complimentary grants", () => {
  it("grants an effective plan without a subscription and notifies the user", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();

    const res = await request(app)
      .post(`/api/admin/users/${u.user._id}/grant`)
      .set(auth(admin.token))
      .send({ plan: "max", days: 30, reason: "beta tester" });
    expect(res.status).toBe(200);

    const fresh = await User.findById(u.user._id);
    expect(fresh.effectivePlan()).toBe("max");
    expect(fresh.plan).toBe("free"); // stored plan untouched

    await wait();
    expect(
      await Notification.exists({ userId: u.user._id, type: "plan_changed" })
    ).toBeTruthy();
  });

  it("an expired grant no longer counts", async () => {
    await makeAdmin();
    const u = await makeUser();
    await User.updateOne(
      { _id: u.user._id },
      {
        comp: {
          plan: "pro",
          expiresAt: new Date(Date.now() - 1000),
          grantedAt: new Date(),
        },
      }
    );
    const fresh = await User.findById(u.user._id);
    expect(fresh.effectivePlan()).toBe("free");
  });

  it("revokes a grant", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();
    await request(app)
      .post(`/api/admin/users/${u.user._id}/grant`)
      .set(auth(admin.token))
      .send({ plan: "pro" });

    const res = await request(app)
      .delete(`/api/admin/users/${u.user._id}/grant`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    const fresh = await User.findById(u.user._id);
    expect(fresh.activeComp()).toBeNull();
  });
});

describe("admin console — suspension", () => {
  it("blocks login and token refresh, then unsuspend restores access", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();

    const susp = await request(app)
      .post(`/api/admin/users/${u.user._id}/suspend`)
      .set(auth(admin.token))
      .send({ reason: "spam" });
    expect(susp.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({
      email: u.creds.email,
      password: u.creds.password,
    });
    expect(login.status).toBe(403);

    // suspension revokes refresh tokens too, so a refresh is rejected outright
    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", u.cookie);
    expect(refresh.status).toBeGreaterThanOrEqual(401);

    const un = await request(app)
      .post(`/api/admin/users/${u.user._id}/unsuspend`)
      .set(auth(admin.token));
    expect(un.status).toBe(200);

    const login2 = await request(app).post("/api/auth/login").send({
      email: u.creds.email,
      password: u.creds.password,
    });
    expect(login2.status).toBe(200);
  });
});

describe("admin console — password reset", () => {
  it("issues a one-time temp password that forces a change on next login", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();

    const res = await request(app)
      .post(`/api/admin/users/${u.user._id}/temp-password`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.tempPassword).toMatch(/^Rv-/);
    expect(res.body.mustChangePassword).toBe(true);

    // old sessions are gone
    const open = await UserSession.countDocuments({
      userId: u.user._id,
      endedAt: null,
    });
    expect(open).toBe(0);

    const login = await request(app).post("/api/auth/login").send({
      email: u.creds.email,
      password: res.body.tempPassword,
    });
    expect(login.status).toBe(200);
    expect(login.body.user.mustChangePassword).toBe(true);

    const changed = await request(app)
      .post("/api/auth/change-password")
      .set(auth(login.body.accessToken))
      .send({ currentPassword: res.body.tempPassword, newPassword: "brand-new-pass-9" });
    expect(changed.status).toBe(200);
    expect(changed.body.user.mustChangePassword).toBe(false);
  });

  it("sends a reset link (creates a password_reset token)", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();
    const res = await request(app)
      .post(`/api/admin/users/${u.user._id}/send-reset`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(
      await Token.exists({ userId: u.user._id, type: "password_reset" })
    ).toBeTruthy();
  });
});

describe("admin console — roles & guard rails", () => {
  it("only the root admin can change roles", async () => {
    const plainAdmin = await makeAdmin({ root: false });
    const rootAdmin = await makeAdmin({ root: true });
    const u = await makeUser();

    const denied = await request(app)
      .post(`/api/admin/users/${u.user._id}/role`)
      .set(auth(plainAdmin.token))
      .send({ role: "admin" });
    expect(denied.status).toBe(403);

    const ok = await request(app)
      .post(`/api/admin/users/${u.user._id}/role`)
      .set(auth(rootAdmin.token))
      .send({ role: "admin" });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe("admin");
  });

  it("the root admin account is protected from suspension", async () => {
    const rootAdmin = await makeAdmin({ root: true });
    const otherAdmin = await makeAdmin({ root: false });

    const res = await request(app)
      .post(`/api/admin/users/${rootAdmin.user._id}/suspend`)
      .set(auth(otherAdmin.token))
      .send({ reason: "nope" });
    expect(res.status).toBe(403);
  });

  it("records every action in the admin audit log", async () => {
    const admin = await makeAdmin();
    const u = await makeUser();
    await request(app)
      .post(`/api/admin/users/${u.user._id}/grant`)
      .set(auth(admin.token))
      .send({ plan: "pro" });

    await wait();
    const res = await request(app)
      .get("/api/admin/audit")
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.items.some((a) => a.action === "user.grant")).toBe(true);
  });
});

describe("admin console — broadcasts", () => {
  it("previews an audience count and delivers an in-app announcement", async () => {
    const admin = await makeAdmin();
    const a = await makeUser();
    const b = await makeUser();

    const count = await request(app)
      .get("/api/admin/audience-count?audience=all")
      .set(auth(admin.token));
    expect(count.status).toBe(200);
    expect(count.body.count).toBeGreaterThanOrEqual(3);

    const send = await request(app)
      .post("/api/admin/broadcasts")
      .set(auth(admin.token))
      .send({
        audience: "all",
        title: "Scheduled maintenance",
        body: "Back in 10 minutes.",
        channels: { inApp: true },
      });
    expect(send.status).toBe(201);

    await wait(150);
    expect(
      await Notification.exists({ userId: a.user._id, type: "announcement" })
    ).toBeTruthy();
    expect(
      await Notification.exists({ userId: b.user._id, type: "announcement" })
    ).toBeTruthy();

    const history = await request(app)
      .get("/api/admin/broadcasts")
      .set(auth(admin.token));
    expect(history.body.items[0].title).toBe("Scheduled maintenance");
  });

  it("targets a single user", async () => {
    const admin = await makeAdmin();
    const target = await makeUser();
    const bystander = await makeUser();

    await request(app)
      .post("/api/admin/broadcasts")
      .set(auth(admin.token))
      .send({
        audience: "user",
        userId: String(target.user._id),
        title: "Just for you",
        channels: { inApp: true },
      });

    await wait(120);
    expect(
      await Notification.exists({ userId: target.user._id, type: "announcement" })
    ).toBeTruthy();
    expect(
      await Notification.exists({ userId: bystander.user._id, type: "announcement" })
    ).toBeFalsy();
  });
});

describe("admin console — stats", () => {
  it("exposes the expanded dashboard metrics", async () => {
    const admin = await makeAdmin();
    await request(app).post("/api/presence/ping").set(auth(admin.token));

    const res = await request(app).get("/api/admin/stats").set(auth(admin.token));
    expect(res.status).toBe(200);
    for (const key of [
      "onlineNow",
      "activeToday",
      "compedUsers",
      "suspendedUsers",
      "pushSubscribers",
      "health",
    ]) {
      expect(res.body).toHaveProperty(key);
    }
    expect(res.body.health.features).toHaveProperty("push");

    const ts = await request(app)
      .get("/api/admin/timeseries?days=14")
      .set(auth(admin.token));
    expect(ts.status).toBe(200);
    expect(ts.body.series.length).toBe(14);
  });
});

describe("admin bootstrap", () => {
  it("promotes an existing account and creates a fresh one", async () => {
    const { bootstrapAdmin } = await import("../services/adminBootstrap.js");
    const { env } = await import("../config/env.js");

    const existing = await makeUser();
    env.admin.email = existing.creds.email;
    env.admin.password = "a-strong-operator-passphrase";
    await bootstrapAdmin();
    let fresh = await User.findById(existing.user._id);
    expect(fresh.role).toBe("admin");
    expect(fresh.isRootAdmin).toBe(true);

    env.admin.email = "root-admin-fresh@example.com";
    await bootstrapAdmin();
    fresh = await User.findOne({ email: "root-admin-fresh@example.com" });
    expect(fresh).toBeTruthy();
    expect(fresh.isRootAdmin).toBe(true);

    env.admin.email = null;
    env.admin.password = null;
  });
});

beforeEach(async () => {
  await AdminAudit.deleteMany({});
});
