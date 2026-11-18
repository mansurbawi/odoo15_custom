/** @odoo-module **/

/**********************************************************************************
 * 
 *    Copyright (C) 2017 MuK IT GmbH
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Affero General Public License as
 *    published by the Free Software Foundation, either version 3 of the
 *    License, or (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 **********************************************************************************/

// Odoo 15 port: small wrapper around the (legacy) bus_service.
//
//   const mukBus = env.services.muk_bus;
//   mukBus.addChannel("my_channel");          // server: bus._sendone("my_channel", "my_type", payload)
//   mukBus.on("my_type", (payload) => {...});

import { registry } from "@web/core/registry";

export const mukBusService = {
    start(env) {
        const handlers = {};
        const channels = new Set();
        let busService = null;

        function dispatch(notifications) {
            for (const { type, payload } of notifications) {
                for (const handler of handlers[type] || []) {
                    try {
                        handler(payload);
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }

        env.bus.on("WEB_CLIENT_READY", null, () => {
            busService = owl.Component.env.services.bus_service;
            if (!busService) {
                return;
            }
            busService.onNotification(this, dispatch);
            for (const channel of channels) {
                busService.addChannel(channel);
            }
            busService.startPolling();
        });

        return {
            addChannel(channel) {
                channels.add(channel);
                if (busService) {
                    busService.addChannel(channel);
                }
            },
            deleteChannel(channel) {
                channels.delete(channel);
                if (busService) {
                    busService.deleteChannel(channel);
                }
            },
            on(type, handler) {
                (handlers[type] = handlers[type] || []).push(handler);
            },
            off(type, handler) {
                handlers[type] = (handlers[type] || []).filter((h) => h !== handler);
            },
        };
    },
};

registry.category("services").add("muk_bus", mukBusService);
