
var delim = ';';
getDelimiter().then((value) => {
    delim = value;
});
const timeout = 2;

// /// used for delim, and replacing the word with the emoji
// async function keyUp(event) {
//     /// get the text, caret position, and the word to replace
//     var selection = window.getSelection();
//     var textElement = selection.anchorNode.parentElement;
//     var text = textElement.textContent;
//     var caretPos = selection.anchorOffset;

    
//     var x = selection.anchorNode.parentElement.getBoundingClientRect().left + caretPos * 10;
//     var y = selection.anchorNode.parentElement.getBoundingClientRect().top + 20;
//     if (event.key === delim) {
        
//         var sequence = text.slice(0, caretPos - 1).split(delim);
//         /// if the sequence is less than 2, then there is no word to replace
//         if (sequence.length < 2) return;

//         var word = sequence.pop();

//         var replacement = DICT[word];

//         /// if the word is not in the dictionary, then we don't need to replace it
//         if (replacement == "" || replacement == undefined) {
//             return;
//         }

//         var newText = sequence.join(delim) + replacement + text.slice(caretPos);
//         document.execCommand("selectAll", false, null);
//         document.execCommand("insertHTML", false, newText);
//         textElement.textContent = newText;
        
//         await new Promise(r => setTimeout(r, timeout)); /// certain sites have lag? so we need to wait for the text to be inserted before setting the caret position
//         setCaretPosition(caretPos - word.length + replacement.length - 3);
//     }
//     updateSuggestions(x, y, text.slice(0, caretPos).split(delim).pop());
// }

/// used for backspace, since we need the character which is being deleted
async function keyDown(event){
    var selection = window.getSelection();
    var textElement = selection.anchorNode.parentElement;
    var text = textElement.textContent;
    var caretPos = selection.anchorOffset;


    var sequence = text.slice(0, caretPos).split(delim);
    var word = sequence.pop();

    if (event.key === "Backspace") {
        word = word.slice(0, -1);
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
        var replacement = REVDICT[character];

        console.log(character, replacement);

        if (replacement != "" && replacement != undefined) {
            event.preventDefault();
            text =
                codePointArray.slice(0, codeCharPos - 1).join("") +
                delim +
                replacement +
                codePointArray.slice(codeCharPos).join("") + ' ';
            document.execCommand("selectAll", false, null);
            document.execCommand("insertHTML", false, text);
            console.log(codePointArray, codeCharPos, codePointArray.slice(codeCharPos));
            await new Promise(r => setTimeout(r, timeout)); /// certain sites have lag? so we need to wait for the text to be inserted before setting the caret position
            setCaretPosition(caretPos - character.length + replacement.length + 1);
            word = replacement;
            sequence.push('');
        }
    }
    else if(event.key === delim) {
        
        if (sequence.length == 0) return;

        var replacement = DICT[word];
        
        /// if the word is not in the dictionary, then we don't need to replace it
        if (replacement == "" || replacement == undefined) {
            return;
        }
        
        var newText = sequence.join(delim) + replacement + text.slice(caretPos);
        document.execCommand("selectAll", false, null);
        document.execCommand("insertHTML", false, newText);
        textElement.textContent = newText;
        event.preventDefault();
        await new Promise(r => setTimeout(r, timeout)); /// certain sites have lag? so we need to wait for the text to be inserted before setting the caret position
        setCaretPosition(caretPos - word.length + replacement.length - 2);
        console.log(caretPos, word.length, replacement.length);
        word = null;
    }
    else if(event.key != "Tab"){
        word += event.key;
    }
    /// if the sequence length is 0, then there is no delimiter before the caret 
    if (sequence.length == 0) {
        word = null;
    }

    let box = selection.getRangeAt(0).getClientRects()[0];

    var x = box.right;
    var top = box.top;
    var bottom = box.bottom;
    
    var replacement = updateSuggestions(x, top, bottom, word);
    
    if (event.key === "Tab") {
        if (replacement != null) {
            event.preventDefault();
            console.log(sequence, replacement, text, caretPos, text.slice(caretPos));
            var newText = sequence.join(delim) + delim + replacement + text.slice(caretPos);
            document.execCommand("selectAll", false, null);
            document.execCommand("insertHTML", false, newText);
            textElement.textContent = text.slice(0, caretPos) + replacement + text.slice(caretPos);
            await new Promise(r => setTimeout(r, timeout)); /// certain sites have lag? so we need to wait for the text to be inserted before setting the caret position
            setCaretPosition(caretPos - word.length + replacement.length);
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


async function getDelimiter(){
    var delim = await chrome.runtime.sendMessage({
        action: "get",
        delim: true
    });
    return delim;

}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.action === "set") {;smile;
        if (request.key !== undefined && request.value !== undefined) {
            DICT[request.key] = request.value;
            REVDICT[request.value] = request.key;
        }
        if (request.dictionary !== undefined) {
            DICT = request.dictionary;
            for (let key of Object.keys(DICT)) {
                REVDICT[DICT[key]] = key;
            }
        }
        if (request.delim !== undefined) {
            delim = request.delim;
        }
        if (request.suggestions !== undefined) {
            suggestionsOn = request.suggestions;
        }
    }
});

// document.addEventListener("keyup", keyUp);
window.addEventListener("keydown", keyDown, true);