const path = require( "path" );
const express = require( "express" );
const mongoose = require( "mongoose" );
const session = require( "express-session" );
const nocache = require( "nocache" );
const bodyParser = require( "body-parser" );

require('dotenv').config();

// mongodb data
// const mongodb = require("./util/mongodb");

// requre and set multer
const multer = require("multer");
const storage = multer.diskStorage({
    destination: function( req, file, cb ) {
        cb(null, './public/images/')
    },
    filename: function(req, file, cb ) {
        // let ext = req.files.image.name;
        const uniqueName = Date.now() + '.jpg'
        cb(null, uniqueName)
    }
})
const upload = multer({storage: storage})

const app = express();

// use multer
app.use(upload.array('image', 3), function (req, res, next) {
    next()
})

// set public path
app.use( express.static( path.join( __dirname, 'public' )));

// set view engine
app.set( "view engine", "ejs" )
app.set( "views", "views" );

// use express session
app.use( session({
    secret: "key",
    saveUninitialized: true,
    resave: false,
    cookie: { maxAge: 60000000000 }
}));

// use nocache
app.use( nocache());

// set body-parser
app.use( bodyParser.urlencoded({ extended: false }));


// import routes
const shopRoute = require( "./routes/shop" );
const userRoute = require( "./routes/user" );
const sellerRoute = require( "./routes/seller" );
const adminRoute = require("./routes/admin");

app.use( '/', shopRoute );
app.use( '/user', userRoute );
app.use( '/seller', sellerRoute );
app.use( '/admin', adminRoute );

app.use(function(req, res, next) {
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
      res.render('404', { url: req.url });
      return;
    }
  });

// connect with mongodb and make app listenable from browser
mongoose.connect(process.env.MONGODB_URL ? process.env.MONGODB_URL : '').then( data => {
    app.listen( process.env.PORT || 3000 );
}).catch( err => {
    console.log( err );
})