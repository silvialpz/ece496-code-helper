import * as vscode from 'vscode';
import * as codeBuddyCompile from './codeBuddyCompile';
import { promptChatGpt } from './configOpenAI';
import { CError } from './codeBuddyCompile';

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

        webview.webview.options = { enableScripts: true };
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
                        compileResult.then((val) => {                            // This commented line would display the results of parsing in
                            // the webview container
                            // webview.webview.postMessage(val);

                            switch (val.type) {
                                case 1:
                                    if (val.content === null) {
                                        console.log("content was null");
                                        return;
                                    }
                                    
                                    // Display 3 errors 
                                    let  dummyListOfErrors= {
                                        type: 1, 
                                        content:[
                                        new CError(1, 1, "function", "error1"),
                                        new CError(1, 1, "function", "error2"),
                                        new CError(1, 1, "function", "error3"),
                                        ],
                                        message: "compilefail"
                                    };


                                    webview.webview.postMessage(dummyListOfErrors);

                                    // TODO: All of this  will be moved down to the case "explain"
                                    // Putting together the prompt to send to ChatGPT
                                    // let errorText: string = `Error on line ${val.content.line}
                                    // in function ${val.content.func}.
                                    // Error message: ${val.content.errormsg}`;

                                    // let prompt: string = `Here is a C Compile Time Error: 
                                    // ${errorText}
                                    // Act as a TA for me and tell me what is wrong with my code.
                                    // I am new to programming so please explain in as as simple terms as possible.
                                    // Do not tell me what line to fix.
                                    // Please inform them on what line and in what function the error occurred.`;

                                    // let completion = promptChatGpt(prompt);
                                    // completion.then((val) => {
                                    //     // Once ChatGPT has responded we send a message to the webview
                                    //     // container which will display the response
                                    //     let response: string | null = val.choices[0].message.content;
                                    //     if (response === null) {
                                    //         console.log("response was null");
                                    //         return;
                                    //     }
                                    //     let messageToWebview = {
                                    //         type: 2,
                                    //         message: response
                                    //     };
                                    //     webview.webview.postMessage(messageToWebview);
                                    // });
                                    break;

                                default:
                                    console.log("default case");
                                    break;
                            }

                        });
                    case "explain":
                        break;

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
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
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
            <div class="compile">
                <button id="compile-button">Check Compile Errors</button>
                <span style="display: none;", class="dot">
                    <p id="compile-error-count"><p>
                </span>
                <div id="compile-error-container", class="compile-error-container"></div>
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