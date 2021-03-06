Ext.define('CF.view.dataviews.SolverConf', {
  extend: 'CF.view.dataviews.Conf',
  alias: 'widget.solverconf',
  id: "SolverConfPanel",
  features: [{
    id: 'grouping',
    ftype: 'grouping',
    startCollapsed: true
  }],
  initComponent: function() {
    this.store = CF.app.getController('Map').getStore('SolverConf');
    this.callParent(arguments);
  }
});