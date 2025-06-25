// ======================= ENV & Module Imports =======================
require('dotenv').config()
const express = require("express");
const session = require("express-session");
const http = require('http');
const WebSocket = require('ws');
const helmet = require("helmet");
const xss = require('xss-clean');
const lusca = require('lusca');
const rateLimit = require("express-rate-limit");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require("method-override");
const engine = require("ejs-mate");
const flash = require("connect-flash");
const mongoose = require("mongoose");
const path = require("path");

// ======================= Utility & Custom Modules =======================
const ExpressError = require("./utils/ExpressError");
const wrapAsync = require("./utils/wrapAsync.js")
const {isLoggedIn} = require("./middleware.js");
const {dashboardListings } = require("./controller/listings.js");
const userRouter = require("./router/users.js");
const listingsRouter = require("./router/listings.js");
const deviceRouter = require("./router/devices.js");

// ======================= App Initialization =======================
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;


// ===================== Before all middleware =====================
app.set('trust proxy', 1); // ✅ Needed for HTTPS cookies on Render



// // ======================= HTTPS Redirect (Production Only) =======================
// app.use((req, res, next) => {
//   if (
//     process.env.NODE_ENV === 'production' &&
//     req.headers['x-forwarded-proto'] !== 'https'
//   ) {
//     return res.redirect('https://' + req.headers.host + req.url);
//   }
//   next();
// });

//  ======================= Helmet & Security Headers =======================
app.use(helmet());
app.use(helmet.hsts({
  maxAge: 63072000, // 2 years
  includeSubDomains: true,
  preload: true
}));

app.use(
  helmet.referrerPolicy({ 
    policy: "no-referrer"
  })
);

app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://use.fontawesome.com",
      ],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://fonts.googleapis.com",
        "https://use.fontawesome.com",
        "'unsafe-inline'"  // Required by some libraries like Bootstrap
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://use.fontawesome.com",
        "data:"
      ],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    },
  })
);  

// ======================= Body Parsing, Cookies, Method Override =======================
app.use(xss());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(methodOverride('_method'));

// ======================= Session and Flash =======================
const sessionOptions = {
  secret : process.env.SECRET,
  resave : false,
  saveUninitialized : true,
  cookie :{
      expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge : 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ======================= View Engine & Static =======================
app.engine('ejs', engine);
app.use(flash());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,"public")));
app.set("views",path.join(__dirname,"/views"));
app.use("/images", express.static("images"));

// ======================= CSRF Protection (Lusca) =======================
app.use(lusca({
  csrf: true,
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));

// app.use(lusca.csrf());
// ======================= Rate Limiter =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// ======================= Globals to All Views =======================
app.use((req, res, next) => {
  // try {
  //   res.locals._csrf = req._csrf ? req.csrfToken() : null;
  // } catch (err) {
  //   res.locals._csrf = null;
  // }
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.session.user?.uid || null;
  next();
});

// ==================================== mongoDB connection ===================================
const dburl = process.env.ATLASDB_URL;


async function main() {
  await mongoose.connect(dburl);
}

main()
.then(res =>{
    console.log('database connected successfully');
}).catch(err => console.log(err));

// ======================= Routes =======================
app.get('/', (req, res) => {
res.redirect('/dashboard');
});
// ============================================= / route =============================
app.get('/dashboard', isLoggedIn , wrapAsync(async (req, res) => dashboardListings(req, res, wss)));

// ================================= Auth Router =================================
app.use('/auth', userRouter);

// ================================= Room or Listings Router =================================
app.use('/listings', listingsRouter);

// ================================= Device Router =================================
app.use('/listings/:roomName', deviceRouter);

// ======================= 404 Not Found =======================
app.all("*", (req, res, next) => {
  next(new ExpressError ("Page Not Found" , 404));
})

// ======================= Custom Error Handlers =======================
// Handle Firebase Auth Error
app.use((err, req, res, next) => {
  if (err.code === "auth/invalid-credential") {
      req.flash("error", "No account found with this email!");
      return res.redirect('/auth/signin');
  }
  next(err); // Forward other errors
});

// General Error Handler
app.use((err, req, res,next) => {
  const {statusCode = 500, message = "something went wrong"} = err;
  res.status(statusCode).render("error/error.ejs", {err});
})

// ======================= Start Server =======================
server.listen(PORT, () =>{
    console.log(`listining on port ${PORT}`);
})