document.getElementById('add').addEventListener('click', addToDict);


function addToDict(){
    var word = document.getElementById('input').value;
    console.log(word);
    chrome.runtime.sendMessage({"set": word, "replacement": 'test'}, function(response){
        console.log(response);
    });
}