# odoo15_custom

Custom addons for **Odoo 15** (Community).

| Module | Version | Description |
|---|---|---|
| `muk_dms` | 15.0.1.2.2 | Document Management System (directories, files, locks, Documents tree view, kanban/list/form widgets) |
| `muk_web_preview` | 15.0.1.0.0 | File preview dialog (PDF via Odoo's pdf.js, OpenDocument via ViewerJS, images, text) |
| `muk_web_client` | 15.0.1.0.0 | Web client helpers (bus channels — currently disabled on Odoo 15) |
| `muk_web_client_refresh` | 15.0.1.0.0 | Client refresh (currently disabled on Odoo 15) |
| `document` | 15.0.1.0.0 | Attachment indexation (docx, pptx, xlsx, odt, pdf) |

Dependency chain: `muk_dms` → `muk_web_preview`, `muk_web_client_refresh` → `muk_web_client`.

## Installation

```bash
cd /opt
git clone https://github.com/mansurbawi/odoo15_custom.git odoo15_custom
```

Add the folder to `addons_path` in the Odoo config (e.g. `/etc/odoo/odoo.conf`):

```ini
addons_path = /opt/odoo15/odoo/addons,/opt/odoo15/addons,/opt/odoo15_custom
```

Restart Odoo, then in *Apps* → *Update Apps List* and install **muk_dms**
(dependencies are installed automatically), or from the command line:

```bash
sudo systemctl stop odoo15
sudo -u odoo python3 /opt/odoo15/odoo-bin -c /etc/odoo/odoo.conf -d <DB> -i muk_dms,document --stop-after-init
sudo systemctl start odoo15
```

Optional Python library: `PyPDF2` (PDF content indexation by `document`).
`lessc` is **not** required (all styles are SCSS).

## Update

```bash
cd /opt/odoo15_custom && git pull
sudo systemctl stop odoo15
sudo -u odoo python3 /opt/odoo15/odoo-bin -c /etc/odoo/odoo.conf -d <DB> -u muk_dms,muk_web_preview --stop-after-init
sudo systemctl start odoo15
```

Then hard refresh the browser (Ctrl+Shift+R).

## Notes

- Users need the group **Documents / User** (or Manager / Administrator).
  The `admin` user gets *Documents / Administrator* automatically on install.
- Preview: clicking a file name opens the preview; the download icon downloads.
  Add `options="{'no_preview': True}"` on a binary field to keep the standard behaviour.
- Do not add a `download` parameter to `/web/content` preview URLs: Odoo 15
  treats any value (even `download=false`) as a download (`Content-Disposition: attachment`).
- Auto refresh through the bus (`muk_web_client_refresh`) is not ported yet;
  views must be reloaded manually after changes made by other users.

## License

`muk_*` modules: AGPL-3 (MuK IT GmbH). `document`: LGPL-3 (Odoo S.A.).
