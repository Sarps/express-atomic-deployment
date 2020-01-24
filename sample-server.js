const trigger = require('./trigger')();

const express = require('express');
const app = express();

app.get('*', (req, res) => res.send(`${trigger.port}`));

app.listen(trigger.port, () => {
    console.log(`Example app listening on port ${trigger.port}!`);
    trigger.expose();
});

