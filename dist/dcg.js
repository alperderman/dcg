/*!
* Dynamic Content Generation (1.0.4) 2021/08/24
*/
var dcg = {};
dcg.presetDefault = {
    baseAttrs: ["src", "href"], //array of attributes (including labelSource) that will be replaced with base path
    tokenOpen: "{{", //opening delimiter for tokens
    tokenClose: "}}", //closing delimiter for tokens
    removeCss: false, //for removing the styles of the content page, if set to true styles will not be carried over rendered page
    cacheRender: false //for caching render change it to true if its going to be used in production
};
dcg.presetProfile = { //copy of the default presets for assigning custom options
    baseAttrs: ["src", "href"],
    tokenOpen: "{{",
    tokenClose: "}}",
    removeCss: false,
    cacheRender: false
};
dcg.labelDesign = "dcg-design"; //design attribute: for locating the design page
dcg.labelBase = "dcg-base"; //base attribute: for setting base path for dependencies on the design page
dcg.labelObj = "dcg-obj"; //dynamic content attribute
dcg.labelRaw = "dcg-raw"; //static content attribute
dcg.labelJson = "dcg-json"; //json content attribute
dcg.labelXml = "dcg-xml"; //xml content attribute
dcg.labelTemplate = "dcg-temp"; //temp attribute: for indicating templates
dcg.labelTemplateData = "dcg-data"; //data attribute: for passing raw json data to the template or binding the template with dynamic content
dcg.labelTemplateReference = "dcg-tref"; //template reference attribute: for loading template for future uses
dcg.labelTemplatePrefix = "tref_"; //prefix for indicating template references inside the dataStatic
dcg.labelTemplateRender = "dcg-tren"; //template render attribute: for rendering the templates that has been referenced before
dcg.labelSource = "dcg-src"; //external source attribute: for fetching external contents or external templates
dcg.labelRepeat = "dcg-repeat"; //repeat attribute: for iterating json contents on design
dcg.labelIf = "dcg-if"; //if attribute: for making conditional rendering
dcg.labelRemove = "dcg-remove"; //remove attribute: for removing elements from the content
dcg.labelEscapePrefix = "dcg:"; //escape prefix: escape prefix is used for bypassing invalid html errors by escaping tags and attributes
dcg.tokenKeyword = {kwThis:"_this", kwKey:"_key", kwIndex:"_index", kwLen:"_length"}; //keywords for using inside the tokens
dcg.regexBody = new RegExp("<body[^>]*>((.|[\\n\\r])*)<\\/body>", "im"); //regex for matching body tag
dcg.regexLinks = new RegExp("<link[^>]*>", "gim"); //regex for matching link tags
dcg.regexStyles = new RegExp("<style[^>]*>([\\s\\S]*?)<\\/style>", "gim"); //regex for style tags
dcg.regexScripts = new RegExp("<script[^>]*>([\\s\\S]*?)<\\/script>", "gim"); //regex for script tags
dcg.regexTokenDelimiter = new RegExp(dcg.presetProfile.tokenOpen+"[\\s\\S]*?"+dcg.presetProfile.tokenClose, "g"); //regex for tokens
dcg.regexEscape = new RegExp("(<[^>]*?"+dcg.labelEscapePrefix+"[^>]*?>)", "gim"); //regex for escaped elements
dcg.dataDynamic = {}; //for storing dynamic contents, they are nestable and usable as tokens (xml and json)
dcg.dataStatic = {}; //for storing static contents (raw html and template references)
dcg.renderReady = false; //for checking if the render is done
dcg.renderDom = false; //for checking if the render will be on the current document
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
dcg.getRecursiveValue = function (arr, keys, i, thisKey) { //getting a value from a multi-dimensional object, case insensitive
    if (typeof keys === 'string') {keys = keys.split('.');}
    if (i == null) {i = 0;}
    if (thisKey == null && i > 0) {thisKey = keys[i-1];}
    var key = keys[i], len = keys.length, val = arr, arrLen;
    if (!arr.length) {
        arrLen = Object.keys(arr).length;
    } else {
        arrLen = arr.length;
    }
    if (len > 0 && i < len) {
        i++;
        if (arr.hasOwnProperty(key)) {
            val = dcg.getRecursiveValue(arr[key], keys, i);
        } else if (arr.hasOwnProperty(key.toUpperCase())) {
            val = dcg.getRecursiveValue(arr[key.toUpperCase()], keys, i);
        } else if (arr.hasOwnProperty(key.toLowerCase())) {
            val = dcg.getRecursiveValue(arr[key.toLowerCase()], keys, i);
        } else if (key == dcg.tokenKeyword.kwThis){
            val = dcg.getRecursiveValue(arr, keys, i, thisKey);
        } else if (key == dcg.tokenKeyword.kwKey && thisKey != null) {
            val = thisKey;
        } else if (key == dcg.tokenKeyword.kwIndex && thisKey != null && (/^-?\d+$/).test(thisKey)) {
            val = parseInt(thisKey, 10)+1;
        } else if (key == dcg.tokenKeyword.kwLen) {
            val = arrLen;
        } else {
            val = false;
        }
    }
    return val;
};
dcg.setNestedPropertyValue = function (obj, fields, val) { //function for setting a value deep inside an object
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
dcg.convertToObject = function (obj) { //function for converting arrays into objects
    var result = {};
    if (Array.isArray(obj)) {
        obj = toObject(obj);
    }
    if (typeof obj === 'object') {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                result[property] = dcg.convertToObject(obj[property]);
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
dcg.render = function (arg) { //wrapper for renderDesign function, inputs are: arg.content, arg.contentSrc, arg.design, arg.designSrc, arg.base, arg.options
    var result;
    if (arg == null) {arg = {};}
    dcg.presetProfile = dcg.mergeDeep(dcg.presetDefault); //set presetProfile to default
    if (arg.options != null && typeof arg.options === 'object') { //if preset options are defined then merge it with presetProfile
        dcg.presetProfile = dcg.mergeDeep(dcg.presetProfile, arg.options);
    }
    dcg.renderReady = false;
    dcg.renderDom = false;
    dcg.regexTokenDelimiter = new RegExp(dcg.presetProfile.tokenOpen+"[\\s\\S]*?"+dcg.presetProfile.tokenClose, "g"); //reconstruct token regex
    if (arg.content == null) { //if content and contentSrc is null then reference the current document as content
        if (arg.contentSrc == null) {
            dcg.renderDom = true;
            step_content(arg, document);
        } else {
            arg.contentSrc;
            dcg.xhr(arg.contentSrc, function (xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        step_content(arg, xhr.responseText);
                    }
                }
            });
        }
    } else {
        step_content(arg, arg.content);
    }
    function step_content(arg, doc) {
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
        step_base(arg, content);
    }
    function step_base(arg, content) {
        var base;
        if (arg.base != null) {
            base = arg.base;
        } else { //if base is not defined, check the base attribute
            base = content.body.getAttribute(dcg.labelBase);
        }
        step_design(arg, content, base);
    }
    function step_design(arg, content, base) {
        var design, designSrc, bodyLabelDesign;
        if (arg.design == null) { //if design is null then check for the external source in designSrc and design attribute in order
            if (arg.designSrc == null) {
                bodyLabelDesign = content.body.getAttribute(dcg.labelDesign);
                if (bodyLabelDesign == null) {
                    return;
                } else {
                    designSrc = bodyLabelDesign;
                }
            } else {
                designSrc = arg.designSrc;
            }
            if (base == null) {
                base = designSrc.replace(designSrc.substring(designSrc.lastIndexOf('/')+1), '');
            }
            dcg.xhr(designSrc, function (xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        design = xhr.responseText;
                        step_render(content, design, base);
                    }
                }
            });
        } else { //if design is defined then pass it directly
            design = arg.design;
            if (base == null) {
                base = "";
            }
            step_render(content, design, base);
        }
    }
    function step_render(content, design, base) {
        dcg.renderDesign({
            content: content,
            design: design,
            base: base,
            callback: function (render) {
                result = render;
            }
        });
    }
    return result;
};
dcg.renderDesign = function (arg) { //the main render function, inputs are: arg.content, arg.design, arg.base, arg.callback
    var i, externalContents, staticContents, staticContent, dynamicContents, dynamicContent, dynamicContentParse, dynamicContentNested, contentId, contentStyle, contentCss, fixedDesign, designLinks, designStyles, designScripts, designTemplateReferences, designTemplateRenders, designTemplate, designTemplateId, rawTargets, rawTarget;
    if (dcg.presetProfile.removeCss) { //find styles from the content and mark them with labelRemove
        contentStyle = arg.content.getElementsByTagName('style');
        contentCss = dcg.getElementsByAttribute(arg.content.documentElement, "rel", "stylesheet");
        for (i = 0; i < contentStyle.length; i++) {
            contentStyle[i].setAttribute(dcg.labelRemove, "true");
        }
        for (i = 0; i < contentCss.length; i++) {
            contentCss[i].setAttribute(dcg.labelRemove, "true");
        }
    }
    externalContents = dcg.getElementsByAttribute(arg.content.body, dcg.labelSource); //get external contents
    dcg.loadContents(externalContents, function () { //load the external contents and then continue render
        dynamicContents = dcg.getElementsByAttribute(arg.content.body, dcg.labelObj); //get dynamic contents
        staticContents = dcg.getElementsByAttribute(arg.content.body, dcg.labelRaw); //get raw contents
        for (i = 0; i < staticContents.length; i++) { //iterate through raw contents and store them
            staticContent = staticContents[i];
            contentId = staticContent.getAttribute(dcg.labelRaw);
            if (staticContent.innerHTML != "") {
                dcg.dataStatic[contentId] = staticContent.innerHTML;
            }
        }
        for (i = 0; i < dynamicContents.length; i++) { //iterate through dynamic contents and store them
            dynamicContent = dynamicContents[i];
            contentId = dynamicContent.getAttribute(dcg.labelObj);
            if (dynamicContent.innerHTML != "") {
                if (dynamicContent.hasAttribute(dcg.labelJson)) { //if it has labelJson attribute, parse json
                    dynamicContentParse = JSON.parse(dynamicContent.innerHTML);
                } else if (dynamicContent.hasAttribute(dcg.labelXml)) { //if it has labelXml attribute, parse xml
                    dynamicContentParse = dcg.parseXML(dynamicContent);
                } else { //if it doesn't have labels, store it as it is
                    dynamicContentParse = dynamicContent.innerHTML;
                }
                dynamicContentNested = dcg.setNestedPropertyValue({}, contentId, dynamicContentParse); //create nested object based on labelObj
                dcg.dataDynamic = dcg.convertToObject(dcg.mergeDeep(dcg.dataDynamic, dynamicContentNested)); //merge content with dataDynamic and convert all arrays to objects in order to nest them manually later on
            }
        }
        fixedDesign = fix_path(arg.design, arg.base); //replace paths on the design with the base path
        if ((/\<\/body\>/).test(fixedDesign)) { //if design has body then insert only the body with its attributes
            arg.content.documentElement.innerHTML = arg.content.documentElement.innerHTML.replace("<body", "<body"+fixedDesign.match("<body" + "(.*)" + ">")[1]);
            arg.content.body.innerHTML = fixedDesign.match(dcg.regexBody)[1];
        } else { //if it doesn't then insert it directly
            arg.content.body.innerHTML = fixedDesign;
        }
        //get link elements from design and insert them
        designLinks = fixedDesign.match(dcg.regexLinks);
        if (designLinks) {
            for (i = 0;i < designLinks.length;i++) {
                arg.content.head.innerHTML += designLinks[i];
            }
        }
        //get style elements from design and insert them
        designStyles = fixedDesign.match(dcg.regexStyles);
        if (designStyles) {
            for (i = 0;i < designStyles.length;i++) {
                arg.content.head.innerHTML += designStyles[i];
            }
        }
        //remove content script elements
        while (arg.content.getElementsByTagName('script').length > 0) {
            arg.content.getElementsByTagName('script')[0].parentNode.removeChild(arg.content.getElementsByTagName('script')[0]);
        }
        //get script elements from design and insert them
        designScripts = fixedDesign.match(dcg.regexScripts);
        if (designScripts) {
            for (i = 0;i < designScripts.length;i++) {
                arg.content.body.innerHTML += designScripts[i];
            }
        }
        externalContents = dcg.getElementsByAttribute(arg.content.body, dcg.labelSource); //get external templates
        dcg.loadContents(externalContents, function () { //load external templates and continue render
            for (contentId in dcg.dataStatic) { //insert html contents
                rawTargets = dcg.getElementsByAttribute(arg.content.body, dcg.labelRaw, contentId);
                for (i = 0; i < rawTargets.length; i++) {
                    rawTarget = rawTargets[i];
                    rawTarget.insertAdjacentHTML("afterend", dcg.dataStatic[contentId]);
                    rawTarget.parentNode.removeChild(rawTarget);
                }
            }
            //store the referenced templates
            designTemplateReferences = dcg.getElementsByAttribute(arg.content.body, dcg.labelTemplateReference);
            for (i = 0;i < designTemplateReferences.length;i++) {
                designTemplate = designTemplateReferences[i];
                designTemplateId = designTemplate.getAttribute(dcg.labelTemplate);
                dcg.loadTemplate({id : designTemplateId, obj : designTemplate});
                designTemplate.parentNode.removeChild(designTemplate);
            }
            //render the previously stored templates
            designTemplateRenders = dcg.getElementsByAttribute(arg.content.body, dcg.labelTemplateRender);
            for (i = 0;i < designTemplateRenders.length;i++) {
                designTemplate = designTemplateRenders[i];
                designTemplateId = designTemplate.getAttribute(dcg.labelTemplate);
                designTemplate.insertAdjacentHTML("afterend", dcg.loadTemplate({id : designTemplateId, obj : designTemplate}).innerHTML);
                designTemplate.parentNode.removeChild(designTemplate);
            }
            arg.content.documentElement.innerHTML = dcg.removeMarked(arg.content.documentElement); //remove marked elements from the content
            arg.content.body = dcg.displayTokens({obj: arg.content.body}); //insert json contents, the tokens
            arg.content.body.innerHTML = dcg.replaceEscape(arg.content.body.innerHTML); //escape all elements
            //remove dcg attributes from body
            arg.content.body.removeAttribute(dcg.labelDesign);
            arg.content.body.removeAttribute(dcg.labelBase);
            dcg.renderReady = true;
            if (dcg.renderDom) {
                dcg.loadScripts(arg.content.body.getElementsByTagName("script"), function () { //inject scripts from design
                    if (window.location.hash.slice(1)) { //jump to anchor
                        arg.content.getElementById(window.location.hash.slice(1)).scrollIntoView();
                    }
                    dcg.DOMLoad(); //dispatch onload event for injected scripts
                    if (typeof arg.callback !== 'undefined') { //run callback
                        arg.callback(arg.content.documentElement.innerHTML);
                    }
                });
            } else {
                if (typeof arg.callback !== 'undefined') { //run callback
                    arg.callback(arg.content.documentElement.innerHTML);
                }
            }
            dcg.presetProfile = dcg.mergeDeep(dcg.presetDefault); //set presetProfile to default
        });
    });
    function fix_path(html, base) { //replace paths with base path
        var i, newHtml = html, newUrl, match, matches = [], url, attr, attrs = "", regex;
        for (i = 0;i < dcg.presetProfile.baseAttrs.length;i++) {
            attr = dcg.presetProfile.baseAttrs[i];
            attrs = attrs+attr+"|";
        }
        attrs = attrs+dcg.labelSource;
        regex = new RegExp("(?:<)[^>]*(?:"+attrs+")(?:=)(?:\"|')([^>]*?)(?:\"|')[^>]*(?:>)", "gim");
        while (match = regex.exec(newHtml)) {
            matches.push(match[1]);
        }
        matches = dcg.removeDuplicatesFromArray(matches);
        for (i = 0;i < matches.length;i++) {
            url = matches[i];
            if (url.search("http") == -1 && url[0] != "#") {
                newUrl = base+url;
                newHtml = dcg.replaceAll(newHtml, url, newUrl, 'gim');
            }
        }
        return newHtml;
    }
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
        newEl = dcg.replaceAll(oldEl, dcg.labelEscapePrefix, '', 'gim');
        newHtml = dcg.replaceAll(newHtml, oldEl, newEl, 'gim');
    }
    return newHtml;
};
dcg.removeMarked = function (node) { //remove elements that has labelRemove attribute function
    if (node == null) {node = document.documentElement}
    var newHtml = node.cloneNode(true), marked, i;
    marked = dcg.getElementsByAttribute(newHtml, dcg.labelRemove);
    if (marked) {
        for (i = 0; i < marked.length; i++) {
            marked[i].parentNode.removeChild(marked[i]);
        }
    }
    return newHtml.innerHTML;
};
dcg.displayTokens = function (arg) { //display tokens function, inputs are: arg.data, arg.obj
    if (arg == null) {arg = {};}
    if (!arg.hasOwnProperty("data")) {arg.data = dcg.dataDynamic;} //default data is dcg.dataDynamic
    if (!arg.hasOwnProperty("obj")) {arg.obj = document.body;} //default element is document.body
    arg.obj = arg.obj.cloneNode(true); //clone the element
    //initiate the functions
    replace_token();
    replace_repeat();
    replace_if();
    function replace_token() { //replace all superficial tokens
        var i, tokens, token, tokenPure, tokenPureSplit, tokenData;
        tokens = dcg.removeDuplicatesFromArray(arg.obj.innerHTML.match(dcg.regexTokenDelimiter)); //get all tokens from the element and remove duplicated tokens
        for (i = 0;i < tokens.length;i++) { //iterate through tokens
            token = tokens[i];
            tokenPure = token.substring(dcg.presetProfile.tokenOpen.length, token.length-dcg.presetProfile.tokenClose.length); //remove the token delimiters
            tokenPureSplit = tokenPure.split(".");
            if (dcg.getRecursiveValue(arg.data, tokenPureSplit[0], 0) !== false) {
                tokenData = dcg.getRecursiveValue(arg.data, tokenPureSplit, 0); //split the token using dots and recursively get the value from the data
                if (!(typeof tokenData === 'object')) {
                    arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, tokenData, 'g'); //replace the token with the value using regex
                } else {
                    arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, JSON.stringify(tokenData), 'g');
                }
            }
        }
    }
    function replace_repeat() { //iterate the elements that has dcg-repeat attribute and replace tokens inside them
        var i, ii, arr, objRepeat, objRepeatClone, objRepeatCloneHtml, repeatAttr, repeatAttrSplit, repeatAttrSplitDot, tokenDataArray, tokenDataArrayCount, tokens, token, tokenPure, tokenPureSplit, tokenData, aliasRegex, aliasRegexMatches, aliasRegexMatch, aliasMatch, aliasReplace;
        objRepeat = dcg.getElementByAttribute(arg.obj, dcg.labelRepeat); //get the first element that has dcg-repeat attribute
        objRepeatCloneHtml = "";
        if (objRepeat !== false) { //if there is element with repeat attribute, continue
            repeatAttr = objRepeat.getAttribute(dcg.labelRepeat);
            repeatAttrSplit = repeatAttr.split(" ");
            repeatAttrSplitDot = repeatAttrSplit[0].split("."); //split the dcg-repeat attribute with spaces and dots
            if (typeof dcg.getRecursiveValue(arg.data, repeatAttrSplitDot[0], 0) === 'object') {
                tokenDataArray = dcg.getRecursiveValue(arg.data, repeatAttrSplitDot, 0); //get the object or array from the data using splitted variable
                if (!tokenDataArray.length) { //if it is an object get the keys.length, if it is an array get the length
                    tokenDataArrayCount = Object.keys(tokenDataArray).length;
                } else {
                    tokenDataArrayCount = tokenDataArray.length;
                }
                for (i = 0;i < tokenDataArrayCount;i++) {
                    objRepeatClone = objRepeat.cloneNode(true); //clone the element that it will be repeated
                    aliasRegex = new RegExp("(?:<)[^>]*((?:"+dcg.labelRepeat+")(?:=)(?:\"|')(?:"+repeatAttrSplit[2]+"\\.)([^>]*?)(?:\"|'))[^>]*(?:>)", "gim");
                    aliasRegexMatches = [];
                    //replace alias inside the cloned element to literal definition in order to repeat the child elements that uses the alias from the parent element
                    while (aliasRegexMatch = aliasRegex.exec(objRepeatClone.innerHTML)) { //find the child elements that uses the alias from the parent element
                        arr = [];
                        arr.push(aliasRegexMatch[1]);
                        arr.push(aliasRegexMatch[2]);
                        aliasRegexMatches.push(arr);
                    }
                    for (ii = 0;ii < aliasRegexMatches.length;ii++) { //iterate through the all of the matches and replace them with literal definition using regex
                        aliasMatch = aliasRegexMatches[ii];
                        aliasReplace = dcg.labelRepeat+"='"+repeatAttrSplit[0]+"."+i+"."+aliasMatch[1]+"'";
                        objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, aliasMatch[0], aliasReplace, 'g');
                    }
                    tokens = dcg.removeDuplicatesFromArray(objRepeatClone.innerHTML.match(dcg.regexTokenDelimiter)); //get all tokens inside the repeated element
                    for (ii = 0;ii < tokens.length;ii++) {
                        token = tokens[ii];
                        tokenPure = token.substring(dcg.presetProfile.tokenOpen.length, token.length-dcg.presetProfile.tokenClose.length); //remove the token delimiters
                        tokenPureSplit = tokenPure.split(".");
                        if (tokenPureSplit[0] == repeatAttrSplit[2]) { //check if the alias defined inside the token is same as the alias on the dcg-repeat attribute
                            tokenPureSplit.shift(); //remove the alias since we only need the literal definitions
                            tokenData = dcg.getRecursiveValue(tokenDataArray[i], tokenPureSplit, 0, i); //split the token using dots and recursively get the value from the data
                            if (typeof tokenData !== 'object') { //if the value is not an object, replace the token using regex
                                objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, token, tokenData, 'g');
                            } else {
                                objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, token, JSON.stringify(tokenData), 'g');
                            }
                        }
                    }
                    objRepeatCloneHtml += objRepeatClone.innerHTML; //expand the variable with the clone element that we have processed this will be done every loop and we will insert it after the iteration
                }
            }
            if (objRepeatCloneHtml != "") { //if the cloned elements are processed then insert the cloned element and remove the original element
                objRepeat.insertAdjacentHTML("afterend", objRepeatCloneHtml);
                objRepeat.parentNode.removeChild(objRepeat);
            }
            replace_repeat(); //restart the function
        }
    }
    function replace_if() { //recursive conditional rendering
        var objIf, ifAttr;
        objIf = dcg.getElementByAttribute(arg.obj, dcg.labelIf); //get the first element that has dcg-if attribute
        if (objIf !== false) { //if there is element with dcg-if attribute, continue
            ifAttr = objIf.getAttribute(dcg.labelIf);
            if (ifAttr && ifAttr != "") {
                if (eval(ifAttr)) { //evaluate the attribute, if it returns true then render the element
                    objIf.insertAdjacentHTML("afterend", objIf.innerHTML);
                }
            }
            objIf.parentNode.removeChild(objIf);
            replace_if(); //restart the function
        }
    }
    return arg.obj; //return the final element
};
dcg.loadTemplate = function (arg) { //load template function, inputs are: arg.id, arg.data, arg.obj
    var objClone, attrData, attrDataSplit;
    if (!arg.hasOwnProperty("id")) {return false;} //if id isn't defined then stop the function
    if (arg.hasOwnProperty("obj")) { //if obj is defined, check the data attribute of the defined element
        attrData = arg.obj.getAttribute(dcg.labelTemplateData);
        if (attrData) {
            attrDataSplit = attrData.split(".");
            if (dcg.getRecursiveValue(dcg.dataDynamic, attrDataSplit[0], 0) !== false) { //check if there is an object defined on the json content
                arg.data = dcg.getRecursiveValue(dcg.dataDynamic, attrDataSplit, 0); //split the label using dots and recursively get the value from the data
            } else {
                arg.data = JSON.parse(attrData); //if there isn't, parse the label data
            }
        }
    } else { //if its not defined then set it undefined
        arg.obj = undefined;
    }
    objClone = init_template(arg.id, arg.obj).cloneNode(true); //load and clone the template
    attrData = objClone.getAttribute(dcg.labelTemplateData); //get the referenced template's data attribute
    if ((!arg.data || !arg.hasOwnProperty("data")) && attrData) { //if data is not defined previously check if its defined on the referenced template
        attrDataSplit = attrData.split(".");
        if (dcg.getRecursiveValue(dcg.dataDynamic, attrDataSplit[0], 0) !== false) { //check if there is an object defined on the json content
            arg.data = dcg.getRecursiveValue(dcg.dataDynamic, attrDataSplit, 0); //split the label using dots and recursively get the value from the data
        } else {
            arg.data = JSON.parse(attrData); //if there isn't parse the label data
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
        if (typeof obj === 'undefined' || dcg.dataStatic.hasOwnProperty(dcg.labelTemplatePrefix+id)) { //check if template's id exists on the stored templates or obj is not defined
            template = dcg.dataStatic[dcg.labelTemplatePrefix+id];
        } else { //if obj is defined and template id doesn't exist then store this new template with its id
            template = obj.cloneNode(true);
            dcg.dataStatic[dcg.labelTemplatePrefix+id] = template;
        }
        return template; //return the template
    }
};
dcg.loadContents = function (node, callback, i) { //fetch and load external contents this is a recursive function
    if (node == null) {node = dcg.getElementsByAttribute(document.documentElement, dcg.labelSource);} //if node doesn't exist then set it to document element and get the elements with source attribute
    if (i == null) {i = 0;} //if index doesn't exist, set it to 0
    var src, len = node.length;
    if (len > 0 && i < len) { //if there are elements with source attributes and index is lower than total elements, continue
        src = node[i].getAttribute(dcg.labelSource); //get the source attribute's value
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
        if (node[i].src) { //check if script element has source attribute if it has then fetch the external script and inject it
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
    if (cache == null) {cache = dcg.presetProfile.cacheRender;}
    if (method == null) {method = 'GET';}
    if (async == null) {async = true;}
    var xhr, guid, cacheUrl, hashUrl;
    method = method.toUpperCase();
    if (!(method === 'GET' || method === 'POST' || method === 'HEAD')) {
        throw new Error('method must either be GET, POST, or HEAD');
    }
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
        cacheURL = cacheUrl.replace(/([?&])_=[^&]*/, "$1");
        hashUrl = ((/\?/).test(cacheUrl) ? "&" : "?") + "_=" + (guid++) + hashUrl;
        url = cacheUrl + hashUrl;
    }
    xhr.open(method, url, async);
    xhr.send();
};
dcg.DOMLoad = function () { //imitate window onload
    (function () { //polyfill for dispatchEvent
        if (typeof window.CustomEvent === 'function') {return false;}
        function CustomEvent(event, params) {
            params = params || {bubbles: false, cancelable: false, detail: null};
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        window.CustomEvent = CustomEvent;
    })();
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

//babel and polyfills

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === 'function' && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(target) {
        'use strict';
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert first argument to object');
        }
        var to = Object(target);
        for (var i = 1; i < arguments.length; i++) {
            var nextSource = arguments[i];
            if (nextSource === undefined || nextSource === null) {
                continue;
            }
            nextSource = Object(nextSource);
            var keysArray = Object.keys(Object(nextSource));
            for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                var nextKey = keysArray[nextIndex];
                var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                if (desc !== undefined && desc.enumerable) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
        return to;
        }
    });
}