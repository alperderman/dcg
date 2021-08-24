function runEditor(){
  var content, design, preview;
  var content = editors["content"].getValue();
  var design = editors["design"].getValue();
  var presets = editors["presets"].getValue();
  var defaultPresets = 'dcg.baseAttr =["src","href"];dcg.tokenOpen="{{";dcg.tokenClose = "}}";dcg.removeCss=false;dcg.cacheRender=false;dcg.beforeRender=undefined;dcg.afterRender=undefined;';
  dcg.DOMEval(defaultPresets);
  dcg.DOMEval(presets);
  if (content != "" && design != "") {
    preview = dcg.render({content: content, design: design, renderOnDom: false});
  }else {
    preview = "";
  }
  document.getElementById('preview').contentWindow.document.open();
  document.getElementById('preview').contentWindow.document.write(preview);
  document.getElementById('preview').contentWindow.document.close();
}
function clearAll(){
  editors["content"].setValue("");
  editors["design"].setValue("");
  editors["presets"].setValue("");
  runEditor();
}