const delim = ':';

/// used for delim, and replacing the word with the emoji
async function keyReleased(event) {
    var textElement = event.srcElement;
    if(event.key === delim){

        var text;


        if(textElement.tagName === 'TEXTAREA' || textElement.tagName === 'INPUT' || textElement.isContentEditable === false){
            text = textElement.value;
        }else{
            text = textElement.innerHTML;
        }
        /// the next 4 lines extract the text inside nested tags
        text = text.split('>');
        text = text[Math.floor(text.length / 2)];
        text = text.split('<');
        text = text[0];
        
        /// get position of caret
        var caretPos = textElement.selectionStart;

        
        /// gets part of text before the next delimiter (including the delimiter)
        var sequence = text.slice(0, caretPos).split(delim);
        console.log(sequence);
        if(sequence.length < 3){ /// there should be at least two delimiters
            return;
        }
        sequence.pop(); /// remove the last element, which is the empty string after the last delimiter
        word = sequence.pop(); /// get the last word
        var replacement = await checkDictionary(word);  
        console.log(text, caretPos, word, replacement);
        Promise.resolve(replacement);
        if(replacement != ''){
            text = text.slice(0, caretPos - word.length - 2) + replacement + text.slice(caretPos);
            console.log(text);
            if(textElement.tagName === 'TEXTAREA' || textElement.tagName === 'INPUT' || textElement.isContentEditable === false){
                textElement.value = text;
            }else{
                document.execCommand('selectAll',false,null);
                document.execCommand('insertHTML',false,text);
            }
            setCaretPosition(textElement, caretPos - word.length + replacement.length);
        }
    }
}

/// used for backspace, since we need the character which is being deleted
async function keyPressed(event) {
    var textElement = event.srcElement;
    
    if(event.key === 'Backspace'){
        var text;
        if(textElement.tagName === 'TEXTAREA' || textElement.tagName === 'INPUT' || textElement.isContentEditable === false){
            text = textElement.value;
        }else{
            text = textElement.innerHTML;
        }
        text = text.split('>');
        text = text[Math.floor(text.length / 2)];
        text = text.split('<');
        text = text[0];
        
        /// get position of caret
        var caretPos = textElement.selectionStart;
        var codePointArray = Array.from(text);
        var codeCharPos = 0;        
        var counter = 0;
        for(var c of codePointArray){
            if(counter === caretPos){
                break;
            }
            counter += c.length;
            codeCharPos++;
        }
        var character = codePointArray[codeCharPos-1];
        var replacement = await checkReverseDictionary(character);
        Promise.resolve(replacement);
        if(replacement != ''){
            text = codePointArray.slice(0, codeCharPos-1).join('') + delim + replacement + codePointArray.slice(codeCharPos+1).join('');
            if(textElement.tagName === 'TEXTAREA' || textElement.tagName === 'INPUT' || textElement.isContentEditable === false){
                textElement.value = text;
            }else{
                document.execCommand('selectAll',false,null);
                document.execCommand('insertHTML',false,text);
            }
            setCaretPosition(textElement, caretPos - (character.length - replacement.length - 1));
        }
    }
}

function setCaretPosition(elem, caretPos) {

    if(elem != null) {
        if(elem.createTextRange) {
            var range = elem.createTextRange();
            range.move('character', caretPos);
            range.select();
        }
        else {
            if(elem.selectionStart) {
                elem.focus();
                elem.setSelectionRange(caretPos, caretPos);
            }
            else
                elem.focus();
        }
    }
}

async function checkDictionary(word){
    var replacement = await chrome.runtime.sendMessage({"action": "get", "word": word});
    return replacement;
}

async function checkReverseDictionary(character){
    var word = await chrome.runtime.sendMessage({"action": "reverse", "word": character});
    return word;
}


document.addEventListener('keyup', keyReleased);
document.addEventListener('keydown', keyPressed);
