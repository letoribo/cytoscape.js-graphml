;(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape, $) {

    if (!cytoscape || !$) {
      return;
    } // can't register if cytoscape unspecified

    function xmlToString(xmlData) {

      var xmlString;
      //IE
      if (window.ActiveXObject) {
        xmlString = xmlData.xml;
      }
      // code for Mozilla, Firefox, Opera, etc.
      else {
        xmlString = (new XMLSerializer()).serializeToString(xmlData);
      }
      return xmlString;
    }

    var options = {
      node: {
        css: false,
        data: true,
        position: true,
        discludeds: []
      },
      edge: {
        css: false,
        data: true,
        discludeds: []
      }
    };

    function getEleData(ele) {
      var type = ele.isNode() ? "node" : "edge";
      var attrs = ["css", "data", "position"];
      var result = {};

      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        var opt = options[type][attr];
        if (!opt)
          result[attr] = {};
        else if ($.isArray(opt)) {
          result[attr] = {};
          for (var j = 0; j < opt.length; j++){
            var el = opt[i];
            if (ele[attr](el))
              result[attr][el] = ele[attr](el);
          }
        } else{
          var eleAttr = ele[attr]();
          result[attr] = {};
          for (var key in eleAttr)
            if($.inArray(key, options[type].discludeds) < 0)
            result[attr][key] = eleAttr[key];

        }
      }

      return $.extend(result.css, result.data, result.position);
    }

    function parseNode(ele) {
      var node = '<node id="' + ele.id() + '">';

      var eleData = getEleData(ele);
      for (var key in eleData)
          node += '<data key="' + key + '">' + eleData[key] + '</data>';


      if (ele.isParent()) {
        node += '<graph id="' + ele.id() + ':">';
        ele.children().each(function (i, child) {
          node += parseNode(child);
        });
        node += '</graph>'
      }

      node += '</node>';
      return node;
    }

    cytoscape('core', 'graphml', function () {
      var cy = this;

      options.node.discludeds.push("id");
      options.edge.discludeds.push("id", "source", "target");

      var xmlDoc = $.parseXML(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"\n' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
        'xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns\n' +
        'http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">\n' +
        '  <graph>\n' +
        ' </graph>\n' +
        ' </graphml>\n'
      );
      var $xml = $(xmlDoc);

      var $graph = $xml.find("graph");

      cy.nodes().orphans().forEach(function (ele) {
        $graph.append(parseNode(ele));
      });

      cy.edges().forEach(function (ele) {

        var edge = '<edge id="' + ele.id() + '" source="' + ele.source().id() + '"' + ' target="' + ele.target().id() + '" >';

        var eleData = getEleData(ele);
        for (var key in eleData)
            edge += '<data key="' + key + '">' + eleData[key] + '</data>';

        edge += '</edge>';

        $graph.append(edge);

      });


      return xmlToString(xmlDoc);
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-graphml', function () {
      return register;
    });
  }

  if (typeof cytoscape !== 'undefined' && typeof $ !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape, $);
  }

})();
