const express = require('express');
const router = express.Router();
const csvService = require('../services/csvService');

// Example route
router.get('/', async (req, res) => {
    try {
        const zones = await csvService.readCSVFile('./data/zones.csv');
        zones.map(zone => {
            zone.points = csvService.parsePoints(zone.points);
            zone.id = Number(zone.id);
        });
        res.json(zones);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
router.post('/', async (req, res) => {
    const zoneData = req?.body;

    if (!zoneData || !zoneData.name || !zoneData.points) {
        return res.status(400).send('Required fields are missing');
    }

    try {
        const zones = await csvService.addZoneToCSV('./data/zones.csv', zoneData);
        res.json(zones);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
router.delete('/:id', async (req, res) => {
    const zoneId = req?.params?.id;
    try {
        const zones = await csvService.deleteZoneById(zoneId, './data/zones.csv');
        // if (!zones) {
        //     return res.status(404).send('Zone not found');
        // }
        res.json(zones);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;