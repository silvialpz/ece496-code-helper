
(function() {
        const vscode = acquireVsCodeApi();


        document.querySelector(".check-compile-errors-button").addEventListener(
            'click', () => {
                checkCompileErrors();
            });

        function checkCompileErrors() {
            const p = document.createElement("p");
            p.innerText = "Button Clicked!";
            document.body.append(p);
        }
}());