# DCG
DCG is a javascript framework that aims for content management.

DCG is vastly different from other frameworks. The main difference is, contents and layouts are splitted from each other on DCG and most of the features and objects are defined with simple HTML elements. In addition to that, DCG works like a preprocessing intrepreter, so it can be use it with other frameworks but the formation and the structure of your projects, must be coherent with DCG.

DCG basically stitches the content and the layout together then generates and renders the final result. Since the contents and designs are completely seperate entities, it allows us to re-use the same contents or same designs on a different page thus reduces the code duplication, but as a trade-off it increases the page load time because of the extra XHR calls.

One other advantage is; DCG solves the SEO problem, since you define your contents of the page with pure HTML and contents are there before the render occurs, web crawlers can index these contents.

## Example
content.html (the main page)
```html
<html>
  <body>

    <div dcg-obj="hello">Hello World!</div>

    <script src="path/to/dcg.js"></script>
    <script>
      dcg.render({
        designSrc: "path/to/design.html"
      });
    </script>
  </body>
</html>
```

design.html
```html
<html>
  <body>
    <h1>{{hello}}</h1>
  </body>
</html>
```
