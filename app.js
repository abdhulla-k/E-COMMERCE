const express = require( "express" );

const bodyParser = require( "body-parser" );
const morgan = require( "morgan" );

const app = express();

// use morgan
app.use( morgan(':method :url :status :res[content-length] - :response-time ms') );

// set view engine
app.set( "view engine", "ejs" )
app.set( "views", "views" );

// set body-parser
app.use( bodyParser.urlencoded({ extended: false }));

app.use( '/', (req, res) => {
    res.send( "<h1>Hi</h1>" );
})

app.listen( 3000 );