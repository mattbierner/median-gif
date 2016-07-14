<div align="center">
    <div><img src="https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/example.gif" /></div>
    <h1 align="center">median.gif</h1>
    <p><i align="center">Median blending gifs</i></p>
</div>

* [Site][site]
* [Documentation][documentation]

*[median.gif](site)* is an experiment [median blending](http://petapixel.com/2013/05/29/a-look-at-reducing-noise-in-photographs-using-median-blending/) multiple frames of gif animations together. When all frames of the animation are blended together, the result is a single image the captures to average value of each pixel across the entire animation. You can also create new animations by only blending a subset of frames or changing how the blending works.


## Building and Running
The website uses [Jekyll](http://jekyllrb.com/) and [Webpack](http://webpack.github.io/) for building:

```bash
$ git checkout gh-pages
$ npm install
```

Start Jekyll with:

```bash
$ jekyll serve -w
```

Start webpack with:

```bash
$ webpack --watch
```

Main Javascript is stored in `src` and output to `js`.


[site]: https://mattbierner.github.io/median-gif/
[documentation]: https://github.com/mattbierner/median-gif/blob/gh-pages/documentation/about.md