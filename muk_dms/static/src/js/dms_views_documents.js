/** @odoo-module **/

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

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import dmsUtils from "muk_dms.utils";
import core from "web.core";

const { Component, hooks } = owl;
const { onMounted, onWillUnmount, useRef, useState } = hooks;

const DIRECTORY_MODEL = "muk_dms.directory";
const FILE_MODEL = "muk_dms.file";

export class DocumentsClientAction extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.treeRef = useRef("tree");
        this.state = useState({
            selected: null,
            showPreview: true,
            preview: null,
        });
        this._searchTimer = null;
        onMounted(() => {
            this._mountTree();
            // auto refresh (muk_web_client_refresh): reload the tree when
            // files / directories are changed by anybody
            core.bus.on("muk_refresh", this, this._onMukRefresh);
        });
        onWillUnmount(() => {
            core.bus.off("muk_refresh", this, this._onMukRefresh);
            this._destroyTree();
        });
    }

    _onMukRefresh(model) {
        if (model === FILE_MODEL || model === DIRECTORY_MODEL) {
            this.refresh();
        }
    }

    get canOpen() {
        return !!(this.state.selected && this.state.selected.permRead);
    }

    get canEdit() {
        return !!(this.state.selected && this.state.selected.permWrite);
    }

    get canCreate() {
        return !!(
            this.state.selected &&
            this.state.selected.model === DIRECTORY_MODEL &&
            this.state.selected.permCreate
        );
    }

    async _loadDirectories() {
        const directories = await this.orm.searchRead(
            DIRECTORY_MODEL,
            [],
            ["name", "parent_directory", "perm_read", "perm_create", "perm_write", "perm_unlink"]
        );
        const directoryIds = directories.map((directory) => directory.id);
        const data = directories.map((directory) => {
            const parent = directory.parent_directory && directory.parent_directory[0];
            return {
                id: "directory_" + directory.id,
                parent: directoryIds.includes(parent) ? "directory_" + parent : "#",
                text: directory.name,
                icon: "fa fa-folder-o",
                type: "directory",
                data: {
                    container: false,
                    odoo_id: directory.id,
                    odoo_parent_directory: parent || false,
                    odoo_model: DIRECTORY_MODEL,
                    perm_read: directory.perm_read,
                    perm_create: directory.perm_create,
                    perm_write: directory.perm_write,
                    perm_unlink: directory.perm_unlink,
                },
            };
        });
        return { data, directoryIds };
    }

    _containerDirectory(directoryId, directoryName) {
        return {
            id: "directory_" + directoryId,
            parent: "#",
            text: directoryName,
            icon: "fa fa-folder-o",
            type: "directory",
            data: {
                container: true,
                odoo_id: directoryId,
                odoo_parent_directory: false,
                odoo_model: DIRECTORY_MODEL,
                perm_read: false,
                perm_create: false,
                perm_write: false,
                perm_unlink: false,
            },
        };
    }

    async _loadFiles(directoryIds) {
        const files = await this.orm.searchRead(
            FILE_MODEL,
            [],
            [
                "name",
                "mimetype",
                "extension",
                "directory",
                "size",
                "perm_read",
                "perm_create",
                "perm_write",
                "perm_unlink",
            ]
        );
        const data = [];
        const knownDirectories = new Set(directoryIds);
        for (const file of files) {
            const directory = file.directory || [false, ""];
            if (!knownDirectories.has(directory[0])) {
                knownDirectories.add(directory[0]);
                data.push(this._containerDirectory(directory[0], directory[1]));
            }
            data.push({
                id: "file_" + file.id,
                parent: "directory_" + directory[0],
                text: file.name,
                icon: dmsUtils.mimetype2fa(file.mimetype, { prefix: "fa fa-" }),
                type: "file",
                data: {
                    odoo_id: file.id,
                    odoo_parent_directory: directory[0],
                    odoo_model: FILE_MODEL,
                    filename: file.name,
                    file_size: file.size,
                    file_extension: file.extension,
                    mime_type: file.mimetype,
                    perm_read: file.perm_read,
                    perm_create: file.perm_create,
                    perm_write: file.perm_write,
                    perm_unlink: file.perm_unlink,
                },
            });
        }
        return data;
    }

    async _loadTreeData() {
        const { data: directories, directoryIds } = await this._loadDirectories();
        const files = await this._loadFiles(directoryIds);
        return directories.concat(files);
    }

    async _mountTree() {
        const data = await this._loadTreeData();
        if (!this.treeRef.el) {
            return;
        }
        const $tree = $(this.treeRef.el);
        $tree
            .jstree({
                core: {
                    animation: 0,
                    multiple: false,
                    check_callback: true,
                    themes: { stripes: true },
                    data,
                },
                plugins: ["contextmenu", "search", "sort", "state", "wholerow", "types"],
                search: {
                    case_insensitive: false,
                    show_only_matches: true,
                    search_callback: (str, node) => {
                        try {
                            return node.text.match(new RegExp(str));
                        } catch (error) {
                            return false;
                        }
                    },
                },
                contextmenu: {
                    items: (node) => this._contextMenuItems(node),
                },
            })
            .on("open_node.jstree", (event, treeData) => {
                treeData.instance.set_icon(treeData.node, "fa fa-folder-open-o");
            })
            .on("close_node.jstree", (event, treeData) => {
                treeData.instance.set_icon(treeData.node, "fa fa-folder-o");
            })
            .on("changed.jstree", (event, treeData) => this._onTreeChanged(treeData));
    }

    _destroyTree() {
        if (this._searchTimer) {
            clearTimeout(this._searchTimer);
            this._searchTimer = null;
        }
        if (this.treeRef.el && $(this.treeRef.el).data("jstree")) {
            $(this.treeRef.el).jstree("destroy");
        }
    }

    _nodeFromContext(context) {
        const instance = $.jstree.reference(context.reference);
        return instance && instance.get_node(context.reference);
    }

    _contextMenuItems(node) {
        const nodeData = node.data || {};
        const items = {};
        if (nodeData.perm_read) {
            items.open = {
                separator_before: false,
                separator_after: false,
                _disabled: false,
                icon: "fa fa-external-link-square",
                label: this.env._t("Open"),
                action: (context) => {
                    const selected = this._nodeFromContext(context);
                    this._openRecord(selected.data.odoo_model, selected.data.odoo_id);
                },
            };
        }
        if (nodeData.perm_write) {
            items.edit = {
                separator_before: false,
                separator_after: false,
                _disabled: false,
                icon: "fa fa-pencil",
                label: this.env._t("Edit"),
                action: (context) => {
                    const selected = this._nodeFromContext(context);
                    this._editRecord(selected.data.odoo_model, selected.data.odoo_id);
                },
            };
        }
        if (nodeData.odoo_model === FILE_MODEL && nodeData.perm_read) {
            items.download = {
                separator_before: false,
                separator_after: false,
                _disabled: false,
                icon: "fa fa-download",
                label: this.env._t("Download"),
                action: (context) => {
                    const selected = this._nodeFromContext(context);
                    this._downloadRecord(selected.data.odoo_id, selected.data.filename);
                },
            };
        } else if (nodeData.odoo_model === DIRECTORY_MODEL && nodeData.perm_create) {
            items.create = {
                separator_before: false,
                icon: "fa fa-plus-circle",
                separator_after: false,
                label: this.env._t("Create"),
                action: false,
                submenu: {
                    directory: {
                        separator_before: false,
                        separator_after: false,
                        label: this.env._t("Directory"),
                        icon: "fa fa-folder",
                        action: (context) => {
                            const selected = this._nodeFromContext(context);
                            this._createRecord(DIRECTORY_MODEL, selected.data.odoo_id);
                        },
                    },
                    file: {
                        separator_before: false,
                        separator_after: false,
                        label: this.env._t("File"),
                        icon: "fa fa-file",
                        action: (context) => {
                            const selected = this._nodeFromContext(context);
                            this._createRecord(FILE_MODEL, selected.data.odoo_id);
                        },
                    },
                },
            };
        }
        return items;
    }

    _onTreeChanged(treeData) {
        const node = treeData.node;
        if (!node || !node.data) {
            this.state.selected = null;
            this.state.preview = null;
            return;
        }
        const data = node.data;
        this.state.selected = {
            model: data.odoo_model,
            id: data.odoo_id,
            parentId: data.odoo_parent_directory,
            name: node.text,
            permRead: !!data.perm_read,
            permWrite: !!data.perm_write,
            permCreate: !!data.perm_create,
            permUnlink: !!data.perm_unlink,
        };
        this._updatePreview(data);
    }

    _updatePreview(data) {
        if (!this.state.showPreview || data.odoo_model !== FILE_MODEL) {
            this.state.preview = null;
            return;
        }
        const mimetype = data.mime_type || "";
        // NB: no `download` parameter at all: Odoo treats any value (even
        // "false") as a download request (Content-Disposition: attachment).
        let url = "/web/content/" + FILE_MODEL + "/" + data.odoo_id + "/content";
        let type = "other";
        if (mimetype.startsWith("image/")) {
            type = "image";
        } else if (mimetype === "application/pdf") {
            type = "pdf";
            // Render with the PDF.js viewer shipped with Odoo, so it also works
            // when the browser is configured to download PDFs.
            url = "/web/static/lib/pdfjs/web/viewer.html?file=" + encodeURIComponent(url);
        }
        this.state.preview = { type, url, name: data.filename || "" };
    }

    _openRecord(model, id) {
        this.action.doAction({
            type: "ir.actions.act_window",
            res_model: model,
            res_id: id,
            views: [[false, "form"]],
            target: "current",
        });
    }

    _editRecord(model, id) {
        this.action.doAction({
            type: "ir.actions.act_window",
            res_model: model,
            res_id: id,
            views: [[false, "form"]],
            target: "current",
            flags: { initial_mode: "edit" },
        });
    }

    _createRecord(model, parentId) {
        const context = {};
        if (model === FILE_MODEL) {
            context.default_directory = parentId;
        } else if (model === DIRECTORY_MODEL) {
            context.default_parent_directory = parentId;
        }
        this.action.doAction({
            type: "ir.actions.act_window",
            res_model: model,
            views: [[false, "form"]],
            target: "current",
            context,
        });
    }

    _downloadRecord(id, filename) {
        const link = document.createElement("a");
        link.href = "/dms/checkout/" + id;
        link.download = filename || "";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async refresh() {
        // Serialize refreshes: several notifications (file + directory) can
        // arrive at once; running jstree.refresh() in parallel loses the
        // opened/selected state.
        if (this._refreshing) {
            this._refreshAgain = true;
            return;
        }
        this._refreshing = true;
        try {
            do {
                this._refreshAgain = false;
                const data = await this._loadTreeData();
                if (!this.treeRef.el) {
                    return;
                }
                const instance = $(this.treeRef.el).jstree(true);
                if (instance) {
                    const state = instance.get_state();
                    instance.settings.core.data = data;
                    await new Promise((resolve) => {
                        $(this.treeRef.el).one("refresh.jstree", () => resolve());
                        setTimeout(resolve, 5000); // never block further refreshes
                        instance.refresh(false, () => state);
                    });
                }
            } while (this._refreshAgain);
        } finally {
            this._refreshing = false;
        }
    }

    open() {
        const selected = this.state.selected;
        if (selected && selected.permRead) {
            this._openRecord(selected.model, selected.id);
        }
    }

    edit() {
        const selected = this.state.selected;
        if (selected && selected.permWrite) {
            this._editRecord(selected.model, selected.id);
        }
    }

    createFile() {
        const selected = this.state.selected;
        if (selected && selected.model === DIRECTORY_MODEL && selected.permCreate) {
            this._createRecord(FILE_MODEL, selected.id);
        }
    }

    createDirectory() {
        const selected = this.state.selected;
        if (selected && selected.model === DIRECTORY_MODEL && selected.permCreate) {
            this._createRecord(DIRECTORY_MODEL, selected.id);
        }
    }

    showPreview() {
        this.state.showPreview = true;
        if (this.state.selected) {
            const data = this.state.selected;
            this._updatePreview({
                odoo_model: data.model,
                odoo_id: data.id,
                mime_type: false,
                filename: data.name,
            });
            const node = $(this.treeRef.el).jstree(true).get_selected(true)[0];
            if (node && node.data) {
                this._updatePreview(node.data);
            }
        }
    }

    hidePreview() {
        this.state.showPreview = false;
        this.state.preview = null;
    }

    onSearch(event) {
        if (this._searchTimer) {
            clearTimeout(this._searchTimer);
        }
        const value = event.target.value;
        this._searchTimer = setTimeout(() => {
            const instance = $(this.treeRef.el).jstree(true);
            if (instance) {
                instance.search(value);
            }
        }, 250);
    }
}

DocumentsClientAction.template = "muk_dms.DocumentsClientAction";
DocumentsClientAction.target = "current";

registry.category("actions").add("muk_dms_views.documents", DocumentsClientAction);

export default DocumentsClientAction;
