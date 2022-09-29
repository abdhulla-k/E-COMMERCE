const path = require( "path" );

const express = require( "express" );

const mongoose = require( "mongoose" );

const bodyParser = require( "body-parser" );

const app = express();

// set public path
app.use( express.static( path.join( __dirname, 'public' )));

// set view engine
app.set( "view engine", "ejs" )
app.set( "views", "views" );

// set body-parser
app.use( bodyParser.urlencoded({ extended: false }));

// import routes
const shopRoute = require( "./routes/shop" );
const userRoute = require( "./routes/user" );

app.use( '/', shopRoute );
app.use( '/user', userRoute );

// connect with mongodb and make app listenable from browser
mongoose.connect( "mongodb://localhost:27017/bigCart" ).then( data => {
    app.listen( 3000 );
}).catch( err => {
    console.log( err );
})