# -*- coding: utf-8 -*-
# Recompute the stored thumbnails: they could be empty for records created
# with earlier Odoo 15 ports (thumbnail did not depend on `extension`).

from odoo import api, SUPERUSER_ID


def migrate(cr, version):
    env = api.Environment(cr, SUPERUSER_ID, {})
    for model in ('muk_dms.file', 'muk_dms.directory'):
        records = env[model].with_context(active_test=False).search([])
        if records:
            env.add_to_compute(env[model]._fields['thumbnail'], records)
            records.flush()
