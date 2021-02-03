const fs = require('fs');
const path = require('path');
const express = require('express');
const monitorEnergyConsumption = require('./communications/sense');
const monitorAirQuality = require('./communications/awair');
const workFromHomeRoutes = require('./pages/work-from-home');

monitorAirQuality();
monitorEnergyConsumption();

const app = express();

app.use(express.static(path.join(__dirname, '../public')));

app.get('/sculpture/monitor', function (req, res) {
    const energyConsumption = JSON.parse(fs.readFileSync('./data/energyConsumption.json'));
    const airQuality = JSON.parse(fs.readFileSync('./data/airQuality.json'));
    res.send({ sense: energyConsumption, awair: airQuality });
});

workFromHomeRoutes(app);

app.listen(3000);