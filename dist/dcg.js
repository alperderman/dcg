/*!
* Dynamic Content Generation (2.0.0) 2022/05/09
*/

//polyfills
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === 'function' && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

if (!Object.assign) { Object.defineProperty(Object, 'assign', { enumerable: false, configurable: true, writable: true, value: function(target) { 'use strict'; if (target === undefined || target === null) { throw new TypeError('Cannot convert first argument to object'); } var to = Object(target); for (var i = 1; i < arguments.length; i++) { var nextSource = arguments[i]; if (nextSource === undefined || nextSource === null) { continue; } nextSource = Object(nextSource); var keysArray = Object.keys(Object(nextSource)); for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) { var nextKey = keysArray[nextIndex]; var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey); if (desc !== undefined && desc.enumerable) { to[nextKey] = nextSource[nextKey]; } } } return to; } }); }

if (!Object.values) { Object.values = function values(obj) { var res = []; for (var i in obj) { if (Object.prototype.hasOwnProperty.call(obj, i)) { res.push(obj[i]); } } return res; }; }

if (typeof window.CustomEvent !== 'function') { window.CustomEvent = function (event, params) { params = params || {bubbles: false, cancelable: false, detail: null}; var evt = document.createEvent('CustomEvent'); evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail); return evt; }; }

