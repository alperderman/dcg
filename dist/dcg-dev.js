/*!
* Dynamic Content Generation (1.0.0) 2021/02/25
*/
var dcg = {};
dcg.labelDesign = "dcg-design"; //design attribute: for locating design itself
dcg.labelBase = "dcg-base"; //base attribute: for setting base path for design dependencies
dcg.labelJson = "dcg-json"; //json content attribute
dcg.labelHtml = "dcg-html"; //raw html content attribute
dcg.labelTemplate = "dcg-temp"; //temp attribute: for indicating templates
dcg.labelTemplateData = "dcg-data"; //data attribute: for passing raw json data to the template or binding the template with json content
dcg.labelTemplateReference = "dcg-tref"; //template reference attribute: for loading template for future uses
dcg.labelTemplateRender = "dcg-tren"; //template render attribute: for rendering the templates that has been referenced before
dcg.labelSource = "dcg-src"; //external source attribute: for fetching external contents or external templates
dcg.labelRepeat = "dcg-repeat"; //repeat attribute: for iterating json contents on design
dcg.labelAttribute = "dcg-attr:"; //custom attribute prefix: custom attributes are used for bypassing invalid html errors when you use tokens inside attributes
dcg.tokenOpen = "{{"; //opening delimiter for tokens
dcg.tokenClose = "}}"; //closing delimiter for tokens
dcg.dataTemplate = {}; //for storing templates
dcg.dataJson = {}; //for storing json contents
dcg.dataHtml = {}; //for storing raw html contents
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
dcg.removeDuplicatesFromArray = function (arr) { //remove duplicated values from array
    var m = {}, newArr = [];
    if(arr){
        for (var i=0;i < arr.length;i++) {
            var v = arr[i];
            if (!m[v]) {
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
dcg.renderDesign = function (src, base) { //the main render function
    var i, externalContents, jsonContents, htmlContents, contentId, contentStyles, designLinks, designStyles, designScripts, designTemplateReferences, designTemplateRenders, designTemplate, designTemplateId, fixedResponseText, jsonTargets, jsonTarget, htmlTargets, htmlTarget;
    if (typeof dcg.beforeRender != 'undefined') { //if beforeRender function is defined run it
        dcg.beforeRender();
    }
    if (dcg.removeCss) { //remove styles from the content
        contentStyles = dcg.getElementsByAttribute(document.documentElement, "rel", "stylesheet");
        while (document.getElementsByTagName('style').length > 0) {
            document.getElementsByTagName('style')[0].parentNode.removeChild(document.getElementsByTagName('style')[0]);
        }
        while (contentStyles.length > 0) {
            contentStyles[0].parentNode.removeChild(contentStyles[0]);
            contentStyles.splice(0, 1);
        }
    }
    externalContents = dcg.getElementsByAttribute(document.body, dcg.labelSource); //get external contents
    dcg.loadContents(externalContents, function () { //load the external contents and then continue render
        jsonContents = dcg.getElementsByAttribute(document.body, dcg.labelJson); //get json contents
        htmlContents = dcg.getElementsByAttribute(document.body, dcg.labelHtml); //get raw html contents
        for (i = 0; i < htmlContents.length; i++) { //iterate through html contents and store them
            htmlContent = htmlContents[i];
            contentId = htmlContent.getAttribute(dcg.labelHtml);
            if (!dcg.dataHtml.hasOwnProperty(contentId) && htmlContent.innerHTML != "") {
                dcg.dataHtml[contentId] = htmlContent.innerHTML;
            }
        }
        for (i = 0; i < jsonContents.length; i++) { //iterate through json contents and store them
            jsonContent = jsonContents[i];
            contentId = jsonContent.getAttribute(dcg.labelJson);
            if (!dcg.dataJson.hasOwnProperty(contentId) && jsonContent.innerHTML != "") {
                dcg.dataJson[contentId] = JSON.parse(jsonContent.innerHTML);
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
                            for (contentId in dcg.dataHtml) { //insert html contents
                                htmlTargets = dcg.getElementsByAttribute(document.body, dcg.labelHtml, contentId);
                                for (i = 0; i < htmlTargets.length; i++) {
                                    htmlTarget = htmlTargets[i];
                                    htmlTarget.outerHTML = dcg.dataHtml[contentId];
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
                                designTemplate.outerHTML = dcg.loadTemplate({id : designTemplateId, obj : designTemplate}).innerHTML;
                            }
                            for (contentId in dcg.dataJson) { //insert json contents, the tokens
                                jsonTargets = dcg.getElementsByAttribute(document.body, dcg.labelJson, contentId);
                                for (i = 0; i < jsonTargets.length; i++) {
                                    jsonTarget = jsonTargets[i];
                                    jsonTarget.outerHTML = dcg.displayTokens({id: contentId, data: dcg.dataJson[contentId], obj: jsonTarget}).innerHTML;
                                }
                            }
                            document.body.innerHTML = replace_attr(); //replace custom attributes
                            dcg.loadScripts(document.body.getElementsByTagName("script"), function () { //inject scripts from design
                                //remove attributes
                                document.body.removeAttribute(dcg.labelDesign);
                                document.body.removeAttribute(dcg.labelBase);
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
        var i, newHtml = html, newUrl, matches = [], url, replaceUrl, regex = new RegExp("(?:<)[^>]*(?:src|href|"+dcg.labelSource+")(?:=)(?:\"|')([^>]*?)(?:\"|')[^>]*(?:>)", "gim");
        while (match = regex.exec(newHtml)) {
            matches.push(match[1]);
        }
        matches = dcg.removeDuplicatesFromArray(matches);
        for (i = 0;i < matches.length;i++) {
            url = matches[i];
            if (url.search("http") == -1 && url[0] != "#") {
                newUrl = base+url;
                replaceUrl = new RegExp(url, "gim");
                newHtml = newHtml.replace(replaceUrl, newUrl);
            }
        }
        return newHtml;
    }
    function replace_attr(html) { //replace custom attributes
        if (!html) {html = document.body.cloneNode(true).innerHTML;}
        var i, newHtml = html, match, matches = [], oldAttr, newAttr, replaceAttr, regex = new RegExp("(?:<)[^>]*((?:"+dcg.labelAttribute+")(?:[^>]*?)(?:=)(?:\"|')(?:[^>]*?)(?:\"|'))[^>]*(?:>)","gim");
        while (match = regex.exec(newHtml)) {
            matches.push(match[1]);
        }
        matches = dcg.removeDuplicatesFromArray(matches);
        for (i = 0;i < matches.length;i++) {
            oldAttr = matches[i];
            newAttr = oldAttr.replace(dcg.labelAttribute, "");
            replaceAttr = new RegExp(oldAttr, "gim");
            newHtml = newHtml.replace(replaceAttr, newAttr);
        }
        return newHtml;
    }
};
dcg.displayTokens = function (arg) { //display tokens function inputs are: arg.id, arg.data, arg.obj
    var i, ii, iii, hasId = true, objClone, objRepeats, objRepeat, objRepeatClone, objRepeatCloneHtml, objRef, objRefSplit, objRefSplitLimit, objRefSplitDot, dataChild, dataTokens, dataToken, tokens, token, tokenRegex, tokenDelimiterRegex = new RegExp(dcg.tokenOpen+"[\\s\\S]*?"+dcg.tokenClose, "g"), prop, propSplit, propIndex;
    if (!arg.hasOwnProperty("id")) {hasId = false;} //if id doesn't exists set hasId to false
    if (!arg.hasOwnProperty("data")) {return false;} //if data is not defined stop the function
    if (!arg.hasOwnProperty("obj")) {return false;} //if element is not defined stop the function
    objClone = arg.obj.cloneNode(true); //clone the element
    if (!hasId) { //if id is not defined then don't check for id of the tokens used for template tokens because template tokens doesn't have id
        propIndex = 0;
        objRefSplitLimit = 1;
    } else { //if id exists then set the split limit higher so it can detect the id correctly
        propIndex = 1;
        objRefSplitLimit = 3;
    }
    objRepeats = dcg.getElementsByAttribute(objClone, dcg.labelRepeat); //get the elements with repeat attribute
    if (objRepeats.length > 0) { //if there are elements that should repeat then continue
        for (i = 0;i < objRepeats.length;i++) { //iterate through elements
            objRepeatCloneHtml = "";
            objRepeat = objRepeats[i];
            tokens = dcg.removeDuplicatesFromArray(objRepeat.innerHTML.match(tokenDelimiterRegex)); //get the tokens with regex and remove the duplicated tokens
            objRef = objRepeat.getAttribute(dcg.labelRepeat); //get the repeat attribute's value
            objRefSplit = objRef.split(" "); //split the value by space
            if (tokens.length > 0) { //check if there are tokens
                if (objRefSplit.length > objRefSplitLimit) { //check if the defined data is an array or an object by counting the splitted value if its array then continue
                    objRefSplitDot = objRefSplit[2].split("."); //split the value again this time by dot for checking id
                    if ((!hasId || objRefSplit[4] == arg.id) && arg.data.hasOwnProperty(objRefSplitDot[0])) { //if the extracted id from the attribute's value is the same as defined id and data has an property corresponding to attribute then continue
                        dataTokens = dcg.getRecursiveValue(arg.data, objRefSplitDot, 0); //get the corresponding property from data
                        for (ii = 0;ii < dataTokens.length;ii++) { //iterate through property
                            dataToken = dataTokens[ii]; //set the token as property value
                            objRepeatClone = objRepeat.cloneNode(true); //clone the element
                            for (iii = 0;iii < tokens.length;iii++) { //iterate through all of the tokens
                                token = tokens[iii];
                                prop = token.substring(2, token.length-2); //remove delimiters from the token
                                propSplit = prop.split("."); //split the token by dot in order to check id 
                                if ((!hasId || propSplit[0] == arg.id) && propSplit[propIndex] == objRefSplit[0]) { //if the token id is same as defined id and the token key is same as the key defined in the repeat attribute then continue
                                    tokenRegex = new RegExp(token, 'g'); //prepare a regex statement to replace the corresponding tokens with the data
                                    objRepeatClone.innerHTML = objRepeatClone.innerHTML.replace(tokenRegex, dataToken); //replace the tokens
                                }
                            }
                            objRepeatCloneHtml += objRepeatClone.innerHTML; //append the stored variable in order to insert them later
                        }
                    }
                } else { //if data is an object then continue
                    objRefSplitDot = objRefSplit[0].split("."); //split the attribute by dot to check the property
                    if ((!hasId || objRefSplit[2] == arg.id) && arg.data.hasOwnProperty(objRefSplitDot[0])) { //if the id in the attribute is the same as defined id and data has the property defined in the attribute then continue
                        dataTokens = dcg.getRecursiveValue(arg.data, objRefSplitDot, 0); //get the corresponding property from data
                        for (ii = 0;ii < dataTokens.length;ii++) { //iterate through property
                            dataChild = dataTokens[ii];
                            objRepeatClone = objRepeat.cloneNode(true); //clone the element
                            for (iii = 0;iii < tokens.length;iii++) { //iterate through all of the tokens
                                token = tokens[iii];
                                prop = token.substring(2, token.length-2); //remove delimiters from the token
                                propSplit = prop.split("."); //split the token by dot in order to check id
                                if ((!hasId || propSplit[0] == arg.id) && dataChild.hasOwnProperty(propSplit[propIndex])) { //if the token id is same as the defined id and data has the property defined in the token then continue
                                    dataToken = dcg.getRecursiveValue(dataChild, propSplit, propIndex); //get the corresponding property from the dataChild
                                    tokenRegex = new RegExp(token, 'g'); //prepare a regex statement to replace the corresponding tokens with the data
                                    objRepeatClone.innerHTML = objRepeatClone.innerHTML.replace(tokenRegex, dataToken); //replace the tokens
                                }
                            }
                            objRepeatCloneHtml += objRepeatClone.innerHTML; //append the stored variable in order to insert them later
                        }
                    }
                }
            }
            if (objRepeatCloneHtml != "") { //if the corresponding tokens are replaced in the element then insert the new element into the parent element and then remove the old element with delimiters
                objRepeat.insertAdjacentHTML("afterend", objRepeatCloneHtml);
                objRepeat.parentNode.removeChild(objRepeat);
            }
        }
    }
    tokens = dcg.removeDuplicatesFromArray(objClone.innerHTML.match(tokenDelimiterRegex)); //get all of the tokens from element
    if (tokens.length > 0) { //check if there are tokens if there is then continue
        for (i = 0;i < tokens.length;i++) { //iterate through tokens
            token = tokens[i];
            prop = token.substring(2, token.length-2); //remove delimiters from the tokens
            propSplit = prop.split("."); //split the token in order to check id
            if ((!hasId || propSplit[0] == arg.id) && arg.data.hasOwnProperty(propSplit[propIndex])) { //if token id is same as the defined id and data has the property defined in the token then continue
                dataToken = dcg.getRecursiveValue(arg.data, propSplit, propIndex); //get the corresponding property from data
                tokenRegex = new RegExp(token, 'g'); //prepare a regex statement to replace the corresponding tokens with the data
                objClone.innerHTML = objClone.innerHTML.replace(tokenRegex, dataToken); //replace the tokens
            }
        }
    }
    return objClone; //return the new element
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
    var objClone, attrData;
    if (!arg.hasOwnProperty("id")) {return false;} //if id isn't defined then stop the function
    if (arg.hasOwnProperty("obj")) { //if obj is defined check the data attribute of the defined element
        attrData = arg.obj.getAttribute(dcg.labelTemplateData);
        if (attrData) {
            if (dcg.dataJson.hasOwnProperty(attrData)) {
                arg.data = dcg.dataJson[attrData];
            } else {
                arg.data = JSON.parse(attrData);
            }
        }
    } else { //if its not defined then set it undefined
        arg.obj = undefined;
    }
    objClone = init_template(arg.id, arg.obj).cloneNode(true); //load and clone the template
    attrData = objClone.getAttribute(dcg.labelTemplateData); //get the referenced template's data attribute
    if ((!arg.data || !arg.hasOwnProperty("data")) && attrData) { //if data is not defined previously check if its defined on the referenced template
        if (dcg.dataJson.hasOwnProperty(attrData)) {
            arg.data = dcg.dataJson[attrData];
        } else {
            arg.data = JSON.parse(attrData);
        }
    }
    if (arg.data) { //if data is defined then display the tokens
        objClone = dcg.displayTokens({data: arg.data, obj: objClone});
    }
    return objClone;
    function init_template(id, obj) { //load template function
        var template;
        if (typeof obj == 'undefined' || dcg.dataTemplate.hasOwnProperty(id)) { //check if template's id exists on the stored templates or obj is not defined
            template = dcg.dataTemplate[id];
        } else { //if obj is defined and template id doesnt exists then store this new template with its id
            template = obj.cloneNode(true);
            dcg.dataTemplate[id] = template;
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
                        node[i].outerHTML = xhr.responseText;
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