const path = require( "path" );

const express = require( "express" );

const bodyParser = require( "body-parser" );
const morgan = require( "morgan" );

const app = express();

// use morgan
app.use( morgan(':method :url :status :res[content-length] - :response-time ms') );

// set public path
app.use( express.static( path.join( __dirname, 'public' )));

// set view engine
app.set( "view engine", "ejs" )
app.set( "views", "views" );

// set body-parser
app.use( bodyParser.urlencoded({ extended: false }));

// import routes
const shopRoute = require( "./routes/shop" );

app.use( '/', shopRoute );

app.listen( 3000 );