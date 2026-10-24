const admin = require("firebase-admin");

const STORAGE_APP_NAME = "cbd-push-storage";
const OPERATIONS_AUTH_APP_NAME = "cbd-operations-auth";
const OPERATIONS_PROJECT_ID = "finanzas-boat-detailing";

function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Falta FIREBASE_SERVICE_ACCOUNT_JSON en el entorno.");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no contiene JSON válido.");
  }
}

function namedApp(name) {
  return admin.apps.find((app) => app.name === name);
}

function getStorageApp() {
  return namedApp(STORAGE_APP_NAME) || admin.initializeApp({
    credential: admin.credential.cert(credentials()),
  }, STORAGE_APP_NAME);
}

function getOperationsAuthApp() {
  return namedApp(OPERATIONS_AUTH_APP_NAME) || admin.initializeApp({
    credential: admin.credential.cert(credentials()),
    projectId: OPERATIONS_PROJECT_ID,
  }, OPERATIONS_AUTH_APP_NAME);
}

function getFirestore() {
  return getStorageApp().firestore();
}

async function requireOperationsUser(req) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    const error = new Error("Inicia sesión para administrar las alertas.");
    error.statusCode = 401;
    throw error;
  }
  try {
    const user = await getOperationsAuthApp().auth().verifyIdToken(token);
    const allowedEmail = String(process.env.OPERATIONS_ALLOWED_EMAIL || "").trim().toLowerCase();
    if (allowedEmail && String(user.email || "").toLowerCase() !== allowedEmail) {
      const denied = new Error("Esta cuenta no puede administrar las alertas.");
      denied.statusCode = 403;
      throw denied;
    }
    return user;
  } catch (cause) {
    if (cause.statusCode) throw cause;
    const error = new Error("La sesión no pudo verificarse.");
    error.statusCode = 401;
    error.cause = cause;
    throw error;
  }
}

module.exports = { getFirestore, requireOperationsUser };
