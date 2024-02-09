/// used for delim, and replacing the word with the emoji
async function keyReleased(event) {
    const delim = ":";
    var textElement = event.srcElement;
    if (event.key === delim) {
        var text;

        if (
            textElement.tagName === "TEXTAREA" ||
            textElement.tagName === "INPUT" ||
            textElement.isContentEditable === false
        ) {
            text = textElement.value;
        } else {
            text = textElement.innerHTML;
        }
        /// the next 4 lines extract the text inside nested tags
        text = text.split(">");
        text = text[Math.floor(text.length / 2)];
        text = text.split("<");
        text = text[0];

        /// get position of caret
        var caretPos = textElement.selectionStart;
        if (caretPos === undefined) {
            var sequence = text.split(delim); /// get the sequence of words separated by the delimiter
            if (sequence.length < 2) {
                return; /// there should be at least two delimiters
            }
            var newText = sequence[0];
            var replaced = false;
            for (var i = 1; i < sequence.length - 1; i++) { /// start from 1, since the first element is before the first delimiter, and go to the second to last element, since the last element is after the last delimiter
                if (sequence[i] === "" || sequence[i] === undefined) {
                    continue;
                }
                var replacement = await checkDictionary(sequence[i]);
                if (replacement != "" && replacement != undefined) {
                    newText += replacement;
                    replaced = true;
                } else {
                    if (!replaced && i > 0) {
                        newText += delim;
                    }
                    newText += sequence[i];
                    replaced = false;
                }
            }
            if(sequence[sequence.length - 1] === "" && !replaced){
                newText += delim;
            }
            if (newText === undefined) {
                return;
            }
            if (
                textElement.tagName === "TEXTAREA" ||
                textElement.tagName === "INPUT" ||
                textElement.isContentEditable === false
            ) {
                textElement.value = newText;
            } else {
                document.execCommand("selectAll", false, null);
                document.execCommand("insertHTML", false, newText);
            }
        } else {
            /// gets part of text before the next delimiter (including the delimiter)
            var sequence = text.slice(0, caretPos).split(delim);
            if (sequence.length < 3) {
                /// there should be at least two delimiters
                return;
            }
            sequence.pop(); /// remove the last element, which is the empty string after the last delimiter
            word = sequence.pop(); /// get the last word
            if (word === "" || word === undefined) {
                return;
            }
            var replacement = await checkDictionary(word);
            if (replacement != "" && replacement != undefined) {
                text =
                    text.slice(0, caretPos - word.length - 2) +
                    replacement +
                    text.slice(caretPos);
                if (
                    textElement.tagName === "TEXTAREA" ||
                    textElement.tagName === "INPUT" ||
                    textElement.isContentEditable === false
                ) {
                    textElement.value = text;
                } else {
                    document.execCommand("selectAll", false, null);
                    document.execCommand("insertHTML", false, text);
                }
                setCaretPosition(
                    textElement,
                    caretPos - word.length + replacement.length
                );
            }
        }
    }
}

/// used for backspace, since we need the character which is being deleted
async function keyPressed(event) {
    var textElement = event.srcElement;
    const delim = ":";

    if (event.key === "Backspace") {
        var caretPos = textElement.selectionStart;
        if (caretPos === undefined) {
            return; /// if caret position is not available, we can't really do anything
        }

        var text;
        if (
            textElement.tagName === "TEXTAREA" ||
            textElement.tagName === "INPUT" ||
            textElement.isContentEditable === false
        ) {
            text = textElement.value;
        } else {
            text = textElement.innerHTML;
        }
        text = text.split(">");
        text = text[Math.floor(text.length / 2)];
        text = text.split("<");
        text = text[0];

        /// get position of caret
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
        Promise.resolve(replacement);
        if (replacement != "") {
            text =
                codePointArray.slice(0, codeCharPos - 1).join("") +
                delim +
                replacement +
                codePointArray.slice(codeCharPos + 1).join("");
            if (
                textElement.tagName === "TEXTAREA" ||
                textElement.tagName === "INPUT" ||
                textElement.isContentEditable === false
            ) {
                textElement.value = text;
            } else {
                document.execCommand("selectAll", false, null);
                document.execCommand("insertHTML", false, text);
            }
            setCaretPosition(
                textElement,
                caretPos - (character.length - replacement.length - 1)
            );
        }
    }
}

function setCaretPosition(elem, caretPos) {
    if (elem != null) {
        if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.move("character", caretPos);
            range.select();
        } else {
            if (elem.selectionStart) {
                elem.focus();
                elem.setSelectionRange(caretPos, caretPos);
            } else elem.focus();
        }
    }
}

async function checkDictionary(word) {
    var replacement = await chrome.runtime.sendMessage({
        action: "get",
        word: word,
    });
    return replacement;
}

async function checkReverseDictionary(character) {
    var word = await chrome.runtime.sendMessage({
        action: "reverse",
        word: character,
    });
    return word;
}

document.addEventListener("keyup", keyReleased);
document.addEventListener("keydown", keyPressed);
