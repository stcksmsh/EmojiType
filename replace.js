const delim = ':';

async function keyReleased(event) {
    var textElement = event.srcElement;

    if(event.key === delim){
        if(textElement.tagName === 'TEXTAREA' || textElement.tagName === 'INPUT' || textElement.isContentEditable === false){
            var sequence = textElement.value.split(delim);
            if(sequence.length < 3){ /// there should be at least two delimiters
                return;
            }
            sequence.pop(); /// remove the last one (it is always '')
            sequence = sequence.pop();
            var replacement = await checkDictionary(sequence);  
            Promise.resolve(replacement);
            console.log(replacement);
            if(replacement != undefined){
                var newContent = textElement.value.replace(':' + sequence + ':', replacement);
                console.log(newContent);
                textElement.value = newContent;
            }

        }else{
            var sequence = textElement.innerHTML.split(delim);
            if(sequence.length < 3){ /// there should be at least two delimiters
                return;
            }
            sequence.pop(); /// remove the last one (it is always '')
            sequence = sequence.pop();
            var replacement = await checkDictionary(sequence);  
            Promise.resolve(replacement);
            if(replacement != undefined){
                var newContent = textElement.innerHTML.replace(':' + sequence + ':', replacement);
                textElement.innerHTML = newContent;
            }
        }

    }
}


async function checkDictionary(word){
    var replacement = await chrome.runtime.sendMessage({"action": "get", "word": word});
    return replacement;
}


document.addEventListener('keyup', keyReleased);
