
var DICT;

fetch('dictionary.json')
    .then((response) => response.json())
    .then((json) => {
        DICT = json;
        console.log(DICT);
    }
);
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.action === 'get'){
        var response = DICT[request.word];
        console.log(response);
        sendResponse(response);
    }
    if(request.action === 'set'){
        DICT[request.word] = request.replacement;
        sendResponse('success');
    }
});
