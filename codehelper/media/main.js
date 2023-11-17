(function() {
    const vscode = acquireVsCodeApi();

    const compileButton = document.getElementById("compile-button");
    compileButton.addEventListener("click", compile);

    function compile() {
        vscode.postMessage({ command: "compile" });
    }

    window.addEventListener('message', handleMessages);

    function handleMessages(event) {
        let data = event.data;
        let msgtype = parseInt(data.type);

        switch(msgtype) {
            case 1:
                // Message Type 1: Compilation results (BIG CHECK COMPILE ERRORS BUTTON)
                handleCompileErrors(data);
                break;
            case 2:
                // Message Type 2: ChatGPT response (Little '?' button)
                handleChatGptResponse(data);
                break;
            default:
                handleDefaultError();
                break;
        }
    }

    function handleCompileErrors(data) {
        const d = document.getElementById("compile-error-container");
        // Remove all children
        d.innerHTML = "";

        const errorCount = document.getElementById("compile-error-count");
        errorCount.innerText = data.content.length;
        errorCount.parentElement.style.display = "inline-block";  // TODO: will probably have to change this when errors are resolved

        data.content.forEach((error, index) => {
            createErrorItem(error, index, d);
            // Stop at third error
            if (index === 2) {
                return;
            }
        });

        document.body.append(d);
    }

    function createErrorItem(error, index, container) {
        const errorItemContainer = document.createElement("div");
        const errorItemContent = document.createElement("p");
        errorItemContainer.className = "compile-error-item";
        const button = document.createElement("button");
        errorItemContent.innerText = `${error.errormsg}`;
        button.innerText = "?";
        button.addEventListener( "click", () => {
            vscode.postMessage({
                command: "explain-error",
                line: error.line,
                charindex: error.charindex,
                func: error.func,
                index: index
            });
        });
        errorItemContainer.append(errorItemContent);
        errorItemContainer.append(button);
        container.append(errorItemContainer);
    }

    function handleChatGptResponse(data) {
        // Get the selection from the error container using data.index
        const selection = document.getElementsByClassName("compile-error-item")[data.index];
        // make a copy of the selection
        const selectionClone = selection.cloneNode(true);
        
        // Hide the button 
        selectionClone.querySelector("button").style.display = "none";

        // remove all of the other childern in the container
        const container = document.getElementById("compile-error-container");
        container.innerHTML = "";

        const chatResponse = document.createElement("p");
        chatResponse.innerText = data.message;
        
        container.appendChild(selectionClone);
        container.appendChild(chatResponse);
    }

    function handleDefaultError() {
        const q = document.createElement("p");
        q.innerText = "ERROR: hit default statement in main.js";
        document.body.append(q);
    }
}());