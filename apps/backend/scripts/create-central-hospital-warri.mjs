/**
 * Create Central Hospital Warri facility account.
 * Usage: node scripts/create-central-hospital-warri.mjs
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

function loadDevVars() {
  const env = {};
  for (const line of fs.readFileSync(".dev.vars", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = value;
  }
  return env;
}

function throwIfError(error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

const env = loadDevVars();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CENTER = {
  centerName: "Central Hospital Warri",
  email: "ami_momodu@yahoo.com",
  contactName: "Dr Mrs Amina Momodu",
  phone: "+2348033134355",
  address: "Central Hospital Warri, Warri, Delta State",
  state: "Delta",
  lga: "Warri South",
  password: "WarriCentral2026!",
};

const email = CENTER.email.trim().toLowerCase();

const { data: existing, error: existingError } = await supabase
  .from("ServiceCenter")
  .select("id, centerName, email, status")
  .ilike("email", email)
  .maybeSingle();
throwIfError(existingError, "lookup center");

const passwordHash = await bcrypt.hash(CENTER.password, 10);
const now = new Date().toISOString();
let center = existing;

if (!center) {
  const { data: created, error: createError } = await supabase
    .from("ServiceCenter")
    .insert({
      id: randomUUID(),
      email,
      passwordHash,
      centerName: CENTER.centerName,
      phone: CENTER.phone,
      whatsappNumber: CENTER.phone,
      address: CENTER.address,
      state: CENTER.state,
      lga: CENTER.lga,
      bankAccount: "",
      status: "ACTIVE",
      createdAt: now,
    })
    .select("id, centerName, email, status, state, lga, phone")
    .single();
  throwIfError(createError, "create center");
  center = created;
} else {
  const { error: updateError } = await supabase
    .from("ServiceCenter")
    .update({
      passwordHash,
      phone: CENTER.phone,
      whatsappNumber: CENTER.phone,
      centerName: CENTER.centerName,
      address: CENTER.address,
      state: CENTER.state,
      lga: CENTER.lga,
      status: "ACTIVE",
    })
    .eq("id", center.id);
  throwIfError(updateError, "update center");
}

const { data: existingStaff, error: staffLookupError } = await supabase
  .from("CenterStaff")
  .select("id, email, fullName, role")
  .eq("centerId", center.id)
  .ilike("email", email)
  .maybeSingle();
throwIfError(staffLookupError, "lookup staff");

if (!existingStaff) {
  const { error: staffError } = await supabase.from("CenterStaff").insert({
    id: randomUUID(),
    centerId: center.id,
    email,
    passwordHash,
    role: "ADMIN",
    fullName: CENTER.contactName,
    status: "ACTIVE",
    createdAt: now,
  });
  throwIfError(staffError, "create admin staff");
} else {
  const { error: staffUpdateError } = await supabase
    .from("CenterStaff")
    .update({
      passwordHash,
      fullName: CENTER.contactName,
      role: "ADMIN",
      status: "ACTIVE",
    })
    .eq("id", existingStaff.id);
  throwIfError(staffUpdateError, "update admin staff");
}

const { data: types, error: typesError } = await supabase
  .from("ScreeningType")
  .select("id, name, agreedPrice, active")
  .eq("active", true);
throwIfError(typesError, "list screening types");

const preferred = (types || []).filter((t) =>
  /cervical|breast|hpv|pap|via|prostate/i.test(String(t.name || "")),
);
const toLink = preferred.length ? preferred : (types || []).slice(0, 3);

for (const type of toLink) {
  const amount = Number(type.agreedPrice || 10000);
  const { error: linkError } = await supabase
    .from("ServiceCenterScreeningType")
    .insert({
      id: randomUUID(),
      centerId: center.id,
      screeningTypeId: type.id,
      amount,
    });
  if (linkError && !/duplicate|unique/i.test(linkError.message || "")) {
    throwIfError(linkError, `link service ${type.name}`);
  }
}

const { error: walletError } = await supabase.from("CenterWallet").insert({
  id: randomUUID(),
  centerId: center.id,
  balance: 0,
  createdAt: now,
  updatedAt: now,
});
if (walletError && !/duplicate|unique/i.test(walletError.message || "")) {
  console.warn("Wallet create skipped:", walletError.message);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      center,
      contact: CENTER.contactName,
      loginEmail: email,
      temporaryPassword: CENTER.password,
      servicesLinked: toLink.map((t) => t.name),
    },
    null,
    2,
  ),
);
