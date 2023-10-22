
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
                const p = document.createElement("p");
                p.innerText = `Compile failed!
                Line: ${data.content.line}
                Char: ${data.content.charindex}
                Function: ${data.content.func}
                Error msg: ${data.content.errormsg}`;
                document.body.append(p);
                break;
            default:
                const q = document.createElement("p");
                q.innerText = "ERROR: hit default statement in main.js";
                document.body.append(q);
                break;
        }
    });
}());