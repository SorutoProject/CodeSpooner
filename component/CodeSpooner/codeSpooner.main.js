/*codeSpooner
(C)2019 Soruto Project
*/

const $$ = function (e) {
    const el = document.querySelectorAll(e);
    if (el.length == 1) {
        return el[0];
    } else {
        return el;
    }
}

let codeMirrors = {};

let spoonFn = {
    "editorSetOption": function (name, value) {
        for (let i = 0; i < 3; i++) {
            switch (i) {
                case 0:
                    var lang = "html";
                    break;
                case 1:
                    var lang = "js";
                    break;
                case 2:
                    var lang = "css";
                    break;
            }
            codeMirrors[lang].setOption(name, value);
        }
    },
    "updatePreview": function () {
        if (spoonFn.updatePreviewTimer !== null) clearTimeout(spoonFn.updatePreviewTimer);
        spoonFn.updatePreviewTimer = setTimeout(function () {
            spoonFn.updatePreviewTimer = null;
            const html = codeMirrors.html.getValue();
            const js = '<script>' + codeMirrors.js.getValue() + "</script>\n";
            const css = '<style>' + codeMirrors.css.getValue() + "</style>\n";
            if (html.indexOf("</head>") !== -1) {
                const code = html.replace("</head>", js + css + "\n</head>");
                //console.log(code);
                const preview = $$("#preview");
                //codeからblobURLを生成
                const blob = new Blob([code], {
                    type: 'text/html'
                });
                preview.src = URL.createObjectURL(blob);
            }
        }, 800);
    },
    updatePreviewTimer: null,
    shareProject: function () {
        if ($$("#projectTitle").value === "" || $$("#projectAuthor").value === "") {
            alert("プロジェクト名もしくはプロジェクトの製作者名が入力されていません。");
            return;
        }
        //make composition of user project
        const json = {
            "info": {
                "title": $$("#projectTitle").value,
                "author": $$("#projectAuthor").value
            },
            "code": {
                "html": codeMirrors.html.getValue(),
                "js": codeMirrors.js.getValue(),
                "css": codeMirrors.css.getValue()
            }
        }

        const jsonStr = JSON.stringify(json);
        const jsonStrLz = LZString.compressToEncodedURIComponent(jsonStr);
        const shareURL = location.protocol + "//" + location.host + location.pathname + "#" + jsonStrLz;
        spoonFn.execCopy(shareURL);
        alert("共有用URLをコピーしました。");
    },
    execCopy: function (string) {
        var temp = document.createElement('textarea');

        temp.value = string;
        temp.selectionStart = 0;
        temp.selectionEnd = temp.value.length;

        var s = temp.style;
        s.position = 'fixed';
        s.left = '-100%';

        document.body.appendChild(temp);
        temp.focus();
        var result = document.execCommand('copy');
        temp.blur();
        document.body.removeChild(temp);
        // true なら実行できている falseなら失敗か対応していないか
        return result;
    }
}

window.onbeforeunload = function (e) {
    return "編集内容が破棄されます。続行しますか？";
}

window.onload = function () {
    //Set Codemirror
    codeMirrors.html = CodeMirror.fromTextArea($$("#codeHTML"), {
        mode: "htmlmixed",
        extraKeys: {
            "Ctrl-Space": "autocomplete"
        }
    });
    codeMirrors.js = CodeMirror.fromTextArea($$("#codeJS"), {
        mode: "javascript",
        extraKeys: {
            "Ctrl-Space": "autocomplete"
        }
    });
    codeMirrors.css = CodeMirror.fromTextArea($$("#codeCSS"), {
        mode: "css",
        extraKeys: {
            "Ctrl-Space": "autocomplete"
        }
    });

    //Enable Emmet
    emmetCodeMirror(codeMirrors.html);
    emmetCodeMirror(codeMirrors.css);


    //set Options to All codeMirror textbox.
    spoonFn.editorSetOption("theme", "monokai");
    spoonFn.editorSetOption("lineNumbers", true);
    spoonFn.editorSetOption("styleActiveLine", true);
    spoonFn.editorSetOption("matchBrackets", true);
    spoonFn.editorSetOption("autoCloseBrackets", true);
    spoonFn.editorSetOption("lineWrapping", true);

    //change Event

    codeMirrors.html.on("change", function () {
        spoonFn.updatePreview();
    });
    codeMirrors.js.on("change", function () {
        spoonFn.updatePreview();
    });
    codeMirrors.css.on("change", function () {
        spoonFn.updatePreview();
    });

    //addEventListener
    
    //if codeSpooner is load in iframe
    if(window.parent == window){
    $$("#shareButton").addEventListener("click", function () {
        spoonFn.shareProject();
    });
    }else{
        $$("#shareButton").style.display = "none";
    }

    $$("#projectTitle").addEventListener("keyup", function (e) {
        if (e.target.value !== "") document.title = e.target.value + " - CodeSpooner";
        else document.title = "CodeSpooner";
    });

    //set User Script when location.hash is not ""
    if (location.hash !== "") {
        const jsonStrLz = location.hash.substring(1);
        const jsonStr = LZString.decompressFromEncodedURIComponent(jsonStrLz);
        const json = JSON.parse(jsonStr);
        codeMirrors.html.setValue(json.code.html);
        codeMirrors.css.setValue(json.code.css);
        codeMirrors.js.setValue(json.code.js);
        $$("#projectTitle").value = json.info.title;
        $$("#projectAuthor").value = json.info.author;

        if (json.info.title !== "") document.title = json.info.title + " - CodeSpooner";
        else document.title = "CodeSpooner";
    }
}
