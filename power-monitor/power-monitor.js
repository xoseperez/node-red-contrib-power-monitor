/*
 * Copyright (c) 2018-2022 Xose Pérez <xose.perez@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 module.exports = function(RED) {

    "use strict";

    function kwh(value, energydecimals) {
        return parseFloat(Number(value / 360 / 10000).toFixed(energydecimals));
    }

    function pretty_time(seconds) {

        var hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        var minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds - minutes * 60);

        var output = "";
        if (hours > 0) output += (hours + "h ");
        if (minutes > 0) output += (minutes + "m ");
        if (hours == 0) output += (seconds + "s ");
        return output;

    }

    function power_monitor(config) {

        RED.nodes.createNode(this, config);

        var node = this;

        this.name = config.name || "";
        this.startthreshold = Number(config.startthreshold || 0);
        this.startafter = Number(config.startafter || 1);
        this.stopthreshold = Number(config.stopthreshold || 0);
        this.stopafter = Number(config.stopafter || 1);
        this.energydecimals = Number(config.energydecimals || 4);
        this.emitidle = Boolean(config.emitidle || false);
        this.preservemsg = Boolean(config.preservemsg || false);

        // States:
        // 0: idle
        // 1: pre-start (less than startafter readings over threshold)
        // 2: start
        // 3: running
        // 4: pre-stop (less than stopafter readings below threshold)
        // 5: stop
        this.state = 0;

        // color for each status
        this.colors = ["red", "blue", "green", "green", "yellow", "red"];

        // Holds the number of readings above/below threshold for states 1 and 3
        this.count = 0;

        // Holds the time for the latest reading
        this.latest = 0;

        // Holds the starting time (the first reading above threshold for a valid cycle)
        this.start = 0;

        // Holds the total energy for this cycle
        this.energy = 0;

        // Initial state
        this.status({fill: node.colors[node.state], shape:"dot"});

        this.on("input", function(msg) {

            // Get the current power
            var event_type = null;
            var forceStop = (msg.payload == "stop" || msg.payload == "STOP");
            var power = Number(msg.payload || 0);
            var now = new Date();
            var time = now.getTime() / 1000;
            var energy = 0;
            var outobj;

            if(forceStop){
                power = 0;
                if(0 !== node.state){
                    node.state = 5
                }
            }
            else{
                if (node.latest > 0) energy = (time - node.latest) * power;
                node.energy = node.energy + energy;
                node.latest = time;
            }

            // State machine - IDLE
            if (0 === node.state) {
                if (power > node.startthreshold) {
                    node.start = time;
                    node.energy = 0;
                    node.count = 0;
                    node.state = 1;
                }
            }

            // State machine - PRE-START
            if (1 === node.state) {
                if (power > node.startthreshold) {
                    node.count = node.count + 1;
                    if (node.count >= node.startafter) node.state = 2;
                    event_type = "pre_start";
                } else {
                    node.state = 0; 
                }
            }

            // State machine - START
            if (2 === node.state) {
                event_type = "start";
            }

            // State machine - RUNNING
            if (3 === node.state) {
                if (power > node.stopthreshold) {
                    event_type = "running";
                } else {
                    node.count = 0;
                    node.state = 4;
                }
            }

            // State machine - PRE-STOP
            if (4 === node.state) {
                if (power > node.stopthreshold) {
                    node.state = 3;
                } else {
                    node.count = node.count + 1;
                    if (node.count >= node.stopafter) node.state = 5;
                    event_type = "pre_stop"
                }
            }

            // State machine - STOP
            if (5 === node.state) {
                event_type = "stop";
            }

            // Send event
            outobj = node.preservemsg ? msg : {};
            if (event_type) {
                outobj.payload = {
                    "name": node.name,
                    "power": power, // Sends power (watts) as received in previous node to next node.
                    "event": event_type,
                    "time": Math.round(time - node.start),
                    "energy": kwh(node.energy, node.energydecimals),
                    "energy_delta": kwh(energy, node.energydecimals),
                    "forced_stop": forceStop
                };
                node.send(outobj);
            } else if (node.emitidle) {
                outobj.payload = {
                    "name": node.name,
                    "power": power, // Sends power (watts) as received in previous node to next node. PR Update 12-Nov-21 Scott Wilson
                    "event": "idle",
                    "energy_delta": 0
                };
                node.send(outobj);
            }

            // Status
            if (0 === node.state) {
                node.status({fill: node.colors[node.state], shape:"dot"});
            } else {
                node.status({fill: node.colors[node.state], shape:"dot", text: pretty_time(time - node.start) + kwh(node.energy) + "kWh"});
            }

            // Delayed state transitions.
            // This state machine uses a chained state (a previous state change can be executed on the same cycle).
            // This works good except for some state changes that must happen after all state checks.
            if (2 === node.state) node.state = 3;
            if (5 === node.state) node.state = 0;

        });
    }

    RED.nodes.registerType("power-monitor", power_monitor);

};
