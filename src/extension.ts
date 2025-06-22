import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface TemplateConfig {
    fileName: string;
    content: string;
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand("extension.cfgCreator", async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("请先打开一个工作区");
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const vscodeFolder = path.join(workspaceRoot, ".vscode");

        try {
            // 读取配置
            const config = vscode.workspace.getConfiguration("cfgCreator");
            const templates: TemplateConfig[] = [];

            for (let i = 1; i <= 5; i++) {
                const fileName = config.get<string>(`template${i}.fileName`, "").trim();
                const content = config.get<string>(`template${i}.content`, "");
                if (fileName && content) {
                    templates.push({ fileName, content });
                }
            }

            if (templates.length === 0) {
                vscode.window.showWarningMessage("请先在设置中配置模板文件");
                return;
            }

            // 创建 .vscode 文件夹（若不存在）
            if (!fs.existsSync(vscodeFolder)) {
                fs.mkdirSync(vscodeFolder, { recursive: true });
                vscode.window.showInformationMessage("已创建 .vscode 文件夹");
            }

            // 检查文件冲突
            const conflictFiles: string[] = [];
            const validTemplates: TemplateConfig[] = [];

            for (const template of templates) {
                const filePath = path.join(vscodeFolder, template.fileName);
                if (fs.existsSync(filePath)) {
                    conflictFiles.push(template.fileName);
                }
                validTemplates.push(template); // 已在前面判断内容完整
            }

            if (validTemplates.length === 0) {
                vscode.window.showWarningMessage("没有有效的模板配置");
                return;
            }

            // 冲突提示
            let shouldOverwrite = true;
            if (conflictFiles.length > 0) {
                const choice = await vscode.window.showWarningMessage(
                    `以下文件已存在: ${conflictFiles.join(", ")}。是否覆盖？`,
                    "覆盖",
                    "取消"
                );

                if (choice !== "覆盖") {
                    shouldOverwrite = false;
                }
            }

            // 写入文件
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
                } catch (error: any) {
                    vscode.window.showErrorMessage(`创建文件 ${template.fileName} 失败: ${error.message || error}`);
                }
            }

            let message = `成功创建 ${createdCount} 个文件`;
            if (skippedCount > 0) {
                message += `，跳过 ${skippedCount} 个文件`;
            }
            vscode.window.showInformationMessage(message);
        } catch (error: any) {
            vscode.window.showErrorMessage(`操作失败: ${error.message || error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
