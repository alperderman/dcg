/*!
* Dynamic Content Generation (1.0.2) 2021/08/06
*/
var dcg = {};
dcg.labelDesign = "dcg-design"; //design attribute: for locating design itself
dcg.labelBase = "dcg-base"; //base attribute: for setting base path for design dependencies
dcg.labelObj = "dcg-obj"; //dynamic content attribute
dcg.labelRaw = "dcg-raw"; //static content attribute
dcg.labelJson = "dcg-json"; //json content attribute
dcg.labelXml = "dcg-xml"; //xml content attribute
dcg.labelTemplate = "dcg-temp"; //temp attribute: for indicating templates
dcg.labelTemplateData = "dcg-data"; //data attribute: for passing raw json data to the template or binding the template with json content
dcg.labelTemplateReference = "dcg-tref"; //template reference attribute: for loading template for future uses
dcg.labelTemplatePrefix = "tref_"; //prefix for indicating template references inside the dataStatic
dcg.labelTemplateRender = "dcg-tren"; //template render attribute: for rendering the templates that has been referenced before
dcg.labelSource = "dcg-src"; //external source attribute: for fetching external contents or external templates
dcg.labelRepeat = "dcg-repeat"; //repeat attribute: for iterating json contents on design
dcg.labelRemove = "dcg-remove"; //remove attribute: for removing css files and styles from content
dcg.labelAttribute = "dcg-attr:"; //custom attribute prefix: custom attributes are used for bypassing invalid html errors when you use tokens inside attributes
dcg.tokenOpen = "{{"; //opening delimiter for tokens
dcg.tokenClose = "}}"; //closing delimiter for tokens
dcg.dataDynamic = {}; //for storing dynamic contents, they are nestable and usable as tokens (xml and json)
dcg.dataStatic = {}; //for storing static contents (raw html and template references)
dcg.contentBackup = undefined; //for reverting back to the original state of the page
dcg.removeCss = false; //for removing the styles of the content page if set to true styles will not be carried over rendered page
dcg.cacheRender = false; //for caching render change it to true if its going to be used in production
dcg.beforeRender = undefined; //for running a function before the render begins
dcg.afterRender = undefined; //for running a function after the render finishes define a status parameter for checking if render has ended successfully or failed
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
dcg.getRecursiveValue = function (arr, keys, i) { //getting a value from multi-dimensional object
    if (!i) {i = 0;}
    var key = keys[i], len = keys.length, val;
    if ((len > 0 && i < len) && arr.hasOwnProperty(key)) {
        i++;
        val = dcg.getRecursiveValue(arr[key], keys, i);
    } else {
        val = arr;
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
dcg.mergeDeep = function (target) { //function for merging multi-dimensional objects
    var _dcg;
    for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        sources[_key - 1] = arguments[_key];
    }
    if (!sources.length) {
        return target;
    }
    var source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (var key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, _defineProperty({}, key, {}));
                }
                dcg.mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, _defineProperty({}, key, source[key]));
            }
        }
    }
    function isObject(item) {
        return item && _typeof(item) === 'object' && !Array.isArray(item);
    }
    return (_dcg = dcg).mergeDeep.apply(_dcg, [target].concat(sources));
};
dcg.replaceAll = function (str, find, replace, options) { //replace all strings with using regex
    if (!options) {options = 'gim';}
    function escapeRegExp(string) {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    }
    return str.replace(new RegExp(escapeRegExp(find), options), replace);
};
dcg.renderDesign = function (src, base) { //the main render function
    var i, externalContents, staticContents, staticContent, dynamicContents, dynamicContent, dynamicContentParse, dynamicContentNested, contentId, contentStyle, contentCss, contentRemove, designLinks, designStyles, designScripts, designTemplateReferences, designTemplateRenders, designTemplate, designTemplateId, fixedResponseText, rawTargets, rawTarget;
    if (typeof dcg.beforeRender != 'undefined') { //if beforeRender function is defined run it
        dcg.beforeRender();
    }
    if (dcg.removeCss) { //find styles from the content and tag them
        contentStyle = document.getElementsByTagName('style');
        contentCss = dcg.getElementsByAttribute(document.documentElement, "rel", "stylesheet");
        for (i = 0; i < contentStyle.length; i++) {
            contentStyle[i].setAttribute("dcg-remove", "true");
        }
        for (i = 0; i < contentCss.length; i++) {
            contentCss[i].setAttribute("dcg-remove", "true");
        }
    }
    externalContents = dcg.getElementsByAttribute(document.body, dcg.labelSource); //get external contents
    dcg.loadContents(externalContents, function () { //load the external contents and then continue render
        dynamicContents = dcg.getElementsByAttribute(document.body, dcg.labelObj); //get dynamic contents
        staticContents = dcg.getElementsByAttribute(document.body, dcg.labelRaw); //get raw contents
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
                }else if (dynamicContent.hasAttribute(dcg.labelXml)) { //if it has labelXml attribute, parse xml
                    dynamicContentParse = dcg.parseXmlToJson(dynamicContent.innerHTML);
                }else { //if it doesn't have labels, store it as it is
                    dynamicContentParse = dynamicContent.innerHTML;
                }
                dynamicContentNested = dcg.setNestedPropertyValue({}, contentId, dynamicContentParse); //create nested object based labelObj
                dcg.dataDynamic = dcg.convertToObject(dcg.mergeDeep(dcg.dataDynamic, dynamicContentNested)); //merge content with dataDynamic and convert all arrays to objects in order to nest them manually later on
            }
        }
        if (src) { //check if source exists
            dcg.xhr(src, function (xhr) { //fetch design from source
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) { //if the xhr responded with success then continue render
                        fixedResponseText = fix_path(xhr.responseText, base); //replace paths on the design with the base path
                        //insert design body and its attributes
                        document.documentElement.innerHTML = document.documentElement.innerHTML.replace("<body", "<body"+xhr.responseText.match("<body" + "(.*)" + ">")[1]);
                        document.body.innerHTML = fixedResponseText.match(/<body[^>]*>((.|[\n\r])*)<\/body>/im)[1];
                        //get link elements from design and insert them
                        designLinks = fixedResponseText.match(/<link[^>]*>/gim);
                        if (designLinks) {
                            for (i = 0;i < designLinks.length;i++) {
                                document.head.innerHTML += designLinks[i];
                            }
                        }
                        //get style elements from design and insert them
                        designStyles = fixedResponseText.match(/<style[^>]*>([\s\S]*?)<\/style>/gim);
                        if (designStyles) {
                            for (i = 0;i < designStyles.length;i++) {
                                document.head.innerHTML += designStyles[i];
                            }
                        }
                        //remove content script elements
                        while (document.getElementsByTagName('script').length > 0) {
                            document.getElementsByTagName('script')[0].parentNode.removeChild(document.getElementsByTagName('script')[0]);
                        }
                        //get script elements from design and insert them
                        designScripts = fixedResponseText.match(/<script[^>]*>([\s\S]*?)<\/script>/gim);
                        if (designScripts) {
                            for (i = 0;i < designScripts.length;i++) {
                                document.body.innerHTML += designScripts[i];
                            }
                        }
                        externalContents = dcg.getElementsByAttribute(document.body, dcg.labelSource); //get external templates
                        dcg.loadContents(externalContents, function () { //load external templates and continue render
                            for (contentId in dcg.dataStatic) { //insert html contents
                                rawTargets = dcg.getElementsByAttribute(document.body, dcg.labelRaw, contentId);
                                for (i = 0; i < rawTargets.length; i++) {
                                    rawTarget = rawTargets[i];
                                    rawTarget.insertAdjacentHTML("afterend", dcg.dataStatic[contentId]);
                                    rawTarget.parentNode.removeChild(rawTarget);
                                }
                            }
                            //store the referenced templates
                            designTemplateReferences = dcg.getElementsByAttribute(document.body, dcg.labelTemplateReference);
                            for (i = 0;i < designTemplateReferences.length;i++) {
                                designTemplate = designTemplateReferences[i];
                                designTemplateId = designTemplate.getAttribute(dcg.labelTemplate);
                                dcg.loadTemplate({id : designTemplateId, obj : designTemplate});
                                designTemplate.parentNode.removeChild(designTemplate);
                            }
                            //render the previously stored templates
                            designTemplateRenders = dcg.getElementsByAttribute(document.body, dcg.labelTemplateRender);
                            for (i = 0;i < designTemplateRenders.length;i++) {
                                designTemplate = designTemplateRenders[i];
                                designTemplateId = designTemplate.getAttribute(dcg.labelTemplate);
                                designTemplate.insertAdjacentHTML("afterend", dcg.loadTemplate({id : designTemplateId, obj : designTemplate}).innerHTML);
                                designTemplate.parentNode.removeChild(designTemplate);
                            }
                            if (dcg.removeCss) { //remove tagged css from the content
                                contentRemove = dcg.getElementsByAttribute(document.head, dcg.labelRemove);
                                for (i = 0; i < contentRemove.length; i++) {
                                    contentRemove[i].parentNode.removeChild(contentRemove[i]);
                                }
                            }
                            document.body = dcg.displayTokens(); //insert json contents, the tokens
                            document.body.innerHTML = replace_attr(); //replace custom attributes
                            dcg.loadScripts(document.body.getElementsByTagName("script"), function () { //inject scripts from design
                                //remove attributes
                                document.body.removeAttribute(dcg.labelDesign);
                                document.body.removeAttribute(dcg.labelBase);
                                if (window.location.hash.slice(1)) { //jump to anchor
                                    document.getElementById(window.location.hash.slice(1)).scrollIntoView();
                                }
                                dcg.DOMLoad(); //dispatch onload event for injected scripts
                                if (typeof dcg.afterRender != 'undefined') { //if afterRender function is defined then set the status true and run it
                                    dcg.afterRender(true);
                                }
                            });
                        });
                    }
                    if (xhr.status == 404) { //if couldn't find the design
                        if (typeof dcg.afterRender != 'undefined') { //if afterRender function is defined then set the status false and run it
                            dcg.afterRender(false);
                        }
                    }
                }
            }, dcg.cacheRender);
        }
    });
    function fix_path(html, base) { //replace paths with base path
        var i, newHtml = html, newUrl, match, matches = [], url, regex = new RegExp("(?:<)[^>]*(?:src|href|"+dcg.labelSource+")(?:=)(?:\"|')([^>]*?)(?:\"|')[^>]*(?:>)", "gim");
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
    function replace_attr(html) { //replace custom attributes
        if (!html) {html = document.body.cloneNode(true).innerHTML;}
        var i, newHtml = html, match, matches = [], oldAttr, newAttr, regex = new RegExp("((?:"+dcg.labelAttribute+")(?:[^>]*?)(?:=)(?:\"|')(?:[^>]*?)(?:\"|'))","gim");
        while (match = regex.exec(newHtml)) {
            matches.push(match[1]);
        }
        matches = dcg.removeDuplicatesFromArray(matches);
        for (i = 0;i < matches.length;i++) {
            oldAttr = matches[i];
            newAttr = oldAttr.replace(dcg.labelAttribute, "");
            newHtml = dcg.replaceAll(newHtml, oldAttr, newAttr, 'gim');
        }
        return newHtml;
    }
};
dcg.displayTokens = function (arg) { //display tokens function inputs are: arg.data, arg.obj
    var i, tokens, token, tokenPure, tokenPureSplit, tokenData, tokenDelimiterRegex = new RegExp(dcg.tokenOpen+"[\\s\\S]*?"+dcg.tokenClose, "g");
    if (!arg) {arg = {};}
    if (!arg.hasOwnProperty("data")) {arg.data = dcg.dataDynamic;} //default data as dcg.dataDynamic
    if (!arg.hasOwnProperty("obj")) {arg.obj = document.body;} //default element as document.body
    arg.obj = arg.obj.cloneNode(true); //clone the element
    tokens = dcg.removeDuplicatesFromArray(arg.obj.innerHTML.match(tokenDelimiterRegex)); //get all tokens from the element and remove duplicated tokens
    for (i = 0;i < tokens.length;i++) { //iterate through tokens
        token = tokens[i];
        tokenPure = token.substring(2, token.length-2); //remove the token delimiters
        tokenPureSplit = tokenPure.split(".");
        if(arg.data.hasOwnProperty(tokenPureSplit[0])){
            tokenData = dcg.getRecursiveValue(arg.data, tokenPureSplit, 0); //split the token using dots and recursively get the value from the data
            if(!(typeof tokenData === 'object')){
                arg.obj.innerHTML = dcg.replaceAll(arg.obj.innerHTML, token, tokenData, 'g'); //replace the token with the value using regex
            }
        }
    }
    recursiveReplaceRepeat();
    function recursiveReplaceRepeat() { //replace repeats recursively
        var i, ii, iii, arr, objRepeat, objRepeatClone, objRepeatCloneHtml, repeatAttr, repeatAttrSplit, repeatAttrSplitDot, tokenDataArray, tokenDataArrayCount, tokens, token, tokenPure, tokenPureSplit, tokenData, aliasRegex, aliasRegexMatches, aliasRegexMatch, aliasMatch, aliasReplace;
        objRepeat = dcg.getElementByAttribute(arg.obj, dcg.labelRepeat); //get the first element that has repeat attribute
        objRepeatCloneHtml = "";
        if (objRepeat !== false) { //if there is element with repeat attribute continue
            repeatAttr = objRepeat.getAttribute(dcg.labelRepeat);
            repeatAttrSplit = repeatAttr.split(" ");
            repeatAttrSplitDot = repeatAttrSplit[0].split("."); //split the repeat attribute with spaces and dots
            if (arg.data.hasOwnProperty(repeatAttrSplitDot[0]) && typeof arg.data[repeatAttrSplitDot[0]] === 'object') {
                tokenDataArray = dcg.getRecursiveValue(arg.data, repeatAttrSplitDot, 0); //get the object or array from the data using splitted variable
                tokenDataArrayCount;
                if (!tokenDataArray.length) { //if it is an object get the keys.length, if it is an array get the length
                    tokenDataArrayCount = Object.keys(tokenDataArray).length;
                } else {
                    tokenDataArrayCount = tokenDataArray.length;
                }
                for (i = 0;i < tokenDataArrayCount;i++) {
                    objRepeatClone = objRepeat.cloneNode(true); //clone the element that it will be repeated
                    tokens = dcg.removeDuplicatesFromArray(objRepeatClone.innerHTML.match(tokenDelimiterRegex)); //get all tokens inside the will be repeated element
                    for (ii = 0;ii < tokens.length;ii++) {
                        token = tokens[ii];
                        tokenPure = token.substring(2, token.length-2); //remove the token delimiters
                        tokenPureSplit = tokenPure.split(".");
                        if (tokenPureSplit[0] == repeatAttrSplit[2]) { //check if the alias defined inside the token is same as the alias on the repeat attribute
                            tokenPureSplit.shift(); //remove the alias since we don't need it
                            tokenData = dcg.getRecursiveValue(tokenDataArray[i], tokenPureSplit, 0); //split the token using dots and recursively get the value from the data
                            if (!(typeof tokenData === 'object')) { //if the value is not object replace the token using regex
                                objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, token, tokenData, 'g');
                            }
                            aliasRegex = new RegExp("(?:<)[^>]*((?:"+dcg.labelRepeat+")(?:=)(?:\"|')(?:"+repeatAttrSplit[2]+"\\.)([^>]*?)(?:\"|'))[^>]*(?:>)", "gim");
                            aliasRegexMatches = [];
                            //replace alias inside the cloned element to literal definition in order to repeat the child elements that uses the alias from the parent element
                            while (aliasRegexMatch = aliasRegex.exec(arg.obj.innerHTML)) { //find the child elements that uses the alias from the parent element
                                arr = [];
                                arr.push(aliasRegexMatch[1]);
                                arr.push(aliasRegexMatch[2]);
                                aliasRegexMatches.push(arr);
                            }
                            for (iii = 0;iii < aliasRegexMatches.length;iii++) { //iterate through the all of the matches and replace them with literal definition using regex
                                aliasMatch = aliasRegexMatches[iii];
                                aliasReplace = dcg.labelRepeat+"='"+repeatAttrSplit[0]+"."+i+"."+aliasMatch[1]+"'";
                                objRepeatClone.innerHTML = dcg.replaceAll(objRepeatClone.innerHTML, aliasMatch[0], aliasReplace, 'g');
                            }
                        }
                    }
                    objRepeatCloneHtml += objRepeatClone.innerHTML; //expand the variable with the clone element that we have processed this will be done every loop and we will insert it after the iteration
                }
            }
            if (objRepeatCloneHtml != "") { //if the clone elements are processed then insert the cloned element and remove the original element
                objRepeat.insertAdjacentHTML("afterend", objRepeatCloneHtml);
                objRepeat.parentNode.removeChild(objRepeat);
            }
            recursiveReplaceRepeat(); //restart the function
        }
    }
    return arg.obj; //return the final element
};
dcg.revertBack = function () { //revert back function, load content backup if it exists
    if (typeof dcg.contentBackup != 'undefined') { //check if backup exists
        var backup = dcg.contentBackup.cloneNode(true);
        document.documentElement.innerHTML = backup.innerHTML;
    } else { //if it doesn't then take backup
        while (document.getElementsByTagName('script').length > 0) {
            document.getElementsByTagName('script')[0].parentNode.removeChild(document.getElementsByTagName('script')[0]);
        }
        dcg.contentBackup = document.documentElement.cloneNode(true);
    }
};
dcg.render = function (src, base) { //wrapper for renderDesign function
    dcg.revertBack(); //revert back changes
    if (!src) {src = document.body.getAttribute(dcg.labelDesign);} //if the design source isn't defined it gets the source from the attribute
    if (!base) {base = document.body.getAttribute(dcg.labelBase); //if the base path isn't defined its gets the base path from the attribute
        if (!base) { //if base path still doesn't exists it sets the base path relative to the design source
            base = src.replace(src.substring(src.lastIndexOf('/')+1), '');
        }
    }
    dcg.renderDesign(src, base);
};
dcg.loadTemplate = function (arg) { //load template function inputs are: arg.id, arg.data, arg.obj
    var objClone, attrData, attrDataSplit;
    if (!arg.hasOwnProperty("id")) {return false;} //if id isn't defined then stop the function
    if (arg.hasOwnProperty("obj")) { //if obj is defined check the data attribute of the defined element
        attrData = arg.obj.getAttribute(dcg.labelTemplateData);
        if (attrData) {
            attrDataSplit = attrData.split(".");
            if (dcg.dataDynamic.hasOwnProperty(attrDataSplit[0])) { //check if there is an object defined on the json content
                arg.data = dcg.getRecursiveValue(dcg.dataDynamic, attrDataSplit, 0); //split the label using dots and recursively get the value from the data
            } else {
                arg.data = JSON.parse(attrData); //if there isn't parse the label data
            }
        }
    } else { //if its not defined then set it undefined
        arg.obj = undefined;
    }
    objClone = init_template(arg.id, arg.obj).cloneNode(true); //load and clone the template
    attrData = objClone.getAttribute(dcg.labelTemplateData); //get the referenced template's data attribute
    if ((!arg.data || !arg.hasOwnProperty("data")) && attrData) { //if data is not defined previously check if its defined on the referenced template
        attrDataSplit = attrData.split(".");
        if (dcg.dataDynamic.hasOwnProperty(attrDataSplit[0])) { //check if there is an object defined on the json content
            arg.data = dcg.getRecursiveValue(dcg.dataDynamic, attrDataSplit, 0); //split the label using dots and recursively get the value from the data
        } else {
            arg.data = JSON.parse(attrData); //if there isn't parse the label data
        }
    }
    if (arg.data) { //if data is defined then display the tokens
        objClone = dcg.displayTokens({data: arg.data, obj: objClone});
    }
    return objClone;
    function init_template(id, obj) { //load template function
        var template;
        if (typeof obj == 'undefined' || dcg.dataStatic.hasOwnProperty(dcg.labelTemplatePrefix+id)) { //check if template's id exists on the stored templates or obj is not defined
            template = dcg.dataStatic[dcg.labelTemplatePrefix+id];
        } else { //if obj is defined and template id doesnt exists then store this new template with its id
            template = obj.cloneNode(true);
            dcg.dataStatic[dcg.labelTemplatePrefix+id] = template;
        }
        return template; //return the template
    }
};
dcg.loadContents = function (node, callback, i) { //fetch and load external contents this is a recursive function
    if (!node) {node = dcg.getElementsByAttribute(document.documentElement, dcg.labelSource);} //if node doesn't exists then set it to document element and get the elements with source attribute
    if (!i) {i = 0;} //if index doesn't exists set it to 0
    var src, len = node.length;
    if (len > 0 && i < len) { //if there are elements with source attributes and index is lower than total elements continue
        src = node[i].getAttribute(dcg.labelSource); //get the source attribute's value
        if (src != "") { //if source is not empty then fetch the content and insert it into element then increase the index and run the function again
            dcg.xhr(src, function (xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        node[i].insertAdjacentHTML("afterend", xhr.responseText);
                        node[i].parentNode.removeChild(node[i]);
                        i++;
                        dcg.loadContents(node, callback, i);
                    }
                }
            }, dcg.cacheRender);
        }
    } else { //if there are no elements or index is higher than total elements then run the callback function
        if (typeof callback != 'undefined') {
            callback();
        }
    }
};
dcg.loadScripts = function (node, callback, i) { //inject scripts from specified element this is a recursive function
    if (!node) {node = document.getElementsByTagName("script");} //if node is not specified then get all script elements
    if (!i) {i = 0;} //if index is not defined then set it to 0
    var len = node.length;
    if (len > 0 && i < len) { //if there are script elements and index is lower than total elements continue
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
        if (typeof callback != 'undefined') {
            callback();
        }
    }
};
dcg.parseXmlToJson = function (xml) { //convert xml to object
    var json = {}, res, key, value, arr, arrValue, _iterator, _step, _iterator = _createForOfIteratorHelper(xml.matchAll(/(?:<(\w*)(?:\s[^>]*)*>)((?:(?!<\1)[\s\S])*)(?:<\/\1>)|<(\w*)(?:\s*)*\/>/gm));
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        res = _step.value;
        key = res[1] || res[3];
        value = res[2] && dcg.parseXmlToJson(res[2]);
        if (json.hasOwnProperty(key)) {
            if (!Array.isArray(json[key])) {
                arr = [];
                arr.push(json[key]);
            }else {
                arr = json[key];
            }
            arrValue = (value && Object.keys(value).length ? value : res[2]) || null;
            arr.push(arrValue);
            json[key] = arr;
        } else {
            json[key] = (value && Object.keys(value).length ? value : res[2]) || null;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return json;
};
dcg.xhr = function (url, callback, cache, method, async) { //XHR function used for fetching external contents, scripts and templates
    if (!cache) {cache = false;}
    if (!method) {method = 'GET';}
    if (!async) {async = true;}
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
        if (typeof window.CustomEvent === "function") {return false;}
        function CustomEvent(event, params) {
            params = params || {bubbles: false, cancelable: false, detail: null};
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        window.CustomEvent = CustomEvent;
    })();
    window.dispatchEvent(new CustomEvent("DOMContentLoaded"));
    window.dispatchEvent(new CustomEvent('load'));
};
dcg.DOMEval = function (code) { //script injection function
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
            if (typeof callback != 'undefined') { //skip an execution frame and run callback function if its defined
                setTimeout(function () {callback(xhr)}, 0);
            }
        }
    }, dcg.cacheRender);
};

//Babel and polyfills

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

if (!String.prototype.matchAll) {
    String.prototype.matchAll = function (rx) {
        if (typeof rx === "string") rx = new RegExp(rx, "g");
        rx = new RegExp(rx);
        let cap = [];
        let all = [];
        while ((cap = rx.exec(this)) !== null) all.push(cap);
        return all;
    };
}

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