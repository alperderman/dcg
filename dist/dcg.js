/*!
* Dynamic Content Generation (1.1.0) 2021/12/23
*/

//polyfills
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === 'function' && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

if (!Object.assign) { Object.defineProperty(Object, 'assign', { enumerable: false, configurable: true, writable: true, value: function(target) { 'use strict'; if (target === undefined || target === null) { throw new TypeError('Cannot convert first argument to object'); } var to = Object(target); for (var i = 1; i < arguments.length; i++) { var nextSource = arguments[i]; if (nextSource === undefined || nextSource === null) { continue; } nextSource = Object(nextSource); var keysArray = Object.keys(Object(nextSource)); for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) { var nextKey = keysArray[nextIndex]; var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey); if (desc !== undefined && desc.enumerable) { to[nextKey] = nextSource[nextKey]; } } } return to; } }); }

if (!Object.values) { Object.values = function values(obj) { var res = []; for (var i in obj) { if (Object.prototype.hasOwnProperty.call(obj, i)) { res.push(obj[i]); } } return res; }; }

if (typeof window.CustomEvent !== 'function') { window.CustomEvent = function (event, params) { params = params || {bubbles: false, cancelable: false, detail: null}; var evt = document.createEvent('CustomEvent'); evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail); return evt; }; }

