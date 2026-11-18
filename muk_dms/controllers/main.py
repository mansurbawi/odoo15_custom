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

import werkzeug.exceptions

from odoo import http
from odoo.http import request
from odoo.exceptions import AccessError

_logger = logging.getLogger(__name__)


class DocumentController(http.Controller):

    @http.route(['/dms/checkout/',
        '/dms/checkout/<int:id>',
        '/dms/checkout/<int:id>/<string:filename>',
        '/dms/checkout/<int:id>-<string:unique>',
        '/dms/checkout/<int:id>-<string:unique>/<string:filename>'], type='http', auth="user")
    def checkout(self, id=None, filename=None, unique=None, data=None, token=None):
        response = request.env['ir.http']._get_content_common(
            model='muk_dms.file', res_id=id, field='content', unique=unique,
            filename=filename, filename_field='name', download=True)
        if token:
            response.set_cookie('fileToken', token)
        try:
            lock = request.env['muk_dms.file'].sudo().browse(id).user_lock()[0]
            response.set_cookie('checkoutToken', lock['token'])
        except AccessError:
            return werkzeug.exceptions.Forbidden()
        return response
