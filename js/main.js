(function () {
  'use strict';

  var canvasId = 'canvas';
  var canvasWidth = '100%';
  var canvasHeight = '100%';

  var gridId = 'grid';
  var gridSize = 80;
  var gridFill = 'none';
  var gridStroke = '#ddd';
  var gridStrokeWidth = 1;

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
  }

  function dragended() {
    d3.select(this).classed('dragging', false);
  }

  d3.behavior.drag()
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

  grid.visible = true;

  var group = canvas.append('g');

  function loadParts($http, $rootScope, $scope) {
    var parts = localStorage.getItem('parts');

    if (parts !== null) {
      Wyliodrin.bc.parts = JSON.parse(parts);

      $rootScope.$emit('bc:library:loaded');

      return;
    }

    $http.get(Wyliodrin.bc.partsPath, {
      eventHandlers: {
        progress: function (event) {
          if (event.lengthComputable) {
            var progress = event.loaded / event.total;

            $scope.progress = progress * 100;
          }
        }
      }
    }).then(function (response) {
      try {
        localStorage.setItem('parts', JSON.stringify(response.data));
      } catch (exception) {
        // Nothing to do.
      }

      Wyliodrin.bc.parts = response.data;

      $rootScope.$emit('bc:library:loaded');
    });
  }

  function _findPart(group, id) {
    if (group instanceof Array) {
      for (var i = 0; i < group.length; i++) {
        var part = _findPart(group[i], id);

        if (part !== false) {
          return part;
        }
      }
    }

    if (group.type === 'group') {
      return _findPart(group.parts, id);
    }

    return group.id === id ? group : false;
  }

  function findPart(id) {
    return _findPart(Wyliodrin.bc.parts, id);
  }

  var bcApp = angular.module('MyApp', [
    'ngMaterial'
  ]);

  bcApp.config(function ($mdThemingProvider) {
    $mdThemingProvider
      .theme('default')
      .primaryPalette('blue')
      .accentPalette('red');
  });

  bcApp.controller('AppCtrl', function ($http, $rootScope, $scope, $q) {
    loadParts($http, $rootScope, $scope);

    $scope.resetView = function () {
      zoom.scale(1);
      zoom.translate([0, 0]);
      pattern.attr('patternTransform', null);
      group.attr('transform', null);
    };

    $scope.toggleGrid = function () {
      grid.visible = !grid.visible;

      var visibility = grid.visible ? 'visible' : 'hidden';

      grid.style('visibility', visibility);
    };

    $scope.category = null;
    $scope.categories = null;

    var q = $q(function (resolve) {
      $rootScope.$on('bc:library:loaded', function () {
        var categories = [];

        angular.forEach(Wyliodrin.bc.parts, function (value, key) {
          var category = {
            key: key,
            title: value.title
          };

          if (value.icon !== undefined) {
            category.icon = 'assets/app/parts/icons/' + value.icon;
          }

          categories.push(category);
        });

        $scope.category = categories[2].key;
        $scope.categories = categories;

        resolve();
      });
    });

    $scope.loadCategories = function () {
      return $scope.categories || q;
    };

    $scope.parts = null;

    $scope.loadCategory = function () {
      if ($scope.category === null) {
        return;
      }

      $scope.parts = Wyliodrin.bc.parts[$scope.category].parts;
    };

    $scope.$watch('category', $scope.loadCategory);

    $scope.part = null;

    $scope.inspect = function (id) {
      var part = findPart(id);

      $scope.part = {
        description: part.description,
        properties: part.properties,
        tags: part.tags,
        title: part.title
      };
    };

    $scope.deinspect = function () {
      $scope.part = null;
    };
  });
})();
