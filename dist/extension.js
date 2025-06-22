"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
function activate(context) {
  const disposable = vscode.commands.registerCommand("extension.cfgCreator", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u5DE5\u4F5C\u533A");
      return;
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const vscodeFolder = path.join(workspaceRoot, ".vscode");
    try {
      const config = vscode.workspace.getConfiguration("cfgCreator");
      const templates = [];
      for (let i = 1; i <= 5; i++) {
        const fileName = config.get(`template${i}.fileName`, "").trim();
        const content = config.get(`template${i}.content`, "");
        if (fileName && content) {
          templates.push({ fileName, content });
        }
      }
      if (templates.length === 0) {
        vscode.window.showWarningMessage("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u6A21\u677F\u6587\u4EF6");
        return;
      }
      if (!fs.existsSync(vscodeFolder)) {
        fs.mkdirSync(vscodeFolder, { recursive: true });
        vscode.window.showInformationMessage("\u5DF2\u521B\u5EFA .vscode \u6587\u4EF6\u5939");
      }
      const conflictFiles = [];
      const validTemplates = [];
      for (const template of templates) {
        const filePath = path.join(vscodeFolder, template.fileName);
        if (fs.existsSync(filePath)) {
          conflictFiles.push(template.fileName);
        }
        validTemplates.push(template);
      }
      if (validTemplates.length === 0) {
        vscode.window.showWarningMessage("\u6CA1\u6709\u6709\u6548\u7684\u6A21\u677F\u914D\u7F6E");
        return;
      }
      let shouldOverwrite = true;
      if (conflictFiles.length > 0) {
        const choice = await vscode.window.showWarningMessage(
          `\u4EE5\u4E0B\u6587\u4EF6\u5DF2\u5B58\u5728: ${conflictFiles.join(", ")}\u3002\u662F\u5426\u8986\u76D6\uFF1F`,
          "\u8986\u76D6",
          "\u53D6\u6D88"
        );
        if (choice !== "\u8986\u76D6") {
          shouldOverwrite = false;
        }
      }
      let createdCount = 0;
      let skippedCount = 0;
      for (const template of validTemplates) {
        const filePath = path.join(vscodeFolder, template.fileName);
        if (fs.existsSync(filePath) && !shouldOverwrite) {
          skippedCount++;
          continue;
        }
        try {
          fs.writeFileSync(filePath, template.content, "utf8");
          createdCount++;
        } catch (error) {
          vscode.window.showErrorMessage(`\u521B\u5EFA\u6587\u4EF6 ${template.fileName} \u5931\u8D25: ${error.message || error}`);
        }
      }
      let message = `\u6210\u529F\u521B\u5EFA ${createdCount} \u4E2A\u6587\u4EF6`;
      if (skippedCount > 0) {
        message += `\uFF0C\u8DF3\u8FC7 ${skippedCount} \u4E2A\u6587\u4EF6`;
      }
      vscode.window.showInformationMessage(message);
    } catch (error) {
      vscode.window.showErrorMessage(`\u64CD\u4F5C\u5931\u8D25: ${error.message || error}`);
    }
  });
  context.subscriptions.push(disposable);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
