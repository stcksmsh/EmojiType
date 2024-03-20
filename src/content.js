var delim = ';';
getDelimiter().then((value) => {
    delim = value;
});

const timeout = 5;

/// used for delim, and replacing the word with the emoji
async function keyUp(event) {
    if (event.key === delim) {
        /// get position of caret
        var selection = window.getSelection();
        var textElement = selection.anchorNode.parentElement;
        var text = textElement.textContent;
        var caretPos = selection.anchorOffset;

        var sequence = text.slice(0, caretPos - 1).split(delim);
        
        /// if the sequence is less than 2, then there is no word to replace
        if (sequence.length < 2) {
            return;
        }
        
        var word = sequence.pop();
        
        var replacement = await checkDictionary(word);

        /// if the word is not in the dictionary, then we don't need to replace it
        if (replacement == "" || replacement == undefined) {
            return;
        }

        var newText = sequence.join(delim) + replacement + text.slice(caretPos);
        document.execCommand("selectAll", false, null);
        document.execCommand("insertHTML", false, newText);
        textElement.textContent = newText;
        await new Promise(r => setTimeout(r, timeout)); /// certain sites have lag? so we need to wait for the text to be inserted before setting the caret position
        setCaretPosition(caretPos - word.length + replacement.length - 3);
    }
}

/// used for backspace, since we need the character which is being deleted
async function keyDown(event) {
    if (event.key === "Backspace") {
        var selection = window.getSelection();
        var textElement = selection.anchorNode.parentElement;
        var text = textElement.textContent;
        var caretPos = selection.anchorOffset;

        /// certain characters (like emojis) are represented by multiple characters, so we need to find transform the text into an array of code points
        /// then we will find the position of the character being deleted
        var codePointArray = Array.from(text);
        var codeCharPos = 0;
        var counter = 0;
        
        if (caretPos == 0) {
            return;
        }

        for (var c of codePointArray) {
            counter += c.length;
            codeCharPos++;
            if (counter == caretPos) {
                break;
            }
            if(counter > caretPos) {
                caretPos = counter;
                break;
            }
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
            await new Promise(r => setTimeout(r, timeout)); /// certain sites have lag? so we need to wait for the text to be inserted before setting the caret position
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
window.addEventListener("keydown", keyDown, true);