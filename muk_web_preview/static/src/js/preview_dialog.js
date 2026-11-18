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

odoo.define('muk_preview.PreviewDialog', function (require) {
"use strict";

// Odoo 15 port: Bootstrap 4 modal driven by a legacy Widget.

var core = require('web.core');
var framework = require('web.framework');
var Widget = require('web.Widget');

var PreviewGenerator = require('muk_preview.PreviewGenerator');

var QWeb = core.qweb;
var _t = core._t;

var PreviewDialog = Widget.extend({
    init: function (parent, generator, url, mimetype, extension, title) {
        this._super(parent);
        this.title = title || _t('Preview');
        this.url = url;
        this.mimetype = mimetype;
        this.extension = extension;
        this.generator = generator || new PreviewGenerator(this, {});
        this.generator.widget = this;
    },
    start: function () {
        var self = this;
        this.$modal = $(QWeb.render('PreviewDialog', {title: this.title, url: this.url}));
        this.$modal.on('hidden.bs.modal', function () {
            self.destroy();
        });
        this.$modal.find('.preview-maximize').on('click', this.maximize.bind(this));
        this.$modal.find('.preview-minimize').on('click', this.minimize.bind(this));
        this.$modal.find('.preview-print').on('click', this.print.bind(this)).hide();
        var $body = this.$modal.find('.preview-body');
        $body.append($('<div class="o_preview_loading text-center p-5"><i class="fa fa-circle-o-notch fa-spin fa-2x"/></div>'));
        return Promise.all([
            this._super.apply(this, arguments),
            this.generator.createPreview(this.url, this.mimetype, this.extension, this.title).then(function ($content) {
                if (self.isDestroyed()) {
                    return;
                }
                $body.empty().append($content);
                self.$modal.find('.preview-print').toggle($content.hasClass('printable'));
            }),
        ]);
    },
    open: function () {
        var self = this;
        $('.tooltip').remove();
        this.appendTo($('<div/>')).then(function () {
            self.$modal.appendTo(document.body);
            if ($.fn.draggable) {
                self.$modal.find('.modal-dialog').draggable({handle: '.modal-header'});
            }
            self.$modal.modal('show');
        });
        return this;
    },
    maximize: function () {
        this.$modal.find('.preview-maximize').hide();
        this.$modal.find('.preview-minimize').show();
        this.$modal.addClass('o_preview_fullscreen');
    },
    minimize: function () {
        this.$modal.find('.preview-maximize').show();
        this.$modal.find('.preview-minimize').hide();
        this.$modal.removeClass('o_preview_fullscreen');
    },
    print: function () {
        var $printable = this.$modal.find('.printable');
        var delay = $printable.data('print-delay') || 333;
        framework.blockUI();
        setTimeout(function () {
            framework.unblockUI();
        }, delay * 0.95);
        var $target = this.$modal.find('.print-content');
        ($target.length ? $target : $printable).printThis({
            importCSS: true,
            importStyle: true,
            printDelay: delay,
            loadCSS: $printable.data('print-css') || "",
        });
    },
    close: function () {
        if (this.$modal) {
            this.$modal.modal('hide');
        }
    },
    destroy: function () {
        if (this.isDestroyed()) {
            return;
        }
        $('.tooltip').remove();
        var $modal = this.$modal;
        this._super.apply(this, arguments);
        if ($modal) {
            $modal.off('hidden.bs.modal');
            $modal.modal('hide');
            $modal.remove();
            if ($('body > .modal:visible').length) {
                $('body').addClass('modal-open');
            }
        }
    },
});

PreviewDialog.createPreviewDialog = function (parent, url, mimetype, extension, title) {
    // The dialog lives independently of the (often re-rendered) field widget
    // that opened it, so it is not attached to `parent`.
    return new PreviewDialog(null, new PreviewGenerator(parent, {}), url, mimetype, extension, title).open();
};

return PreviewDialog;

});
