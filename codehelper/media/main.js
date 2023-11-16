
(function() {
    const vscode = acquireVsCodeApi();

    const compileButton = document.getElementById("compile-button");
    compileButton.addEventListener("click", compile);

    function compile() {
        vscode.postMessage({ command: "compile" });
    }

    window.addEventListener('message', (event) => {

        let data = event.data;
        let msgtype = parseInt(data.type);

        switch(msgtype) {
            case 1:
                // Show compile errors in a container
                const d = document.getElementById("compile-error-container");
                // Remove all children
                while (d.firstChild) {
                    d.removeChild(element.firstChild);
                }

                // Show error count
                const errorCount = document.getElementById("compile-error-count");
                errorCount.innerText = data.content.length;
                errorCount.parentElement.style.display = "inline-block";

                // Create each error item
                data.content.forEach(error => {
                    const errorItemContainer = document.createElement("div");
                    const errorItemContent = document.createElement("p");
                    errorItemContainer.className = "compile-error-item";
                    const button = document.createElement("button");
                    errorItemContent.innerText = `Error msg: ${error.errormsg}`;
                    button.innerText = "?";
                    button.addEventListener("click", () => {
                        vscode.postMessage({ command: "showerror", line: error.line, charindex: error.charindex, func: error.func, errormsg: error.errormsg });
                    });
                    errorItemContainer.append(errorItemContent);
                    errorItemContainer.append(button);
                    
                    d.append(errorItemContainer);
                });
                document.body.append(d);
                break;
                // const p = document.createElement("p");
                // p.innerText = `Compile failed!
                // Line: ${data.content[0].line}
                // Char: ${data.content.charindex}
                // Function: ${data.content.func}
                // Error msg: ${data.content.errormsg}`;
                // document.body.append(p);
                // break;
            case 2:
                // Print ChatGPT response to the webview
                const r = document.createElement("p");
                r.innerText = data.message;
                document.body.append(r);
                break;
            default:
                const q = document.createElement("p");
                q.innerText = "ERROR: hit default statement in main.js";
                document.body.append(q);
                break;
        }
    });
}());