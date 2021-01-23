const fs = require('fs');
const express = require('express');
const monitorEnergyConsumption = require('./communications/sense');
const monitorAirQuality = require('./communications/awair');

monitorAirQuality();
monitorEnergyConsumption();

const app = express();

app.get('/sculpture/monitor', function (req, res) {
    const energyConsumption = JSON.parse(fs.readFileSync('./data/energyConsumption.json'));
    const airQuality = JSON.parse(fs.readFileSync('./data/airQuality.json'));
    res.send({ sense: energyConsumption, awair: airQuality });
})

app.listen(3000);