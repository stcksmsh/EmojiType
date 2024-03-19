var delim = ';';
getDelimiter().then((value) => {
    delim = value;
});

/// used for delim, and replacing the word with the emoji
async function keyUp(event) {
    if (event.key === delim) {
        var textElement = event.srcElement;
        var text = textElement.innerText;
        textElement = document.evaluate("//*[text() = '" + escape(text) + "']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        /// get position of caret
        var selection = window.getSelection();
        var caretPos = selection.anchorOffset;

        var sequence = text.split(delim); /// get the sequence of words separated by the delimiter

        if (sequence.length < 2){
            return; /// there should be at least two delimiters for a hotword to be between them
        }

        console.log(text, sequence);

        var newText = sequence[0];
        var replaced = false;
        for (var i = 1; i < sequence.length - 1; i++) {
            /// start from 1, since the first element is before the first delimiter, and go to the second to last element, since the last element is after the last delimiter
            var replacement = await checkDictionary(sequence[i]);
            console.log(sequence[i]);
            if (replacement != "" && replacement != undefined) {
                console.log(replacement);
                newText += replacement;
                replaced = true;
                // codeCharPos -= sequence[i].length + 2 - replacement.length;
                caretPos -= sequence[i].length + 2 - replacement.length;
            } else {
                if (!replaced) {
                    newText += delim;
                }
                newText += sequence[i];
                replaced = false;
            }
        }
        if(!replaced){
            newText += delim;
        }
        newText += sequence[sequence.length - 1];
        if (newText === undefined) {
            return;
        }
        console.log(newText);
        document.execCommand("selectAll", false, null);
        document.execCommand("insertHTML", false, newText);
        setCaretPosition(caretPos);
    }
}

/// used for backspace, since we need the character which is being deleted
async function keyDown(event) {
    var textElement = event.srcElement;
    var text = textElement.innerText;
    if (event.key === "Backspace") {
        textElement = document.evaluate("//*[text() = '" + escape(text) + "']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        /// get position of caret
        var selection = window.getSelection();
        var caretPos = selection.anchorOffset;

        /// certain characters (like emojis) are represented by multiple characters, so we need to find transform the text into an array of code points
        /// then we will find the position of the character being deleted
        var codePointArray = Array.from(text);
        var codeCharPos = 0;
        var counter = 0;
        for (var c of codePointArray) {
            if (counter === caretPos) {
                break;
            }
            counter += c.length;
            codeCharPos++;
        }
        
        var character = codePointArray[codeCharPos - 1];
        var replacement = await checkReverseDictionary(character);
        if (replacement != "" && replacement != undefined) {
            text =
                codePointArray.slice(0, codeCharPos - 1).join("") +
                delim +
                replacement +
                codePointArray.slice(codeCharPos).join("");
            document.execCommand("selectAll", false, null);
            document.execCommand("insertHTML", false, text);
            // await new Promise(r => setTimeout(r, 10));
            setCaretPosition(caretPos - character.length + replacement.length + 1);
        }
    }
}

function setCaretPosition(caretPos) {
    var sel = window.getSelection();
    var range = document.createRange();
    range.setStart(sel.anchorNode, caretPos);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

async function checkDictionary(word) {
    var replacement = await chrome.runtime.sendMessage({
        action: "get",
        key: word,
    });
    return replacement;
}

async function checkReverseDictionary(character) {
    var word = await chrome.runtime.sendMessage({
        action: "get",
        value: character,
    });
    return word;
}

async function getDelimiter(){
    var delim = await chrome.runtime.sendMessage({
        action: "get",
        delim: true
    });
    return delim;

}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.action === "reload") {
        delim = request.delim;
    }
});

document.addEventListener("keyup", keyUp);
document.addEventListener("keydown", keyDown);