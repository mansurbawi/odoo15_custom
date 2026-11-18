# -*- coding: utf-8 -*-

###################################################################################
#
#    Copyright (C) 2017 MuK IT GmbH
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
###################################################################################

import logging

from odoo import _
from odoo import models, api, fields
from odoo.exceptions import ValidationError, AccessError

_logger = logging.getLogger(__name__)


class RefreshRule(models.Model):
    _name = 'muk_web_client_refresh.rule'
    _description = "Auto Refresh Rule"

    name = fields.Char(
        string="Name",
        required=True)
    
    model = fields.Many2one(
        'ir.model',
        string="Model",
        required=True,
        ondelete='cascade',
        help="Select model for which you want to refresh the corresponding views.")
    
    refresh_create = fields.Boolean(
        string="Refresh on Create", 
        default=True)
    
    refresh_write = fields.Boolean(
        string="Refresh on Writes", 
        default=True)
    
    refresh_unlink = fields.Boolean(
        string="Refresh on Unlink", 
        default=True)

    _sql_constraints = [
        ('model_uniq', 'unique(model)',
        ("There is already a rule defined on this model."))
    ]

    def _register_hook(self):
        super(RefreshRule, self)._register_hook()
        try:
            return self.search([])._patch_methods()
        except Exception:
            _logger.debug("Unable to patch refresh rules during registry setup.", exc_info=True)

    def _patch_methods(self):
        for rule in self:
            model = self.env[rule.model.model]
            if rule.refresh_create and not hasattr(model, "rule_refresh_create"):
                model._patch_method('create', rule._make_create())
                setattr(type(model), "rule_refresh_create", True)
            if rule.refresh_write and not hasattr(model, "rule_refresh_write"):
                model._patch_method('write', rule._make_write())
                setattr(type(model), "rule_refresh_write", True)
            if rule.refresh_unlink and not hasattr(model, "rule_refresh_unlink"):
                model._patch_method('unlink', rule._make_unlink())
                setattr(type(model), "rule_refresh_unlink", True)

    def _revert_methods(self):
        for rule in self:
            model = self.env[rule.model.model]
            for method in ['create', 'write', 'unlink']:
                if getattr(rule, 'refresh_%s' % method) and hasattr(getattr(model, method), 'origin'):
                    model._revert_method(method)
                    if hasattr(type(model), 'rule_refresh_%s' % method):
                        delattr(type(model), 'rule_refresh_%s' % method)

    @api.model
    def create(self, vals):
        record = super(RefreshRule, self).create(vals)
        record._patch_methods()
        return record

    def write(self, vals):
        result = super(RefreshRule, self).write(vals)
        self._patch_methods()
        return result

    def unlink(self):
        self._revert_methods()
        return super(RefreshRule, self).unlink()

    def _make_create(self):
        # Odoo 15: _patch_method/api.propagate only copies `_returns`, so the
        # api decorator must be applied explicitly, otherwise `create` called
        # over RPC (web client) is dispatched as a record method and fails.
        @api.model_create_multi
        def create_refresh(self, vals_list, **kwargs):
            result = create_refresh.origin(self, vals_list, **kwargs)
            self.env['bus.bus']._sendone(
                "%s_refresh" % self.env.cr.dbname, 'refresh', self._name)
            return result
        return create_refresh

    def _make_write(self):
        def write_refresh(self, vals, **kwargs):
            result = write_refresh.origin(self, vals, **kwargs)
            self.env['bus.bus']._sendone(
                "%s_refresh" % self.env.cr.dbname, 'refresh', self._name)
            return result
        return write_refresh

    def _make_unlink(self):
        def unlink_refresh(self, **kwargs):
            result = unlink_refresh.origin(self, **kwargs)
            self.env['bus.bus']._sendone(
                "%s_refresh" % self.env.cr.dbname, 'refresh', self._name)
            return result
        return unlink_refresh
