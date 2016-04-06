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
$ grunt deploy # push an existing build to gh-pages branch
```

### Migrating data

Migrated data is already included in this repository. To run a migration clone the [fritzing-parts](https://github.com/fritzing/fritzing-parts) repository first then run Grunt `migrate` task:

```
$ git clone https://github.com/fritzing/fritzing-parts.git
$ grunt migrate
```

### Available grunt tasks

* build _(default)_
* clean
* deploy
* migrate
* serve
* test
* watch
