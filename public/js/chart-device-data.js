/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
$(document).ready(() => {
  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
  const webSocket = new WebSocket(protocol + location.host);

  // A class for holding the last N points of telemetry for a device CAMBIAR
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.maxLen = 50;
      this.timeData = new Array(this.maxLen);
      this.lab1Data = new Array(this.maxLen);
      this.lab2Data = new Array(this.maxLen);
      this.lab3Data = new Array(this.maxLen);
    }

    addData(time, lab1, lab2, lab3) {
      this.timeData.push(time);
      this.lab1Data.push(lab1);
      this.lab2Data.push(lab2);
      this.lab3Data.push(lab3);

      if (this.timeData.length > this.maxLen) {
        this.timeData.shift();
        this.lab1Data.shift();
        this.lab2Data.shift();
        this.lab3Data.shift();
      }
    }
  }

  // All the devices in the list (those that have been sending telemetry)
  class TrackedDevices {
    constructor() {
      this.devices = [];
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          return this.devices[i];
        }
      }

      return undefined;
    }

    getDevicesCount() {
      return this.devices.length;
    }
  }

  const trackedDevices = new TrackedDevices();

  // Define the chart axes CAMBIAR
  const chartData = {
    datasets: [
      {
        fill: false,
        label: 'Lab1',
        yAxisID: 'Lab1',
        borderColor: 'rgba(255, 204, 0, 1)',
        pointBoarderColor: 'rgba(255, 204, 0, 1)',
        backgroundColor: 'rgba(255, 204, 0, 0.4)',
        pointHoverBackgroundColor: 'rgba(255, 204, 0, 1)',
        pointHoverBorderColor: 'rgba(255, 204, 0, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Lab2',
        yAxisID: 'Lab2',
        borderColor: 'rgba(24, 120, 240, 1)',
        pointBoarderColor: 'rgba(24, 120, 240, 1)',
        backgroundColor: 'rgba(24, 120, 240, 0.4)',
        pointHoverBackgroundColor: 'rgba(24, 120, 240, 1)',
        pointHoverBorderColor: 'rgba(24, 120, 240, 1)',
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Lab3',
        yAxisID: 'Lab3',
        borderColor: 'rgba(24, 120, 240, 1)',
        pointBoarderColor: 'rgba(24, 120, 240, 1)',
        backgroundColor: 'rgba(24, 120, 240, 0.4)',
        pointHoverBackgroundColor: 'rgba(24, 120, 240, 1)',
        pointHoverBorderColor: 'rgba(24, 120, 240, 1)',
        spanGaps: true,
      }
    ]
  };

  //CAMBIAR
  const chartOptions = {
    scales: {
      yAxes: [{
        id: 'Lab1',
        type: 'linear',
        scaleLabel: {
          labelString: 'Lab1Data (unidades)',
          display: true,
        },
        position: 'left',
      },
      {
        id: 'Lab2',
        type: 'linear',
        scaleLabel: {
          labelString: 'Lab2Data (unidades)',
          display: true,
        },
        position: 'right',
      },
      {
        id: 'Lab3',
        type: 'linear',
        scaleLabel: {
          labelString: 'Lab3Data (unidades)',
          display: true,
        },
        position: 'left',
      }
      ]
    }
  };

  // Get the context of the canvas element we want to select
  const ctx = document.getElementById('iotChart').getContext('2d');
  const myLineChart = new Chart(
    ctx,
    {
      type: 'line',
      data: chartData,
      options: chartOptions,
    });

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  let needsAutoSelect = true;
  const deviceCount = document.getElementById('deviceCount');
  const listOfDevices = document.getElementById('listOfDevices');
  function OnSelectionChange() {
    const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
    chartData.labels = device.timeData;
    chartData.datasets[0].data = device.lab1Data;
    chartData.datasets[1].data = device.lab2Data;
    chartData.datasets[2].data = device.lab3Data;
    myLineChart.update();
  }
  listOfDevices.addEventListener('change', OnSelectionChange, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it has date/time and temperature
  // 3. Find or create a cached device to hold the telemetry data
  // 4. Append the telemetry data
  // 5. Update the chart UI
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      console.log(messageData);

      /*
      // time and either temperature or humidity are required CAMBIAR
      if (!messageData.MessageDate || (!messageData.IotData.temperature && !messageData.IotData.humidity)) {
        return;
      }
      */

      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);

      if (existingDeviceData) {
        switch (messageData.DeviceId) {
          case temperatura:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.temperatureLab1, messageData.IotData.temperatureLab2, messageData.IotData.temperatureLab3);
            break;
          case luminosidad:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.lumninosidadLab1, messageData.IotData.lumninosidadLab2, messageData.IotData.lumninosidadLab3);
            break;
          case ruido:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.ruidoLab1, messageData.IotData.ruidoLab2, messageData.IotData.ruidoLab3);
            break;
          case co2:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.co2Lab1, messageData.IotData.co2Lab2, messageData.IotData.co2Lab3);
            break;
          default:
            break;
        }
      } else {
        const newDeviceData = new DeviceData(messageData.DeviceId);
        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText = numDevices === 1 ? `${numDevices} device` : `${numDevices} devices`;
        switch (messageData.DeviceId) {
          case temperatura:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.temperatureLab1, messageData.IotData.temperatureLab2, messageData.IotData.temperatureLab3);
            break;
          case luminosidad:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.lumninosidadLab1, messageData.IotData.lumninosidadLab2, messageData.IotData.lumninosidadLab3);
            break;
          case ruido:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.ruidoLab1, messageData.IotData.ruidoLab2, messageData.IotData.ruidoLab3);
            break;
          case co2:
            existingDeviceData.addData(messageData.MessageDate, messageData.IotData.co2Lab1, messageData.IotData.co2Lab2, messageData.IotData.co2Lab3);
            break;
          default:
            break;
        }

        // add device to the UI list
        const node = document.createElement('option');
        const nodeText = document.createTextNode(messageData.DeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }

      myLineChart.update();
    } catch (err) {
      console.error(err);
    }
  };
});
