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

odoo.define('muk_web_client_refresh.views', function (require) {
"use strict";

// Reload legacy views (list / kanban / form in readonly mode) when a
// "muk_refresh" event is received for their model.

var core = require('web.core');
var AbstractController = require('web.AbstractController');

AbstractController.include({
    init: function () {
        this._super.apply(this, arguments);
        core.bus.on('muk_refresh', this, this._onMukRefresh);
    },
    destroy: function () {
        core.bus.off('muk_refresh', this, this._onMukRefresh);
        this._super.apply(this, arguments);
    },
    _onMukRefresh: function (model) {
        if (model !== this.modelName || this.isDestroyed() || !this.$el ||
                !this.$el.is(':visible')) {
            return;
        }
        // never reload while the user is editing
        if (this.mode === 'edit') {
            return;
        }
        if (this.handle && this.model && this.model.isDirty &&
                this.model.isDirty(this.handle)) {
            return;
        }
        // do not close an open dialog (e.g. a preview) of this view
        if ($('body > .modal:visible').length) {
            return;
        }
        this.reload();
    },
});

});
