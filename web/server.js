const express = require('express');
const bodyParser = require('body-parser');
const { EventEmitter } = require('events');
const { InfluxDB } = require('@influxdata/influxdb-client');
const { ChecksAPI } = require('@influxdata/influxdb-client-apis')

const app = express();
const eventEmitter = new EventEmitter();

// Middleware to parse JSON body
app.use(bodyParser.json());


// Initialize InfluxDB client
const influxUrl = 'http://localhost:8086';
const influxToken = '0cONMdxfCrvkMIDeRCjsx-BrTysiUaN47nKXMTZCGIXWNS5M85tw?ZboGx5ylv-gus5BYqoVacji7-LG13WOMO==';
const influxOrg = 'InfluxGarden';
const influxBucket = 'garden_sensor_data';
const client = new InfluxDB({ url: influxUrl, token: influxToken });

// Endpoint to load and send recent temperature data
app.get('/load-temperature', async (req, res) => {
  try {
    // Calculate the start time for the query (1 hour ago from now)
    const oneHourAgo = new Date(Date.now() - 3600000); // 3600000 milliseconds = 1 hour

    // InfluxDB query to retrieve recent temperature data for the last hour
    const query = `
      from(bucket: "${influxBucket}")
        |> range(start: ${oneHourAgo.toISOString()}, stop: now())
        |> filter(fn: (r) => r._measurement == "temperature")
    `;

    // Execute the query
    const result = await client.queryRows(query, { org: influxOrg });
    const temperatures = [];

    // Process the query result
    for await (const row of result) {
      temperatures.push(row._time);
    }

    // Emit the temperature data as an event on /feed-data
    eventEmitter.emit('feed-data', temperatures);

    return res.status(200).json({ message: 'Temperature data loaded and published to /feed-data' });
  } catch (error) {
    console.error('Error loading temperature data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to load and send active alerts from InfluxDB
app.get('/load-alerts', async (req, res) => {
  try {
    // InfluxDB query to retrieve all active alerts
    const query = `
      from(bucket: "${influxBucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "alerts" and r["status"] == "active")
    `;

    // Execute the query
    const result = await client.queryRows(query, { org: influxOrg });
    const alerts = [];

    // Process the query result
    for await (const row of result) {
      alerts.push(row);
    }

    // Emit the alerts as an event on /feed-alert
    eventEmitter.emit('feed-alert', alerts);

    return res.status(200).json({ message: 'Active alerts loaded and published to /feed-alert' });
  } catch (error) {
    console.error('Error loading active alerts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to receive POST data and trigger /feed-data
app.post('/trigger-data', (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Data is required in the request body' });
  }

  // Emit the received data as an event on /feed-data
  eventEmitter.emit('feed-data', data);

  return res.status(200).json({ message: 'Data received and published to /feed-data' });
});

// Endpoint to listen for SSE events on /feed-data
app.get('/feed-data', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send a welcome message when a client connects
  res.write('data: Welcome to the SSE feed!\n\n');

  // Event listener to send data to connected clients
  const eventListener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Add the event listener to the SSE feed
  eventEmitter.on('feed-data', eventListener);

  // Close the connection when the client disconnects
  req.on('close', () => {
    eventEmitter.removeListener('feed-data', eventListener);
  });
});

// Endpoint to receive POST data and trigger /feed-alert
app.post('/trigger-alert', (req, res) => {
  const { alert } = req.body;

  if (!alert) {
    return res.status(400).json({ error: 'Alert data is required in the request body' });
  }

  // Emit the received alert as an event on /feed-alert
  eventEmitter.emit('feed-alert', alert);

  return res.status(200).json({ message: 'Alert received and published to /feed-alert' });
});

// Endpoint to listen for SSE events on /feed-alert
app.get('/feed-alert', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send a welcome message when a client connects
  res.write('data: Welcome to the Alert SSE feed!\n\n');

  // Event listener to send alerts to connected clients
  const eventListener = (alert) => {
    res.write(`data: ${JSON.stringify(alert)}\n\n`);
  };

  // Add the event listener to the Alert SSE feed
  eventEmitter.on('feed-alert', eventListener);

  // Close the connection when the client disconnects
  req.on('close', () => {
    eventEmitter.removeListener('feed-alert', eventListener);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

createInfluxDBTask()
// Function to create an InfluxDB task for alerting
async function createInfluxDBTask() {
  // Check if the task already exists
  const checksApi = new ChecksAPI(client)
  let { checks = [] } = await checksApi.getChecks()
  // console.log(checks, checks[0].thresholds[0], JSON.stringify(checks[0].query.builderConfig, null, 2))

  if (checks.length == 0) {
    // Create a new task that triggers an alert when temperature > 40
    checksApi.createCheck({
      body: {
        orgID: '7f8c15141ca5e482',
        type: 'threshold',
        every: '1s',
        offset: '0s',
        thresholds: [{ allValues: false, level: 'CRIT', value: 40, type: 'greater' }],
        status: 'active',
        name: 'temperature_check',
        query: {
          editMode: 'builder',
          text: getFlux(),
          builderConfig: getBuilderConfig(),
        }
      }
    })

  }
}


function getFlux() {
  return 'from(bucket: "garden_sensor_data")\n' +
    '  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n' +
    '  |> filter(fn: (r) => r["_measurement"] == "kafka_consumer")\n' +
    '  |> filter(fn: (r) => r["_field"] == "temperature")\n' +
    '  |> aggregateWindow(every: 1m, fn: last, createEmpty: false)\n' +
    '  |> yield(name: "last")'
}

function getBuilderConfig() {
  return {
    "buckets": [
      "garden_sensor_data"
    ],
    "tags": [
      {
        "key": "_measurement",
        "values": [
          "kafka_consumer"
        ],
        "aggregateFunctionType": "filter"
      },
      {
        "key": "_field",
        "values": [
          "temperature"
        ],
        "aggregateFunctionType": "filter"
      },
      {
        "key": "host",
        "values": [],
        "aggregateFunctionType": "filter"
      }
    ],
    "functions": [
      {
        "name": "last"
      }
    ],
    "aggregateWindow": {
      "period": "1m",
      "fillValues": false
    }
  }
}