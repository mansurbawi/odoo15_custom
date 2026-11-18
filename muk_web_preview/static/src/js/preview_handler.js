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

odoo.define('muk_preview.PreviewHandler', function (require) {
"use strict";

// Odoo 15 port: handlers return a Promise resolving to a jQuery element.

var core = require('web.core');

var QWeb = core.qweb;

function normalizeExtension(extension) {
    return (extension || '').toString().toLowerCase().replace(/^\./, '');
}

function inlineUrl(url) {
    // Viewers/images must not get the "Content-Disposition: attachment" header.
    // Odoo treats ANY non-empty `download` value as true (even "false"),
    // so the parameter has to be removed completely.
    return (url || '')
        .replace(/([?&])download=[^&#]*&?/g, '$1')
        .replace(/[?&]$/, '');
}

var BaseHandler = core.Class.extend({
    extensions: [],
    mimetypes: [],
    init: function (widget) {
        this.widget = widget;
    },
    checkExtension: function (extension) {
        return this.extensions.includes(normalizeExtension(extension));
    },
    checkType: function (mimetype) {
        return !!mimetype && this.mimetypes.includes(mimetype);
    },
    createHtml: function (url, mimetype, extension, title) {
        return Promise.resolve($());
    },
});

var PDFHandler = BaseHandler.extend({
    extensions: ['pdf'],
    mimetypes: ['application/pdf'],
    createHtml: function (url, mimetype, extension, title) {
        // Use the PDF.js viewer shipped (and maintained) with Odoo 15.
        var viewerUrl = '/web/static/lib/pdfjs/web/viewer.html?file=' +
            encodeURIComponent(inlineUrl(url));
        return Promise.resolve($(QWeb.render('PDFjsFrame', {url: viewerUrl})));
    },
});

var OpenOfficeHandler = BaseHandler.extend({
    extensions: ['odt', 'odp', 'ods', 'fodt', 'ott', 'fodp', 'otp', 'fods', 'ots'],
    mimetypes: [
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.spreadsheet',
    ],
    createHtml: function (url, mimetype, extension, title) {
        var viewerUrl = '/muk_web_preview/static/lib/ViewerJS/index.html#' + inlineUrl(url);
        return Promise.resolve($(QWeb.render('ViewerJSFrame', {url: viewerUrl})));
    },
});

var ImageHandler = BaseHandler.extend({
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico'],
    checkType: function (mimetype) {
        return !!mimetype && mimetype.startsWith('image/');
    },
    createHtml: function (url, mimetype, extension, title) {
        return Promise.resolve($(QWeb.render('ImageContent', {url: inlineUrl(url), title: title})));
    },
});

var TextHandler = BaseHandler.extend({
    extensions: ['txt', 'csv', 'log', 'md', 'json', 'xml', 'py', 'js', 'css', 'scss', 'ini', 'conf', 'sql'],
    checkType: function (mimetype) {
        return !!mimetype && mimetype.startsWith('text/') && mimetype !== 'text/html';
    },
    createHtml: function (url, mimetype, extension, title) {
        return fetch(inlineUrl(url), {credentials: 'same-origin'}).then(function (response) {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.text();
        }).then(function (text) {
            return $(QWeb.render('TextContent', {text: text}));
        });
    },
});

return {
    BaseHandler: BaseHandler,
    PDFHandler: PDFHandler,
    OpenOfficeHandler: OpenOfficeHandler,
    ImageHandler: ImageHandler,
    TextHandler: TextHandler,
    inlineUrl: inlineUrl,
};

});
