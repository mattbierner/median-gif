# About *median.gif*

*[median.gif](site)* is an experiment [median blending](http://petapixel.com/2013/05/29/a-look-at-reducing-noise-in-photographs-using-median-blending/) multiple frames of gif animations together. When all frames of the animation are blended together, the result is a single image the captures to average value of each pixel across the entire animation. You can also create new animations by only blending a subset of frames or changing how the blending works.

## Basic Settings

### Gif
Gifs come from Giphy. Just enter a search term and select one of the returned gifs.

We'll use this gif for these examples:
![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/original.gif)

### Sample Direction
Controls the direction of sampling for blending. 

**Forward** - Samples frames after the current frame to produce the new image.

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/example.gif)


**Reverse** - Samples frames before the current frame to produce the new image.

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/reverse.gif)


**Bidirectional** - Combines forward and reverse (and samples twice as many frames.)

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/bidirectional.gif)


### Sample Frames
Number of frames to sample. A sample size of 1 produces the original gif (since only the current frame is sampled), while a sample size equal to the number of frames in the animation blends all frames together.

Sample size of 5:

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/sample-5.gif)

Sample all frames:

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/sample-all.png)


### Wrapping
Controls how frames outside the range of the original animation are sampled. Consider a gif with 4 frames: 0, 1, 2, and 3

**Overflow** - Uses a mod operator to wrap frame results: `2 -> 2`, `5 -> 1`, `-1 -> 3`

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/example.gif)


**Mirror** - When the start or end of the animation is reached, reverse direction and start counting in reverse: `2 -> 2`, `5 -> 2`, `-1 -> 1`

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/mirror.gif)


**Clamp** - Clamp frames to animation range: `2 -> 2`, `5 -> 3`, `-1 -> 0`

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/clamp.gif)


**Stop** - Replace frames outside of animation range with black: `2 -> 2`, `5 -> nothing`, `-1 -> nothing`

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/stop.gif)


### Frame Increment
When sampling, how many frames should be advanced between each sample. `1` skips ahead a single frame while `4` skips ahead four frames each time.

Frame Increment 1:

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/example.gif)

Frame Increment 4
![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/increment-4.gif)


### Frame Weights
Controls the blending weight of each frame

**Equal** - Every frame contributes equally to final image.

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/example.gif)

**Exponential** - Frame weights decay exponentially. 

![](https://raw.githubusercontent.com/mattbierner/median-gif/gh-pages/documentation/images/exponential-5.gif)




[site]: https://mattbierner.github.io/median-gif/