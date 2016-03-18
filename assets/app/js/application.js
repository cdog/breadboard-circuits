(function ($) {
  'use strict';

  var canvasId = 'canvas';
  var canvasWidth = '100%';
  var canvasHeight = '100%';

  var gridId = 'grid';
  var gridSize = 80;
  var gridFill = 'none';
  var gridStroke = '#ddd';
  var gridStrokeWidth = 1;

  var editing = true;

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function zoomed() {
    pattern.attr('patternTransform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
    defs.select('path').attr('stroke-width', 0.5 / d3.event.scale);
    pattern.select('path').attr('stroke-width', 1 / d3.event.scale);
    group.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
  }

  var zoom = d3.behavior.zoom()
    .scaleExtent([0.5, 4])
    .on('zoom', zoomed);

  function dragstarted() {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed('dragging', true);
  }

  function dragged() {
    d3.select(this)
      .attr('x', d3.event.x)
      .attr('y', d3.event.y);

    line1
      .attr('x1', Number(pushbutton.attr('x')) + 23.5)
      .attr('y1', Number(pushbutton.attr('y')) + .5)
      .attr('x2', Number(lightBulb.attr('x')) + 45)
      .attr('y2', Number(lightBulb.attr('y')) + 163);

    line2
      .attr('x1', Number(aaBattery.attr('x')) + .5)
      .attr('y1', Number(aaBattery.attr('y')) + 25)
      .attr('x2', Number(pushbutton.attr('x')) + 4.5)
      .attr('y2', Number(pushbutton.attr('y')) + 29.5);

    line3
      .attr('x1', Number(aaBattery.attr('x')) + 163.5)
      .attr('y1', Number(aaBattery.attr('y')) + 25)
      .attr('x2', Number(lightBulb.attr('x')) + 55)
      .attr('y2', Number(lightBulb.attr('y')) + 163);
  }

  function dragended() {
    d3.select(this).classed('dragging', false);
  }

  function loadComponent(url, component) {
    var dfd = new jQuery.Deferred();

    d3.xml(url, 'image/svg+xml', function (xml) {
      components[component] = xml.documentElement;

      dfd.resolve();
    });

    return dfd.promise();
  }

  function loadComponents() {
    var dfd = [];

    dfd.push(loadComponent('assets/app/img/components/aa-battery.svg', 'aaBattery'));
    dfd.push(loadComponent('assets/app/img/components/breadboard.svg', 'breadboard'));
    dfd.push(loadComponent('assets/app/img/components/light-bulb.svg', 'lightBulb'));
    dfd.push(loadComponent('assets/app/img/components/pushbutton.svg', 'pushbutton'));

    return dfd;
  }

  var drag = d3.behavior.drag()
    .origin(function () {
      return {
        x: d3.select(this).attr('x'),
        y: d3.select(this).attr('y')
      };
    })
    .on('dragstart', dragstarted)
    .on('drag', dragged)
    .on('dragend', dragended);

  var canvas = d3.select('#viewport')
    .append('svg:svg')
    .attr('id', canvasId)
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)
    .call(zoom)
    .on('mousedown', function () {
      canvas.style('cursor', 'grabbing');
    })
    .on('mouseup', function () {
      canvas.style('cursor', 'grab');
    })
    .style('cursor', 'grab');

  var defs = canvas.append('defs');

  var pattern = defs.append('pattern')
    .attr('id', 'grid-inner')
    .attr('width', 8)
    .attr('height', 8)
    .attr('patternUnits', 'userSpaceOnUse');

  pattern.append('path')
    .attr('d', 'M ' + '8' + ' 0 L 0 0 0 ' + '8')
    .attr('fill', gridFill)
    .attr('stroke', '#eee')
    .attr('stroke-width', 0.5);

  pattern = defs.append('pattern')
    .attr('id', gridId)
    .attr('width', gridSize)
    .attr('height', gridSize)
    .attr('patternUnits', 'userSpaceOnUse');

  pattern.append('rect')
    .attr('fill', 'url(#grid-inner)')
    .attr('width', gridSize)
    .attr('height', gridSize);

  pattern.append('path')
    .attr('d', 'M ' + gridSize + ' 0 L 0 0 0 ' + gridSize)
    .attr('fill', gridFill)
    .attr('stroke', gridStroke)
    .attr('stroke-width', gridStrokeWidth);

  var grid = canvas.append('rect')
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)
    .attr('fill', 'url(#' + gridId + ')');

  var group = canvas.append('g').
    classed('editing', editing);

  var components = {};
  var aaBattery;
  var breadboard;
  var lightBulb;
  var pushbutton;
  var line1;
  var line2;
  var line3;

  $.when.apply($, loadComponents()).then(function () {
    var node;

    node = group.node().appendChild(components.breadboard);

    breadboard = d3.select(node)
      .attr('class', 'component')
      .attr('width', 660)
      .attr('height', 220)
      .attr('x', getRandomInt(0, $(canvas[0]).width() - 660))
      .attr('y', getRandomInt(0, $(canvas[0]).height() - 220))
      .call(drag);

    node = group.node().appendChild(components.aaBattery);

    aaBattery = d3.select(node)
      .attr('class', 'component')
      .attr('width', 164)
      .attr('height', 50)
      .attr('x', getRandomInt(0, $(canvas[0]).width() - 164))
      .attr('y', getRandomInt(0, $(canvas[0]).height() - 50))
      .call(drag);

    node = group.node().appendChild(components.lightBulb);

    lightBulb = d3.select(node)
      .attr('class', 'component off')
      .attr('width', 100)
      .attr('height', 164)
      .attr('x', getRandomInt(0, $(canvas[0]).width() - 100))
      .attr('y', getRandomInt(0, $(canvas[0]).height() - 164))
      .call(drag);

    node = group.node().appendChild(components.pushbutton);

    pushbutton = d3.select(node)
      .attr('class', 'component')
      .attr('width', 28)
      .attr('height', 30)
      .attr('x', getRandomInt(0, $(canvas[0]).width() - 28))
      .attr('y', getRandomInt(0, $(canvas[0]).height() - 30))
      .call(drag);

    line1 = group.append('line')
      .attr('stroke', '#f00')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('x1', Number(pushbutton.attr('x')) + 23.5)
      .attr('y1', Number(pushbutton.attr('y')) + .5)
      .attr('x2', Number(lightBulb.attr('x')) + 45)
      .attr('y2', Number(lightBulb.attr('y')) + 163);

    line2 = group.append('line')
      .attr('stroke', '#f00')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('x1', Number(aaBattery.attr('x')) + .5)
      .attr('y1', Number(aaBattery.attr('y')) + 25)
      .attr('x2', Number(pushbutton.attr('x')) + 4.5)
      .attr('y2', Number(pushbutton.attr('y')) + 29.5);

    line3 = group.append('line')
      .attr('stroke', '#f00')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('x1', Number(aaBattery.attr('x')) + 163.5)
      .attr('y1', Number(aaBattery.attr('y')) + 25)
      .attr('x2', Number(lightBulb.attr('x')) + 55)
      .attr('y2', Number(lightBulb.attr('y')) + 163);
  });

  $('#field-search').keyup(function () {
    var needle = $(this).val().toLowerCase();

    $('.component-library .component-library-item').show().filter(function () {
      return $('.caption', this).text().trim().toLowerCase().indexOf(needle) === -1;
    }).hide();
  });

  ace.edit('code-editor');

  $('#reset-view').click(function (event) {
    event.preventDefault();

    zoom.scale(1);
    zoom.translate([0, 0]);
    pattern.attr('patternTransform', null);
    group.attr('transform', null);
  });

  $('#toggle-grid').click(function (event) {
    event.preventDefault();

    $(grid[0]).toggle();
  });

  $('#toggle-simulation').click(function (event) {
    event.preventDefault();

    editing = !editing;

    $('.glyphicon', this).toggleClass('glyphicon-play glyphicon-stop');

    group.classed('editing', editing);

    if (editing) {
      pushbutton
        .on('mousedown', null)
        .on('mouseup', null);

      breadboard.call(drag);
      aaBattery.call(drag);
      lightBulb.call(drag);
      pushbutton.call(drag);
    } else {
      breadboard.on('.drag', null);
      aaBattery.on('.drag', null);
      lightBulb.on('.drag', null);
      pushbutton.on('.drag', null);

      pushbutton
        .on('mousedown', function () {
          pushbutton.classed('pressed', true);
          lightBulb.classed('off', false);
        })
        .on('mouseup', function () {
          pushbutton.classed('pressed', false);
          lightBulb.classed('off', true);
        });
    }
  });

  $.whenAllDone = function () {
    var dfds = [];
    var result = $.Deferred();

    $.each(arguments, function (i, dfd) {
      var cdfd = $.Deferred();

      dfd.always(function () {
        cdfd.resolve();
      });

      dfds.push(cdfd.promise());
    });

    $.when.apply(null, dfds).always(function () {
      return result.resolve();
    });

    return result.promise();
  };

  var library = {
    categories: []
  };

  $.get('assets/vendor/fritzing-parts/bins/core.fzb', function (data) {
    var xml = $.parseXML(data);
    var $xml = $(xml);

    $xml.find('instance').each(function () {
      var $this = $(this);
      var category;
      var n = library.categories.length;
      var id = $this.attr('moduleIdRef');

      if (n) {
        category = library.categories[n - 1];
      }

      if (id == '__spacer__') {
        category = {
          components: []
        };

        category.name = $this.attr('path');

        library.categories.push(category);
      } else {
        var path = $this.attr('path');

        if (path) {
          category.components.push(path.split('/').pop());
        } else {
          category.components.push(id + '.fzp');
        }
      }
    });

    var deferreds = [];

    for (var i = 0; i < library.categories.length; i++) {
      for (var j = 0; j < library.categories[i].components.length; j++) {
        deferreds.push((function (i, j) {
          return $.get('assets/vendor/fritzing-parts/core/' + library.categories[i].components[j], function (data) {
            var component = {};

            try {
              var xml = $.parseXML(data);
              var $xml = $(xml);

              component.title = $xml.find('module > title').text();
              component.icon = 'assets/vendor/fritzing-parts/svg/core/' + $xml.find('module > views > iconView > layers').attr('image');
              component.description = $xml.find('module > description').text();
              component.properties = {};

              $xml.find('module > properties > property').each(function () {
                var $this = $(this);
                var key = $this.attr('name').toLowerCase();

                component.properties[key] = $this.text().toLowerCase();
              });

              component.tags = [];

              $xml.find('module > tags > tag').each(function () {
                component.tags.push($(this).text().toLowerCase());
              });
            } catch (e) {
              component.title = library.categories[i].components[j];
              component.error = 'parse error';
            }

            library.categories[i].components[j] = component;
          }).fail(function () {
            library.categories[i].components[j] = {
              title: library.categories[i].components[j],
              error: 'not found'
            };
          });
        })(i, j));
      }
    }

    $.whenAllDone.apply(null, deferreds).always(function () {
      var source = $('#categories-template').html();
      var template = Handlebars.compile(source);
      var context = library;
      var html = template(context);

      $('#categories-template').after(html);

      source = $('#components-template').html();
      template = Handlebars.compile(source);
      html = template(context);

      $('#components-template').after(html);
    });
  });

  $('.component-library').on({
    mouseenter: function () {
      var $this = $(this);
      var i = $this.data('category');
      var j = $this.data('id');
      var source = $('#component-overview-template').html();
      var template = Handlebars.compile(source);
      var context = library.categories[i].components[j];
      var html = template(context);

      $('#component-overview-template').after(html);
      $('#component-inspector').addClass('active');
    },
    mouseleave: function () {
      $('#component-overview').remove();
      $('#component-inspector').removeClass('active');
    }
  }, '.thumbnail');
})(jQuery);
