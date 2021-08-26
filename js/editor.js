function runEditor(){
  var content, design, preview;
  var content = editors["content"].getValue();
  var design = editors["design"].getValue();
  var presets = editors["presets"].getValue().trim();
  if (presets == "") {
    presets = "{}";
  }
  var options = eval('('+presets+')');
  if (design != "") {
    preview = dcg.render({content: content, design: design, options: options});
  } else {
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