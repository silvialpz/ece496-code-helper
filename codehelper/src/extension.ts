import * as vscode from 'vscode';
import { mainTest } from './configOpenAI';
import { CodeBuddyWebViewProvider } from './codeBuddy';

export function activate(context: vscode.ExtensionContext) {
	console.log('Code Buddy extension is now active!');

	// Test chatgpt online
	// mainTest();

	const provider = new CodeBuddyWebViewProvider(context.extensionUri);

	// Register the webview view provider for the extension view on the sidebar
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"code-buddy.view",
			provider
		),
        vscode.commands.registerCommand("code-buddy.checkLogicErrors", () => {
            provider.handleLogicCommand();
        })
    );

}

// This method is called when your extension is deactivated
export function deactivate() {}
