(function ($) {
  var canvasId = 'canvas';
  var canvasWidth = '100%';
  var canvasHeight = '100%';

  var gridId = 'grid';
  var gridSize = 80;
  var gridFill = 'none';
  var gridStroke = '#ddd';
  var gridStrokeWidth = 1;

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
  }

  function dragended() {
    d3.select(this).classed('dragging', false);
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
    .on('mousedown', function () {canvas.style('cursor', 'grabbing')})
    .on('mouseup', function () {canvas.style('cursor', 'grab')})
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

  var group = canvas.append('g');

  group.append('image')
    .attr('xlink:href', 'assets/img/components/breadboard.svg')
    .attr('width', 660.5)
    .attr('height', 221)
    .attr('x', $(canvas[0]).width() / 2 - 330.25)
    .attr('y', $(canvas[0]).height() / 2 - 110.5)
    .call(drag);

  $('#field-search').keyup(function () {
    var needle = $(this).val().toLowerCase();

    $('#components > div').show().filter(function () {
      return $('.caption', this).text().trim().toLowerCase().indexOf(needle) === -1;
    }).hide();
  });

  var codeEditor = ace.edit('code-editor');

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
})(jQuery);
