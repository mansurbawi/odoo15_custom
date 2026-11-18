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

odoo.define('muk_dms_widgets.many2one', function (require) {
"use strict";

// Odoo 15 port: many2one to muk_dms.file with a preview icon in readonly mode.

var core = require('web.core');
var relational_fields = require('web.relational_fields');
var field_registry = require('web.field_registry');

var PreviewHelper = require('muk_dms_preview_file.PreviewHelper');

var _t = core._t;

var FieldDocumentMany2One = relational_fields.FieldMany2One.extend({
    _renderReadonly: function () {
        this._super.apply(this, arguments);
        if (this.noOpen || !this.value) {
            return;
        }
        var $preview = $('<span class="fa fa-file-o muk_form_document_preview mr-1"/>')
            .attr('title', _t('Preview this file'))
            .attr('role', 'button');
        $preview.on('click', this._onPreviewClick.bind(this));
        this.$el.prepend($preview);
    },
    _onPreviewClick: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        PreviewHelper.createFilePreviewDialog(this.value.res_id);
    },
});

field_registry.add('dms_many2one', FieldDocumentMany2One);

return FieldDocumentMany2One;

});
