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

odoo.define('muk_dms_views.directory', function (require) {
"use strict";

// Odoo 15 port of the muk_dms.directory kanban (js_class="dms_directory_kanban"):
// the file / sub-directory counters open the related records.
// Form/list permission handling is shared with muk_dms_views.file.

var core = require('web.core');
var KanbanController = require('web.KanbanController');
var KanbanView = require('web.KanbanView');
var view_registry = require('web.view_registry');

var _t = core._t;

var DirectoryKanbanController = KanbanController.extend({
    events: _.extend({}, KanbanController.prototype.events, {
        'click .muk_info_files': '_onInfoFiles',
        'click .muk_info_directories': '_onInfoDirectories',
    }),
    _onInfoFiles: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.do_action({
            type: 'ir.actions.act_window',
            res_model: 'muk_dms.file',
            name: _t('Document Files'),
            views: [[false, 'kanban'], [false, 'list'], [false, 'form']],
            target: 'current',
            domain: [['directory', '=', $(ev.currentTarget).data('id')]],
        });
    },
    _onInfoDirectories: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.do_action({
            type: 'ir.actions.act_window',
            res_model: 'muk_dms.directory',
            name: _t('Document Directories'),
            views: [[false, 'kanban'], [false, 'list'], [false, 'form']],
            target: 'current',
            domain: [['parent_directory', '=', $(ev.currentTarget).data('id')]],
        });
    },
});

var DirectoryKanbanView = KanbanView.extend({
    config: _.extend({}, KanbanView.prototype.config, {
        Controller: DirectoryKanbanController,
    }),
});

view_registry.add('dms_directory_kanban', DirectoryKanbanView);

return {
    DirectoryKanbanController: DirectoryKanbanController,
    DirectoryKanbanView: DirectoryKanbanView,
};

});
