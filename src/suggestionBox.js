let floatingDiv = document.createElement("div");

floatingDiv.style=' position: absolute;\
                    display: none; \
                    background-color: #dfdfdf; \
                    border: 1px solid black; \
                    opacity: 0.75; \
                    z-index: 1000; \
                    flex-direction: column; \
                    color: black; \
                    border-radius: 5px; \
                    padding: 5px; \
                    max-height: 200px; \
                    overflow-y: auto; \
                    width: 200px; \
                    box-shadow: 0px 0px 5px 0px black;';


document.body.appendChild(floatingDiv);

var suggestionsOn;

DICT = {}
REVDICT = {}

let divX = 0, divY = 0;

/// now get the dictionary from the background script, initially
chrome.runtime.sendMessage({
    action: "get",
    dictionary: true
}).then(function (response) {
    DICT = response;
    /// now initialise the revdictionary
    for (let key of Object.keys(DICT)) {
        REVDICT[DICT[key]] = key;
    }
});

chrome.runtime.sendMessage({
    action: "get",
    suggestions: true
}).then(function (response) {
    suggestionsOn = response;
});

function clickedSuggestion(event) {
    /// TODO: insert the suggestion into the text
};

function updateSuggestions(x, top, bottom, text) {
    console.log("update: " + text);
    if(!suggestionsOn) {
        floatingDiv.style.display = "none";
        return null;
    }
    if(text == "") {
        floatingDiv.style.display = "none";
        return null;
    }
    floatingDiv.style.display = "flex";
    for(let child = floatingDiv.lastChild; child; child = floatingDiv.lastChild) {
        floatingDiv.removeChild(child);
    }

    /// now we need to add the suggestions to the floating div
    /// we need to get the suggestions from the dictionary which are similar to the text
    /// sort the suggestions by the similarity
    /// add the suggestions to the floating div
    var suggestions = [];
    for (var key in DICT) {
        if (key.startsWith(text)) {
            suggestions.push(key);
        }
    }
    
    if(suggestions.length == 0) {
        floatingDiv.style.display = "none";
        return null;
    }
    
    console.log(suggestions);
    
    suggestions.sort((a, b) => DICT[b] - DICT[a]);
    for(var i = 0; i < suggestions.length; i++) {
        var suggestion = suggestions[i];
        var suggestionDiv = document.createElement("div");
        suggestionDiv.style = "padding: 5px; cursor: pointer; display: flex; justify-content: space-between;";
        suggestionDiv.onclick = function( event ) {
            clickedSuggestion(event);
        }

        if(i > 0)suggestionDiv.style.borderTop = "1px solid black";

        var suggestionText = document.createElement("p");
        suggestionText.innerHTML = suggestion;
        suggestionText.style = "margin: 0;";
        suggestionDiv.appendChild(suggestionText);

        var suggestionValue = document.createElement("p");
        suggestionValue.innerHTML = DICT[suggestion];
        suggestionValue.style = "margin: 0;";
        suggestionDiv.appendChild(suggestionValue);

        floatingDiv.appendChild(suggestionDiv);
    }

    
    console.log(window.screen.availHeight, top, bottom, floatingDiv.clientHeight);
    if(window.screen.availHeight - bottom < floatingDiv.clientHeight + 150) {
        console.log("top");
        top -= floatingDiv.clientHeight;
        floatingDiv.style.left = x + "px";
        floatingDiv.style.top = top + "px";
    }else{
        console.log("bottom");
        floatingDiv.style.left = x + "px";
        floatingDiv.style.top = bottom + "px";
    }
        
    
    console.log("update: " + text);
    return suggestions[0];
}