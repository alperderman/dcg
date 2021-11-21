# DCG
Dynamic Content Generation (DCG) is a front-end templating library tailored for comfort and ease of usage.

The main difference between other template engines and DCG is, contents and layouts are splitted from each other and since the contents and designs are seperate entities, it allows us to re-use the same contents or same designs on a different page thus reduces the code duplication.

### [Documentation](https://alperderman.github.io/project/dcg/docs)

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
