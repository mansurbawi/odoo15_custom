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

odoo.define('muk_preview.PreviewGenerator', function (require) {
"use strict";

var core = require('web.core');

var PreviewHandler = require('muk_preview.PreviewHandler');

var QWeb = core.qweb;
var _t = core._t;

var PreviewGenerator = core.Class.extend({
    init: function (widget, additional_handler) {
        this.widget = widget;
        this.handler = _.extend({
            "PDFHandler": new PreviewHandler.PDFHandler(widget),
            "OpenOfficeHandler": new PreviewHandler.OpenOfficeHandler(widget),
            "ImageHandler": new PreviewHandler.ImageHandler(widget),
            "TextHandler": new PreviewHandler.TextHandler(widget),
        }, additional_handler || {});
    },
    /**
     * @returns {boolean} true if a handler can preview this file
     */
    canPreview: function (mimetype, extension) {
        return _.some(_.values(this.handler), function (handler) {
            return handler.checkExtension(extension) || handler.checkType(mimetype);
        });
    },
    /**
     * @returns {Promise<jQuery>}
     */
    createPreview: function (url, mimetype, extension, title) {
        var self = this;
        var matchedHandler = _.find(_.values(this.handler), function (handler) {
            return handler.checkExtension(extension) || handler.checkType(mimetype);
        });
        if (matchedHandler) {
            return matchedHandler.createHtml(url, mimetype, extension, title).catch(function () {
                return self._unsupported(url, mimetype, extension, title);
            });
        }
        return Promise.resolve(this._unsupported(url, mimetype, extension, title));
    },
    _unsupported: function (url, mimetype, extension, title) {
        return $(QWeb.render('UnsupportedContent', {
            url: url,
            mimetype: mimetype || _t('Unknown'),
            extension: extension || _t('Unknown'),
            title: title || _t('Unknown'),
        }));
    },
});

PreviewGenerator.canPreview = function (mimetype, extension) {
    return new PreviewGenerator(null, {}).canPreview(mimetype, extension);
};

PreviewGenerator.createPreview = function (widget, url, mimetype, extension, title) {
    return new PreviewGenerator(widget, {}).createPreview(url, mimetype, extension, title);
};

return PreviewGenerator;

});
