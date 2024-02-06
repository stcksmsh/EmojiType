
var DICT;

fetch('dictionary.json')
    .then((response) => response.json())
    .then((json) => {
        DICT = json;
    }
);
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.action === 'get'){
        var response = DICT[request.word];
        sendResponse(response);
    }
    if(request.action === 'set'){
        DICT[request.word] = request.replacement;
        sendResponse('success');
    }
});
