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

// Odoo 15 port: listen to "<db>_refresh" bus notifications (sent by the
// refresh rules, see models/refresh_rule.py) and broadcast them on
// core.bus as "muk_refresh" (payload = model name). Views listening to it
// reload themselves (see client_refresh_views.js).

import { registry } from "@web/core/registry";
import { session } from "@web/session";
import core from "web.core";

const DEBOUNCE = 500;

export const mukRefreshService = {
    dependencies: ["muk_bus"],
    start(env, { muk_bus }) {
        const timers = {};
        muk_bus.addChannel(`${session.db}_refresh`);
        muk_bus.on("refresh", (model) => {
            if (!model) {
                return;
            }
            clearTimeout(timers[model]);
            timers[model] = setTimeout(() => core.bus.trigger("muk_refresh", model), DEBOUNCE);
        });
    },
};

registry.category("services").add("muk_refresh", mukRefreshService);
