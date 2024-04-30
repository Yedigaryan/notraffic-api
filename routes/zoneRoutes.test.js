const request = require('supertest');
const express = require('express');
const app = express(); // create Express instance

const csvService = require('../services/csvService');
jest.mock('../services/csvService');

app.use(express.json());
app.use('/', require('../routes/zoneRoutes'));

describe('Zone API', () => {
    describe('GET /zones', () => {
        it('should return all zones', async () => {
            csvService.readCSVFile.mockResolvedValue([
                { id: 1, name: 'Zone 2', points: '7.7,8.45,13.6,20.25,22.4,17.15,18.5,12.8' },
                { id: 2, name: 'Zone 3', points: '11.3,12,16.3,12,16.3,8,12.4,8.7' }
            ]);

            csvService.parsePoints.mockImplementation(
                points => points.split('-').map(pair => pair.split(',').map(Number))
            );

            const res = await request(app).get('/');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].id).toEqual(1);
            expect(res.body[1].id).toEqual(2);
        });

        it('should handle errors', async () => {
            csvService.readCSVFile.mockRejectedValue(new Error('Error reading CSV'));

            const res = await request(app).get('/');
            expect(res.statusCode).toEqual(500);
            expect(res.text).toEqual('Error reading CSV');
        });
    });

    describe('POST /zones', () => {
        it('should add a new zone', async () => {
            const newZone = { name: 'Zone 3', points: [[11.3,12],[16.3,12],[16.3,8],[12.4,8.7]] };
            // const newZone = { name: 'Zone 3', points: '11.3,12,16.3,12,16.3,8,12.4,8.7' };
            csvService.addZoneToCSV.mockResolvedValue(newZone);

            const res = await request(app).post('/').send(newZone);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(newZone);
        });

        it('should return 500 Internal Server Error when unexpected error occurs', async () => {
            csvService.addZoneToCSV.mockRejectedValue(new Error('Unexpected error'));
            const zoneData = { name: 'Zone 1', points: '1,2-3,4' };
            const res = await request(app).post('/').send(zoneData);
            expect(res.statusCode).toEqual(500);
        });


        // it('sanitizes input fields', async () => {
        //     const sanitizedData = { name: 'Zone <script>', points: [[11.3,12],[16.3,12],[16.3,8],[12.4,8.7]] };
        //
        //     // Mock implementation should include sanitization check
        //     csvService.addZoneToCSV.mockImplementation(data => {
        //         expect(data.name).toBe('Zone ');
        //         expect(data.points).toBe( [[11.3,12],[16.3,12],[16.3,8],[12.4,8.7]]);
        //         return Promise.resolve({ ...data, id: 123 });
        //     });
        //
        //     const res = await request(app).post('/').send(sanitizedData);
        //     expect(res.statusCode).toEqual(200);
        // });

        it('should reject requests without required fields', async () => {
            const incompleteData = { name: 'Zone Missing Points' }; // 'points' field is missing
            const res = await request(app).post('/').send(incompleteData);
            expect(res.statusCode).toEqual(400); // Assuming 400 for Bad Request
        });

    });

    describe('DELETE /zones/:id', () => {
        it('should delete a zone by id', async () => {
            const zoneId = 1;
            csvService.deleteZoneById.mockResolvedValue('Zone deleted');

            const res = await request(app).delete(`/${zoneId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.text).toContain('Zone deleted');
        });

        it('should handle server errors gracefully', async () => {
            const zoneId = 1;
            csvService.deleteZoneById.mockRejectedValue(new Error('Internal server error'));

            const res = await request(app).delete(`/${zoneId}`);
            expect(res.statusCode).toEqual(500);
            expect(res.text).toContain('Internal server error');
        });

        it('should return a not found message when the zone does not exist', async () => {
            const zoneId = 9999; // Non-existent ID
            // csvService.deleteZoneById.mockRejectedValue(new Error("Zone not found"));

            const res = await request(app).delete(`/${zoneId}`);
            expect(res.statusCode).toEqual(404);
            expect(res.text).toContain("Zone not found");
        });
    })
})