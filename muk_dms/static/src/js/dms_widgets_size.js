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

odoo.define('muk_dms_widgets.size', function (require) {
"use strict";

// Odoo 15 port: human readable file size (form + list views).
// Options: {'si': True} to use 1000 based units (kB, MB, ...).

var basic_fields = require('web.basic_fields');
var field_registry = require('web.field_registry');

function format_size(bytes, si) {
    bytes = Number(bytes) || 0;
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}

var FieldDocumentSize = basic_fields.FieldInteger.extend({
    _renderReadonly: function () {
        this.$el.text(format_size(this.value, this.nodeOptions.si));
        this.$el.attr('title', (this.value || 0) + ' B');
    },
});

field_registry.add('dms_size', FieldDocumentSize);

return {
    format_size: format_size,
    FieldDocumentSize: FieldDocumentSize,
};

});
