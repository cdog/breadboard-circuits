# [Breadboard Circuits](http://cdog.github.io/breadboard-circuits/)

## Installation and Usage

```
$ git clone https://github.com/cdog/breadboard-circuits.git
$ cd breadboard-circuits
$ npm install grunt-cli -g # install grunt command line interface if not already installed
$ npm install
$ grunt build
$ grunt serve # open http://127.0.0.1:4000/ in your browser
$ grunt clean && grunt build --environment production
$ grunt deploy # push last build to the gh-pages branch
```

### Available grunt tasks

* build _(default)_
* clean
* deploy
* serve
* test
* watch