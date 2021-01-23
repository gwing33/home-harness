const sense = require('sense-energy-node');
const fs = require('fs');
const config = require('../config');


//Global Variables
let mySense;                        //Main Sense API object
let websocketPollingInterval = 60;  //Number of seconds between opening/closing the websocket

module.exports = async function monitorEnergyConsumption() {
    try {
        mySense = await sense({ email: config.SENSE_EMAIL, password: config.SENSE_PASS, verbose: false })   //Set up Sense API object and authenticate

        //Handle websocket data updates (one at a time)
        mySense.events.on('data', (data) => {
            // Check for loss of authorization. If detected, try to reauth
            if (data.payload.authorized == false) {
                console.log('Authentication failed. Trying to reauth...');
                refreshAuth();
            }

            //Set processing flag so we only send through and process one at a time
            if (data.type === "realtime_update" && data.payload && data.payload.devices) {
                const total = data.payload.w;
                fs.writeFile('./data/energyConsumption.json', `{"energyConsumption":${total}}`, function (err) {
                    if (err) {
                        console.log(`Error writing file: ${err}`);
                        return;
                    }
                    console.log(`Energy Updated: ${total}`);
                });
                mySense.closeStream();
            }
            return 0;
        });

        //Handle closures and errors
        mySense.events.on('close', (data) => {
            console.log(`Sense WebSocket Closed | Reason: ${data.wasClean ? 'Normal' : data.reason}`);
            let interval = websocketPollingInterval && websocketPollingInterval > 10 ? websocketPollingInterval : 60;

            //On clean close, set up the next scheduled check
            console.log(`New poll scheduled for ${interval * 1000} ms from now.`);
            setTimeout(() => {
                mySense.openStream();
            }, interval * 1000);
        });
        mySense.events.on('error', (data) => {
            console.log('Error: Sense WebSocket Closed | Reason: ' + data.msg);
        });

        //Open websocket flow (and re-open again on an interval)
        mySense.openStream();

    } catch (error) {
        console.log(`FATAL ERROR: ${error}`);
        if (error.stack) {
            console.log(`FATAL ERROR: ${error.stack}`);
        }
        process.exit();
    }
}

//Attempt to refresh auth
function refreshAuth() {
    try {
        mySense.getAuth();
    } catch (error) {
        console.log(`Re-auth failed: ${error}. Exiting.`);
        process.exit();
    }
}