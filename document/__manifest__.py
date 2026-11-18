# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'Attachments List and Document Indexation',
    'version': '15.0.1.0.0',
    'category': 'Hidden/Tools',
    'description': """
Attachments list and document indexation
========================================
* Document Indexation: odt, pdf, xlsx, docx

The attachment list on top of forms is now provided natively by the chatter
(`mail` module), so no custom JavaScript is needed on Odoo 15.

The `PyPDF2` Python library is required in order to index PDF files.
""",
    'depends': ['web'],
    'installable': True,
    'license': 'LGPL-3',
}
