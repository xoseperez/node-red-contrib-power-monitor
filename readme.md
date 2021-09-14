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


### Configuration

- `Name`: Name of the appliance. Will be attached to the output object.
- `Power threshold`: Value (in watts) to tell whether the appliance is running or not, an ideal value would be 0 (0W if not running).
- `Start after`: Number of messages with readings over the threshold to trigger a start event.
- `Stop after`: Number of messages with readings below the threshold to trigger a stop event.


### Output

The output will be a JSON object with the appliance name and the event type. 
In case the event is a `running` event, it will also report the **current** running time (in seconds) and the **current** energy consumption of the cycle (in kWh) since it started, as well as the `energy_delta` in kWh since last update. 
In case the event is a `stop` event, it will also report the **total** time (in seconds) and the **total** energy consumption of the cycle (in kWh). Examples:

`{ "name": "washer", "event": "start" }`

`{ "name": "washer", "event": "running", "time": 4500, "energy": 0.05, "energy_delta": 0.009 }`

`{ "name": "washer", "event": "stop", "time": 8800, "energy": 0.14 }`



## Contribute

There are several ways to contribute to this project. You can [report](http://github.com/xoseperez/node-red-contrib-power-monitor/issues) bugs or [ask](http://github.com/xoseperez/node-red-contrib-power-monitor/issues) for new features directly on GitHub.
You can also submit your own new features of bug fixes via a [pull request](http://github.com/xoseperez/node-red-contrib-power-monitor/pr).

And of course you can always buy me a beer, coffee, tea,... via the donation button below.

[![donate](https://img.shields.io/badge/donate-PayPal-blue.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=xose%2eperez%40gmail%2ecom&lc=US&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHostedGuest)

## License

This project is licensed under [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) license.
