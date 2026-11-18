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

odoo.define('muk_dms_views.file', function (require) {
"use strict";

// Odoo 15 port of the muk_dms.file view extensions:
//  - form: hide create/edit buttons based on perm_*, show "Locked!" when locked
//  - list: "locked" / "no_unlink" row classes
//  - kanban (js_class="dms_file_kanban"): click on image = preview,
//    click on filename = open the record

var core = require('web.core');
var FormController = require('web.FormController');
var ListRenderer = require('web.ListRenderer');
var KanbanController = require('web.KanbanController');
var KanbanView = require('web.KanbanView');
var view_registry = require('web.view_registry');

var PreviewHelper = require('muk_dms_preview_file.PreviewHelper');

var _t = core._t;

var DMS_MODELS = ['muk_dms.file', 'muk_dms.directory'];

function isLocked(data) {
    return !!(data.locked && (data.locked.res_id || data.locked.data || data.locked === true));
}

FormController.include({
    updateButtons: function () {
        this._super.apply(this, arguments);
        if (!this.$buttons || !DMS_MODELS.includes(this.modelName)) {
            return;
        }
        var data = this.model.get(this.handle).data;
        if ('perm_create' in data) {
            this.$buttons.find('.o_form_button_create').toggleClass('d-none', !data.perm_create);
        }
        var $edit = this.$buttons.find('.o_form_button_edit');
        if ('perm_write' in data) {
            $edit.toggleClass('d-none', !data.perm_write);
        }
        if (this.modelName === 'muk_dms.file' && 'locked' in data) {
            var locked = isLocked(data) && !data.editor;
            if (!$edit.data('muk-label')) {
                $edit.data('muk-label', $edit.text());
            }
            $edit.prop('disabled', locked);
            $edit.text(locked ? _t("Locked!") : $edit.data('muk-label'));
        }
    },
    _onQuickEdit: function () {
        if (DMS_MODELS.includes(this.modelName)) {
            var data = this.model.get(this.handle).data;
            if (('perm_write' in data && !data.perm_write) ||
                    (this.modelName === 'muk_dms.file' && isLocked(data) && !data.editor)) {
                return;
            }
        }
        return this._super.apply(this, arguments);
    },
});

ListRenderer.include({
    _renderRow: function (record) {
        var $tr = this._super.apply(this, arguments);
        if (DMS_MODELS.includes(record.model)) {
            var data = record.data || {};
            if (record.model === 'muk_dms.file' && isLocked(data)) {
                $tr.addClass('locked');
            }
            if ('perm_unlink' in data && !data.perm_unlink) {
                $tr.addClass('no_unlink');
            }
        }
        return $tr;
    },
});

var FileKanbanController = KanbanController.extend({
    events: _.extend({}, KanbanController.prototype.events, {
        'click .muk_image': '_onPreviewFile',
        'click .muk_filename': '_onSelectFile',
    }),
    _onPreviewFile: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        PreviewHelper.createFilePreviewDialog($(ev.currentTarget).data('id'));
    },
    _onSelectFile: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.do_action({
            type: 'ir.actions.act_window',
            res_model: 'muk_dms.file',
            res_id: $(ev.currentTarget).data('id'),
            views: [[false, 'form']],
            target: 'current',
        });
    },
});

var FileKanbanView = KanbanView.extend({
    config: _.extend({}, KanbanView.prototype.config, {
        Controller: FileKanbanController,
    }),
});

view_registry.add('dms_file_kanban', FileKanbanView);

return {
    FileKanbanController: FileKanbanController,
    FileKanbanView: FileKanbanView,
};

});
