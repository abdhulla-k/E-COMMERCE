const express = require( "express" );

const app = express();

app.use( '/', (req, res) => {
    res.send( "<h1>Hi</h1>" );
})

app.listen( 3000 );