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

odoo.define('muk_preview.PreviewWidgets', function (require) {
"use strict";

// Odoo 15 port of the binary field preview (form and list views, readonly):
//  - click on the file name   -> preview (if the file type is supported)
//  - click on the download icon -> download (standard Odoo behaviour)
//  - unsupported file types keep the standard "click = download" behaviour
// Use options="{'no_preview': True}" on a field to disable the preview.

var core = require('web.core');
var basic_fields = require('web.basic_fields');

var PreviewDialog = require('muk_preview.PreviewDialog');
var PreviewGenerator = require('muk_preview.PreviewGenerator');

var _t = core._t;

basic_fields.FieldBinaryFile.include({
    _renderReadonly: function () {
        this._super.apply(this, arguments);
        this._mukPreviewable = false;
        if (this.template !== 'FieldBinaryFile' || this.nodeOptions.no_preview ||
                !(this.value && this.res_id)) {
            return;
        }
        var info = this._getPreviewInfo();
        if (!PreviewGenerator.canPreview(info.mimetype, info.extension)) {
            return;
        }
        this._mukPreviewable = true;
        this.$el.addClass('o_binary_previewable').attr('title', _t('Click to preview'));
        this.$('.fa-download')
            .addClass('o_binary_download')
            .attr('title', _t('Download'))
            .attr('role', 'button');
        this.$el.prepend($('<i class="fa fa-eye o_binary_preview mr-1"/>').attr('title', _t('Preview')));
    },
    /**
     * Standard click handler of FieldBinaryFile (readonly) -> download.
     * Redirect it to the preview unless the download icon was clicked.
     *
     * @override
     */
    on_save_as: function (ev) {
        if (this.mode === 'readonly' && this._mukPreviewable && ev &&
                !$(ev.target).closest('.o_binary_download').length) {
            ev.preventDefault();
            ev.stopPropagation();
            return this._openPreview();
        }
        return this._super.apply(this, arguments);
    },
    _getPreviewInfo: function () {
        var filenameField = this.attrs.filename;
        var filename = (filenameField && this.recordData[filenameField]) || this.filename_value || '';
        return {
            filenameField: filenameField || '',
            filename: filename,
            extension: filename && filename.includes('.') ? filename.split('.').pop() : false,
            mimetype: this.recordData.mimetype || false,
        };
    },
    _openPreview: function () {
        var info = this._getPreviewInfo();
        var url = '/web/content?' + $.param({
            model: this.model,
            id: this.res_id,
            field: this.name,
            filename_field: info.filenameField,
            filename: info.filename,
            download: true,
        });
        PreviewDialog.createPreviewDialog(this, url, info.mimetype, info.extension, info.filename);
    },
});

});
