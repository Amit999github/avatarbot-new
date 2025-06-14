require('dotenv').config()
const express = require("express");
const session = require("express-session");
const http = require('http');
const WebSocket = require('ws');
const lusca = require('lusca');
const app = express();
const helmet = require("helmet");
const xss = require('xss-clean');
const rateLimit = require("express-rate-limit");
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const engine = require("ejs-mate");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const wrapAsync = require("./utils/wrapAsync.js")
const {isLoggedIn} = require("./middleware.js");
const {dashboardListings } = require("./controller/listings.js");
const userRouter = require("./router/users.js");
const listingsRouter = require("./router/listings.js");
const deviceRouter = require("./router/devices.js");

const sessionOptions = {
  secret : process.env.SECRET,
  resave : false,
  saveUninitialized : true,
  cookie :{
      expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge : 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: true
  },
};

// Force HTTPS Redirect
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
      ],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://fonts.googleapis.com",
        "'unsafe-inline'"  // Required by some libraries like Bootstrap
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "data:"
      ],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    },
  })
);  
app.use(xss());
app.use(session(sessionOptions));
app.use(flash());

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('ejs', engine);
app.use(cookieParser());
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(flash());
app.set('view engine', 'ejs');
const path = require("path");
app.use(express.static(path.join(__dirname,"public")));
app.set("views",path.join(__dirname,"/views"));
app.use("/images", express.static("images"));

// Apply CSRF protection via Lusca
app.use(lusca({
  csrf: true,
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.cookies.user;
  next();
});

// ==================================== mongoDB connection ===================================
const dburl = process.env.ATLASDB_URL;

main()
.then(res =>{
    console.log('database connected successfully');
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(dburl);
}

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


app.all("*", (req, res, next) => {
  next(new ExpressError ("Page Not Found" , 404));
})

app.use((err, req, res, next) => {
  if (err.code === "auth/invalid-credential") {
      req.flash("error", "No account found with this email!");
      return res.redirect('/auth/signin');
  }
  next(err); // Forward other errors
});


app.use((err, req, res,next) => {
  const {statusCode = 500, message = "something went wrong"} = err;
  res.status(statusCode).render("error/error.ejs", {err});
})

server.listen(PORT, () =>{
    console.log(`listining on port ${PORT}`);
})