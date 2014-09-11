roborampage
===========

The robots are after you!

Play on webmaker.org: https://stenington.makes.org/thimble/LTE0NjEyNTYxOTI=/roborampage

Play on github: http://stenington.github.io/roborampage

## Development

Roborampage is deployed at [http://stenington.github.io/roborampage](http://stenington.github.io/roborampage)
and in several [Thimble](https://thimble.webmaker.org) makes linked from there.

### Get Started

``` sh
git clone https://github.com/stenington/roborampage.git
cd roborampage
npm install
node bin/server.js
```

Then navigate to http://localhost:3000 to see the main site.

Navigating to a tutorial directory, e.g. http://localhost:3000/hacks/colors, will give
you a Thimble emulator of sorts. 

### Developing

Most of the `.html` files are generated from corresponding `.tmpl` Jinja/Nunjucks templates. Output
targets are listed explicitly in `bin/compile.js`. 

The development server always re-renders output targets.

Use `node bin/compile.js` to compile all output targets.

### Tests

With `node bin/server.js` running, visit http://localhost:3000/test/ to see the mocha test suite
for the game code.

Tutorial instructions and line numbers are currently verified manually.

### Deployment

1. Run `node bin/compile.js` to ensure all templates have been rendered.
2. Commit changes to **gh-pages** branch.
3. Push upstream.
4. Copy/paste the contents of `./copypaste.html` into the main Thimble make and save it. (Make ids are listed in `bin/compile.js CONFIG`.)
    * I use `cat ./copypaste.html | pbcopy` to put the contents in the clipboard.
    * Make sure you're **editing** the make, not **remixing**, before you save.
5. For each tutorial, copy/paste the contents of `hacks/<name>/copypaste.html` into the corresponding Thimble make, and save.
    * When you paste the new content in, the tutorial line numbers *will change*! Save and refresh before confirming line numbers.

