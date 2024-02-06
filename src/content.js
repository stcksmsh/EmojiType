const delim = ':';

async function keyReleased(event) {
    var textElement = event.srcElement;
    if(event.key === delim){

        var text;


        if(textElement.tagName === 'TEXTAREA' || textElement.tagName === 'INPUT' || textElement.isContentEditable === false){
            text = textElement.value;
        }else{
            text = textElement.innerHTML;
            if(replacement != undefined){
                var newContent = textElement.innerHTML.replace(':' + sequence + ':', replacement);
                textElement.innerHTML = newContent;
                // selectionStart = selectionStart - sequence.length - 2 + replacement.length;
                // textElement.setSelectionRange(selectionStart, selectionStart);
                textElement.selectionStart = selectionStart;
            }
        }
        /// the next 4 lines extract the text inside nested tags
        text = text.split('>');
        text = text[Math.floor(text.length / 2)];
        text = text.split('<');
        text = text[0];
        var sequence = text.split(delim);
        if(sequence.length < 3){ /// there should be at least two delimiters
            return;
        }
        sequence.pop();/// remove the last one
        var word = sequence.pop(); 
        var replacement = await checkDictionary(word);  
        Promise.resolve(replacement);
        if(replacement != undefined){
            text = text.replace(':' + word + ':', replacement);
        }
        if(textElement.tagName === 'TEXTAREA' || textElement.tagName === 'INPUT' || textElement.isContentEditable === false){
            textElement.value = text;
        }else{
            document.execCommand('selectAll',false,null);
            document.execCommand('insertText',false,text);
        }

    }
}


async function checkDictionary(word){
    var replacement = await chrome.runtime.sendMessage({"action": "get", "word": word});
    return replacement;
}


document.addEventListener('keyup', keyReleased);
