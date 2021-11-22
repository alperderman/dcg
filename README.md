# DCG
Dynamic Content Generation (DCG) is a front-end templating framework that aims for content management.

The main difference between other templating frameworks and DCG is, contents and layouts are splitted from each other on DCG. And In addition to that, DCG works like a preprocessing intrepreter, so you can use it with other frameworks but in order to do that, the formation and the structure of your project must be coherent with DCG.

DCG basically stitches the content and the layout together then generates and renders the final result. Since the contents and designs are completely seperate entities, it allows us to re-use the same contents or same designs on a different page thus reduces the code duplication and increases maintainability.

#### [Full Documentation](https://alperderman.github.io/project/dcg/docs)

## Example
content.html (the main page)
```html
<html>
  <body dcg-design="path/to/design.html" dcg-base="./">

    <div dcg-obj="hello">Hello World!</div>

    <script src="path/to/dcg.js"></script>
    <script>
      dcg.render();
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
