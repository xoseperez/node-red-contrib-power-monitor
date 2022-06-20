node-red-contrib-power-monitor
==============================

[![GitHub version](https://badge.fury.io/gh/xoseperez%2Fnode-red-contrib-power-monitor.svg)](http://github.com/xoseperez/node-red-contrib-power-monitor)
[![NPM version](https://badge.fury.io/js/node-red-contrib-power-monitor.svg)](http://www.npmjs.org/package/node-red-contrib-power-monitor)
[![Dependencies Status](https://david-dm.org/xoseperez/node-red-contrib-power-monitor/status.svg)](https://david-dm.org/xoseperez/node-red-contrib-power-monitor)
<br />
[![donate](https://img.shields.io/badge/donate-PayPal-blue.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=xose%2eperez%40gmail%2ecom&lc=US&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHostedGuest)
[![twitter](https://img.shields.io/twitter/follow/xoseperez.svg?style=social)](https://twitter.com/intent/follow?screen_name=xoseperez)

A [Node-RED](http://nodered.org) node to monitor home appliances based on their power consumption.

---

## Table of Contents
* [Install](#install)
* [Usage](#usage)
  * [Configuration](#configuration)
  * [Output](#output)
  * [Suggestions](#suggestions)
* [Bugs / Feature request](#bugs--feature-request)
* [License](#license)
* [Contribute](#contribute)

---

## Install

Run the following command in your Node-RED user directory - typically `~/.node-red`:

```
npm install node-red-contrib-power-monitor
```


## Usage

Feed the node regularly with a real number as payload representing the average consumption in Watts since the last message.
The node will trigger events based on the start and stop conditions with additional information like the total energy consumption for the last cycle.

### Notice

Latest version (1.0.0) is not backwards compatible with previous ones (0.X.X). The most important change is that we have just one output for all the different events instead of 2 outputs for start and stop events. Therefore, you will have to add a switch node the the output to filter the type of message you want to process using the `event` property of the `payload` object. You can use the same node to redirect different type of events to different sub-flows.

### Configuration

- `Name`: Name of the appliance. Will be attached to the output object.
- `Start threshold`: Value (in watts) to tell whether the appliance is running, an ideal value would be 0 (0W if not running).
- `Start after`: Number of messages with readings over the threshold to trigger a start event.
- `Stop threshold`: Value (in watts) to tell whether the device has finished, an ideal value would be 0 (0W if not running).
- `Stop after`: Number of messages with readings below the threshold to trigger a stop event.

### Input
Two valid input options:
- The number of the average watts since last message.
- Passing `stop` will force a stoppd state, overriding the `Stop threshold` and `Stop after` requirements.

### Output

The output will be a JSON object with the device name and the event type. 
- In case the event is a `pre_start` or `running` event, it will also report the **current** running time (in seconds) and the **current** energy consumption of the cycle (in kWh) since it started, as well as the `energy_delta` in kWh since last update. 
- In case the event is a `stop` event, it will also report the **total** time (in seconds) and the **total** energy consumption of the cycle (in kWh).
- The input power (Watts) and device name (the name you gave to this node) will always be fed to the output for every input. Knowing the power gives you the capability of discovering in which particular cycle a washing machine is in (ie: Washing, Draining, Rinse Cycle, etc). For a clothes dryer that contains a light bulb you can determine if someone opened the door to check the clothes as the power will drop to whatever wattage the light bulb is. Knowing this would allow you to write downline functions that could show `paused` for example.
- The `idle` event allows downstream nodes to receive their first feed soon after a reboot.

Examples:

`{ "name": "washer", "power": 8, "event": "start", "time": 0, "energy": 0, "energy_delta": 0 }`

`{ "name": "washer", "power": 8, "event": "pre_start", "time": 100, "energy": 0.003, "energy_delta": 0.002 }`

`{ "name": "washer", "power": 217, "event": "running", "time": 4500, "energy": 0.05, "energy_delta": 0.009 }`

`{ "name": "washer", "power": 0, "event": "stop", "time": 8800, "energy": 0.14, "energy_delta": 0.020 }`

`{ "name": "washer", "power": 0, "event": "idle" }`

### Suggestions

The ideal popular device to use to capture power is a Sonoff S-31 or POW running Espurna firmware (Tasmota probably too). Set it up to report power perhaps every 30 or 60 seconds. 

Place a timer or countdown node just in front of the power-monitor node. Set it to perhaps 45 or 90 seconds so that it will send 0 or `stop` if nothing is received by the hardware power monitor device. This is useful when the power monitor loses power/is switched off while the power-monitor node is not in a idle state and node-red is still running. Without this countdown node power-monitor will continue to accumulate time and energy if it was in a running state at the time of power outtage. Note that the countown node must send out 0 or `stop`, 0 will adhear to the the `Stop threshold` and `Stop after`, passing `stop` will force a stopped state.

At the completion of a stop event it is a good time to write the total seconds etc to a database.

## Contribute

There are several ways to contribute to this project. You can [report](http://github.com/xoseperez/node-red-contrib-power-monitor/issues) bugs or [ask](http://github.com/xoseperez/node-red-contrib-power-monitor/issues) for new features directly on GitHub.
You can also submit your own new features of bug fixes via a [pull request](http://github.com/xoseperez/node-red-contrib-power-monitor/pr).

And of course you can always buy me a beer, coffee, tea,... via the donation button below.

[![donate](https://img.shields.io/badge/donate-PayPal-blue.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=xose%2eperez%40gmail%2ecom&lc=US&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHostedGuest)

## License

This project is licensed under [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) license.
