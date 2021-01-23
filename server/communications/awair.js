const fs = require('fs');
const fetch = require('node-fetch');
const config = require('../config');

const baseUrl = 'https://developer-apis.awair.is/v1/users/self';
const devicesEndpoint = () => baseUrl + '/devices';
const deviceEndpoint = (type, id) => `${devicesEndpoint()}/${type}/${id}`;
const deviceApiUsagesEndpoint = (type, id) => `${deviceEndpoint(type, id)}/api-usages`
const latestAirDataEndpoint = (type, id) => `${deviceEndpoint(type, id)}/air-data/latest`;

function getLatestAirData() {
    return new Promise(async (resolve, reject) => {
        fetchAwair(devicesEndpoint()).then(devices => {
            const device = devices.devices[0];
            fetchAwair(latestAirDataEndpoint(device.deviceType, device.deviceId))
                .then(res => resolve(res))
                .catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

function fetchAwair(url) {
    return new Promise(async (resolve, reject) => {
        const res = await fetch(url, { method: 'GET', headers: { "Authorization": `bearer ${config.AWAIR_ACCESS_TOKEN}` } });
        // console.log(res)
        if (res.status == 200) {
            resolve(await res.json());
        } else if (res.status == 400) {
            reject(new Error('Bad data'));
        } else if (res.status == 401) {
            reject(new Error('Authentication failed'));
        } else if (res.status == 404) {
            reject(new Error('Not found'));
        } else {
            reject(new Error(await res.json()));
        }
    });
}

function monitorAirQuality() {
    getLatestAirData().then(res => {
        const total = res.data[0].score;
        fs.writeFile('./data/airQuality.json', `{"airQuality":${total}}`, function (err) {
            if (err) {
                console.log(`Error writing file: ${err}`);
                return;
            }
            console.log(`Air Quality Updated: ${total}`);
        });
    }).catch(err => console.log(`Awair ${err}`));

    setTimeout(() => monitorAirQuality(), 60000);
}

module.exports = monitorAirQuality;