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

odoo.define('muk_dms_widgets.path', function (require) {
"use strict";

// Odoo 15 port:
//  - dms_path:    char field, truncated from the left when too long
//  - dms_relpath: text field containing a JSON list of {model, id, name}
//                 rendered as a clickable breadcrumb in readonly mode
// Options: {'width': 500, 'seperator': '/'}

var basic_fields = require('web.basic_fields');
var field_registry = require('web.field_registry');

var $measure = null;
function textWidth(text, $ref) {
    if (!$measure) {
        $measure = $('<span>').css({
            position: 'absolute', visibility: 'hidden', 'white-space': 'nowrap', left: '-9999px',
        }).appendTo(document.body);
    }
    $measure.css('font', $ref && $ref.length ? $ref.css('font') : '');
    $measure.text(text || '');
    return $measure.width();
}

function truncate(value, maxWidth, $ref) {
    value = value || '';
    var width = textWidth(value, $ref);
    if (width >= maxWidth) {
        var start = Math.ceil((1 - (maxWidth / width)) * value.length);
        return '..' + value.substring(start);
    }
    return value;
}

var FieldDocumentPath = basic_fields.FieldChar.extend({
    _renderReadonly: function () {
        var value = this._formatValue(this.value) || '';
        this.$el.text(truncate(value, this.nodeOptions.width || 500, this.$el));
        this.$el.attr('title', value);
    },
});

var FieldDocumentRelationalPath = basic_fields.FieldText.extend({
    events: _.extend({}, basic_fields.FieldText.prototype.events, {
        'click a.o_dms_path_node': '_onNodeClicked',
    }),
    _renderReadonly: function () {
        var self = this;
        var path;
        try {
            path = JSON.parse(this.value || '[]');
        } catch (e) {
            path = [];
        }
        var maxWidth = this.nodeOptions.width || 500;
        var seperator = this.nodeOptions.seperator || '/';
        var text = '';
        this.$el.empty().addClass('muk_form_relpath');
        _.each(_.clone(path).reverse(), function (element, index) {
            text += element.name + seperator;
            if (textWidth(text, self.$el) >= maxWidth) {
                self.$el.prepend($('<span/>').text('..'));
                return false;
            }
            if (index === 0) {
                if (element.model === 'muk_dms.directory') {
                    self.$el.prepend($('<span/>').text(seperator));
                }
                self.$el.prepend($('<span/>').text(element.name));
            } else {
                self.$el.prepend($('<a href="#" class="o_form_uri o_dms_path_node"/>')
                    .data('model', element.model)
                    .data('id', element.id)
                    .text(element.name));
            }
            self.$el.prepend($('<span/>').text(seperator));
        });
    },
    _onNodeClicked: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var $node = $(ev.currentTarget);
        this.do_action({
            type: 'ir.actions.act_window',
            res_model: $node.data('model'),
            res_id: $node.data('id'),
            views: [[false, 'form']],
            target: 'current',
        });
    },
});

field_registry.add('dms_path', FieldDocumentPath);
field_registry.add('dms_relpath', FieldDocumentRelationalPath);

return {
    textWidth: textWidth,
    FieldDocumentPath: FieldDocumentPath,
    FieldDocumentRelationalPath: FieldDocumentRelationalPath,
};

});