var dcg = {}; //main object
dcg.version = "1.1.0"; //version number
dcg.logPrefix = "[DCG] "; //log prefix
dcg.default = { //default presets
    labelObj: "dcg-obj", //dynamic content attribute
    labelRaw: "dcg-raw", //static content attribute
    labelJson: "dcg-json", //json content attribute
    labelXml: "dcg-xml", //xml content attribute
    labelHtml: "dcg-html", //html content attribute
    labelTemplate: "dcg-temp", //temp attribute: for indicating templates
    labelTemplateData: "dcg-data", //data attribute: for passing raw json data to the template or binding the template with dynamic content
    labelTemplateReference: "dcg-tref", //template reference attribute: for loading template for future uses
    labelTemplateRender: "dcg-tren", //template render attribute: for rendering the templates that has been referenced before
    labelTemplatePrefix: "tref_", //prefix for indicating template references inside the dataStatic
    labelSource: "dcg-src", //external source attribute: for fetching external contents or external templates
    labelRepeat: "dcg-repeat", //repeat attribute: for iterating json contents on design
    labelIf: "dcg-if", //if attribute: for making conditional rendering
    labelRemove: "dcg-remove", //remove attribute: for removing elements from the content
    labelEscapePrefix: "dcg:", //escape prefix: escape prefix is used for bypassing invalid html errors by escaping tags and attributes
    tokenOpen: "{{", //opening delimiter for tokens
    tokenClose: "}}", //closing delimiter for tokens
    tokenEscape: "##", //for escaping tokens
    evalOpen: "{%", //opening delimiter for eval expressions
    evalClose: "%}", //closing delimiter for eval expressions
    evalMultiOpen: "{!%", //opening delimiter for multi-line eval expressions
    evalMultiClose: "%!}", //closing delimiter for multi-line eval expressions
    cacheRender: false, //for caching render change it to true if its going to be used in production
    showLogs: false, //for showing the render logs
    removeCss: false //for removing the styles of the content page, if set to true styles will not be carried over rendered page
};
//keywords to be used inside the tokens
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
dcg.regexTokenDelimiter = new RegExp(dcg.default.tokenOpen+"[\\s\\S]*?"+dcg.default.tokenClose, "g"); //regex for tokens
dcg.regexEvalDelimiter = new RegExp(dcg.default.evalOpen+"[\\s\\S]*?"+dcg.default.evalClose, "g"); //regex for eval expressions
dcg.regexEvalMultiDelimiter = new RegExp(dcg.default.evalMultiOpen+"[\\s\\S]*?"+dcg.default.evalMultiClose, "g"); //regex for multi-line eval expressions
dcg.regexEscape = new RegExp("(<[^>]*?"+dcg.default.labelEscapePrefix+"[^>]*?>)", "gim"); //regex for escaped elements
dcg.regexBody = new RegExp("<body[^>]*>((.|[\\n\\r])*)<\\/body>", "im"); //regex for matching body tag
dcg.regexLinks = new RegExp("<link[^>]*>", "gim"); //regex for matching link tags
dcg.regexStyles = new RegExp("<style[^>]*>([\\s\\S]*?)<\\/style>", "gim"); //regex for style tags
dcg.regexScripts = new RegExp("<script[^>]*>([\\s\\S]*?)<\\/script>", "gim"); //regex for script tags
dcg.profile = {}; //preset profile for assigning custom presets
dcg.dataDynamic = {}; //for storing the dynamic contents, they are nestable and usable as tokens (xml and json)
dcg.dataStatic = {}; //for storing the static contents (raw html and template references)
//time variables for calculating the elapsed time
dcg.watchTimeStart = 0;
dcg.watchTimeStop = 0;
dcg.watchTimeTotal = 0;
dcg.watchTimeRun = false;
dcg.renderReady = false; //for checking if the render is done
dcg.renderDom = false; //for checking if the render will be on the current document
dcg.evalFunc = undefined; //empty function for running eval expressions
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
    dcg.profile = dcg.mergeDeep(dcg.default);
    dcg.reconstruct();
};
dcg.reconstruct = function () { //function for reconstructing the presets
    dcg.regexTokenDelimiter = new RegExp(dcg.profile.tokenOpen+"[\\s\\S]*?"+dcg.profile.tokenClose, "g");
    dcg.regexEvalDelimiter = new RegExp(dcg.profile.evalOpen+"[\\s\\S]*?"+dcg.profile.evalClose, "g");
    dcg.regexEvalMultiDelimiter = new RegExp(dcg.profile.evalMultiOpen+"[\\s\\S]*?"+dcg.profile.evalMultiClose, "g");
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
dcg.watchPrint = function (text, total) { //function for printing the time
    if (total) {
        time = dcg.watchGetTotal();
    } else {
        time = dcg.watchGetElapsed();
    }
    if (dcg.profile.showLogs) {
        console.log(dcg.logPrefix+text+" "+time+"ms");
    }
};
dcg.watchPrintSplit = function (text) { //function for splitting and printing the time
    dcg.watchPrint(text);
    dcg.watchSplit();
};
dcg.render = function (arg) { //wrapper for renderDesign function, inputs are: arg.options, arg.content, arg.contentSrc, arg.design, arg.designSrc
    var result;
    step_start();
    function step_start() { //start the render wrapper
        if (arg == null) {arg = {};}
        dcg.renderReady = false;
        dcg.renderDom = false;
        if (arg.options !== null) {
            dcg.config(arg.options);
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
                return;
            } else {
                designSrc = arg.designSrc;
            }
            dcg.xhr(designSrc, function (xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        design = xhr.responseText;
                        step_render(content, design);
                    }
                }
            });
        } else { //if the design is defined then pass it directly
            design = arg.design;
            step_render(content, design);
        }
    }
    function step_render(content, design) { //render the design with the given arguments
        dcg.renderDesign({
            content: content,
            design: design,
            callback: function (render) {
                result = render;
                if (arg.options !== null) {
                    dcg.reset();
                }
            }
        });
    }
    return result;
};
dcg.renderDesign = function (arg) { //main render function, inputs are: arg.content, arg.design, arg.callback
    step_start();
    function step_start() { //start the time and render
        dcg.watchStart();
        dcg.watchPrint("Render is started!");
        step_markcss();
    }
    function step_markcss() { //find the styles from the content and mark them with labelRemove
        var i, contentStyle, contentCss;
        if (dcg.profile.removeCss) {
            contentStyle = arg.content.getElementsByTagName('style');
            contentCss = dcg.getElementsByAttribute(arg.content.documentElement, "rel", "stylesheet");
            for (i = 0; i < contentStyle.length; i++) {
                contentStyle[i].setAttribute(dcg.profile.labelRemove, "true");
            }
            for (i = 0; i < contentCss.length; i++) {
                contentCss[i].setAttribute(dcg.profile.labelRemove, "true");
            }
            dcg.watchPrintSplit("Content styles are marked as remnants!");
        }
        step_ext("Primary external contents are loaded!", function(){
            step_storestatic("Primary static contents are stored!", function(){
                step_storedynamic("Primary dynamic contents are stored!", function(){
                    step_dependency();
                });
            });
        });
    }
    function step_ext(print, callback) { //load the external contents and then continue to render
        var externalContents;
        externalContents = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelSource);
        dcg.loadContents(externalContents, function () {
            dcg.watchPrintSplit(print);
            callback();
        });
    }
    function step_storestatic(print, callback) { //iterate through the raw contents and store them
        var i, staticContents, staticContent, contentId;
        staticContents = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelRaw);
        for (i = 0; i < staticContents.length; i++) {
            staticContent = staticContents[i];
            contentId = staticContent.getAttribute(dcg.profile.labelRaw);
            dcg.dataStatic[contentId] = staticContent.innerHTML;
            staticContent.parentNode.removeChild(staticContent);
        }
        dcg.watchPrintSplit(print);
        callback();
    }
    function step_storedynamic(print, callback) { //iterate through the dynamic contents and store them
        var i, dynamicContents, dynamicContent, contentId, dynamicContentParse, dynamicContentNested;
        dynamicContents = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelObj);
        for (i = 0; i < dynamicContents.length; i++) {
            dynamicContent = dynamicContents[i];
            contentId = dynamicContent.getAttribute(dcg.profile.labelObj);
            if (dynamicContent.hasAttribute(dcg.profile.labelJson)) { //if it has labelJson attribute, parse json
                dynamicContentParse = JSON.parse(dynamicContent.innerHTML);
            } else if (dynamicContent.hasAttribute(dcg.profile.labelXml)) { //if it has labelXml attribute, parse xml
                dynamicContentParse = dcg.parseXML(dynamicContent);
            } else if (dynamicContent.hasAttribute(dcg.profile.labelHtml)) { //if it has labelHtml attribute, clone the node
                dynamicContentParse = dynamicContent.cloneNode(true);
            } else { //if it doesn't have labels, store it as it is
                dynamicContentParse = dynamicContent.innerHTML;
            }
            dynamicContentNested = dcg.normalizeObject(dcg.setNestedPropertyValue({}, contentId, dynamicContentParse)); //create nested object based on labelObj and normalize arrays and objects in order to nest them manually later on
            dcg.dataDynamic = dcg.mergeDeep(dcg.dataDynamic, dynamicContentNested); //merge content with dataDynamic
            dynamicContent.parentNode.removeChild(dynamicContent);
        }
        dcg.watchPrintSplit(print);
        callback();
    }
    function step_dependency() { //add the dependencies
        var i, designLinks, designStyles, designScripts;
        arg.design = dcg.replaceRoot(arg.design); //replace the root tokens
        if ((/\<\/body\>/).test(arg.design)) { //if the design has body then insert only the body with its attributes
            arg.content.documentElement.innerHTML = arg.content.documentElement.innerHTML.replace("<body", "<body"+arg.design.match("<body" + "(.*)" + ">")[1]);
            arg.content.body.innerHTML = arg.design.match(dcg.regexBody)[1];
        } else { //if it doesn't then insert it directly
            arg.content.body.innerHTML = arg.design;
        }
        //get the link elements from the design and insert them
        designLinks = arg.design.match(dcg.regexLinks);
        if (designLinks) {
            for (i = 0;i < designLinks.length;i++) {
                arg.content.head.innerHTML += designLinks[i];
            }
        }
        //get the style elements from the design and insert them
        designStyles = arg.design.match(dcg.regexStyles);
        if (designStyles) {
            for (i = 0;i < designStyles.length;i++) {
                arg.content.head.innerHTML += designStyles[i];
            }
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
        step_ext("Secondary external contents are loaded!", function(){
            step_storedynamic("Secondary dynamic contents are stored!", function(){
                step_insertstatic();
            });
        });
    }
    function step_insertstatic() { //insert the raw contents
        var i, contentId, rawTargets, rawTarget;
        for (contentId in dcg.dataStatic) {
            rawTargets = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelRaw, contentId);
            for (i = 0; i < rawTargets.length; i++) {
                rawTarget = rawTargets[i];
                rawTarget.insertAdjacentHTML("afterend", dcg.dataStatic[contentId]);
                rawTarget.parentNode.removeChild(rawTarget);
            }
        }
        dcg.watchPrintSplit("Static contents are inserted!");
        step_template();
    }
    function step_template() { //store and render the templates
        var i, designTemplateReferences, designTemplate, designTemplateId, designTemplateRenders;
        designTemplateReferences = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelTemplateReference);
        for (i = 0;i < designTemplateReferences.length;i++) {
            designTemplate = designTemplateReferences[i];
            designTemplateId = designTemplate.getAttribute(dcg.profile.labelTemplate);
            dcg.loadTemplate({id : designTemplateId, obj : designTemplate});
            designTemplate.parentNode.removeChild(designTemplate);
        }
        designTemplateRenders = dcg.getElementsByAttribute(arg.content.body, dcg.profile.labelTemplateRender);
        for (i = 0;i < designTemplateRenders.length;i++) {
            designTemplate = designTemplateRenders[i];
            designTemplateId = designTemplate.getAttribute(dcg.profile.labelTemplate);
            designTemplate.insertAdjacentHTML("afterend", dcg.loadTemplate({id : designTemplateId, obj : designTemplate}).innerHTML);
            designTemplate.parentNode.removeChild(designTemplate);
        }
        dcg.watchPrintSplit("Templates are rendered!");
        step_insertdynamic();
    }
    function step_insertdynamic() { //insert the dynamic contents and display the tokens
        arg.content.body = dcg.displayTokens({obj: arg.content.body});
        dcg.watchPrintSplit("Dynamic contents are inserted!");
        step_escape();
    }
    function step_escape() { //escape the elements, remove the remnants and replace root tokens
        arg.content.body.innerHTML = dcg.replaceRoot(arg.content.body.innerHTML);
        arg.content.documentElement.innerHTML = dcg.removeMarked(arg.content.documentElement);
        arg.content.body.innerHTML = dcg.replaceEscape(arg.content.body.innerHTML);
        dcg.renderReady = true;
        dcg.watchPrintSplit("Elements are escaped and remnants are removed!");
        step_inject();
    }
    function step_inject() { //reload styles, inject the scripts, jump to anchor and dispatch onload event
        var i, links = document.getElementsByTagName("link"), link;
        for (i = 0; i < links.length;i++) {
            link = links[i];
            link.href = link.href;
        }
        if (dcg.renderDom) {
            dcg.loadScripts(arg.content.body.getElementsByTagName("script"), function () {
                dcg.watchPrintSplit("Scripts are injected!");
                if (window.location.hash.slice(1) && arg.content.getElementById(window.location.hash.slice(1))) {
                    arg.content.getElementById(window.location.hash.slice(1)).scrollIntoView();
                }
                dcg.DOMLoad();
                step_finish();
            });
        } else {
            step_finish();
        }
    }
    function step_finish() { //stop the time and print the total elapsed time
        dcg.watchStop();
        dcg.watchPrint("Render is finished! Total time:", true);
        if (typeof arg.callback !== 'undefined') {
            arg.callback(arg.content.documentElement.innerHTML);
        }
    }
};
dcg.displayTokens = function (arg) { //display tokens function, inputs are: arg.data, arg.obj, arg.root
    if (arg == null) {arg = {};}
    if (!arg.hasOwnProperty("data")) {arg.data = dcg.dataDynamic;} //default data is dcg.dataDynamic
    if (!arg.hasOwnProperty("obj")) {arg.obj = document.body;} //default element is document.body
    if (!arg.hasOwnProperty("root")) {arg.root = false;} //token root
    step_start();
    function step_start() {
        arg.data = dcg.normalizeObject(arg.data); //normalize the object
        arg.obj = arg.obj.cloneNode(true); //clone the element
        step_token();
    }
    function step_token() { //replace all superficial tokens
        var i, tokens, token, tokenPure, tokenPureSplit, tokenData, tokenRoot;
        tokens = dcg.removeDuplicatesFromArray(arg.obj.innerHTML.match(dcg.regexTokenDelimiter)); //get all tokens from the element and remove duplicated tokens
        for (i = 0;i < tokens.length;i++) { //iterate through tokens
            token = tokens[i];
            tokenPure = token.substring(dcg.profile.tokenOpen.length, token.length-dcg.profile.tokenClose.length).toLowerCase(); //remove the token delimiters
            tokenPureSplit = tokenPure.split(".");
            if(!escape_token(tokenPure)) {
                tokenData = dcg.getRecursiveValue({arr: arg.data, keys: tokenPureSplit, i: 0, thisRoot: arg.root}); //split the token using dots and recursively get the value from the data
                if (tokenData !== false) {
                    if (dcg.isElement(tokenData)) { //if the value is an html element then run the displayTokens function inside it and set the root relatively
                        tokenRoot = Object.values(dcg.mergeDeep(tokenPureSplit));
                        tokenRoot.pop();
                        arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, dcg.displayTokens({obj: tokenData.cloneNode(true), root: tokenRoot}).innerHTML, 'g');
                    } else if (typeof tokenData === 'string') { //if the value is string, replace the token using regex
                        arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, tokenData, 'g');
                    } else if (typeof tokenData === 'object') { //if the value is an object, stringify it
                        arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, dcg.encodeHtml(JSON.stringify(tokenData)), 'g');
                    }
                }
            } else {
                arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, token.replace(dcg.profile.tokenEscape, ''), 'g');
            }
        }
        step_repeat();
    }
    function step_repeat() { //iterate the elements that has dcg-repeat attribute and replace tokens inside them
        var key, i, ii, arr, objRepeat, objRepeatClone, objRepeatCloneHtml, repeatAttr, repeatAttrSplit, repeatAttrSplitDot, tokenDataArray, tokens, token, tokenPure, tokenPureSplit, tokenData, tokenRoot, aliasRegex, aliasRegexMatches, aliasRegexMatch, aliasMatch, aliasReplace;
        objRepeat = dcg.getElementByAttribute(arg.obj, dcg.profile.labelRepeat); //get the first element that has dcg-repeat attribute
        objRepeatCloneHtml = "";
        if (objRepeat !== false) { //if there is element with repeat attribute, continue
            repeatAttr = objRepeat.getAttribute(dcg.profile.labelRepeat).toLowerCase();
            repeatAttrSplit = repeatAttr.split(" ");
            repeatAttrSplitDot = repeatAttrSplit[0].split("."); //split the dcg-repeat attribute with spaces and dots
            tokenDataArray = dcg.getRecursiveValue({arr: arg.data, keys: repeatAttrSplitDot, i: 0, thisRoot: arg.root}); //get the object or array from the data using splitted variable
            if (tokenDataArray !== false) {
                i = 0;
                for (var key in tokenDataArray) {
                    objRepeatClone = objRepeat.cloneNode(true); //clone the element that it will be repeated
                    aliasRegex = new RegExp("(?:<)[^>]*((?:"+dcg.profile.labelRepeat+")(?:=)(?:\"|')(?:"+repeatAttrSplit[2]+"\\.)([^>]*?)(?:\"|'))[^>]*(?:>)", "gim");
                    aliasRegexMatches = [];
                    //replace alias inside the cloned element to literal definition in order to repeat the child elements that uses the alias from the parent element
                    while (aliasRegexMatch = aliasRegex.exec(objRepeatClone.innerHTML)) { //find the child elements that uses the alias from the parent element
                        arr = [];
                        arr.push(aliasRegexMatch[1]);
                        arr.push(aliasRegexMatch[2]);
                        aliasRegexMatches.push(arr);
                    }
                    for (ii = 0;ii < aliasRegexMatches.length;ii++) { //iterate through the all of the matches and replace them with literal definitions using regex
                        aliasMatch = aliasRegexMatches[ii];
                        aliasReplace = dcg.profile.labelRepeat+"='"+repeatAttrSplit[0]+"."+key+"."+aliasMatch[1]+"'";
                        objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, aliasMatch[0], aliasReplace, 'g');
                    }
                    tokens = dcg.removeDuplicatesFromArray(objRepeatClone.innerHTML.match(dcg.regexTokenDelimiter)); //get all tokens inside the repeated element
                    for (ii = 0;ii < tokens.length;ii++) {
                        token = tokens[ii];
                        tokenPure = token.substring(dcg.profile.tokenOpen.length, token.length-dcg.profile.tokenClose.length).toLowerCase(); //remove the token delimiters
                        tokenPureSplit = tokenPure.split(".");
                        if (!escape_token(tokenPure)) {
                            if (tokenPureSplit[0] == repeatAttrSplit[2]) { //check if the alias defined inside the token is same as the alias on the dcg-repeat attribute
                                tokenPureSplit.shift(); //remove the alias since we only need the literal definitions
                                tokenData = dcg.getRecursiveValue({arr: tokenDataArray[key], keys: tokenPureSplit, i: 0, thisKey: key, thisIndex: i, thisRoot: arg.root}); //split the token using dots and recursively get the value from the data
                                if (tokenData !== false) {
                                    if (dcg.isElement(tokenData)) { //if the value is an html element then run the displayTokens function inside it and set the root relatively
                                        tokenRoot = repeatAttrSplit[0]+"."+key;
                                        objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, token, dcg.displayTokens({obj: tokenData.cloneNode(true), root: tokenRoot}).innerHTML, 'g');
                                    } else if (typeof tokenData === 'string') { //if the value is string, replace the token using regex
                                        objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, token, tokenData, 'g');
                                    } else if (typeof tokenData === 'object') { //if the value is an object, stringify it
                                        objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, token, dcg.encodeHtml(JSON.stringify(tokenData)), 'g');
                                    }
                                }
                            }
                        } else {
                            arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, token.replace(dcg.profile.tokenEscape, ''), 'g');
                        }
                    }
                    objRepeatCloneHtml += objRepeatClone.innerHTML; //expand the variable with the clone element that we have processed, this will be done in every loop and processed elements will be inserted after the whole iteration completes
                    i++;
                }
            }
            if (objRepeatCloneHtml != "") { //if the cloned elements are processed then insert the cloned element and remove the original element
                objRepeat.insertAdjacentHTML("afterend", objRepeatCloneHtml);
                objRepeat.parentNode.removeChild(objRepeat);
            }
            step_repeat(); //restart the function
        }
        step_eval();
    }
    function step_eval() { //replace all eval expressions with their corresponding data
        var i, evalExps, evalExp, evalExpPure, evalExpData;
        evalExps = dcg.removeDuplicatesFromArray(arg.obj.innerHTML.match(dcg.regexEvalDelimiter)); //get all eval expressions from the element and remove duplicated evals
        for (i = 0;i < evalExps.length;i++) { //iterate through eval expressions
            evalExp = evalExps[i];
            evalExpPure = dcg.decodeHtml(evalExp.substring(dcg.profile.evalOpen.length, evalExp.length-dcg.profile.evalClose.length)); //remove the eval expression delimiters
            if (!escape_token(evalExpPure)) {
                if (dcg.isValidJs("dcg.evalFunc = function () {return "+evalExpPure+";}") && evalExpPure.trim() != "") { //if input is valid then evaluate the input and replace it
                    window.eval("dcg.evalFunc = function () {return "+evalExpPure+";}");
                    evalExpData = dcg.evalFunc();
                    arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, evalExp, evalExpData, 'g');
                }
            } else {
                arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, evalExp, evalExp.replace(dcg.profile.tokenEscape, ''), 'g');
            }
            
        }
        step_multieval();
    }
    function step_multieval() { //replace all multi-line eval expressions with their corresponding data
        var i, evalExps, evalExp, evalExpPure, evalExpData;
        evalExps = dcg.removeDuplicatesFromArray(arg.obj.innerHTML.match(dcg.regexEvalMultiDelimiter)); //get all multi-line eval expressions from the element and remove duplicated evals
        for (i = 0;i < evalExps.length;i++) { //iterate through multi-line eval expressions
            evalExp = evalExps[i];
            evalExpPure = dcg.decodeHtml(evalExp.substring(dcg.profile.evalMultiOpen.length, evalExp.length-dcg.profile.evalMultiClose.length)); //remove the multi-line eval expression delimiters
            if (!escape_token(evalExpPure)) {
                if (dcg.isValidJs("dcg.evalFunc = function () {"+evalExpPure+"}") && evalExpPure.trim() != "") { //if input is valid then evaluate the input and replace it
                    window.eval("dcg.evalFunc = function () {"+evalExpPure+"}");
                    evalExpData = dcg.evalFunc();
                    arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, evalExp, evalExpData, 'g');
                }
            } else {
                arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, evalExp, evalExp.replace(dcg.profile.tokenEscape, ''), 'g');
            }
        }
        step_if();
    }
    function step_if() { //recursive conditional rendering
        var objIf, ifAttr;
        objIf = dcg.getElementByAttribute(arg.obj, dcg.profile.labelIf); //get the first element that has dcg-if attribute
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
    function escape_token(tokenPure) {
        var result = false;
        if (tokenPure.substring(0,dcg.profile.tokenEscape.length) == dcg.profile.tokenEscape) {
            result = true;
        }
        return result;
    }
    return arg.obj; //return the final element
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
dcg.replaceRoot = function (html, name) { //root keywords function
    var i, newHtml = html, root;
    dcg.reconstruct();
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
dcg.removeMarked = function (node) { //remove elements that has labelRemove attribute function
    if (node == null) {node = document.documentElement}
    var newHtml = node.cloneNode(true), marked, i;
    marked = dcg.getElementsByAttribute(newHtml, dcg.profile.labelRemove);
    if (marked) {
        for (i = 0; i < marked.length; i++) {
            marked[i].parentNode.removeChild(marked[i]);
        }
    }
    return newHtml.innerHTML;
};
dcg.isValidJs = function (code) { //try eval function
    var result = true;
    try {
        eval(code);
    }
    catch(e) {
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
dcg.loadTemplate = function (arg) { //load template function, inputs are: arg.id, arg.data, arg.obj
    var objClone, attrData, attrDataSplit;
    if (!arg.hasOwnProperty("id")) {return false;} //if id isn't defined then stop the function
    if (arg.hasOwnProperty("obj")) { //if obj is defined, check the data attribute of the defined element
        attrData = arg.obj.getAttribute(dcg.profile.labelTemplateData);
        if (attrData) {
            attrDataSplit = attrData.split(".");
            arg.data = dcg.getRecursiveValue({arr: dcg.dataDynamic, keys: attrDataSplit, i: 0}); //recursively get the value from the data
            if (arg.data === false) { //check if there is an object defined on the json content
                arg.data = JSON.parse(attrData); //if there isn't, parse the label data
            }
        }
    } else { //if its not defined then set it undefined
        arg.obj = undefined;
    }
    objClone = init_template(arg.id, arg.obj).cloneNode(true); //load and clone the template
    attrData = objClone.getAttribute(dcg.profile.labelTemplateData); //get the referenced template's data attribute
    if ((!arg.data || !arg.hasOwnProperty("data")) && attrData) { //if data is not defined previously, check if its defined on the referenced template
        attrDataSplit = attrData.split(".");
        arg.data = dcg.getRecursiveValue({arr: dcg.dataDynamic, keys: attrDataSplit, i: 0}); //recursively get the value from the data
        if (arg.data === false) { //check if there is an object defined on the json content
            arg.data = JSON.parse(attrData); //if there isn't, parse the label data
        }
    }
    if (arg.data) { //if data is defined then display the tokens
        objClone = dcg.displayTokens({data: arg.data, obj: objClone});
    }
    if(dcg.renderReady){ //if render is done, escape elements
        objClone.innerHTML = dcg.replaceEscape(objClone.innerHTML);
    }
    return objClone;
    function init_template(id, obj) { //load template function
        var template;
        if (typeof obj === 'undefined' || dcg.dataStatic.hasOwnProperty(dcg.profile.labelTemplatePrefix+id)) { //check if template's id exists on the stored templates or obj is not defined
            template = dcg.dataStatic[dcg.profile.labelTemplatePrefix+id];
        } else { //if obj is defined and template id doesn't exist then store this new template with its id
            template = obj.cloneNode(true);
            dcg.dataStatic[dcg.profile.labelTemplatePrefix+id] = template;
        }
        return template; //return the template
    }
};
dcg.loadContents = function (node, callback, i) { //fetch and load external contents, this is a recursive function
    if (node == null) {node = dcg.getElementsByAttribute(document.documentElement, dcg.profile.labelSource);} //if node doesn't exist then set it to document element and get the elements with source attribute
    if (i == null) {i = 0;} //if index doesn't exist, set it to 0
    var src, len = node.length;
    if (len > 0 && i < len) { //if there are elements with source attributes and index is lower than total elements, continue
        src = node[i].getAttribute(dcg.profile.labelSource); //get the source attribute's value
        if (src != "") { //if source is not empty, fetch the content and insert it into element then increase the index and run the function again
            dcg.xhr(src, function (xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        node[i].insertAdjacentHTML("afterend", xhr.responseText);
                        node[i].parentNode.removeChild(node[i]);
                        i++;
                        dcg.loadContents(node, callback, i);
                    }
                }
            });
        }
    } else { //if there are no elements or index is higher than total elements, run the callback function
        if (typeof callback !== 'undefined') {
            callback();
        }
    }
};
dcg.loadScripts = function (node, callback, i) { //inject scripts from specified element this is a recursive function
    if (node == null) {node = document.getElementsByTagName("script");} //if node is not specified then get all script elements
    if (i == null) {i = 0;} //if index is not defined then set it to 0
    var len = node.length;
    if (len > 0 && i < len) { //if there are script elements and index is lower than total elements, continue
        if (node[i].src) { //check if script element has source attribute, if it has then fetch the external script and inject it
            dcg.getScript(node[i].src, function () {
                i++;
                dcg.loadScripts(node, callback, i);
            });
        } else { //if it hasn't then inject it directly
            dcg.DOMEval(node[i].text);
            i++;
            dcg.loadScripts(node, callback, i);
        }
    } else { //if there are no elements or index is higher than total elements then run the callback function
        if (typeof callback !== 'undefined') {
            callback();
        }
    }
};
dcg.parseXML = function (m, p) { //convert xml elements to object
    var f=1,o=2,d=3,n=4,j=7,c=8,h=9,l,b,a,k={},g=[];if(!p){p={}}if(typeof p==='string'){p={find:p}}p.xmlns=p.xmlns||"*";if(p.parse!="function"){p.parse=e}function e(i){return i.split(":").pop().replace(/^ows_/,"").replace(/[^a-z,A-Z,0-9]/g,"")}switch(m.nodeType){case h:a=(!p.find)?m.childNodes:(m.getElementsByTagNameNS)?m.getElementsByTagNameNS(p.xmlns,p.find.split(":").pop()):m.getElementsByTagName(p.find);for(l=0;l<a.length;l++){k=dcg.parseXML(a[l]);if(k){g.push(k)}}k=(g.length&&g.length==1)?g[0]:g;break;case f:if(m.attributes.length==0&&m.childNodes.length==1&&m.childNodes.item(0).nodeValue){k=m.childNodes.item(0).nodeValue}for(l=0;l<m.attributes.length;l++){b=p.parse(m.attributes.item(l).nodeName);k[b]=m.attributes.item(l).nodeValue}for(l=0;l<m.childNodes.length;l++){if(m.childNodes.item(l).nodeType!=d){b=p.parse(m.childNodes.item(l).nodeName);if(typeof k[b]==='undefined'){k[b]=dcg.parseXML(m.childNodes.item(l))}else{if(typeof k[b].push==='undefined'){k[b]=[k[b]]}k[b].push(dcg.parseXML(m.childNodes.item(l)))}}}break;case n:k="<![CDATA["+m.nodeValue+"]]>";break;case d:k=m.nodeValue;break;case c:k="";break;default:k=null}return k
};
dcg.xhr = function (url, callback, cache, method, async) { //xhr function used for fetching external contents, scripts and templates
    if (cache == null) {cache = dcg.profile.cacheRender;}
    if (method == null) {method = 'GET';}
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
    xhr.open(method, url, async);
    xhr.send();
};
dcg.DOMLoad = function () { //imitate window onload
    document.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    window.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    window.dispatchEvent(new CustomEvent('load'));
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