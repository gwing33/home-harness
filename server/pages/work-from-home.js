const fs = require('fs');

const file = './data/wfh.json';

// DO NOT CHANGE THESE
// See _test* functions below
let _skipLeaveRestrictions = false;
let _skipReturnRestrictions = false;

function getCurrentData() {
    if (!fs.existsSync(file)) {
        updateData({ leave: 0 });
    }
    return JSON.parse(fs.readFileSync(file));
}

function updateData(data) {
    fs.writeFileSync(file, JSON.stringify(data));
}

function isToday(d) {
    const today = new Date();
    return d.getDate() == today.getDate() &&
        d.getMonth() == today.getMonth() &&
        d.getFullYear() == today.getFullYear();
}

function isWithinAcceptableTime() {
    const today = new Date();
    const hour = today.getHours();
    return hour >= 6 & hour <= 10;
}

function handleLeave() {
    const data = getCurrentData();

    if (_skipReturnRestrictions) {
        console.log('TESTING work from home leave call');
    }

    if (_skipLeaveRestrictions || !isToday(new Date(data.leave)) && isWithinAcceptableTime()) {
        updateData({ leave: Date.now() });
    }
}

function handleReturn() {
    const data = getCurrentData();
    const today = Date.now();

    if (_skipReturnRestrictions) {
        console.log('TESTING work from home return call');
    }

    if (
        (_skipReturnRestrictions || !data.return) &&
        isToday(new Date(data.leave)) && data.leave < today) {
        updateData({
            leave: data.leave,
            return: today,
            ...formatDuration(Math.round((today - data.leave) / 1000)),
        });
    }
}

function formatDuration(sec) {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec - (hours * 3600)) / 60);
    const seconds = sec - (hours * 3600) - (minutes * 60);
    return { hours, minutes, seconds };
}

function isCompleted(data) {
    if (isToday(new Date(data.leave)) && data.return) {
        if (data.hours > 0 || data.minutes >= 15) {
            return true;
        }
    }
    return false;
}


/**
 * Work from home Routes
 */
function workFromHomeRoutes(app) {
    app.get('/wfh/reset', function (req, res) {
        updateData({ leave: 0 });
        res.send(getCurrentData());
    });

    app.get('/wfh/leave', function (req, res) {
        _skipLeaveRestrictions = false;
        handleLeave();
        res.send(getCurrentData());
    });

    app.get('/wfh/leave/test', function (req, res) {
        _skipLeaveRestrictions = true;
        handleLeave();
        res.send(getCurrentData());
    });

    app.get('/wfh/return', function (req, res) {
        _skipReturnRestrictions = false;
        handleReturn();
        res.send(getCurrentData());
    });
    app.get('/wfh/return/test', function (req, res) {
        _skipReturnRestrictions = true;
        handleReturn();
        res.send(getCurrentData());
    });

    app.get('/wfh/status', function (req, res) {
        const data = getCurrentData();
        res.send({
            ...data,
            isCompleted: isCompleted(data),
        });
    });
}

/**
 * Testing Functions
 * Uncomment one of the function calls below to test
 * Then run:
 *   $ node server/pages/work-from-home
 */
function _testLeave() {
    _skipLeaveRestrictions = true;

    handleLeave();
    console.log('Test resposne after leave', getCurrentData());
}

function _testReturn() {
    _skipReturnRestrictions = true;
    handleReturn();
    console.log('Test response after return', getCurrentData());
}

function _testLeaveAndReturn() {
    _testLeave();
    console.log('Pausing for 5 seconds...');
    setTimeout(() => _testReturn(), 5000);
}

// _testLeave();
// _testReturn();
// _testLeaveAndReturn();

module.exports = workFromHomeRoutes;