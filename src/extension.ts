import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface TemplateConfig {
    fileName: string;
    content: string;
}

export function activate(context: vscode.ExtensionContext) {
    // 注册创建.vscode文件夹的命令
    const disposable = vscode.commands.registerCommand('extension.cfgCreator', async () => {
        // 获取当前工作区
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const vscodeFolder = path.join(workspaceRoot, '.vscode');

        try {
            // 获取用户配置的模板
            const config = vscode.workspace.getConfiguration('vscodeCreator');
            const templates: TemplateConfig[] = [];

            // 读取所有模板配置（最多5个）
            for (let i = 1; i <= 5; i++) {
                const templateConfig = config.get<{fileName: string, content: string}>(`template${i}`, {fileName: '', content: ''});
                
                if (templateConfig.fileName && templateConfig.content) {
                    templates.push({ 
                        fileName: templateConfig.fileName, 
                        content: templateConfig.content 
                    });
                }
            }

            if (templates.length === 0) {
                vscode.window.showWarningMessage('请先在设置中配置模板文件');
                return;
            }

            // 创建.vscode文件夹（如果不存在）
            if (!fs.existsSync(vscodeFolder)) {
                fs.mkdirSync(vscodeFolder, { recursive: true });
                vscode.window.showInformationMessage('已创建.vscode文件夹');
            }

            // 处理每个模板文件
            const conflictFiles: string[] = [];
            const validTemplates: TemplateConfig[] = [];

            // 检查文件冲突
            for (const template of templates) {
                if (!template.fileName || !template.content) {
                    continue;
                }
                
                const filePath = path.join(vscodeFolder, template.fileName);
                if (fs.existsSync(filePath)) {
                    conflictFiles.push(template.fileName);
                }
                validTemplates.push(template);
            }

            if (validTemplates.length === 0) {
                vscode.window.showWarningMessage('没有有效的模板配置');
                return;
            }

            // 如果有冲突文件，询问是否覆盖
            let shouldOverwrite = true;
            if (conflictFiles.length > 0) {
                const choice = await vscode.window.showWarningMessage(
                    `以下文件已存在: ${conflictFiles.join(', ')}。是否覆盖？`,
                    '覆盖',
                    '取消'
                );
                
                if (choice !== '覆盖') {
                    shouldOverwrite = false;
                }
            }

            // 创建文件
            let createdCount = 0;
            let skippedCount = 0;

            for (const template of validTemplates) {
                const filePath = path.join(vscodeFolder, template.fileName);
                
                // 如果文件存在且用户选择不覆盖，则跳过
                if (fs.existsSync(filePath) && !shouldOverwrite) {
                    skippedCount++;
                    continue;
                }

                try {
                    fs.writeFileSync(filePath, template.content, 'utf8');
                    createdCount++;
                } catch (error) {
                    vscode.window.showErrorMessage(`创建文件 ${template.fileName} 失败: ${error}`);
                }
            }

            // 显示结果
            let message = `成功创建 ${createdCount} 个文件`;
            if (skippedCount > 0) {
                message += `，跳过 ${skippedCount} 个文件`;
            }
            vscode.window.showInformationMessage(message);

        } catch (error) {
            vscode.window.showErrorMessage(`操作失败: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}