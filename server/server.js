const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const LOCAL_DEFAULT = 'mongodb://127.0.0.1:27017/peerwise';
const MONGO_OPTS = { serverSelectionTimeoutMS: 8000 };
const ATLAS_OPTS = { serverSelectionTimeoutMS: 4000 };

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

async function tryConnect(uri, label, connectOpts = MONGO_OPTS) {
  if (!uri || typeof uri !== 'string' || !uri.trim()) return null;
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri.trim(), connectOpts);
    if (mongoose.connection.readyState === 1) {
      console.log(`✅ MongoDB connected (${label})`);
      return uri.trim();
    }
  } catch (e) {
    console.warn(`⚠️ Mongo unreachable (${label}): ${e.message}`);
  }
  return null;
}

function useInMemoryMongoFallback() {
  if (process.env.USE_MEMORY_MONGO === 'false' || process.env.USE_MEMORY_MONGO === '0') return false;
  if (process.env.USE_MEMORY_MONGO === 'true' || process.env.USE_MEMORY_MONGO === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

let memoryServerInstance = null;

async function tryInMemoryMongo() {
  if (!useInMemoryMongoFallback()) return null;
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const memVersion = process.env.MONGOMS_VERSION || '6.0.14';
    memoryServerInstance = await MongoMemoryServer.create({
      binary: { version: memVersion }
    });
    const uri = memoryServerInstance.getUri();
    const url = await tryConnect(uri, 'in-memory Mongo (dev — data resets when server stops)');
    if (url) {
      console.log('ℹ️  Using in-memory DB: sign up / login work without Atlas or Docker.');
      return url;
    }
  } catch (e) {
    console.warn(`⚠️ In-memory Mongo failed: ${e.message}`);
  }
  return null;
}

async function resolveMongoUrl() {
  const primary = process.env.MONGO_URI;
  const fallbackOn =
    process.env.TRY_LOCAL_MONGO_FALLBACK === undefined ||
    process.env.TRY_LOCAL_MONGO_FALLBACK === 'true' ||
    process.env.TRY_LOCAL_MONGO_FALLBACK === '1';
  const localUri = process.env.MONGO_URI_LOCAL || LOCAL_DEFAULT;
  const prod = process.env.NODE_ENV === 'production';

  const tryPrimary = () =>
    tryConnect(primary, 'MONGO_URI (Atlas / primary)', ATLAS_OPTS);
  const tryLocal = () => tryConnect(localUri, 'local Mongo (Docker / MONGO_URI_LOCAL)');

  let url;

  if (!prod) {
    console.log('ℹ️  Dev mode: trying in-memory Mongo first (fast login without Atlas).');
    url = await tryInMemoryMongo();
    if (url) return url;

    if (fallbackOn) {
      url = await tryLocal();
      if (url) return url;
    }

    url = await tryPrimary();
    if (url) return url;
  } else {
    url = await tryPrimary();
    if (url) return url;

    if (fallbackOn) {
      url = await tryLocal();
      if (url) return url;
    }

    url = await tryInMemoryMongo();
    if (url) return url;
  }

  throw new Error(
    'No database reachable.\n' +
      '  • First run: wait for MongoDB binary download to finish, then refresh login.\n' +
      '  • Or: docker compose up -d in server folder (uses port 27017).\n' +
      '  • Or: fix Atlas MONGO_URI / network.\n' +
      '  • Production: set NODE_ENV=production and a working MONGO_URI.'
  );
}

async function startServer() {
  let mongoUrl;
  try {
    mongoUrl = await resolveMongoUrl();
  } catch (e) {
    console.error('❌ ' + e.message);
    process.exit(1);
  }

  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl }),
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24
    }
  }));

  const authRoutes = require('./routes/authRoutes');
  const tutorRoutes = require('./routes/tutorRoutes');
  const customerRoutes = require('./routes/customerRoutes');
  const bookingRoutes = require('./routes/bookingRoutes');
  const adminStatsRoutes = require('./routes/adminStats');
  const reviewRoutes = require('./routes/reviewRoutes');
  const paymentRoutes = require('./routes/paymentRoutes');
  const subscriptionRoutes = require('./routes/subscriptionRoutes');
  const feedbackRoutes = require('./routes/feedbackRoutes');
  const tutorRequestRoutes = require('./routes/tutorRequestRoutes');
  const moduleRoutes = require('./routes/moduleRoutes');
  const { seedPromosIfEmpty } = require('./controllers/paymentController');

  app.use('/api/auth', authRoutes);
  app.use('/api/tutors', tutorRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/admin', adminStatsRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/tutor-requests', tutorRequestRoutes);
  app.use('/api/modules', moduleRoutes);
  app.use('/api', feedbackRoutes);

  await seedPromosIfEmpty();

  app.listen(PORT, () => {
    console.log(`🎂 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
