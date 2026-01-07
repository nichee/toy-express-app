const express = require('express');
const app = express();
const port = 3000;


app.get('/', (req, res) => {
    res.send('Hello World!!!!');
})

app.post('/', (req, res) => {
    res.sendStatus(200);
    res.send("Got a post request!");
})

app.get('/users', (req, res) => {
    res.send("users page");
})
app.put('/users', (req, res) => {
    res.send("Got a PUT request at /user")
})

app.delete('/users', (req, res) => {
    res.sendStatus(200);
    res.send("Successfully deleted!")
})

app.listen(port, () => {
    console.log(`Example app listening at ${port}`);
})

