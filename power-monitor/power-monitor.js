/*
 * Copyright (c) 2018 Xose Pérez <xose.perez@gmail.com>
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

    function kwh(value) {
        return Math.round(value / 360) / 10000;
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
        this.threshold = Number(config.threshold || 0);
        this.startafter = Number(config.startafter || 1);
        this.stopafter = Number(config.stopafter || 1);

        // States:
        // 0: idle
        // 1: pre-start (less than startafter readings over threshold)
        // 2: start
        // 3: running
        // 4: pre-stop (less than stopafter readings below threshold)
        // 5: stop
        // 6: wait next cycle
        this.state = 0;

        // color for each status
        this.colors = ["red", "blue", "green", "green", "yellow", "red", "blue"];

        // Holds the number of readings above/below threshold for states 1 and 3
        this.count = 0;

        // Holds the time for the latest reading
        this.latest = 0;

        // Holds the starting time (the first reading above threshold for a valid cycle)
        this.start = 0;

        // Holds the total energy for this cycle
        this.energy = 0;
     
        // Holds the number of cycles left
        this.cyclesleft = 0;

        // Initial state
        this.status({fill: node.colors[node.state], shape:"dot"});

        this.on("input", function(msg) {

            // Get the current power
            var power = Number(msg.payload || 0);
            var above = (power > node.threshold);
            var now = new Date();
            var time = now.getTime() / 1000;
            var energy = 0;
            if (node.latest > 0) energy = (time - node.latest) * power;
            node.latest = time;

            if (2 === node.state) node.state = 3;
            if (5 === node.state) node.state = 0;

            // State machine - IDLE
            if (0 === node.state) {
                if (above) {
                    node.start = time;
                    node.energy = 0;
                    node.count = 0;
                    node.state = 1;
                    node.cyclesleft = Number(config.cycles || 1) - 1;
                }
            }

            // State machine - PRE-START
            if (1 === node.state) {
                if (above) {
                    node.energy = node.energy + energy;
                    node.count = node.count + 1;
                    node.send([
                        { "payload": {
                            "name": node.name,
                            "event": "pre_start",
                            "time": Math.round(time - node.start),
                            "energy": kwh(node.energy),
                            "energy_delta": kwh(energy)    
                        }},
                        null
                    ]);
                    if (node.count >= node.startafter) node.state = 2;
                } else {
                    node.state = 0;
                }
            }

            // State machine - START
            if (2 === node.state) {
                node.send([
                    { "payload": {
                        "name": node.name,
                        "event": "start"
                    }},
                    null
                ]);
            }

            // State machine - RUNNING
            if (3 === node.state) {
                if (above) {
                    node.energy = node.energy + energy;
                    node.send([
                        { "payload": {
                            "name": node.name,
                            "event": "running",
                            "time": Math.round(time - node.start),
                            "energy": kwh(node.energy),
                            "energy_delta": kwh(energy)    
                        }},
                        null
                    ]);
                } else {
                    node.count = 0;
                    node.state = 4;
                }
            }

            // State machine - PRE-STOP
            if (4 === node.state) {
                if (above) {
                    node.state = 3;
                } else {
                    node.count = node.count + 1;
                    if (node.count >= node.stopafter) {
                        if (node.cyclesleft > 0) {
                            node.state = 6;
                        } else {
                            node.state = 5;
                        }
                    }
                }
            }

            // State machine - STOP
            if (5 === node.state) {
                node.send([
                    null,
                    { "payload": {
                        "name": node.name,
                        "event": "stop",
                        "time": Math.round(time - node.start),
                        "energy": kwh(node.energy)
                    }}
                ]);
            }
         
            // State machine - WAIT NEXT CYCLE
            if (6 === node.state) {
                node.energy = node.energy + energy;
                if (above) {
                    node.count = node.count + 1;
                    if (node.count >= node.startafter) {
                        node.cyclesleft -= 1;
                        node.state = 3;
                    }
                } else {
                    node.count = 0;
                }
            }

            // Status
            if (0 == node.state) {
                node.status({fill: node.colors[node.state], shape:"dot"});
            } else {
                node.status({fill: node.colors[node.state], shape:"dot", text: pretty_time(time - node.start) + kwh(node.energy) + "kWh"});
            }

        });
    }

    RED.nodes.registerType("power-monitor", power_monitor);

};
