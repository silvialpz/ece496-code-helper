import * as vscode from 'vscode';
import * as codeBuddyCompile from './codeBuddyCompile';
import { promptChatGpt } from './configOpenAI';
import { CError } from './codeBuddyCompile';

export class CodeBuddyWebViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'code-buddy.view';

    private _view?: vscode.WebviewView;
    private currErrors: CError[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri
    ) { }

    resolveWebviewView(
        webview: vscode.WebviewView,
        thiswebviewContext: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {

        webview.webview.options = { enableScripts: true };
        webview.webview.html = this._getHtmlForWebview(webview.webview);
        webview.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "compile":
                    this.handleCompileCommand(webview);
                    break;
                case "explain-error":
                    this.handleExplainErrorCommand(message, webview);
                    break;
            }
        });
    }

    private handleCompileCommand(webview: vscode.WebviewView): void {
        let compileResult = Promise.resolve(codeBuddyCompile.cCompile(
            "gcc",
            "this",
            "there"
        ));
        compileResult.then((val) => {
            switch (val.type) {
                case 1:
                    if (val.content === null) {
                        console.log("content was null");
                        return;
                    }
                    webview.webview.postMessage(val);
                    this.currErrors = val.content;
                    break;
                default:
                    console.log("default case");
                    break;
            }
        });
    }

    private handleExplainErrorCommand (
        message: any,
        webview: vscode.WebviewView
    ): void {
        const index = message.index;
        const errorText: string = `Error on line ${this.currErrors[index].line}
        in function ${this.currErrors[index].func}.
        Error message: ${this.currErrors[index].errormsg}
        Code: ${this.currErrors[index].linetext}`;

        const prompt: string = `Here is a C Compile Time Error: 
        ${errorText}
        Act as a TA for me and tell me what is wrong with my code.
        I am new to programming so please explain in as as simple terms as possible.
        Do not tell me what line to fix.
        Please inform them on what line and in what function the error occurred.`;

        promptChatGpt(prompt).then((val) => {
            const response = val.choices[0].message.content;
            if (response === null) {
                console.log("response was null");
                return;
            }
            const messageToWebview = {
                type: 2,
                index: message.index,
                message: response
            };
            webview.webview.postMessage(messageToWebview);
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
        );

        const nonce = getNonce();

        let webviewHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width initial-scale=1.0">
            <title>Get Started</title>
        </head>
        <body>
            <div class="compile">
                <button id="compile-button">Check Compile Errors</button>
                <div style="display: table-cell;">
                    <div style="display: none;" class="dot">
                        <p id="compile-error-count"><p>
                    </span>
                </div>
                <div id="compile-error-container" class="compile-error-container"></div>
            </div>
            
            <script nonce="${nonce}" src="${scriptUri}"></script>
            <link href="${styleUri}" rel="stylesheet" nonce="${nonce}">
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