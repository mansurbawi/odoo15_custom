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

odoo.define('muk_dms_preview_file.PreviewHelper', function (require) {
"use strict";

// Odoo 15 port: open / build a preview for a muk_dms.file record.

var core = require('web.core');
var rpc = require('web.rpc');

var PreviewGenerator = require('muk_preview.PreviewGenerator');
var PreviewDialog = require('muk_preview.PreviewDialog');

var FILE_MODEL = 'muk_dms.file';

function readFile(id) {
    return rpc.query({
        model: FILE_MODEL,
        method: 'read',
        args: [[id], ['name', 'mimetype', 'extension']],
    }).then(function (records) {
        var file = records[0];
        file.url = '/web/content?' + $.param({
            model: FILE_MODEL,
            id: file.id,
            field: 'content',
            filename_field: 'name',
            filename: file.name,
            download: true,
        });
        return file;
    });
}

var PreviewHelper = core.Class.extend({
    createFilePreviewDialog: function (id) {
        return readFile(id).then(function (file) {
            return PreviewDialog.createPreviewDialog(null, file.url,
                file.mimetype, file.extension, file.name);
        });
    },
    createFilePreviewContent: function (id) {
        return readFile(id).then(function (file) {
            return PreviewGenerator.createPreview(null, file.url,
                file.mimetype, file.extension, file.name);
        });
    },
});

PreviewHelper.createFilePreviewDialog = function (id) {
    return new PreviewHelper().createFilePreviewDialog(id);
};

PreviewHelper.createFilePreviewContent = function (id) {
    return new PreviewHelper().createFilePreviewContent(id);
};

return PreviewHelper;

});
