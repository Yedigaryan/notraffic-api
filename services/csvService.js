const fs = require('fs');
const fastcsv = require('fast-csv');
const sanitizeHtml = require('sanitize-html');


function readCSVFile(filePath) {
    const data = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(fastcsv.parse({headers: true}))
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data));
    });
}

function writeCSVFile(filePath, rows) {
    return new Promise((resolve, reject) => {
        fastcsv
            .writeToPath(filePath, rows, {headers: true})
            .on('finish', () => resolve());
    });
}

async function addZoneToCSV(filePath, zoneData) {
    try {
        const sanitizedZoneData = {
            name: sanitizeHtml(zoneData.name),
            points: zoneData.points
        };
        const zones = await readCSVFile(filePath); // Read existing zones
        sanitizedZoneData.id = await getNextId(filePath)
        zones.push(sanitizedZoneData); // Append the new zone
        await writeCSVFile(filePath, zones); // Write updated zones back to the CSV
        return new Promise((resolve, reject) => {
            resolve(sanitizedZoneData);
        });
    } catch (err) {
        throw new Error('Error adding zone to CSV: ' + err.message);
    }
}


async function deleteZoneById(zoneId, csvFilePath) {
    const zones = [];
    const stream = fs.createReadStream(csvFilePath);

    const parseStream = fastcsv.parse({headers: true}).on("data", function (row) {
        if (String(row.id) !== String(zoneId)) { // Filter out the zone to delete
            zones.push(row);
        }
    });

    await new Promise((resolve, reject) => {
        parseStream.on('end', resolve);
        parseStream.on('error', reject);
        stream.pipe(parseStream);
    });

    const writeStream = fs.createWriteStream(csvFilePath);

    fastcsv.write(zones, {headers: true}).pipe(writeStream);

    await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
    });
}


// TODO use uuid
async function getNextId(csvFilePath) {
    const records = await readCSVFile(csvFilePath);

    let maxId = 0;
    records.forEach(record => {
        const currentID = Number(record?.id);
        if (currentID > maxId) {
            maxId = currentID;
        }
    });
    return maxId + 1;
}

function parsePoints(pointsString) {
    // Split the string by commas
    const splitPoints = pointsString.split(',');

    // Group every two elements to form the points array
    const points = [];
    for (let i = 0; i < splitPoints.length; i += 2) {
        const x = parseFloat(splitPoints[i]);
        const y = parseFloat(splitPoints[i + 1]);

        // Ensure that both coordinates are valid numbers
        if (!isNaN(x) && !isNaN(y)) {
            points.push([x, y]);
        }
    }

    return points;
}


module.exports = {
    readCSVFile,
    writeCSVFile,
    addZoneToCSV,
    parsePoints,
    deleteZoneById
};