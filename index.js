const express    = require('express');
const bodyParser = require('body-parser');
const moment     = require('moment');
const fs         = require('fs');
const path       = require('path');
const app        = express();

app.use(bodyParser.json());
require("./cofing/global_constant");

/**  including .env file */
require('dotenv').config();

const logsDirectory = './public/logs';
const disconnects = [];
fs.readdirSync(logsDirectory).forEach((file) => {
    const filePath = path.join(logsDirectory, file);
    const logContents = fs.readFileSync(filePath, 'utf-8');
    const logLines = logContents.split('\n');

    logLines.forEach((line) => {
        const match = LINE_MATCH_REGEX.exec(line);
        if (match) {
            const [, , computerName, userId] = match;
            const dateMatch = DATE_MATCH_REGEX.exec(line);
            const date = dateMatch ? moment(dateMatch[1], 'MM/DD HH:mm:ss').toDate() : null;
            disconnects.push({ computerName, userId, date });
        }
    });
});

/** Get data with the specified date range */
app.post('/api/computer_disconnects', (req, res) => {
    const { startDate, endDate } = req.body;

   /** Convert date strings to Date objects */
    const start = moment(startDate, STAR_END_DATE_FORMAT).toDate();
    const end   = moment(endDate, STAR_END_DATE_FORMAT).toDate();

    /**  Filter specified date range */
    const filteredDisconnects = disconnects.filter((record) => {
        return record.date >= start && record.date <= end;
    });

    /** Group and count the sdisconnects by computer name */
    const computerDisconnectCounts = filteredDisconnects.reduce((acc, record) => {
        acc[record.computerName] = (acc[record.computerName] || 0) + 1;
        return acc;
    }, {});

    /**Sort the result in descending order */
    const sortedDisconnects = Object.entries(computerDisconnectCounts).sort(
        (a, b) => b[1] - a[1]
    );
   
    const convertedData = sortedDisconnects.map(([computerName, disconnected]) => ({
         Computer_name: computerName,
         no_of_disconnected: disconnected,
    }));
    
    res.send(convertedData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
