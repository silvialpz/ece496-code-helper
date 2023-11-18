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
        const errorItemContainerInner = document.createElement("div");
        const errorItemContent = document.createElement("p");
        const button = document.createElement("button");

        errorItemContainer.className = "compile-error-item";
        errorItemContainerInner.className = "compile-error-item-inner";
        // Give it a unique id so its addressable later
        errorItemContainer.id = `compile-error-id-${index}`;

        errorItemContent.innerText = `${error.errormsg}`;
        button.innerText = "?";
        button.addEventListener("click", () => {
            vscode.postMessage({
                command: "explain-error",
                index: index
            });
        });
        errorItemContainerInner.append(errorItemContent);
        errorItemContainerInner.append(button);
        errorItemContainer.append(errorItemContainerInner);
        container.append(errorItemContainer);
    }

    function handleChatGptResponse(data) {
        // Get the selection from the error container using data.index
        const selection = document.getElementById(`compile-error-id-${data.index}`);
        // make a copy of the selection
        
        // Hide the button 
        selection.querySelector("button").style.display = "none";

        // remove all of the other childern in the container
        // ^ Why??
        // const container = document.getElementById("compile-error-container");
        // container.innerHTML = "";

        const chatResponse = document.createElement("p");
        chatResponse.innerText = data.message;
        
        selection.appendChild(chatResponse);
    }

    function handleDefaultError() {
        const q = document.createElement("p");
        q.innerText = "ERROR: hit default statement in main.js";
        document.body.append(q);
    }
}());