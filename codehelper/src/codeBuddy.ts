import * as vscode from 'vscode';
import * as codeBuddyCompile from './codeBuddyCompile';

export class CodeBuddyWebViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'code-buddy.view';

    private _view?: vscode.WebviewView;

    constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

    resolveWebviewView(
        webview: vscode.WebviewView,
        thiswebviewContext: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
        ): void | Thenable<void> {

        webview.webview.options = {enableScripts:true};
        webview.webview.html = this._getHtmlForWebview(webview.webview);
        webview.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "compile":
                        let compileResult = Promise.resolve(codeBuddyCompile.cCompile(
                            "gcc",
                            "this",
                            "there"
                        ));
                        compileResult.then((val) => {
                            webview.webview.postMessage(val);
                        });
                        
                }
            }
        );
    }

    public checkCompileErrors() {
        if (this._view) {
            this._view.show?.(true);
            this._view.webview.postMessage({ type: 'checkCompileErrors' });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

        const nonce = getNonce();

        let webviewHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Get Started</title>
        </head>
        <body>
            <button id="compile-button">Check Compile Errors</button>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
        
        return webviewHtml; 
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}