var dcg = {}; //main object
dcg.version = "2.0.0"; //version number
dcg.logPrefix = "[DCG] "; //log prefix
dcg.default = { //default presets
    labelObj: "dcg-obj", //dynamic content attribute
    labelJson: "dcg-json", //json content attribute
    labelHtml: "dcg-html", //html content attribute
    labelTemplate: "dcg-temp", //temp attribute: for indicating templates
    labelTemplateObj: "dcg-tobj", //template object attribute: for passing raw json data to the template or binding the template with dynamic content
    labelTemplatePre: "dcg-tpre", //template pre attribute: for loading templates before tokens are rendered
    labelTemplateRef: "dcg-tref", //template reference attribute: for loading template for future uses
    labelTemplateRen: "dcg-tren", //template render attribute: for rendering the templates that has been referenced before
    labelSource: "dcg-src", //external source attribute: for fetching external contents or external templates
    labelSourceObj: "dcg-sobj", //source obj attribute: for defining the data of the xhr request
    labelSourceMet: "dcg-smet", //source method attribute: for defining the method of the xhr request
    labelSourcePre: "dcg-spre", //source pre attribute: for fetching external contents before tokens are rendered
    labelScreen: "dcg-screen", //screen block attribute: for indicating the screen block element
    labelRepeat: "dcg-repeat", //repeat attribute: for iterating json contents on design
    labelIf: "dcg-if", //if attribute: for making conditional rendering
    labelEscapePrefix: "dcg:", //escape prefix: escape prefix is used for bypassing invalid html errors by escaping tags and attributes
    tokenOpen: "{{", //opening delimiter for tokens
    tokenClose: "}}", //closing delimiter for tokens
    tokenEscape: "##", //for escaping tokens
    evalOpen: "{%", //opening delimiter for eval expressions
    evalClose: "%}", //closing delimiter for eval expressions
    evalMultiOpen: "{!%", //opening delimiter for multi-line eval expressions
    evalMultiClose: "%!}", //closing delimiter for multi-line eval expressions
    injectScripts: [], //for injecting external scripts
    onloadEvents: [], //for defining custom onload events
    replaceHead: false, //for whether if head is appended or replaced completely with the design's head
    cacheRender: true, //for caching the render
    showLogs: false, //for showing the render logs
    screenBlock: true, //for blocking the screen with the screen block element
    screen: { //screen block properties
        element: "<div style='position:fixed;top:0;left:0;z-index:99;width:100vw;height:100vh;background-color:#ffffff;'></div>", //screen block element
        mode: 0, //for choosing the hiding method of the screen block. 0: removes the screen block element completely, 1: adds a display none, 2: custom hiding method with the custom function
        custom: undefined //function for defining custom hiding method for the screen block (mode 2)
    }
};
//keywords that are going to be used inside the tokens
dcg.keywordObject = {
    this:"_this",
    key:"_key",
    index:"_index",
    len:"_length"
};
dcg.keywordRoot = [
    {name: "$host", value: window.location.protocol + '//' + window.location.host},
    {name: "$path", value: window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"))},
    {name: "$file", value: window.location.pathname.split('/').pop()},
    {name: "$query", value: window.location.search},
    {name: "$hash", value: window.location.hash}
];
dcg.regexTokenDelimiter = new RegExp(dcg.default.tokenOpen+"(?!"+dcg.default.tokenEscape+")[\\s\\S]*?"+dcg.default.tokenClose, "g"); //regex for tokens
dcg.regexEvalDelimiter = new RegExp(dcg.default.evalOpen+"(?!"+dcg.default.tokenEscape+")[\\s\\S]*?"+dcg.default.evalClose, "g"); //regex for eval expressions
dcg.regexEvalMultiDelimiter = new RegExp(dcg.default.evalMultiOpen+"(?!"+dcg.default.tokenEscape+")[\\s\\S]*?"+dcg.default.evalMultiClose, "g"); //regex for multi-line eval expressions
dcg.regexEscape = new RegExp("(<[^>]*?"+dcg.default.labelEscapePrefix+"[^>]*?>)", "gim"); //regex for escaped elements
dcg.regexHead = new RegExp("<head[^>]*>((.|[\\n\\r])*)<\\/head>", "im"); //regex for the head tag
dcg.regexBody = new RegExp("<body[^>]*>((.|[\\n\\r])*)<\\/body>", "im"); //regex for the body tag
dcg.regexScripts = new RegExp("<script[^>]*>([\\s\\S]*?)<\\/script>", "gim"); //regex for the script tags
dcg.profile = {}; //preset profile for assigning custom presets
dcg.dataDynamic = {}; //for storing the dynamic contents, they are usable as tokens (html, json and text)
dcg.dataTemplate = {}; //for storing the template references
//variables for calculating the elapsed time
dcg.watchTimeStart = 0;
dcg.watchTimeStop = 0;
dcg.watchTimeTotal = 0;
dcg.watchTimeRun = false;
dcg.evalFunc = undefined; //empty function for running eval expressions
//static config variables
dcg.renderReady = false; //for checking if the render is done
dcg.renderDom = false; //for checking if the render will be on the current document
dcg.init = function () { //function for initializing the framework
    dcg.reset();
};
dcg.config = function (options) { //function for setting custom presets
    if (typeof options === 'object') {
        dcg.profile = dcg.mergeDeep(dcg.profile, options);
    } else {
        return;
    }
    dcg.reconstruct();
};
dcg.reset = function () { //function for resetting the presets to their default values
    dcg.renderDom = false;
    dcg.profile = dcg.mergeDeep(dcg.default);
    dcg.reconstruct();
};
dcg.reconstruct = function () { //function for reconstructing the presets
    dcg.regexTokenDelimiter = new RegExp(dcg.profile.tokenOpen+"(?!"+dcg.profile.tokenEscape+")[\\s\\S]*?"+dcg.profile.tokenClose, "g");
    dcg.regexEvalDelimiter = new RegExp(dcg.profile.evalOpen+"(?!"+dcg.profile.tokenEscape+")[\\s\\S]*?"+dcg.profile.evalClose, "g");
    dcg.regexEvalMultiDelimiter = new RegExp(dcg.profile.evalMultiOpen+"(?!"+dcg.profile.tokenEscape+")[\\s\\S]*?"+dcg.profile.evalMultiClose, "g");
    dcg.regexEscape = new RegExp("(<[^>]*?"+dcg.profile.labelEscapePrefix+"[^>]*?>)", "gim");
    dcg.keywordRoot = [
        {name: "$host", value: window.location.protocol + '//' + window.location.host},
        {name: "$path", value: window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"))},
        {name: "$file", value: window.location.pathname.split('/').pop()},
        {name: "$query", value: window.location.search},
        {name: "$hash", value: window.location.hash}
    ];
};
dcg.watchStart = function () { //function for starting the time
    dcg.watchTimeStart = dcg.watchGetCurrent();
    dcg.watchTimeRun = true;
};
dcg.watchStop = function () { //function for stopping the time
    dcg.watchTimeStop = dcg.watchGetCurrent();
    dcg.watchTimeRun = false;
};
dcg.watchGetCurrent = function () { //function for getting the current time
    return window.performance.now();
};
dcg.watchSplit = function () { //function for splitting the time
    if (dcg.watchTimeRun) {
        dcg.watchTimeStop = dcg.watchGetCurrent();
    }
    dcg.watchTimeTotal += dcg.watchTimeStop - dcg.watchTimeStart;
    dcg.watchTimeStart = dcg.watchGetCurrent();
};
dcg.watchGetElapsed = function () { //function for getting the elapsed time
    if (dcg.watchTimeRun) {
        dcg.watchTimeStop = dcg.watchGetCurrent();
    }
    return dcg.watchTimeStop - dcg.watchTimeStart;
};
dcg.watchGetTotal = function () { //function for getting the total elapsed time
    if (dcg.watchTimeRun) {
        dcg.watchTimeStop = dcg.watchGetCurrent();
    }
    dcg.watchTimeTotal += dcg.watchTimeStop - dcg.watchTimeStart;
    return dcg.watchTimeTotal;
};
dcg.watchPrint = function (text, showTime, total) { //function for printing the time
    var time;
    if (text == null) {text = "";}
    if (showTime == null) {showTime = true;}
    if (total == null) {total = false;}
    if (total) {
        time = dcg.watchGetTotal();
    } else {
        time = dcg.watchGetElapsed();
    }
    if (dcg.profile.showLogs) {
        if (showTime) {
            console.log(dcg.logPrefix+text+" "+time+"ms");
        } else {
            console.log(dcg.logPrefix+text);
        }
    }
};
dcg.watchPrintSplit = function (text, showTime, total) { //function for splitting and printing the time
    dcg.watchPrint(text, showTime, total);
    dcg.watchSplit();
};
dcg.render = function (arg) { //wrapper for renderDesign function, inputs are: arg.options, arg.content, arg.contentSrc, arg.design, arg.designSrc, arg.before, arg.after
    var result;
    step_start();
    function step_start() { //start the render wrapper
        if (arg == null) {arg = {};}
        if (typeof arg.before !== 'undefined') {
            arg.before();
        }
        dcg.renderReady = false;
        dcg.reset();
        if (arg.options !== null) {
            dcg.config(arg.options);
        }
        if (dcg.profile.screenBlock) {
            screen_block();
        }
        if (dcg.profile.showLogs) {
            console.log(dcg.logPrefix+"Version: "+dcg.version);
        }
        if (arg.content == null) { //if the content and the contentSrc is null then reference the current document as the content
            if (arg.contentSrc == null) {
                dcg.renderDom = true;
                step_content(document);
            } else {
                dcg.xhr(arg.contentSrc, function (xhr) {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            step_content(xhr.responseText);
                        }
                    }
                });
            }
        } else {
            step_content(arg.content);
        }
    }
    function screen_block() { //add screen block element if there is none
        var elScreen, elNewScreen;
        elScreen = dcg.getElementByAttribute(document.body, dcg.profile.labelScreen);
        if (elScreen === false) {
            elNewScreen = document.createElement("dcg");
            elNewScreen.setAttribute(dcg.profile.labelScreen, "");
            elNewScreen.innerHTML = dcg.profile.screen.element;
            document.body.appendChild(elNewScreen);
        }
    }
    function step_content(doc) { //get the content
        var content;
        if (typeof doc === 'string') { //if the content is external then create new document and parse the content
            content = document.implementation.createHTMLDocument("Content");
            if((/\<\/html\>/).test(doc)){
                content.documentElement.innerHTML = doc;
            } else if ((/\<\/body\>/).test(doc)) {
                content.documentElement.innerHTML = content.documentElement.innerHTML.replace("<body", "<body"+doc.match("<body" + "(.*)" + ">")[1]);
                content.body.innerHTML = doc.match(dcg.regexBody)[1];
            } else {
                content.body.innerHTML = doc;
            }
        } else {
            content = doc;
        }
        step_design(content);
    }
    function step_design(content) { //get the design
        var design, designSrc;
        if (arg.design == null) { //if the design is null then check for the external source in the designSrc
            if (arg.designSrc == null) {
                design = false;
                step_render(content, design);
            } else {
                designSrc = arg.designSrc;
                dcg.xhr(designSrc, function (xhr) {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            design = xhr.responseText;
                            step_render(content, design);
                        }
                    }
                });
            }
        } else { //if the design is defined then pass it directly
            design = arg.design;
            step_render(content, design);
        }
    }
    function step_render(content, design) { //render the design with the given arguments
        dcg.renderDesign({
            content: content,
            design: design,
            after: arg.after,
            callback: function (render) {
                result = render;
            }
        });
    }
    return result;
};
dcg.renderDesign = function (arg) { //main render function, inputs are: arg.content, arg.design, arg.callback, arg.after
    step_start();
    function step_start() { //start the time and render
        dcg.watchStart();
        dcg.watchPrint("Render is started!", false);
        if (arg.design !== false) { //if design is not defined then skip the design procedure
            step_design();
        } else {
            recursive_parse();
        }
    }
    function step_design() { //insert the design
        var i, designScripts;
        arg.design = dcg.replaceRoot(arg.design); //replace the root tokens
        if ((/\<\/head\>/).test(arg.design)) { //if the design has head then insert it
            if (dcg.profile.replaceHead) {
                arg.content.head.innerHTML = arg.design.match(dcg.regexHead)[1];
            } else {
                arg.content.head.innerHTML += arg.design.match(dcg.regexHead)[1];
            }
        }
        if ((/\<\/body\>/).test(arg.design)) { //if the design has body then insert only the body with its attributes
            arg.content.documentElement.innerHTML = arg.content.documentElement.innerHTML.replace("<body", "<body"+arg.design.match("<body" + "(.*)" + ">")[1]);
            arg.content.body.innerHTML += arg.design.match(dcg.regexBody)[1];
        } else { //if it doesn't then insert it directly
            arg.content.body.innerHTML += arg.design;
        }
        //remove the script elements that are in the content
        while (arg.content.getElementsByTagName('script').length > 0) {
            arg.content.getElementsByTagName('script')[0].parentNode.removeChild(arg.content.getElementsByTagName('script')[0]);
        }
        //get the script elements from the design and insert them
        designScripts = arg.design.match(dcg.regexScripts);
        if (designScripts) {
            for (i = 0;i < designScripts.length;i++) {
                arg.content.body.innerHTML += designScripts[i];
            }
        }
        dcg.watchPrintSplit("Design is inserted to DOM and dependencies are added!");
        recursive_parse();
    }
    function recursive_parse(i, node) { //recursively parse contents: insert external contents -> render templates -> store and insert dynamic contents -> render templates again
        if (i == null) {i = 1;}
        if (node == null) {node = "";}
        if (i == 1) {
            dcg.watchPrint("Recursive parse is started!", false);
        }
        if (node != arg.content.body.innerHTML || i == 1) {
            node = arg.content.body.innerHTML;
            step_ext("DEPTH "+i+": External contents are loaded!", true, function(){
                arg.content.body.innerHTML = dcg.replaceRoot(arg.content.body.innerHTML);
                step_template("DEPTH "+i+": Templates are stored and rendered before dynamic contents!", true, function(){
                    step_dynamic("DEPTH "+i+": Dynamic contents are stored and inserted!", function(){
                        step_template("DEPTH "+i+": Templates are stored and rendered after dynamic contents!", false, function(){
                            step_ext("DEPTH "+i+": External contents are loaded after dynamic contents!", false, function(){
                                i++;
                                recursive_parse(i, node);
                            });
                        });
                    });
                });
            });
        } else {
            dcg.watchPrintSplit("Recursive parse is completed!", false);
            step_escape();
        }
    }
    function step_ext(print, pre, callback) { //load the external contents and then continue to render
        var externalContents;
        if (pre) {
            externalContents = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelSourcePre);
        } else {
            externalContents = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelSource);
        }
        dcg.loadContents(externalContents, function () {
            dcg.watchPrintSplit(print);
            callback();
        });
    }
    function step_dynamic(print, callback) { //iterate through the dynamic contents then store and insert them
        var i, dynamicContents, dynamicContent, contentId, dynamicContentParse, dynamicContentNested;
        dynamicContents = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelObj);
        for (i = 0; i < dynamicContents.length; i++) {
            dynamicContent = dynamicContents[i];
            contentId = dynamicContent.getAttribute(dcg.profile.labelObj);
            if (dynamicContent.hasAttribute(dcg.profile.labelJson)) { //if it has labelJson attribute, parse json
                dynamicContentParse = dcg.isValidJSON(dynamicContent.innerHTML);
                if (!dynamicContentParse) {
                    dcg.watchPrint('WARNING: JSON parse error on token labeled "'+contentId+'"!', false);
                    dynamicContentParse = '';
                }
            } else if (dynamicContent.hasAttribute(dcg.profile.labelHtml)) { //if it has labelHtml attribute, clone the node
                dynamicContentParse = dynamicContent.cloneNode(true);
            } else { //if it doesn't have labels, store it as it is
                dynamicContentParse = dynamicContent.innerHTML;
            }
            dynamicContentNested = dcg.normalizeObject(dcg.setNestedPropertyValue({}, contentId, dynamicContentParse)); //create nested object based on labelObj and normalize arrays and objects in order to nest them manually later on
            dcg.dataDynamic = dcg.mergeDeep(dcg.dataDynamic, dynamicContentNested); //merge content with dataDynamic
            dynamicContent.parentNode.removeChild(dynamicContent);
        }
        arg.content.body = dcg.displayTokens({el: arg.content.body});
        dcg.watchPrintSplit(print);
        callback();
    }
    function step_template(print, pre, callback) { //store and render the templates
        temp_reference();
        temp_render();
        function temp_reference() {
            var designTemplate, designTemplateId;
            designTemplate = dcg.getElementByAttribute(arg.content.body, dcg.profile.labelTemplateRef);
            if (designTemplate !== false) {
                designTemplateId = designTemplate.getAttribute(dcg.profile.labelTemplate);
                dcg.loadTemplate({id : designTemplateId, el : designTemplate});
                designTemplate.parentNode.removeChild(designTemplate);
                temp_reference();
            }
        }
        function temp_render() {
            var designTemplate, designTemplateId;
            if (pre) {
                designTemplate = dcg.getElementByAttribute(arg.content.body, dcg.profile.labelTemplatePre);
            } else {
                designTemplate = dcg.getElementByAttribute(arg.content.body, dcg.profile.labelTemplateRen);
            }
            if (designTemplate !== false) {
                designTemplateId = designTemplate.getAttribute(dcg.profile.labelTemplate);
                designTemplate.insertAdjacentHTML("afterend", dcg.loadTemplate({id : designTemplateId, el : designTemplate}).innerHTML);
                designTemplate.parentNode.removeChild(designTemplate);
                temp_render();
            }
        }
        dcg.watchPrintSplit(print);
        callback();
    }
    function step_escape() { //remove the remnants and escape the elements and tokens
        arg.content.body.innerHTML = dcg.replaceEscapeToken(arg.content.body.innerHTML);
        arg.content.body.innerHTML = dcg.replaceEscape(arg.content.body.innerHTML);
        dcg.renderReady = true;
        dcg.watchPrintSplit("Elements are escaped and remnants are removed!");
        step_inject();
    }
    function step_inject() { //reload styles and inject the scripts
        var i, links = document.getElementsByTagName("link"), link;
        for (i = 0; i < links.length;i++) {
            link = links[i];
            link.href = link.href;
        }
        dcg.loadScripts(dcg.profile.injectScripts, function() { //load the external scripts
            if (dcg.profile.injectScripts.length > 0) {
                dcg.watchPrintSplit("External scripts are injected!");
            }
            if (dcg.renderDom && arg.design !== false) { //load the scripts of the design
                dcg.loadScriptsNS(arg.content.body.getElementsByTagName("script"), function () {
                    dcg.watchPrintSplit("Design scripts are injected!");
                    step_detail();
                });
            } else {
                step_detail();
            }
        });
    }
    function step_detail() { //if render is not occured on the virtual dom then jump to anchor and dispatch onload events
        if (dcg.renderDom) {
            if (window.location.hash.slice(1) && arg.content.getElementById(window.location.hash.slice(1))) {
                arg.content.getElementById(window.location.hash.slice(1)).scrollIntoView();
            }
            dcg.watchPrintSplit("Dispatching the onload events!");
            dcg.DOMLoad();
        }
        step_finish();
    }
    function step_finish() { //stop the time, print the total elapsed time, remove the screen block and run after function
        var elScreen;
        dcg.watchStop();
        dcg.watchPrint("Render is finished! Total time:", true, true);
        elScreen = dcg.getElementByAttribute(document.body, dcg.profile.labelScreen);
        if (elScreen !== false) {
            if (dcg.profile.screen.mode == 0) {
                elScreen.parentNode.removeChild(elScreen);
            }
            if (dcg.profile.screen.mode == 1) {
                elScreen.style.display = "none";
            }
            if (dcg.profile.screen.mode == 2) {
                if (typeof dcg.profile.screen.custom !== 'undefined') {
                    dcg.profile.screen.custom(elScreen);
                }
            }
        }
        if (typeof arg.after !== 'undefined') {
            arg.after(arg.content.documentElement.innerHTML);
        }
        if (typeof arg.callback !== 'undefined') {
            arg.callback(arg.content.documentElement.innerHTML);
        }
    }
};
dcg.displayTokens = function (arg) { //display tokens function, inputs are: arg.obj, arg.el, arg.root
    if (arg == null) {arg = {};}
    if (!arg.hasOwnProperty("obj")) {arg.obj = dcg.dataDynamic;} //default data is dcg.dataDynamic
    if (!arg.hasOwnProperty("el")) {arg.el = document.body;} //default element is document.body
    if (!arg.hasOwnProperty("root")) {arg.root = false;} //token root
    step_start();
    function step_start() {
        arg.obj = dcg.normalizeObject(arg.obj); //normalize the object
        arg.el = arg.el.cloneNode(true); //clone the element
        step_token();
    }
    function step_token() { //replace all superficial tokens
        var i, tokens, token, tokenPure, tokenPureSplit, tokenData, tokenRoot;
        tokens = dcg.removeDuplicatesFromArray(arg.el.innerHTML.match(dcg.regexTokenDelimiter)); //get all tokens from the element and remove duplicated tokens
        for (i = 0;i < tokens.length;i++) { //iterate through tokens
            token = tokens[i];
            tokenPure = token.substring(dcg.profile.tokenOpen.length, token.length-dcg.profile.tokenClose.length).toLowerCase(); //remove the token delimiters
            tokenPureSplit = tokenPure.split(".");
            tokenData = dcg.getRecursiveValue({arr: arg.obj, keys: tokenPureSplit, i: 0, thisRoot: arg.root}); //split the token using dots and recursively get the value from the data
            if (tokenData !== false) {
                if (dcg.isElement(tokenData)) { //if the value is an html element then run the displayTokens function inside it and set the root relatively
                    tokenRoot = Object.values(dcg.mergeDeep(tokenPureSplit));
                    tokenRoot.pop();
                    arg.el.innerHTML = dcg.replaceAll(arg.el.innerHTML, token, dcg.displayTokens({el: tokenData.cloneNode(true), root: tokenRoot}).innerHTML, 'g');
                } else if (typeof tokenData === 'string') { //if the value is a string, replace the token using regex
                    arg.el.innerHTML = dcg.replaceAll(arg.el.innerHTML, token, tokenData, 'g');
                } else if (typeof tokenData === 'object') { //if the value is an object, stringify it
                    arg.el.innerHTML = dcg.replaceAll(arg.el.innerHTML, token, dcg.encodeHtml(JSON.stringify(tokenData)), 'g');
                }
            }
        }
        step_repeat();
    }
    function step_repeat() { //iterate the elements that has dcg-repeat attribute and replace tokens inside them
        var key, i, ii, arr, elRepeat, elRepeatClone, elRepeatCloneHtml, repeatAttr, repeatAttrSplit, repeatAttrSplitDot, tokenDataArray, tokens, token, tokenPure, tokenPureSplit, tokenData, aliasRegex, aliasRegexMatches, aliasRegexMatch, aliasMatch, aliasReplace;
        elRepeat = dcg.getElementByAttribute(arg.el, dcg.profile.labelRepeat); //get the first element that has dcg-repeat attribute
        elRepeatCloneHtml = "";
        if (elRepeat !== false) { //if there is element with repeat attribute, continue
            repeatAttr = elRepeat.getAttribute(dcg.profile.labelRepeat).toLowerCase();
            repeatAttrSplit = repeatAttr.split(" ");
            repeatAttrSplitDot = repeatAttrSplit[0].split("."); //split the dcg-repeat attribute with spaces and dots
            tokenDataArray = dcg.getRecursiveValue({arr: arg.obj, keys: repeatAttrSplitDot, i: 0, thisRoot: arg.root}); //get the object or array from the data using splitted variable
            if (tokenDataArray === false && arg.obj !== dcg.dataDynamic) { //if there is no specified token inside the data then check the dcg.dataDynamic (fallback for template data)
                tokenDataArray = dcg.getRecursiveValue({arr: dcg.dataDynamic, keys: repeatAttrSplitDot, i: 0, thisRoot: arg.root});
            }
            if (tokenDataArray !== false) {
                i = 0;
                for (var key in tokenDataArray) {
                    elRepeatClone = elRepeat.cloneNode(true); //clone the element that it will be repeated
                    aliasRegex = new RegExp("(?:<)[^>]*((?:"+dcg.profile.labelRepeat+")(?:=)(?:\"|')(?:"+repeatAttrSplit[2]+"\\.)([^>]*?)(?:\"|'))[^>]*(?:>)", "gim");
                    aliasRegexMatches = [];
                    //replace alias inside the cloned element to literal definition in order to repeat the child elements that uses the alias from the parent element
                    while (aliasRegexMatch = aliasRegex.exec(elRepeatClone.innerHTML)) { //find the child elements that uses the alias from the parent element
                        arr = [];
                        arr.push(aliasRegexMatch[1]);
                        arr.push(aliasRegexMatch[2]);
                        aliasRegexMatches.push(arr);
                    }
                    for (ii = 0;ii < aliasRegexMatches.length;ii++) { //iterate through the all of the matches and replace them with literal definitions using regex
                        aliasMatch = aliasRegexMatches[ii];
                        aliasReplace = dcg.profile.labelRepeat+"='"+repeatAttrSplit[0]+"."+key+"."+aliasMatch[1]+"'";
                        elRepeatClone.innerHTML = dcg.replaceAll(elRepeatClone.innerHTML, aliasMatch[0], aliasReplace, 'g');
                    }
                    tokens = dcg.removeDuplicatesFromArray(elRepeatClone.innerHTML.match(dcg.regexTokenDelimiter)); //get all tokens inside the repeated element
                    for (ii = 0;ii < tokens.length;ii++) {
                        token = tokens[ii];
                        tokenPure = token.substring(dcg.profile.tokenOpen.length, token.length-dcg.profile.tokenClose.length).toLowerCase(); //remove the token delimiters
                        tokenPureSplit = tokenPure.split(".");
                        if (tokenPureSplit[0] == repeatAttrSplit[2]) { //check if the alias defined inside the token is same as the alias on the dcg-repeat attribute
                            tokenPureSplit.shift(); //remove the alias since we only need the literal definitions
                            tokenData = dcg.getRecursiveValue({arr: tokenDataArray[key], keys: tokenPureSplit, i: 0, thisKey: key, thisIndex: i, thisRoot: arg.root}); //split the token using dots and recursively get the value from the data
                            if (tokenData !== false) {
                                if (dcg.isElement(tokenData)) { //if the value is an html element then run the displayTokens function inside it and set the root relatively
                                    tokenRoot = repeatAttrSplit[0]+"."+key;
                                    elRepeatClone.innerHTML = dcg.replaceAll(elRepeatClone.innerHTML, token, dcg.displayTokens({el: tokenData.cloneNode(true), root: tokenRoot}).innerHTML, 'g');
                                } else if (typeof tokenData === 'string') { //if the value is string, replace the token using regex
                                    elRepeatClone.innerHTML = dcg.replaceAll(elRepeatClone.innerHTML, token, tokenData, 'g');
                                } else if (typeof tokenData === 'object') { //if the value is an object, stringify it
                                    elRepeatClone.innerHTML = dcg.replaceAll(elRepeatClone.innerHTML, token, dcg.encodeHtml(JSON.stringify(tokenData)), 'g');
                                }
                            }
                        }
                    }
                    elRepeatCloneHtml += elRepeatClone.innerHTML; //expand the variable with the clone element that we have processed, this will be done in every loop and processed elements will be inserted after the whole iteration completes
                    i++;
                }
            }
            if (elRepeatCloneHtml != "") { //if the cloned elements are processed then insert the cloned element
                elRepeat.insertAdjacentHTML("afterend", elRepeatCloneHtml);
            }
            elRepeat.parentNode.removeChild(elRepeat); //remove the original unprocessed element
            step_repeat(); //restart the function
        }
        step_eval();
    }
    function step_eval() { //replace all eval expressions with their corresponding data
        var i, evalExps, evalExp, evalExpPure, evalExpData;
        evalExps = dcg.removeDuplicatesFromArray(arg.el.innerHTML.match(dcg.regexEvalDelimiter)); //get all eval expressions from the element and remove duplicated evals
        for (i = 0;i < evalExps.length;i++) { //iterate through eval expressions
            evalExp = evalExps[i];
            evalExpPure = dcg.decodeHtml(evalExp.substring(dcg.profile.evalOpen.length, evalExp.length-dcg.profile.evalClose.length)); //remove the eval expression delimiters
            if (dcg.isValidJs("dcg.evalFunc = function () {return "+evalExpPure+";}") && evalExpPure.trim() != "") { //if input is valid then evaluate the input and replace it
                window.eval("dcg.evalFunc = function () {return "+evalExpPure+";}");
                evalExpData = dcg.evalFunc();
                arg.el.innerHTML = dcg.replaceAll(arg.el.innerHTML, evalExp, evalExpData, 'g');
            }
        }
        step_multieval();
    }
    function step_multieval() { //replace all multi-line eval expressions with their corresponding data
        var i, evalExps, evalExp, evalExpPure, evalExpData;
        evalExps = dcg.removeDuplicatesFromArray(arg.el.innerHTML.match(dcg.regexEvalMultiDelimiter)); //get all multi-line eval expressions from the element and remove duplicated evals
        for (i = 0;i < evalExps.length;i++) { //iterate through multi-line eval expressions
            evalExp = evalExps[i];
            evalExpPure = dcg.decodeHtml(evalExp.substring(dcg.profile.evalMultiOpen.length, evalExp.length-dcg.profile.evalMultiClose.length)); //remove the multi-line eval expression delimiters
            if (dcg.isValidJs("dcg.evalFunc = function () {"+evalExpPure+"}") && evalExpPure.trim() != "") { //if input is valid then evaluate the input and replace it
                window.eval("dcg.evalFunc = function () {"+evalExpPure+"}");
                evalExpData = dcg.evalFunc();
                arg.el.innerHTML = dcg.replaceAll(arg.el.innerHTML, evalExp, evalExpData, 'g');
            }
        }
        step_if();
    }
    function step_if() { //recursive conditional rendering
        var objIf, ifAttr;
        objIf = dcg.getElementByAttribute(arg.el, dcg.profile.labelIf); //get the first element that has dcg-if attribute
        if (objIf !== false) { //if there is element with dcg-if attribute, continue
            ifAttr = dcg.decodeHtml(objIf.getAttribute(dcg.profile.labelIf));
            if (dcg.isValidJs(ifAttr) && ifAttr.trim() != "") {
                if (window.eval(ifAttr)) { //evaluate the attribute, if it returns true then render the element
                    objIf.insertAdjacentHTML("afterend", objIf.innerHTML);
                }
            }
            objIf.parentNode.removeChild(objIf);
            step_if(); //restart the function
        }
    }
    return arg.el; //return the final element
};
dcg.loadTemplate = function (arg) { //load template function, inputs are: arg.id, arg.obj, arg.el
    var elClone, attrData, attrDataSplit;
    if (!arg.hasOwnProperty("id")) {return false;} //if id isn't defined then stop the function
    if (arg.hasOwnProperty("el")) { //if element is defined, check the object attribute of the defined element
        attrData = arg.el.getAttribute(dcg.profile.labelTemplateObj);
        if (attrData) {
            attrDataSplit = attrData.split(".");
            arg.obj = dcg.getRecursiveValue({arr: dcg.dataDynamic, keys: attrDataSplit, i: 0}); //recursively get the value from the data
            if (arg.obj === false) { //check if there is an object defined on the json content
                arg.obj = dcg.isValidJSON(attrData); //if there isn't, parse the label data
                if (!arg.obj) {
                    if (arg.el.getAttribute(dcg.profile.labelTemplateRef) !== null) {
                        dcg.watchPrint('WARNING: JSON parse error on template reference labeled "'+arg.id+'"!', false);
                    } else {
                        dcg.watchPrint('WARNING: JSON parse error on template render labeled "'+arg.id+'"!', false);
                    }
                }
            }
        }
    } else { //if its not defined then set it undefined
        arg.el = undefined;
    }
    elClone = init_template(arg.id, arg.el).cloneNode(true); //load and clone the template
    attrData = elClone.getAttribute(dcg.profile.labelTemplateObj); //get the referenced template's data attribute
    if ((!arg.obj || !arg.hasOwnProperty("obj")) && attrData) { //if data is not defined previously, check if its defined on the referenced template
        attrDataSplit = attrData.split(".");
        arg.obj = dcg.getRecursiveValue({arr: dcg.dataDynamic, keys: attrDataSplit, i: 0}); //recursively get the value from the data
        if (arg.obj === false) { //check if there is an object defined on the json content
            arg.obj = dcg.isValidJSON(attrData); //if there isn't, parse the label data
        }
    }
    if (arg.obj) { //if data is defined then display the tokens
        elClone = dcg.displayTokens({obj: arg.obj, el: elClone});
    }
    if(dcg.renderReady){ //if render is done, escape elements
        elClone.innerHTML = dcg.replaceEscape(elClone.innerHTML);
    }
    return elClone;
    function init_template(id, el) { //load template function
        var template;
        if (typeof el === 'undefined' || dcg.dataTemplate.hasOwnProperty(id)) { //check if template's id exists on the stored templates or el is not defined
            template = dcg.dataTemplate[id];
        } else { //if el is defined and template id doesn't exist then store this new template with its id
            template = el.cloneNode(true);
            dcg.dataTemplate[id] = template;
        }
        return template; //return the template
    }
};
dcg.encodeHtml = function (str) { //encode html entities function
    var i, buf = [];
    for (var i=str.length-1;i>=0;i--) {
        buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
    }
    return buf.join('');
};
dcg.decodeHtml = function (str) { //decode html entities function
    return str.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
    });
};
dcg.replaceEscape = function (html) { //escape elements function
    if (html == null) {html = document.body.cloneNode(true).innerHTML;}
    var i, newHtml = html, match, matches = [], oldEl, newEl;
    while (match = dcg.regexEscape.exec(newHtml)) {
        matches.push(match[1]);
    }
    matches = dcg.removeDuplicatesFromArray(matches);
    for (i = 0;i < matches.length;i++) {
        oldEl = matches[i];
        newEl = dcg.replaceAll(oldEl, dcg.profile.labelEscapePrefix, '', 'gim');
        newHtml = dcg.replaceAll(newHtml, oldEl, newEl, 'gim');
    }
    return newHtml;
};
dcg.replaceEscapeToken = function (html) { //escape tokens function
    var newHtml = html;
    if (html == null) {return;}
    newHtml = dcg.replaceAll(newHtml, dcg.profile.tokenOpen+dcg.profile.tokenEscape, dcg.profile.tokenOpen, 'gim');
    newHtml = dcg.replaceAll(newHtml, dcg.profile.evalOpen+dcg.profile.tokenEscape, dcg.profile.evalOpen, 'gim');
    newHtml = dcg.replaceAll(newHtml, dcg.profile.evalMultiOpen+dcg.profile.tokenEscape, dcg.profile.evalMultiOpen, 'gim');
    return newHtml;
};
dcg.replaceRoot = function (html, name) { //root tokens function
    var i, newHtml = html, root;
    if (html == null) {return;}
    for (i = 0;i < dcg.keywordRoot.length;i++) {
        root = dcg.keywordRoot[i];
        if (name != null && name != "") {
            if (root.name == name) {
                newHtml = dcg.replaceAll(newHtml, dcg.profile.tokenOpen+root.name+dcg.profile.tokenClose, root.value, 'gim');
            }
        } else {
            newHtml = dcg.replaceAll(newHtml, dcg.profile.tokenOpen+root.name+dcg.profile.tokenClose, root.value, 'gim');
        }
    }
    return newHtml;
};
dcg.isValidJSON = function (str) { //try json function
    try {
        var o = JSON.parse(str);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) {}
    return false;
};
dcg.isValidJs = function (code) { //try eval function
    var result = true;
    try {
        eval(code);
    }
    catch (e) {
        result = false;
    }
    return result;
};
dcg.isElement = function (el) { //check if input is html element function
    return el instanceof Element || el instanceof HTMLDocument;  
};
dcg.getElementsByAttribute = function (x, att, val) { //get elements by their attribute and their value
    if (!val) {val = "";}
    var arr = [], arrCount = -1, i, l, y = x.getElementsByTagName("*"), z = att.toUpperCase();
    l = y.length;
    for (i = -1; i < l; i += 1) {
        if (i == -1) { y[i] = x; }
        if (y[i].getAttribute(z) !== null) {
            if (val == "" || y[i].getAttribute(z) == val) {
                arrCount += 1; arr[arrCount] = y[i];
            }
        }
    }
    return arr;
};
dcg.getElementByAttribute = function (x, att, val) { //get the first element by its attribute and their value
    if (!val) {val = "";}
    var i, l, y = x.getElementsByTagName("*"), z = att.toUpperCase();
    l = y.length;
    var result = false;
    for (i = -1; i < l; i += 1) {
        if (i == -1) { y[i] = x; }
        if (y[i].getAttribute(z) !== null) {
            if (val == "" || y[i].getAttribute(z) == val) {
                result = y[i];
                break;
            }
        }
    }
    return result;
};
dcg.removeDuplicatesFromArray = function (arr) { //remove duplicated values from array
    var m = {}, newArr = [];
    if(arr){
        for (var i=0;i < arr.length;i++) {
            var v = arr[i];
            if (!m[v] && v != "") {
                newArr.push(v);
                m[v]=true;
            }
        }
    }
    return newArr;
};
dcg.getRecursiveValue = function (arg) { //getting a value from a multi-dimensional object, case insensitive, inputs are: arg.arr, arg.keys, arg.i, arg.thisKey, arg.thisRoot
    if (typeof arg.keys === 'string') {arg.keys = arg.keys.split('.');}
    if (typeof arg.thisRoot === 'string') {arg.thisRoot = arg.thisRoot.split('.');}
    if (arg.i == null) {arg.i = 0;}
    if (arg.thisKey == null && arg.i > 0) {arg.thisKey = arg.keys[arg.i-1];}
    var key = arg.keys[arg.i], len = arg.keys.length, val = arg.arr, arrLen, success = true;
    if (arg.arr.length == null) {
        arrLen = Object.keys(arg.arr).length;
    } else {
        arrLen = arg.arr.length;
    }
    if (len > 0 && arg.i < len) {
        arg.i++;
        if (arg.arr.hasOwnProperty(key.toLowerCase())) {
            val = dcg.getRecursiveValue({arr: arg.arr[key.toLowerCase()], keys: arg.keys, i: arg.i});
            if (val === false) {
                success = false;
            }
        } else if (key == dcg.keywordObject.this){
            if (arg.thisRoot != null && arg.thisRoot.length > 0) {
                arg.thisKey = arg.thisRoot[arg.i];
                arg.arr = dcg.getRecursiveValue({arr: arg.arr, keys: arg.thisRoot, i: 0});
            }
            val = dcg.getRecursiveValue({arr: arg.arr, keys: arg.keys, i: arg.i, thisKey: arg.thisKey});
            if (val === false) {
                success = false;
            }
        } else if (key == dcg.keywordObject.key && arg.thisKey != null) {
            val = arg.thisKey;
        } else if (key == dcg.keywordObject.index && arg.thisIndex != null) {
            val = parseInt(arg.thisIndex, 10);
        } else if (key == dcg.keywordObject.len) {
            val = arrLen;
        } else {
            success = false;
            val = false;
        }
    }
    if (success && typeof val !== 'object') {
        val = String(val);
    }
    return val;
};
dcg.setNestedPropertyValue = function (obj, fields, val) { //function for setting a value, deep inside an object
  fields = fields.split('.');
  var cur = obj,
  last = fields.pop();
  fields.forEach(function(field) {
      cur[field] = {};
      cur = cur[field];
  });
  cur[last] = val;
  return obj;
};
dcg.normalizeObject = function (obj) { //function for normalizing arrays and objects
    var result = {};
    if (Array.isArray(obj)) {
        obj = toObject(obj);
    }
    if (typeof obj === 'object' && !dcg.isElement(obj)) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                result[property.toLowerCase()] = dcg.normalizeObject(obj[property]);
            }
        }
    } else {
        result = obj;
    }
    function toObject(arr) {
        var rv = {};
        for (var i = 0; i < arr.length; ++i)
            rv[i] = arr[i];
        return rv;
    }
    return result;
};
dcg.mergeDeep = function (target, source) { //function for merging multi-dimensional objects
    var output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(function (key) {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, _defineProperty({}, key, source[key]));
                } else {
                    output[key] = dcg.mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, _defineProperty({}, key, source[key]));
            }
        });
    }
    function isObject(item) {
        return item && _typeof(item) === 'object' && !Array.isArray(item);
    }
    return output;
};
dcg.replaceAll = function (str, find, replace, options) { //replace all strings with using regex
    if (options == null) {options = 'gim';}
    function escapeRegExp(string) {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    }
    return str.replace(new RegExp(escapeRegExp(find), options), replace);
};
dcg.loadContents = function (node, callback, i) { //fetch and load external contents, recursively
    if (node == null) {node = dcg.getElementsByAttribute(document.documentElement, dcg.profile.labelSource);} //if node doesn't exist then set it to document element and get the elements with source attribute
    if (i == null) {i = 0;} //if index doesn't exist, set it to 0
    var src, len = node.length;
    if (len > 0 && i < len) { //if there are elements with source attributes and index is lower than total elements, continue
        src = node[i].getAttribute(dcg.profile.labelSource);
        method = node[i].getAttribute(dcg.profile.labelSourceMet);
        data = node[i].getAttribute(dcg.profile.labelSourceObj);
        if (src != "") { //if source is not empty, fetch the content and insert it into element then increase the index and run the function again
            if (data) {
                data = dcg.isValidJSON(data);
                if (!data) {
                    dcg.watchPrint('WARNING: JSON parse error on the "'+dcg.profile.labelSourceObj+'" parameter!', false);
                    data = "";
                }
            }
            dcg.xhr(src, function (xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        node[i].insertAdjacentHTML("afterend", xhr.responseText);
                        node[i].parentNode.removeChild(node[i]);
                    }
                }
                i++;
                dcg.loadContents(node, callback, i);
            }, method, data);
        }
    } else { //if there are no elements or index is higher than total elements, run the callback function
        if (typeof callback !== 'undefined') {
            callback();
        }
    }
};
dcg.loadScripts = function(arr, callback, i) { //inject scripts from array, recursively
    var len;
    if (i == null) {i = 0;}
    if (arr == null) {len = 0;} else {len = arr.length;}
    if (typeof arr === 'object') {
        if (len > 0 && i < len) {
            dcg.getScript(arr[i], function () {
                i++;
                dcg.loadScripts(arr, callback, i);
            });
        } else {
            if (typeof callback !== 'undefined') {
                callback();
            }
        }
    } else if (typeof arr === 'string') {
        dcg.getScript(arr, function () {
            if (typeof callback !== 'undefined') {
                callback();
            }
        });
    } else {
        if (typeof callback !== 'undefined') {
            callback();
        }
    }
};
dcg.loadScriptsNS = function (node, callback, i) { //inject scripts from specified element, recursively
    if (node == null) {node = document.getElementsByTagName("script");} //if node is not specified then get all script elements
    if (i == null) {i = 0;} //if index is not defined then set it to 0
    var len = node.length;
    if (len > 0 && i < len) { //if there are script elements and index is lower than total elements, continue
        if (node[i].src) { //check if script element has source attribute, if it has then fetch the external script and inject it
            dcg.getScript(node[i].src, function () {
                i++;
                dcg.loadScriptsNS(node, callback, i);
            });
        } else { //if it hasn't then inject it directly
            dcg.DOMEval(node[i].text);
            i++;
            dcg.loadScriptsNS(node, callback, i);
        }
    } else { //if there are no elements or index is higher than total elements then run the callback function
        if (typeof callback !== 'undefined') {
            callback();
        }
    }
};
dcg.getUrlParams = function (url) { //get query parameters from url
    var i, result = {}, queryString, keyValuePairs, keyValuePair, paramName, paramValue;
    queryString = getQueryString();
    if (queryString) {
        keyValuePairs = queryString.split('&');
        for (i = 0; i < keyValuePairs.length; i++) {
            keyValuePair = keyValuePairs[i].split('=');
            paramName = keyValuePair[0];
            if (keyValuePair[1]) {
                paramValue = keyValuePair[1];
            } else {
                paramValue = '';
            }
            result[paramName] = decodeURIComponent(paramValue.replace(/\+/g, ' '));
        }
    }
    function getQueryString () {
        var reducedUrl, queryString;
        reducedUrl = url.split('#')[0];
        queryString = reducedUrl.split('?')[1];
        if (!queryString) {
            if (reducedUrl.search('=') !== false) {
                queryString = reducedUrl;
            }
        }
        return queryString
    }
    return result;
};
dcg.urlEncode = function (obj) { //convert array of values into query string
    var key, result;
    if (typeof obj === 'object') {
        result = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push(key + '=' + encodeURIComponent(obj[key]));
            }
        }
        result = result.join('&');
    } else {
        result = obj;
    }
    return result;
};
dcg.xhr = function (url, callback, method, obj, cache, async) { //xhr function used for fetching external contents, scripts and templates
    if (method == null) {method = 'GET';}
    if (obj == null) {obj = '';}
    if (cache == null) {cache = dcg.profile.cacheRender;}
    if (async == null) {async = true;}
    var xhr, guid, cacheUrl, hashUrl;
    method = method.toUpperCase();
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            callback(xhr);
        }
    };
    if (!cache) { //cache buster
        guid = Date.now();
        cacheUrl = url.replace(/#.*$/, "");
        hashUrl = url.slice(cacheUrl.length);
        cacheUrl = cacheUrl.replace(/([?&])_=[^&]*/, "$1");
        hashUrl = ((/\?/).test(cacheUrl) ? "&" : "?") + "_=" + (guid++) + hashUrl;
        url = cacheUrl + hashUrl;
    }
    if (method == 'GET' && obj != '') {
        url = url.split(/[?#]/)[0]+'?'+dcg.urlEncode(dcg.mergeDeep(dcg.getUrlParams(url), obj));
    }
    xhr.open(method, url, async);
    if (method == 'GET') {
        xhr.send();
    } else {
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(dcg.urlEncode(obj));
    }
};
dcg.DOMLoad = function () { //imitate window onload and dispatch custom onload events
    var i;
    document.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    window.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    window.dispatchEvent(new CustomEvent('load'));
    for (i = 0; i < dcg.profile.onloadEvents.length; i++) {
        dcg.profile.onloadEvents[i].node.dispatchEvent(new CustomEvent(dcg.profile.onloadEvents[i].name));
    }
};
dcg.DOMEval = function (code) { //script injection function
    var script;
    script = document.createElement("script");
    script.text = code;
    document.head.appendChild(script).parentNode.removeChild(script);
};
dcg.getScript = function (url, callback) { //external script injection function
    dcg.xhr(url, function (xhr) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                dcg.DOMEval(xhr.responseText);
            }
            if (typeof callback !== 'undefined') { //skip an execution frame and run callback function if its defined
                setTimeout(function () {callback(xhr)}, 0);
            }
        }
    });
};
dcg.init();